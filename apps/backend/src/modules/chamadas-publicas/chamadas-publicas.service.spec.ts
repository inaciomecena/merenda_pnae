import { ConflictException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ChamadasPublicasService } from './application/chamadas-publicas.service';
import { CreateChamadaDto, UpdateChamadaDto } from './presentation/chamadas-publicas.dto';
import { normalizarNumeroChamada } from '../../common/util/numero-chamada';

/**
 * Testes da regra de unicidade de ChamadaPublica na camada de aplicação.
 *
 * Regra arquitetural (docs/importacao-pnae-2025/DECISAO_ARQUITETURAL_UNICIDADE.md):
 * - número único dentro de (DRE, exercício); repetição entre DREs é PERMITIDA;
 * - escopo ESTADUAL (dreId nulo) tem unicidade própria;
 * - a garantia EFETIVA é do banco (índices únicos `dreId` e `dreEscopo`);
 *   esta camada só valida cedo e traduz P2002/1062 em 409 com mensagem clara.
 *
 * Nenhum teste toca em banco: prisma/policy/audit são mocks.
 */

interface PrismaMock {
  edital: { findFirst: jest.Mock };
  chamadaPublica: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
}

const ROW = {
  id: 'ch-1',
  numero: '001/2025',
  exercicio: 2025,
  dreId: 'dre-a',
  status: 'RASCUNHO',
  versaoPublicada: 1,
  editalId: 'ed-1',
  inscricoesInicio: new Date('2025-03-01T00:00:00.000Z'),
  inscricoesFim: new Date('2025-04-01T00:00:00.000Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function novoServico() {
  const prisma: PrismaMock = {
    edital: { findFirst: jest.fn().mockResolvedValue({ id: 'ed-1', deletedAt: null }) },
    chamadaPublica: {
      // 1ª chamada sem `where.id` = checagem de unicidade (null = livre);
      // chamada com `where.id` = `obter()` pós-escrita.
      findFirst: jest.fn().mockImplementation((args: any) => Promise.resolve(args?.where?.id ? ROW : null)),
      create: jest.fn().mockResolvedValue(ROW),
      update: jest.fn().mockResolvedValue(ROW),
    },
  };
  const policy = {
    getAuthorizedDREIds: jest.fn().mockResolvedValue(['dre-a']),
    getAuthorizedEscolaIds: jest.fn().mockResolvedValue([]),
    requireDREAccess: jest.fn().mockResolvedValue(undefined),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new ChamadasPublicasService(prisma as any, policy as any, audit as any);
  return { service, prisma, policy, audit };
}

const ADMIN = { sub: 'u-1', role: 'ADMIN' } as any;

function dtoBase(over: Partial<CreateChamadaDto> = {}): CreateChamadaDto {
  return plainToInstance(CreateChamadaDto, {
    editalId: 'ed-1',
    numero: '001/2025',
    exercicio: 2025,
    objeto: 'objeto de teste',
    inscricoesInicio: '2025-03-01T00:00:00.000Z',
    inscricoesFim: '2025-04-01T00:00:00.000Z',
    ...over,
  });
}

function mensagem(erro: any): string {
  try {
    return typeof erro?.getResponse === 'function' ? JSON.stringify(erro.getResponse()) : String(erro?.message ?? erro);
  } catch {
    return String(erro?.message ?? erro);
  }
}

describe('ChamadasPublicasService — unicidade por escopo (DRE x estadual)', () => {
  it('cenário A: mesmo numero/exercicio em DREs diferentes é PERMITIDO (checagem escopada por dreId)', async () => {
    const { service, prisma, audit } = novoServico();
    const resultado = await service.criar(dtoBase({ dreId: 'dre-a' }), ADMIN);

    const checagem = prisma.chamadaPublica.findFirst.mock.calls[0][0];
    expect(checagem.where).toMatchObject({ numero: '001/2025', exercicio: 2025, dreId: 'dre-a' });
    expect(prisma.chamadaPublica.create).toHaveBeenCalledTimes(1);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entity: 'ChamadaPublica' }));
    expect(resultado).toBeDefined();
  });

  it('cenário B: duplicidade na MESMA DRE é bloqueada com 409 e mensagem por DRE (sem escrita nem auditoria)', async () => {
    const { service, prisma, audit } = novoServico();
    prisma.chamadaPublica.findFirst.mockImplementation((args: any) => Promise.resolve(args?.where?.id ? ROW : { id: 'duplicada' }));

    const erro = await service.criar(dtoBase({ dreId: 'dre-a' }), ADMIN).catch((e) => e);
    expect(erro).toBeInstanceOf(ConflictException);
    expect(mensagem(erro)).toContain('nesta DRE');
    expect(prisma.chamadaPublica.create).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('cenário D/E: escopo estadual busca com dreId = null e mensagem própria de estadual', async () => {
    const { service, prisma } = novoServico();
    prisma.chamadaPublica.findFirst.mockImplementation((args: any) => Promise.resolve(args?.where?.id ? ROW : { id: 'duplicada' }));

    const erro = await service.criar(dtoBase(), ADMIN).catch((e) => e); // sem dreId
    expect(erro).toBeInstanceOf(ConflictException);
    expect(mensagem(erro)).toContain('estadual');
    const checagem = prisma.chamadaPublica.findFirst.mock.calls[0][0];
    expect(checagem.where.dreId).toBeNull();
  });

  it('cenário F (corrida): P2002 na escrita de chamada com DRE vira 409 com mensagem por DRE', async () => {
    const { service, prisma } = novoServico();
    prisma.chamadaPublica.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['pnae_chamadas_publicas_dreEscopo_numero_exercicio_key'] },
    });

    const erro = await service.criar(dtoBase({ dreId: 'dre-a' }), ADMIN).catch((e) => e);
    expect(erro).toBeInstanceOf(ConflictException);
    expect(mensagem(erro)).toContain('nesta DRE');
  });

  it('cenário F (corrida, estadual): P2002 na escrita sem DRE vira 409 com mensagem de estadual', async () => {
    const { service, prisma } = novoServico();
    prisma.chamadaPublica.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['pnae_chamadas_publicas_dreEscopo_numero_exercicio_key'] },
    });

    const erro = await service.criar(dtoBase(), ADMIN).catch((e) => e);
    expect(erro).toBeInstanceOf(ConflictException);
    expect(mensagem(erro)).toContain('estadual');
  });

  it('erro que NÃO é de unicidade é re-lançado intacto (não vira 409)', async () => {
    const { service, prisma } = novoServico();
    prisma.chamadaPublica.create.mockRejectedValue(new Error('queda de conexao'));

    const erro = await service.criar(dtoBase({ dreId: 'dre-a' }), ADMIN).catch((e) => e);
    expect(erro).not.toBeInstanceOf(ConflictException);
    expect(erro?.message).toBe('queda de conexao');
  });

  it('normalização: numero é normalizado (trim) na busca e na escrita', async () => {
    const { service, prisma } = novoServico();
    await service.criar(dtoBase({ numero: '  001/2025  ', dreId: 'dre-a' }), ADMIN);

    const checagem = prisma.chamadaPublica.findFirst.mock.calls[0][0];
    expect(checagem.where.numero).toBe('001/2025');
    expect(prisma.chamadaPublica.create.mock.calls[0][0].data.numero).toBe('001/2025');
  });

  it('atualizar: P2002 (corrida) também vira 409', async () => {
    const { service, prisma } = novoServico();
    prisma.chamadaPublica.update.mockRejectedValue({ code: 'P2002', meta: { target: ['dreId', 'numero', 'exercicio'] } });

    const erro = await service.atualizar('ch-1', dtoBase({ dreId: 'dre-a' }) as UpdateChamadaDto, ADMIN).catch((e) => e);
    expect(erro).toBeInstanceOf(ConflictException);
    expect(mensagem(erro)).toContain('nesta DRE');
  });

  it('permissões preservadas: papel não administrativo é recusado antes de qualquer escrita', async () => {
    const { service, prisma } = novoServico();
    const escola = { sub: 'u-2', role: 'ESCOLA' } as any;

    const erro = await service.criar(dtoBase({ dreId: 'dre-a' }), escola).catch((e) => e);
    expect(erro).toBeInstanceOf(ForbiddenException);
    expect(prisma.chamadaPublica.findFirst).not.toHaveBeenCalled();
    expect(prisma.chamadaPublica.create).not.toHaveBeenCalled();
  });
});

