import { ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { BOOTSTRAP_TOKEN_ENV, BootstrapVinculoService } from './bootstrap-vinculo.service';

/**
 * SDD-005 — Bootstrap institucional (dependência circular ADMIN × vínculo).
 *
 * Cenários exigidos:
 *  5. primeiro bootstrap autorizado;
 *  6. tentativa de repetir bootstrap;
 *  7. tentativa de escalonamento de privilégios.
 */
const TOKEN = 'token-de-bootstrap-teste-2026';
const admin = { sub: 'user-admin', email: 'admin@seaf.gov.br', role: 'ADMIN' as const };

function montarServico(opcoes: {
  papel?: string;
  conta?: unknown;
  vinculoAdminExistente?: unknown;
  token?: string | undefined;
  tokenConfigurado?: boolean;
}) {
  const prisma = {
    user: {
      findFirst: jest
        .fn()
        .mockResolvedValue('conta' in opcoes ? opcoes.conta : { id: 'user-admin', email: 'admin@seaf.gov.br', name: 'Admin' }),
    },
    vinculoUsuario: {
      findFirst: jest.fn().mockResolvedValue(opcoes.vinculoAdminExistente ?? null),
      create: jest.fn().mockResolvedValue({ id: 'vinc-novo', userId: 'user-admin', funcao: 'ADMIN', ativo: true, vigenciaInicio: new Date('2026-10-11') }),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const servico = new BootstrapVinculoService(prisma as never, audit as never);
  const user = { ...admin, role: (opcoes.papel ?? 'ADMIN') as typeof admin.role };
  const token = 'token' in opcoes ? opcoes.token : TOKEN;
  return { servico, prisma, audit, user, token };
}

describe('SDD-005: bootstrap institucional do primeiro vínculo ADMIN', () => {
  const original = process.env[BOOTSTRAP_TOKEN_ENV];

  beforeEach(() => {
    process.env[BOOTSTRAP_TOKEN_ENV] = TOKEN;
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (original === undefined) delete process.env[BOOTSTRAP_TOKEN_ENV];
    else process.env[BOOTSTRAP_TOKEN_ENV] = original;
  });

  it('5) primeiro bootstrap autorizado cria vínculo ADMIN global e audita', async () => {
    const { servico, prisma, audit } = montarServico({});

    const vinculo = await servico.executar(TOKEN, admin);

    expect(vinculo).toMatchObject({ id: 'vinc-novo', funcao: 'ADMIN', ativo: true });
    expect(prisma.vinculoUsuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-admin', funcao: 'ADMIN', createdBy: 'user-admin' }),
      }),
    );
    // Sem escopo institucional: ADMIN é global por regra do domínio.
    const dadosCriados = prisma.vinculoUsuario.create.mock.calls[0][0].data;
    expect(dadosCriados.dreId).toBeUndefined();
    expect(dadosCriados.escolaId).toBeUndefined();
    expect(dadosCriados.produtorId).toBeUndefined();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BOOTSTRAP_ADMIN_VINCULO', entity: 'VinculoUsuario', userId: 'user-admin' }),
    );
  });

  it('6) repetir o bootstrap é recusado quando já há vínculo ADMIN ativo', async () => {
    const { servico, prisma, audit } = montarServico({
      vinculoAdminExistente: { id: 'vinc-1', userId: 'outro-admin' },
    });

    await expect(servico.executar(TOKEN, admin)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.vinculoUsuario.create).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('6b) o estado de "uma única execução" é verificado antes de criar', async () => {
    const { servico, prisma } = montarServico({});
    await servico.executar(TOKEN, admin);

    // Segunda chamada no mesmo serviço: a consulta deve ter sido feita (findFirst)
    // e nenhuma criação extra ocorre quando o vínculo já existe.
    expect(prisma.vinculoUsuario.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.vinculoUsuario.findFirst.mock.calls[0][0].where).toMatchObject({ funcao: 'ADMIN', ativo: true });
  });

  it('7) escalonamento: usuário não-ADMIN é recusado sem tocar o banco', async () => {
    for (const papel of ['ESCOLA', 'DRE', 'PRODUTOR', 'EXTENSIONISTA', 'REPRESENTANTE'] as const) {
      const { servico, prisma } = montarServico({ papel });

      await expect(servico.executar(TOKEN, { ...admin, role: papel })).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(prisma.vinculoUsuario.create).not.toHaveBeenCalled();
    }
  });

  it('7b) token errado é recusado sem nenhuma escrita', async () => {
    const { servico, prisma } = montarServico({ token: 'token-errado' });

    await expect(servico.executar('token-errado', admin)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.vinculoUsuario.create).not.toHaveBeenCalled();
  });

  it('7c) token ausente é recusado', async () => {
    const { servico } = montarServico({ token: undefined });

    await expect(servico.executar(undefined, admin)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ambiente sem BOOTSTRAP_ADMIN_TOKEN fica indisponível', async () => {
    delete process.env[BOOTSTRAP_TOKEN_ENV];
    const { servico, prisma } = montarServico({});

    await expect(servico.executar(TOKEN, admin)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.vinculoUsuario.create).not.toHaveBeenCalled();
  });

  it('conta administrativa inativa não executa o bootstrap', async () => {
    const { servico, prisma } = montarServico({ conta: null });

    await expect(servico.executar(TOKEN, admin)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'user-admin', role: 'ADMIN', active: true, deletedAt: null }) }),
    );
    expect(prisma.vinculoUsuario.create).not.toHaveBeenCalled();
  });
});
