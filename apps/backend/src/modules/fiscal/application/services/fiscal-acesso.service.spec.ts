import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalAcessoService, OperacaoFiscal } from './fiscal-acesso.service';

function usuario(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { sub: 'u1', email: 'u1@x.com', role: 'DRE', ...overrides };
}

function montarServico(
  opcoes: {
    dres?: string[];
    escolas?: string[];
    produtores?: string[];
    contrato?: Record<string, unknown> | null;
  } = {},
) {
  const prisma = {
    contrato: {
      findUnique: jest.fn(async () =>
        'contrato' in opcoes
          ? opcoes.contrato
          : { id: 'contrato-1', dreId: 'dre-1', escolaId: 'escola-1', produtorId: 'produtor-1' },
      ),
    },
  };

  const policy = {
    prisma,
    getAuthorizedDREIds: jest.fn(async () => opcoes.dres ?? ['dre-1']),
    getAuthorizedEscolaIds: jest.fn(async () => opcoes.escolas ?? ['escola-1']),
    getAuthorizedProdutorIds: jest.fn(async () => opcoes.produtores ?? ['produtor-1']),
  };

  const servico = new FiscalAcessoService(policy as never);

  return { servico, policy, prisma };
}

const recurso = { contratoId: 'contrato-1', fornecedorId: 'produtor-1' };

const TODAS_OPERACOES: OperacaoFiscal[] = ['CONSULTAR', 'PROCESSAR', 'CONFERIR', 'ATESTAR', 'CANCELAR'];

