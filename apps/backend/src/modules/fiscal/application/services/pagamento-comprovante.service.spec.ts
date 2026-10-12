import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PagamentoService } from './pagamento.service';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

const filtroNota = { contrato: { dreId: { in: ['dre-1'] } } };
const filtroContrato = { dreId: { in: ['dre-1'] } };

function liquidacao(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'liq-1',
    contratoId: 'contrato-1',
    notaFiscalId: 'nf-1',
    numeroProcesso: 'P-2026-001',
    valorLiquidado: new Prisma.Decimal('1000.00'),
    status: 'REGISTRADA',
    contrato: { produtorId: 'fornecedor-1' },
    notaFiscal: { id: 'nf-1', numero: '12345', serie: '1', fornecedorId: 'fornecedor-1' },
    ...overrides,
  };
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

function pastaDaNota(notaFiscalId: string): string {
  return path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
}

function linhaPagamento(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'pg-1',
    liquidacaoId: 'liq-1',
    liquidacao: {
      numeroProcesso: 'P-2026-001',
      valorLiquidado: new Prisma.Decimal('1000.00'),
      notaFiscal: { numero: '12345', fornecedor: { nome: 'Produtor X' } },
    },
    valorPago: new Prisma.Decimal('400.00'),
    dataPagamento: new Date('2026-04-01T00:00:00.000Z'),
    status: 'REGISTRADO',
    hashSha256: null,
    ...overrides,
  };
}

function montarServico(
  opcoes: {
    liquidacao?: Record<string, unknown> | null;
    notaNoEscopo?: Record<string, unknown> | null;
    pagamento?: Record<string, unknown> | null;
    somaPago?: string;
    valorLiquidado?: string;
    statusLiquidacaoNaTransacao?: string;
    statusPagamentoNaTransacao?: string;
    liquidacaoNaTransacao?: Record<string, unknown> | null;
    linhas?: Record<string, unknown>[];
    total?: number;
  } = {},
) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    liquidacao: {
      findUnique: jest.fn(async () =>
        'liquidacaoNaTransacao' in opcoes
          ? opcoes.liquidacaoNaTransacao
          : {
              contratoId: 'contrato-1',
              notaFiscalId: 'nf-1',
              status: opcoes.statusLiquidacaoNaTransacao ?? 'REGISTRADA',
              valorLiquidado: new Prisma.Decimal(opcoes.valorLiquidado ?? '1000.00'),
            },
      ),
    },
    pagamento: {
      aggregate: jest.fn(async () => ({
        _sum: { valorPago: new Prisma.Decimal(opcoes.somaPago ?? '0') },
      })),
      findUnique: jest.fn(async () => ({
        status: opcoes.statusPagamentoNaTransacao ?? 'REGISTRADO',
        observacoes: null,
      })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'pg-1',
        liquidacaoId: args.data.liquidacaoId,
        liquidacao: {
          numeroProcesso: 'P-2026-001',
          valorLiquidado: new Prisma.Decimal(opcoes.valorLiquidado ?? '1000.00'),
          notaFiscal: { numero: '12345', fornecedor: { nome: 'Produtor X' } },
        },
        valorPago: args.data.valorPago,
        dataPagamento: args.data.dataPagamento,
        status: args.data.status,
        hashSha256: args.data.hashSha256,
      })),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
  };

  const prisma = {
    liquidacao: {
      findFirst: jest.fn(async () => ('liquidacao' in opcoes ? opcoes.liquidacao : liquidacao())),
    },
    notaFiscal: {
      findFirst: jest.fn(async () => ('notaNoEscopo' in opcoes ? opcoes.notaNoEscopo : { id: 'nf-1' })),
    },
    pagamento: {
      findFirst: jest.fn(async () => opcoes.pagamento ?? null),
      findMany: jest.fn(async () => opcoes.linhas ?? [linhaPagamento()]),
      count: jest.fn(async () => opcoes.total ?? 1),
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

  const servico = new PagamentoService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, audit, acesso, tx };
}

