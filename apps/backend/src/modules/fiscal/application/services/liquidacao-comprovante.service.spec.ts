import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { LiquidacaoService } from './liquidacao.service';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

const filtroNota = { contrato: { dreId: { in: ['dre-1'] } } };
const filtroContrato = { dreId: { in: ['dre-1'] } };

function nota(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    serie: '1',
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    status: 'ATESTADA',
    fornecedor: { nome: 'Produtor X' },
    ...overrides,
  };
}

function atesto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'atesto-1',
    valorAtestado: new Prisma.Decimal('1000.00'),
    dataAtesto: new Date('2026-03-02T00:00:00.000Z'),
    status: 'ATESTADO',
    ...overrides,
  };
}

function pastaDaNota(notaFiscalId: string): string {
  return path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
}

function comprovante(opcoes: { mimetype?: string; conteudo?: Buffer } = {}): Express.Multer.File {
  const buffer = opcoes.conteudo ?? Buffer.from('%PDF-1.4 comprovante');
  return {
    fieldname: 'comprovante',
    originalname: 'comprovante.pdf',
    encoding: '7bit',
    mimetype: opcoes.mimetype ?? 'application/pdf',
    size: buffer.length,
    buffer,
  } as unknown as Express.Multer.File;
}

function montarServico(
  opcoes: {
    nota?: Record<string, unknown> | null;
    atesto?: Record<string, unknown> | null;
    linhas?: Record<string, unknown>[];
    total?: number;
    somaAtestos?: string;
    somaLiquidacoes?: string;
    statusNotaNaTransacao?: string;
    statusAtestoNaTransacao?: string;
    notaNaTransacao?: Record<string, unknown> | null;
    atestoNaTransacao?: Record<string, unknown> | null;
    liquidacao?: Record<string, unknown> | null;
  } = {},
) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    notaFiscal: {
      findUnique: jest.fn(async () =>
        'notaNaTransacao' in opcoes
          ? opcoes.notaNaTransacao
          : { contratoId: 'contrato-1', status: opcoes.statusNotaNaTransacao ?? 'ATESTADA' },
      ),
    },
    atesto: {
      findUnique: jest.fn(async () =>
        'atestoNaTransacao' in opcoes
          ? opcoes.atestoNaTransacao
          : { status: opcoes.statusAtestoNaTransacao ?? 'ATESTADO' },
      ),
      aggregate: jest.fn(async () => ({
        _sum: { valorAtestado: new Prisma.Decimal(opcoes.somaAtestos ?? '1000.00') },
      })),
    },
    liquidacao: {
      aggregate: jest.fn(async () => ({
        _sum: { valorLiquidado: new Prisma.Decimal(opcoes.somaLiquidacoes ?? '0') },
      })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'liq-1',
        numeroProcesso: args.data.numeroProcesso ?? null,
        notaFiscalId: args.data.notaFiscalId ?? null,
        notaFiscal: null,
        valorLiquidado: args.data.valorLiquidado,
        dataLiquidacao: args.data.dataLiquidacao,
        status: args.data.status,
        hashSha256: args.data.hashSha256,
      })),
    },
  };

  const prisma = {
    notaFiscal: {
      findFirst: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : nota())),
    },
    atesto: {
      findFirst: jest.fn(async () => ('atesto' in opcoes ? opcoes.atesto : atesto())),
    },
    liquidacao: {
      findMany: jest.fn(async () => opcoes.linhas ?? []),
      count: jest.fn(async () => opcoes.total ?? 0),
      findFirst: jest.fn(async () => opcoes.liquidacao ?? null),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (t: typeof tx) => Promise<unknown>)(tx);
      }
      return Promise.all(arg as Array<Promise<unknown>>);
    }),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const acesso = {
    exigir: jest.fn(async () => undefined),
    filtroNotaFiscal: jest.fn(async () => filtroNota),
    filtroContrato: jest.fn(async () => filtroContrato),
  };

  const servico = new LiquidacaoService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, audit, acesso, tx };
}