describe('SDD-005: controle de acesso fiscal', () => {
  describe('filtroNotaFiscal', () => {
    it('ADMIN enxerga todas as notas sem filtro de escopo', async () => {
      const { servico, policy } = montarServico({});

      const filtro = await servico.filtroNotaFiscal(usuario({ role: 'ADMIN' }));

      expect(filtro).toEqual({});
      expect(policy.getAuthorizedDREIds).not.toHaveBeenCalled();
      expect(policy.getAuthorizedEscolaIds).not.toHaveBeenCalled();
      expect(policy.getAuthorizedProdutorIds).not.toHaveBeenCalled();
    });

    it('DRE filtra pelas DREs autorizadas via policy', async () => {
      const { servico, policy } = montarServico({ dres: ['dre-1', 'dre-2'] });

      const filtro = await servico.filtroNotaFiscal(usuario({ role: 'DRE' }));

      expect(policy.getAuthorizedDREIds).toHaveBeenCalledWith(expect.objectContaining({ role: 'DRE' }));
      expect(filtro).toEqual({ contrato: { dreId: { in: ['dre-1', 'dre-2'] } } });
    });

    it('ESCOLA filtra pelas escolas autorizadas via policy', async () => {
      const { servico, policy } = montarServico({ escolas: ['escola-9'] });

      const filtro = await servico.filtroNotaFiscal(usuario({ role: 'ESCOLA' }));

      expect(policy.getAuthorizedEscolaIds).toHaveBeenCalledWith(expect.objectContaining({ role: 'ESCOLA' }));
      expect(filtro).toEqual({ contrato: { escolaId: { in: ['escola-9'] } } });
    });

    for (const papel of ['PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'] as const) {
      it(`${papel} filtra pelo fornecedor autorizado via policy`, async () => {
        const { servico, policy } = montarServico({ produtores: ['produtor-7'] });

        const filtro = await servico.filtroNotaFiscal(usuario({ role: papel }));

        expect(policy.getAuthorizedProdutorIds).toHaveBeenCalledWith(expect.objectContaining({ role: papel }));
        expect(filtro).toEqual({ fornecedorId: { in: ['produtor-7'] } });
      });
    }

    it('papel sem escopo cadastrado recebe filtro que não retorna notas', async () => {
      const { servico, policy } = montarServico({});
      const papelDesconhecido = 'SUPERVISOR' as unknown as AuthenticatedUser['role'];

      const filtro = await servico.filtroNotaFiscal(usuario({ role: papelDesconhecido }));

      expect(filtro).toEqual({ id: { in: [] } });
      expect(policy.getAuthorizedProdutorIds).not.toHaveBeenCalled();
    });
  });

  describe('filtroContrato', () => {
    it('ADMIN enxerga todos os contratos sem filtro', async () => {
      const { servico } = montarServico({});

      await expect(servico.filtroContrato(usuario({ role: 'ADMIN' }))).resolves.toEqual({});
    });

    it('DRE filtra contratos pela DRE autorizada', async () => {
      const { servico } = montarServico({ dres: ['dre-3'] });

      await expect(servico.filtroContrato(usuario({ role: 'DRE' }))).resolves.toEqual({ dreId: { in: ['dre-3'] } });
    });

    it('ESCOLA filtra contratos pela escola autorizada', async () => {
      const { servico } = montarServico({ escolas: ['escola-4'] });

      await expect(servico.filtroContrato(usuario({ role: 'ESCOLA' }))).resolves.toEqual({
        escolaId: { in: ['escola-4'] },
      });
    });

    it('PRODUTOR filtra contratos pelo produtor autorizado', async () => {
      const { servico, policy } = montarServico({ produtores: ['produtor-2'] });

      await expect(servico.filtroContrato(usuario({ role: 'PRODUTOR' }))).resolves.toEqual({
        produtorId: { in: ['produtor-2'] },
      });
      expect(policy.getAuthorizedProdutorIds).toHaveBeenCalled();
    });
  });

  describe('exigir', () => {
    it('ADMIN é sempre permitido para todas as operações sem consultar o banco', async () => {
      const { servico, prisma } = montarServico({});

      for (const operacao of TODAS_OPERACOES) {
        await expect(servico.exigir(usuario({ role: 'ADMIN' }), recurso, operacao)).resolves.toBeUndefined();
      }
      expect(prisma.contrato.findUnique).not.toHaveBeenCalled();
    });

    const bloqueios: Array<{ operacao: OperacaoFiscal; papel: AuthenticatedUser['role'] }> = [
      { operacao: 'PROCESSAR', papel: 'PRODUTOR' },
      { operacao: 'CONFERIR', papel: 'PRODUTOR' },
      { operacao: 'ATESTAR', papel: 'PRODUTOR' },
      { operacao: 'CANCELAR', papel: 'PRODUTOR' },
      { operacao: 'PROCESSAR', papel: 'REPRESENTANTE' },
      { operacao: 'CONFERIR', papel: 'EXTENSIONISTA' },
      { operacao: 'ATESTAR', papel: 'EXTENSIONISTA' },
      { operacao: 'CANCELAR', papel: 'ESCOLA' },
    ];
    for (const caso of bloqueios) {
      it(`bloqueia ${caso.operacao} para o papel ${caso.papel}`, async () => {
        const { servico, prisma } = montarServico({});

        await expect(servico.exigir(usuario({ role: caso.papel }), recurso, caso.operacao)).rejects.toBeInstanceOf(
          ForbiddenException,
        );
        expect(prisma.contrato.findUnique).not.toHaveBeenCalled();
      });
    }

    it('DRE dentro do escopo é autorizado para CANCELAR', async () => {
      const { servico, prisma } = montarServico({ dres: ['dre-1'] });

      await expect(servico.exigir(usuario({ role: 'DRE' }), recurso, 'CANCELAR')).resolves.toBeUndefined();
      expect(prisma.contrato.findUnique).toHaveBeenCalledWith({
        where: { id: 'contrato-1' },
        select: { dreId: true, escolaId: true, produtorId: true },
      });
    });

    it('DRE sem DRE autorizada correspondente é bloqueada', async () => {
      const { servico } = montarServico({ dres: ['dre-outra'] });

      await expect(servico.exigir(usuario({ role: 'DRE' }), recurso, 'CONSULTAR')).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Recurso fora do escopo institucional.' }),
      });
    });

    it('DRE é bloqueada quando o contrato não possui DRE associada', async () => {
      const { servico } = montarServico({
        contrato: { id: 'contrato-1', dreId: null, escolaId: null, produtorId: 'produtor-1' },
        dres: ['dre-1'],
      });

      await expect(servico.exigir(usuario({ role: 'DRE' }), recurso, 'CONSULTAR')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('ESCOLA dentro do escopo é autorizada para CONFERIR', async () => {
      const { servico } = montarServico({ escolas: ['escola-1'] });

      await expect(servico.exigir(usuario({ role: 'ESCOLA' }), recurso, 'CONFERIR')).resolves.toBeUndefined();
    });

    it('ESCOLA fora do escopo é bloqueada', async () => {
      const { servico } = montarServico({ escolas: ['escola-x'] });

      await expect(servico.exigir(usuario({ role: 'ESCOLA' }), recurso, 'CONFERIR')).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Recurso fora do escopo institucional.' }),
      });
    });

    it('ESCOLA é bloqueada quando o contrato não possui escola associada', async () => {
      const { servico } = montarServico({
        contrato: { id: 'contrato-1', dreId: 'dre-1', escolaId: null, produtorId: 'produtor-1' },
        escolas: ['escola-1'],
      });

      await expect(servico.exigir(usuario({ role: 'ESCOLA' }), recurso, 'ATESTAR')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('PRODUTOR dentro do escopo é autorizado para CONSULTAR', async () => {
      const { servico } = montarServico({ produtores: ['produtor-1'] });

      await expect(servico.exigir(usuario({ role: 'PRODUTOR' }), recurso, 'CONSULTAR')).resolves.toBeUndefined();
    });

    it('PRODUTOR fora do escopo do fornecedor é bloqueado', async () => {
      const { servico } = montarServico({ produtores: ['produtor-outro'] });

      await expect(
        servico.exigir(usuario({ role: 'PRODUTOR' }), recurso, 'CONSULTAR'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Recurso fora do escopo institucional.' }),
      });
    });

    it('EXTENSIONISTA e REPRESENTANTE consultam apenas o produtor representado', async () => {
      const autorizado = montarServico({ produtores: ['produtor-1'] });
      await expect(
        autorizado.servico.exigir(usuario({ role: 'EXTENSIONISTA' }), recurso, 'CONSULTAR'),
      ).resolves.toBeUndefined();

      const bloqueado = montarServico({ produtores: [] });
      await expect(
        bloqueado.servico.exigir(usuario({ role: 'REPRESENTANTE' }), recurso, 'CONSULTAR'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('bloqueia com mensagem específica quando o contrato não existe', async () => {
      const { servico } = montarServico({ contrato: null });

      await expect(servico.exigir(usuario({ role: 'DRE' }), recurso, 'CONSULTAR')).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Contrato não encontrado ou fora do escopo.' }),
      });
    });
  });
});