describe('SDD-005: pagamento (comprovantes, validação de valores e filtros)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('criar', () => {
    it('grava o comprovante PDF no storage, persiste o hash e audita', async () => {
      const { servico, tx, audit } = montarServico({});
      const mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
      const conteudo = Buffer.from('%PDF-1.4 comprovante');

      const resultado = await servico.criar(
        { liquidacaoId: 'liq-1', valorPago: '400.00', comprovante: comprovante({ conteudo }) },
        user,
      );

      expect(mkdir).toHaveBeenCalledWith(pastaDaNota('nf-1'), { recursive: true });
      const caminhoGravado = String(writeFile.mock.calls[0][0]);
      expect(path.dirname(caminhoGravado)).toBe(pastaDaNota('nf-1'));
      expect(path.basename(caminhoGravado)).toMatch(/^pagamento-[0-9a-f-]{36}\.pdf$/);
      expect(writeFile).toHaveBeenCalledWith(caminhoGravado, conteudo, { flag: 'wx' });
      const hashEsperado = createHash('sha256').update(conteudo).digest('hex');
      expect(tx.pagamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ comprovantePath: expect.stringContaining(path.join('storage', 'fiscal', 'nf-1')), hashSha256: hashEsperado }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ newValues: expect.objectContaining({ comprovante: true }) }),
      );
      expect(resultado.comprovante).toEqual({ id: 'pg-1', titulo: 'Comprovante de pagamento', versao: 1 });
    });

    it('grava o comprovante XML com a extensão correta', async () => {
      const { servico, tx } = montarServico({});
      jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

      await servico.criar(
        { liquidacaoId: 'liq-1', valorPago: '400.00', comprovante: comprovante({ mimetype: 'text/xml', conteudo: Buffer.from('<lote/>') }) },
        user,
      );

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join('storage', 'fiscal', 'nf-1')),
        expect.any(Buffer),
        { flag: 'wx' },
      );
      expect(String(writeFile.mock.calls[0][0])).toMatch(/\.xml$/);
      expect(tx.pagamento.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ hashSha256: expect.any(String) }) }),
      );
    });

    it('usa a pasta raiz quando a liquidação não está vinculada a nota fiscal', async () => {
      const { servico, acesso } = montarServico({
        liquidacao: liquidacao({ notaFiscalId: null, notaFiscal: null }),
      });
      jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

      await servico.criar({ liquidacaoId: 'liq-1', valorPago: '400.00', comprovante: comprovante() }, user);

      expect(acesso.exigir).toHaveBeenCalledWith(user, { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, 'PROCESSAR');
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join(process.cwd(), 'storage', 'fiscal')),
        expect.any(Buffer),
        { flag: 'wx' },
      );
    });

    it('rejeita comprovante vazio e acima do limite de 10 MB', async () => {
      const vazio = montarServico({});
      await expect(
        vazio.servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00', comprovante: comprovante({ conteudo: Buffer.alloc(0) }) }, user),
      ).rejects.toBeInstanceOf(BadRequestException);

      const grande = montarServico({});
      await expect(
        grande.servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00', comprovante: comprovante({ conteudo: Buffer.alloc(10 * 1024 * 1024 + 1) }) }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('valida o valor pago: vazio, não numérico ou não positivo', async () => {
      const semValor = montarServico({});
      await expect(
        semValor.servico.criar({ liquidacaoId: 'liq-1', valorPago: undefined as unknown as string }, user),
      ).rejects.toBeInstanceOf(BadRequestException);

      const emBranco = montarServico({});
      await expect(emBranco.servico.criar({ liquidacaoId: 'liq-1', valorPago: '   ' }, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      const naoNumerico = montarServico({});
      await expect(naoNumerico.servico.criar({ liquidacaoId: 'liq-1', valorPago: 'abc' }, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      const negativo = montarServico({});
      await expect(negativo.servico.criar({ liquidacaoId: 'liq-1', valorPago: '-5.00' }, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejeita data de pagamento inválida', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00', dataPagamento: 'não-é-data' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falha com NotFound quando a liquidação desaparece dentro da transação', async () => {
      const { servico } = montarServico({ liquidacaoNaTransacao: null });

      await expect(servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00' }, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('paga liquidação CONFIRMADA sem exigir nota no escopo quando não há nota', async () => {
      const { servico, prisma } = montarServico({
        liquidacao: liquidacao({ status: 'CONFIRMADA', notaFiscalId: null, notaFiscal: null }),
      });

      const resultado = await servico.criar({ liquidacaoId: 'liq-1', valorPago: '1000.00' }, user);

      expect(prisma.notaFiscal.findFirst).not.toHaveBeenCalled();
      expect(resultado.status).toBe('CONFIRMADO');
    });
  });

  describe('listar (filtros complementares)', () => {
    it('aplica liquidação e período do pagamento', async () => {
      const { servico, prisma } = montarServico({});

      await servico.listar({ liquidacaoId: 'liq-1', dataInicio: '2026-01-01', dataFim: '2026-01-31' }, user);

      expect(prisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            liquidacaoId: 'liq-1',
            dataPagamento: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
          }),
        }),
      );
    });

    it('ignora status vazio e rejeita período inválido', async () => {
      const { servico, prisma } = montarServico({});

      await servico.listar({ status: '' }, user);
      expect(prisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ status: expect.anything() }) }),
      );

      await expect(servico.listar({ dataInicio: 'não-é-data' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('classifica como PARCIAL e INTEGRAL conforme o valor pago sobre o saldo', async () => {
      const parcial = montarServico({ linhas: [linhaPagamento({ valorPago: new Prisma.Decimal('100.00') })] });
      const parcialResultado = await parcial.servico.listar({}, user);
      expect(parcialResultado.items[0].tipo).toBe('PARCIAL');

      const integral = montarServico({
        linhas: [linhaPagamento({ valorPago: new Prisma.Decimal('1000.00') })],
      });
      const integralResultado = await integral.servico.listar({}, user);
      expect(integralResultado.items[0].tipo).toBe('INTEGRAL');
    });
  });

  describe('estornar', () => {
    it('falha com NotFound quando a reconsulta pós-estorno não encontra a linha', async () => {
      const { servico, prisma } = montarServico({
        pagamento: {
          id: 'pg-1',
          contratoId: 'contrato-1',
          numeroOrdemPagamento: 'OP-1',
          liquidacaoId: 'liq-1',
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: {
            contratoId: 'contrato-1',
            notaFiscalId: 'nf-1',
            valorLiquidado: new Prisma.Decimal('1000.00'),
            numeroProcesso: 'P-1',
          },
          notaFiscal: { numero: '12345', fornecedorId: 'fornecedor-1' },
        },
      });
      prisma.pagamento.findFirst = jest
        .fn()
        .mockResolvedValueOnce({
          id: 'pg-1',
          contratoId: 'contrato-1',
          numeroOrdemPagamento: 'OP-1',
          liquidacaoId: 'liq-1',
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: {
            contratoId: 'contrato-1',
            notaFiscalId: 'nf-1',
            valorLiquidado: new Prisma.Decimal('1000.00'),
            numeroProcesso: 'P-1',
          },
          notaFiscal: { numero: '12345', fornecedorId: 'fornecedor-1' },
        })
        .mockResolvedValueOnce(null);

      await expect(servico.estornar('pg-1', 'Duplicidade', user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('comprovante', () => {
    function pagamentoComArquivo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
      return {
        id: 'pg-1',
        contratoId: 'contrato-1',
        ...overrides,
      };
    }

    it('serve o comprovante PDF com integridade confere', async () => {
      const conteudo = Buffer.from('%PDF-1.4 comprovante');
      const caminho = path.join(pastaDaNota('nf-1'), 'pagamento-x.pdf');
      const { servico, acesso } = montarServico({
        pagamento: pagamentoComArquivo({
          comprovantePath: caminho,
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: { notaFiscalId: 'nf-1' },
        }),
      });
      const readFile = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.comprovante('pg-1', user);

      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'CONSULTAR',
      );
      expect(readFile).toHaveBeenCalledWith(caminho);
      expect(resultado).toEqual({ caminho, nome: 'pagamento-pg-1.pdf', mimeType: 'application/pdf' });
    });

    it('serve comprovante XML com o MIME type correto', async () => {
      const conteudo = Buffer.from('<lote/>');
      const caminho = path.join(pastaDaNota('nf-1'), 'pagamento-x.xml');
      const { servico } = montarServico({
        pagamento: pagamentoComArquivo({
          comprovantePath: caminho,
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: { notaFiscalId: 'nf-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.comprovante('pg-1', user);

      expect(resultado.nome).toBe('pagamento-pg-1.xml');
      expect(resultado.mimeType).toBe('application/xml');
    });

    it('assume extensão pdf quando o arquivo não possui extensão', async () => {
      const conteudo = Buffer.from('%PDF-1.4 comprovante');
      const { servico } = montarServico({
        pagamento: pagamentoComArquivo({
          comprovantePath: path.join(pastaDaNota('nf-1'), 'comprovante'),
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: { notaFiscalId: 'nf-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.comprovante('pg-1', user);

      expect(resultado.nome).toBe('pagamento-pg-1.pdf');
      expect(resultado.mimeType).toBe('application/pdf');
    });

    it('falha com NotFound quando o pagamento não existe', async () => {
      const { servico } = montarServico({ pagamento: null });

      await expect(servico.comprovante('pg-x', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com NotFound quando o arquivo não pode ser lido', async () => {
      const { servico } = montarServico({
        pagamento: pagamentoComArquivo({
          comprovantePath: path.join(pastaDaNota('nf-1'), 'pagamento-x.pdf'),
          hashSha256: 'qualquer',
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: { notaFiscalId: 'nf-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockRejectedValue(new Error('ENOENT'));

      await expect(servico.comprovante('pg-1', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com conflito quando o hash do arquivo diverge do registrado', async () => {
      const { servico } = montarServico({
        pagamento: pagamentoComArquivo({
          comprovantePath: path.join(pastaDaNota('nf-1'), 'pagamento-x.pdf'),
          hashSha256: createHash('sha256').update('original').digest('hex'),
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: { notaFiscalId: 'nf-1' },
        }),
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('adulterado'));

      await expect(servico.comprovante('pg-1', user)).rejects.toBeInstanceOf(ConflictException);
    });

    it('falha com conflito quando o caminho foge da pasta da nota', async () => {
      const { servico } = montarServico({
        pagamento: pagamentoComArquivo({
          comprovantePath: path.resolve(process.cwd(), 'fora-da-raiz', 'comprovante.pdf'),
          hashSha256: 'abc',
          contrato: { produtorId: 'fornecedor-1' },
          liquidacao: { notaFiscalId: 'nf-1' },
        }),
      });

      await expect(servico.comprovante('pg-1', user)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