describe('SDD-005: liquidação (comprovantes e filtros complementares)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('criar com comprovante', () => {
    it('grava o comprovante PDF no storage, persiste o hash e audita', async () => {
      const { servico, tx, audit } = montarServico({});
      const mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
      const conteudo = Buffer.from('%PDF-1.4 comprovante');

      const resultado = await servico.criar(
        { notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '400.00', comprovante: comprovante({ conteudo }) },
        user,
      );

      expect(mkdir).toHaveBeenCalledWith(pastaDaNota('nf-1'), { recursive: true });
      const caminhoGravado = String(writeFile.mock.calls[0][0]);
      expect(path.dirname(caminhoGravado)).toBe(pastaDaNota('nf-1'));
      expect(path.basename(caminhoGravado)).toMatch(/^liquidacao-[0-9a-f-]{36}\.pdf$/);
      expect(writeFile).toHaveBeenCalledWith(caminhoGravado, conteudo, { flag: 'wx' });
      const hashEsperado = createHash('sha256').update(conteudo).digest('hex');
      expect(tx.liquidacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentoPath: expect.stringContaining(path.join('storage', 'fiscal', 'nf-1')),
            hashSha256: hashEsperado,
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ newValues: expect.objectContaining({ comprovante: true }) }),
      );
      expect(resultado.comprovante).toEqual({ id: 'liq-1', titulo: 'Comprovante de liquidação', versao: 1 });
    });

    it('aceita comprovante XML e grava com extensão xml', async () => {
      const { servico, tx } = montarServico({});
      jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

      await servico.criar(
        {
          notaFiscalId: 'nf-1',
          numeroProcesso: 'P-1',
          valorLiquidado: '400.00',
          comprovante: comprovante({ mimetype: 'application/xml', conteudo: Buffer.from('<lote/>') }),
        },
        user,
      );

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join('storage', 'fiscal', 'nf-1')),
        expect.any(Buffer),
        { flag: 'wx' },
      );
      expect(String(writeFile.mock.calls[0][0])).toMatch(/\.xml$/);
      expect(tx.liquidacao.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ hashSha256: expect.any(String) }) }),
      );
    });

    it('rejeita comprovante vazio e acima do limite', async () => {
      const vazio = montarServico({});
      await expect(
        vazio.servico.criar(
          { notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00', comprovante: comprovante({ conteudo: Buffer.alloc(0) }) },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      const grande = montarServico({});
      await expect(
        grande.servico.criar(
          { notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00', comprovante: comprovante({ conteudo: Buffer.alloc(10 * 1024 * 1024 + 1) }) },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita data de liquidação inválida', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00', dataLiquidacao: 'não-é-data' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resolve o atesto informado quando pertence à nota e está ATESTADO', async () => {
      const { servico, prisma, audit } = montarServico({});

      await servico.criar({ notaFiscalId: 'nf-1', atestoId: 'atesto-1', numeroProcesso: 'P-1', valorLiquidado: '400.00' }, user);

      expect(prisma.atesto.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'atesto-1', notaFiscalId: 'nf-1' } }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ newValues: expect.objectContaining({ atestoId: 'atesto-1' }) }),
      );
    });

    it('falha com NotFound quando o atesto informado não pertence à nota', async () => {
      const { servico } = montarServico({ atesto: null });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', atestoId: 'atesto-x', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com NotFound quando a nota desaparece dentro da transação', async () => {
      const { servico } = montarServico({ notaNaTransacao: null });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com conflito quando o atesto desaparece dentro da transação', async () => {
      const { servico } = montarServico({ atestoNaTransacao: null });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('listar (filtros complementares)', () => {
    it('aplica notaFiscalId e período de liquidação', async () => {
      const { servico, prisma } = montarServico({});

      await servico.listar({ notaFiscalId: 'nf-1', dataInicio: '2026-01-01', dataFim: '2026-01-31' }, user);

      expect(prisma.liquidacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notaFiscalId: 'nf-1',
            dataLiquidacao: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
          }),
        }),
      );
    });

    it('ignora filtro de status vazio e rejeita período inválido', async () => {
      const { servico, prisma } = montarServico({});

      await servico.listar({ status: '' }, user);
      expect(prisma.liquidacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ status: expect.anything() }) }),
      );

      await expect(servico.listar({ dataFim: 'não-é-data' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('comprovante', () => {
    function liquidacaoComArquivo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
      return {
        id: 'liq-1',
        contratoId: 'contrato-1',
        notaFiscalId: 'nf-1',
        ...overrides,
      };
    }

    it('serve o comprovante PDF com integridade confere', async () => {
      const conteudo = Buffer.from('%PDF-1.4 comprovante');
      const caminho = path.join(pastaDaNota('nf-1'), 'liquidacao-x.pdf');
      const { servico, acesso } = montarServico({
        liquidacao: liquidacaoComArquivo({
          documentoPath: caminho,
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
        }),
      });
      const readFile = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.comprovante('liq-1', user);

      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'CONSULTAR',
      );
      expect(readFile).toHaveBeenCalledWith(caminho);
      expect(resultado).toEqual({ caminho, nome: 'liquidacao-liq-1.pdf', mimeType: 'application/pdf' });
    });

    it('serve comprovante XML com o MIME type correto', async () => {
      const conteudo = Buffer.from('<lote/>');
      const caminho = path.join(pastaDaNota('nf-1'), 'liquidacao-x.xml');
      const { servico } = montarServico({
        liquidacao: liquidacaoComArquivo({
          documentoPath: caminho,
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.comprovante('liq-1', user);

      expect(resultado.nome).toBe('liquidacao-liq-1.xml');
      expect(resultado.mimeType).toBe('application/xml');
    });

    it('assume extensão pdf quando o arquivo gravado não possui extensão', async () => {
      const conteudo = Buffer.from('%PDF-1.4 comprovante');
      const caminho = path.join(pastaDaNota('nf-1'), 'comprovante');
      const { servico } = montarServico({
        liquidacao: liquidacaoComArquivo({
          documentoPath: caminho,
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.comprovante('liq-1', user);

      expect(resultado.nome).toBe('liquidacao-liq-1.pdf');
      expect(resultado.mimeType).toBe('application/pdf');
    });

    it('falha com NotFound quando a liquidação não existe', async () => {
      const { servico } = montarServico({ liquidacao: null });

      await expect(servico.comprovante('liq-x', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com NotFound quando o arquivo não pode ser lido', async () => {
      const { servico } = montarServico({
        liquidacao: liquidacaoComArquivo({
          documentoPath: path.join(pastaDaNota('nf-1'), 'liquidacao-x.pdf'),
          hashSha256: 'qualquer',
          contrato: { produtorId: 'fornecedor-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockRejectedValue(new Error('ENOENT'));

      await expect(servico.comprovante('liq-1', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com conflito quando o hash do arquivo diverge do registrado', async () => {
      const { servico } = montarServico({
        liquidacao: liquidacaoComArquivo({
          documentoPath: path.join(pastaDaNota('nf-1'), 'liquidacao-x.pdf'),
          hashSha256: createHash('sha256').update('original').digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('adulterado'));

      await expect(servico.comprovante('liq-1', user)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