describe('normalizarNumeroChamada (canônico compartilhado)', () => {
  it('remove espaços das bordas', () => {
    expect(normalizarNumeroChamada('  001/2025 ')).toBe('001/2025');
  });
  it('preserva caixa e miolo (nenhuma correção silenciosa de numeração)', () => {
    expect(normalizarNumeroChamada('025/224')).toBe('025/224');
    expect(normalizarNumeroChamada('e2e-1791821078217')).toBe('e2e-1791821078217');
    expect(normalizarNumeroChamada('00 1/2025')).toBe('00 1/2025');
  });
  it('entradas nulas/indefinidas viram string vazia', () => {
    expect(normalizarNumeroChamada(null)).toBe('');
    expect(normalizarNumeroChamada(undefined)).toBe('');
  });
});

describe('CreateChamadaDto — limites do campo numero (VARCHAR 191)', () => {
  const base = {
    editalId: 'ed-1',
    exercicio: 2025,
    objeto: 'objeto',
    inscricoesInicio: '2025-03-01T00:00:00.000Z',
    inscricoesFim: '2025-04-01T00:00:00.000Z',
  };

  it('aceita numero documental comum', async () => {
    const erros = await validate(plainToInstance(CreateChamadaDto, { ...base, numero: '001/2025' }));
    expect(erros.filter((e) => e.property === 'numero')).toHaveLength(0);
  });

  it('rejeita numero vazio', async () => {
    const erros = await validate(plainToInstance(CreateChamadaDto, { ...base, numero: '' }));
    expect(erros.some((e) => e.property === 'numero')).toBe(true);
  });

  it('rejeita numero acima de 191 caracteres (limite da coluna)', async () => {
    const erros = await validate(plainToInstance(CreateChamadaDto, { ...base, numero: 'x'.repeat(192) }));
    expect(erros.some((e) => e.property === 'numero')).toBe(true);
  });
});
