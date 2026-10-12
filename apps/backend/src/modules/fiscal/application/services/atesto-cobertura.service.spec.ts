import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { AtestoService, CriarAtestoInput } from './atesto.service';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

function nota(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    status: 'AGUARDANDO_ATESTO',
    resultadoConciliacao: 'CONCILIADA',
    valorTotal: new Prisma.Decimal('1000.00'),
    ...overrides,
  };
}

function montarServico(opcoes: { nota?: Record<string, unknown> | null; atesto?: Record<string, unknown> | null } = {}) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    notaFiscal: {
      findUnique: jest.fn(async () => ({
        contratoId: 'contrato-1',
        status: 'AGUARDANDO_ATESTO',
        valorTotal: new Prisma.Decimal('1000.00'),
      })),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
    atesto: {
      aggregate: jest.fn(async () => ({ _sum: { valorAtestado: new Prisma.Decimal('0') } })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'atesto-1',
        dataAtesto: new Date('2026-03-02T00:00:00.000Z'),
        hashSha256: null,
        versao: 1,
        ...args.data,
      })),
    },
  };

  const prisma = {
    notaFiscal: {
      findFirst: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : nota())),
    },
    divergenciaFiscal: {
      count: jest.fn(async () => 0),
    },
    atesto: {
      findMany: jest.fn(async () => []),
      findFirst: jest.fn(async () => ('atesto' in opcoes ? opcoes.atesto : null)),
    },
    $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const acesso = { exigir: jest.fn(async () => undefined) };

  const servico = new AtestoService(prisma as never, audit as never, acesso as never);

  return { servico };
}

describe('SDD-005: atesto (validações complementares)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('criar', () => {
    it('rejeita valor atestado não numérico', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: 'abc' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita data de atesto inválida', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.criar('nf-1', { tipo: 'PARCIAL', valorAtestado: '100.00', dataAtesto: 'não-é-data' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita tipo de atesto diferente de INTEGRAL/PARCIAL', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.criar('nf-1', { tipo: 'TOTAL' as unknown as CriarAtestoInput['tipo'], valorAtestado: '100.00' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('obterComprovante', () => {
    it('falha com NotFound quando o arquivo gravado não pode ser lido', async () => {
      const caminho = path.join(path.resolve(process.cwd(), 'storage', 'fiscal', 'nf-1'), 'atesto-x.pdf');
      const { servico } = montarServico({
        atesto: {
          id: 'atesto-1',
          notaFiscalId: 'nf-1',
          documentoPath: caminho,
          hashSha256: 'qualquer',
        },
      });
      jest.spyOn(fs.promises, 'readFile').mockRejectedValue(new Error('ENOENT'));

      await expect(servico.obterComprovante('nf-1', 'atesto-1', user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
