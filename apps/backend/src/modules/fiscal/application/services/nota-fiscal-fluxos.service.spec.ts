import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { CriarNotaFiscalDto, NotaFiscalService } from './nota-fiscal.service';
import { StatusNotaFiscal } from '../domain/fiscal-estado';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

function D(valor: string): Prisma.Decimal {
  return new Prisma.Decimal(valor);
}

function contrato(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'contrato-1',
    numero: 'C-001',
    exercicio: 2026,
    produtorId: 'fornecedor-1',
    deletedAt: null,
    itens: [{ id: 'ci-1', produto: 'Arroz', unidade: 'KG', valorUnitario: D('9.00'), deletedAt: null }],
    ...overrides,
  };
}

function fornecedor(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144', ...overrides };
}

function notaCompleta(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    serie: '1',
    modelo: '55',
    chaveAcesso: '35261111222333444455555555555555555111111111',
    dataEmissao: new Date('2026-01-02T00:00:00.000Z'),
    dataRecebimento: new Date('2026-01-03T00:00:00.000Z'),
    cnpjEmitente: '11222333000144',
    cpfEmitente: null,
    documentoDestinatario: null,
    valorProdutos: D('900.00'),
    valorTotal: D('1000.00'),
    valorDesconto: D('0.00'),
    valorFrete: D('100.00'),
    valorOutrasDespesas: D('0.00'),
    status: 'PROCESSADA',
    resultadoConciliacao: null,
    observacoes: null,
    fornecedorId: 'fornecedor-1',
    contratoId: 'contrato-1',
    fornecedor: { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' },
    contrato: { id: 'contrato-1', numero: 'C-001', exercicio: 2026, dreId: 'dre-1', escolaId: null, produtorId: 'fornecedor-1' },
    itens: [
      {
        id: 'item-1',
        numeroItem: 1,
        codigoProduto: 'PROD-1',
        descricao: 'Arroz',
        ncm: '10063010',
        cfop: '1102',
        unidadeComercial: 'KG',
        quantidade: D('100.00'),
        valorUnitario: D('9.00'),
        valorTotal: D('900.00'),
        contratoItemId: 'ci-1',
        contratoItem: { id: 'ci-1', produto: 'Arroz', unidade: 'KG', valorUnitario: D('9.00') },
      },
    ],
    documentos: [],
    divergencias: [],
    conferencias: [],
    atestos: [],
    vinculosRecebimento: [
      {
        entrega: {
          id: 'entrega-1',
          numero: 'E-1',
          status: 'ACEITA',
          dataEntrega: new Date('2026-01-04T00:00:00.000Z'),
          aceitaEm: null,
        },
      },
    ],
    xmlDocumento: null,
    pdfDocumento: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    ...overrides,
  };
}

function linhaLista(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    serie: '1',
    modelo: '55',
    chaveAcesso: '35261111222333444455555555555555555111111111',
    dataEmissao: new Date('2026-01-02T00:00:00.000Z'),
    dataRecebimento: new Date('2026-01-03T00:00:00.000Z'),
    cnpjEmitente: '11222333000144',
    cpfEmitente: null,
    documentoDestinatario: null,
    valorProdutos: D('900.00'),
    valorTotal: D('1000.00'),
    valorDesconto: D('0.00'),
    valorFrete: D('100.00'),
    valorOutrasDespesas: D('0.00'),
    status: 'PROCESSADA',
    resultadoConciliacao: null,
    observacoes: null,
    fornecedorId: 'fornecedor-1',
    contratoId: 'contrato-1',
    fornecedor: { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' },
    contrato: { id: 'contrato-1', numero: 'C-001', exercicio: 2026 },
    xmlDocumentoId: null,
    pdfDocumentoId: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    itens: [],
    divergencias: [],
    conferencias: [],
    atestos: [],
    ...overrides,
  };
}

function dadosNFe(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    numero: '12345',
    serie: '1',
    modelo: '55',
    chaveAcesso: '35261111222333444455555555555555555111111111',
    dataEmissao: new Date('2026-01-02T00:00:00.000Z'),
    cnpjEmitente: '11222333000144',
    cpfEmitente: null,
    valorProdutos: '900.00',
    valorTotal: '1000.00',
    valorDesconto: '0.00',
    valorFrete: '100.00',
    valorOutrasDespesas: '0.00',
    itens: [
      {
        numeroItem: 1,
        codigoProduto: 'PROD-1',
        descricao: 'Arroz',
        ncm: '10063010',
        cfop: '1102',
        unidade: 'KG',
        quantidade: '100.00',
        valorUnitario: '9.00',
        valorTotal: '900.00',
      },
    ],
    ...overrides,
  };
}

function dto(overrides: Partial<CriarNotaFiscalDto> = {}): CriarNotaFiscalDto {
  return {
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    numero: '12345',
    chaveAcesso: '35261111222333444455555555555555555111111111',
    dataEmissao: '2026-01-02T00:00:00.000Z',
    valorProdutos: '900.00',
    valorTotal: '1000.00',
    valorDesconto: '0.00',
    valorFrete: '100.00',
    itens: [{ numeroItem: 1, descricao: 'Arroz', quantidade: '100.00', valorUnitario: '9.00', valorTotal: '900.00' }],
    ...overrides,
  };
}

function montarServico(
  opcoes: {
    contrato?: Record<string, unknown> | null;
    fornecedor?: Record<string, unknown> | null;
    chaveExistente?: Record<string, unknown> | null;
    nota?: Record<string, unknown> | null;
    notaExistente?: Record<string, unknown> | null;
    linhas?: Record<string, unknown>[];
    total?: number;
    countUpdate?: number;
    dadosXml?: Record<string, unknown> | null;
    exigirErro?: Error;
  } = {},
) {
  const tx = {
    notaFiscal: {
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'nf-1',
        numero: args.data.numero,
        ...args.data,
      })),
    },
    notaFiscalItem: {
      createMany: jest.fn(async () => ({ count: 1 })),
    },
  };

  const prisma = {
    contrato: {
      findUnique: jest.fn(async () => ('contrato' in opcoes ? opcoes.contrato : contrato())),
    },
    produtor: {
      findUnique: jest.fn(async () => ('fornecedor' in opcoes ? opcoes.fornecedor : fornecedor())),
      findFirst: jest.fn(async (args: { where: Record<string, unknown> }) =>
        args.where.id === '' ? null : 'fornecedor' in opcoes ? opcoes.fornecedor : fornecedor(),
      ),
    },
    notaFiscal: {
      findUnique: jest.fn(async (args: { where: { id?: string; chaveAcesso?: string } }) => {
        if ('chaveAcesso' in args.where) return opcoes.chaveExistente ?? null;
        return 'nota' in opcoes ? opcoes.nota : notaCompleta();
      }),
      findFirst: jest.fn(async () => opcoes.notaExistente ?? null),
      findMany: jest.fn(async () => opcoes.linhas ?? [linhaLista()]),
      count: jest.fn(async () => opcoes.total ?? 1),
      update: jest.fn(async () => ({})),
      updateMany: jest.fn(async () => ({ count: opcoes.countUpdate ?? 1 })),
    },
    notaFiscalItem: {
      createMany: tx.notaFiscalItem.createMany,
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (t: typeof tx) => Promise<unknown>)(tx);
      }
      return Promise.all(arg as Array<Promise<unknown>>);
    }),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const xmlFiscal = {
    extrairDadosNFe: jest.fn(async () => ('dadosXml' in opcoes ? opcoes.dadosXml : dadosNFe())),
  };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
    filtroNotaFiscal: jest.fn(async () => ({ contrato: { dreId: { in: ['dre-1'] } } })),
    filtroContrato: jest.fn(async () => ({ dreId: { in: ['dre-1'] } })),
  };
  const documentoService = { upload: jest.fn(async () => ({ id: 'doc-1' })) };
  const conciliacaoService = { conciliar: jest.fn(async () => ({ status: 'conciliada' })) };

  const servico = new NotaFiscalService(
    prisma as never,
    audit as never,
    xmlFiscal as never,
    acesso as never,
    documentoService as never,
    conciliacaoService as never,
  );

  return { servico, prisma, audit, acesso, xmlFiscal, documentoService, conciliacaoService, tx };
}

describe('SDD-005: nota fiscal (criação, XML, consulta e atualização)', () => {
  describe('create', () => {
    it('cria a nota manual com itens em transação, audita e devolve o detalhe', async () => {
      const { servico, tx, audit } = montarServico({});

      const resultado = await servico.create(
        dto({ dataRecebimento: '2026-01-03T00:00:00.000Z', observacoes: 'Entrada na escola' }),
        'u1',
      );

      expect(tx.notaFiscal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fornecedorId: 'fornecedor-1',
            contratoId: 'contrato-1',
            numero: '12345',
            status: StatusNotaFiscal.PENDENTE_PROCESSAMENTO,
            createdBy: 'u1',
          }),
        }),
      );
      expect(tx.notaFiscalItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ notaFiscalId: 'nf-1', numeroItem: 1 })],
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          action: 'NOTA_FISCAL_CRIADA',
          entity: 'NotaFiscal',
          entityId: 'nf-1',
        }),
      );
      expect(resultado.numero).toBe('12345');
      expect(resultado.itens).toHaveLength(1);
      expect(resultado.recebimentos).toEqual([
        { id: 'entrega-1', numero: 'E-1', status: 'ACEITA', dataRecebimento: new Date('2026-01-04T00:00:00.000Z') },
      ]);
    });

    it('vincula os itens aos itens do contrato quando informados', async () => {
      const { servico, prisma } = montarServico({});

      await servico.create(dto({ itens: [{ numeroItem: 1, descricao: 'Arroz', quantidade: '10', valorUnitario: '90', valorTotal: '900', contratoItemId: 'ci-1' }] }), 'u1');

      expect(prisma.notaFiscalItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ contratoItemId: 'ci-1' })],
      });
    });

    it('falha com NotFound quando o contrato não existe', async () => {
      const { servico } = montarServico({ contrato: null });

      await expect(servico.create(dto(), 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita contrato cancelado', async () => {
      const { servico } = montarServico({ contrato: contrato({ deletedAt: new Date('2026-01-01T00:00:00.000Z') }) });

      await expect(servico.create(dto(), 'u1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falha com NotFound quando o fornecedor não existe', async () => {
      const { servico } = montarServico({ fornecedor: null });

      await expect(servico.create(dto(), 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita fornecedor diferente do produtor do contrato', async () => {
      const { servico } = montarServico({});

      await expect(servico.create(dto({ fornecedorId: 'fornecedor-2' }), 'u1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('impede chave de acesso já registrada', async () => {
      const { servico, prisma } = montarServico({ chaveExistente: { id: 'nf-0' } });

      await expect(servico.create(dto(), 'u1')).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.notaFiscalItem.createMany).not.toHaveBeenCalled();
    });

    it('exige ao menos um item', async () => {
      const { servico } = montarServico({});

      await expect(servico.create(dto({ itens: [] }), 'u1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita valor total que não bate com os componentes', async () => {
      const { servico } = montarServico({});

      await expect(servico.create(dto({ valorTotal: '950.00' }), 'u1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita item apontando para item de contrato inexistente', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.create(dto({ itens: [{ numeroItem: 1, descricao: 'Arroz', quantidade: '10', valorUnitario: '90', valorTotal: '900', contratoItemId: 'ci-x' }] }), 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('processarXml', () => {
    it('cria a nota PROCESSADA a partir do XML, anexa o documento e audita', async () => {
      const { servico, prisma, audit, documentoService, acesso } = montarServico({});
      const xml = Buffer.from('<?xml version="1.0"?><nfeProc/>');

      const resultado = await servico.processarXml(xml, 'contrato-1', user);

      expect(acesso.exigir).not.toHaveBeenCalled();
      expect(prisma.produtor.findFirst).toHaveBeenCalledWith({ where: { cpfCnpj: '11222333000144' } });
      expect(prisma.notaFiscal.findUnique).toHaveBeenCalledWith({ where: { chaveAcesso: '35261111222333444455555555555555555111111111' } });
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(prisma.notaFiscalItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ notaFiscalId: 'nf-1', numeroItem: 1, quantidade: D('100.00') })],
      });
      expect(documentoService.upload).toHaveBeenCalledWith(
        'nf-1',
        expect.objectContaining({ buffer: xml, mimetype: 'application/xml', originalname: 'NF_12345.xml' }),
        'XML',
        'XML NF-e 12345',
        user,
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'NOTA_FISCAL_PROCESSADA_XML', entityId: 'nf-1', userId: 'u1' }),
      );
      expect(resultado.numero).toBe('12345');
    });

    it('falha quando o emitente não tem documento identificador', async () => {
      const { servico, prisma } = montarServico({ dadosXml: dadosNFe({ cnpjEmitente: null, cpfEmitente: null }) });

      await expect(servico.processarXml(Buffer.from('<nfe/>'), 'contrato-1', user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.produtor.findFirst).toHaveBeenCalledWith({ where: { id: '' } });
    });

    it('falha com NotFound quando nenhum fornecedor corresponde ao emitente', async () => {
      const { servico } = montarServico({ fornecedor: null });

      await expect(servico.processarXml(Buffer.from('<nfe/>'), 'contrato-1', user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('falha com NotFound quando o contrato não existe', async () => {
      const { servico } = montarServico({ contrato: null });

      await expect(servico.processarXml(Buffer.from('<nfe/>'), 'contrato-x', user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejeita fornecedor que não corresponde ao contrato', async () => {
      const { servico } = montarServico({ contrato: contrato({ produtorId: 'fornecedor-outro' }) });

      await expect(servico.processarXml(Buffer.from('<nfe/>'), 'contrato-1', user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('impede chave de acesso duplicada vinda do XML', async () => {
      const { servico, tx } = montarServico({ chaveExistente: { id: 'nf-0' } });

      await expect(servico.processarXml(Buffer.from('<nfe/>'), 'contrato-1', user)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.notaFiscal.create).not.toHaveBeenCalled();
    });

    it('processa XML sem chave de acesso sem checar duplicidade', async () => {
      const { servico, prisma } = montarServico({ dadosXml: dadosNFe({ chaveAcesso: null }) });

      await servico.processarXml(Buffer.from('<nfe/>'), 'contrato-1', user);

      expect(prisma.notaFiscal.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.notaFiscal.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'nf-1' } }));
    });

    it('propaga o erro do parser de XML', async () => {
      const { servico, xmlFiscal } = montarServico({});
      xmlFiscal.extrairDadosNFe.mockRejectedValue(new BadRequestException('XML malformado.'));

      await expect(servico.processarXml(Buffer.from('lixo'), 'contrato-1', user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('falha com NotFound quando a nota não existe', async () => {
      const { servico } = montarServico({ nota: null });

      await expect(servico.findById('nf-x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('autoriza a consulta com CONSULTAR quando há usuário', async () => {
      const { servico, acesso } = montarServico({});

      const resultado = await servico.findById('nf-1', user);

      expect(acesso.exigir).toHaveBeenCalledWith(user, { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, 'CONSULTAR');
      expect(resultado.status).toBe('PROCESSADA');
      expect(resultado.documentos).toEqual([]);
      expect(resultado.conciliacao).toBeNull();
      expect(resultado.recebimentos).toHaveLength(1);
    });

    it('não exige autorização quando chamado sem usuário', async () => {
      const { servico, acesso } = montarServico({});

      await servico.findById('nf-1');

      expect(acesso.exigir).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('rejeita filtro de status inválido', async () => {
      const { servico } = montarServico({});

      await expect(servico.findAll({ status: 'ESTORNADA' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('aplica filtros, escopo do usuário e paginação', async () => {
      const { servico, prisma, acesso } = montarServico({ total: 25 });

      const resultado = await servico.findAll(
        {
          status: 'PROCESSADA',
          resultadoConciliacao: 'CONCILIADA',
          fornecedorId: 'fornecedor-1',
          contratoId: 'contrato-1',
          dataInicio: '2026-01-01',
          dataFim: '2026-01-31',
          page: '2',
          limit: '10',
        },
        user,
      );

      expect(acesso.filtroNotaFiscal).toHaveBeenCalledWith(user);
      expect(prisma.notaFiscal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            AND: [{ contrato: { dreId: { in: ['dre-1'] } } }],
            status: 'PROCESSADA',
            resultadoConciliacao: 'CONCILIADA',
            fornecedorId: 'fornecedor-1',
            contratoId: 'contrato-1',
            dataEmissao: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
          },
          skip: 10,
          take: 10,
          orderBy: { dataEmissao: 'desc' },
        }),
      );
      expect(resultado).toEqual(
        expect.objectContaining({ total: 25, page: 2, limit: 10, totalPages: 3 }),
      );
      expect(resultado.items[0].numero).toBe('12345');
    });

    it('normaliza paginação inválida e aceita só o filtro de data inicial', async () => {
      const { servico, prisma } = montarServico({});

      const resultado = await servico.findAll({ page: '-2', limit: '500', dataInicio: '2026-02-01' }, user);

      expect(resultado.page).toBe(1);
      expect(resultado.limit).toBe(100);
      expect(prisma.notaFiscal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ dataEmissao: { gte: new Date('2026-02-01') } }),
          skip: 0,
          take: 100,
        }),
      );
    });

    it('sem usuário considera apenas o filtro base de exclusão lógica', async () => {
      const { servico, prisma, acesso } = montarServico({});

      await servico.findAll({ status: 'PROCESSADA' });

      expect(acesso.filtroNotaFiscal).not.toHaveBeenCalled();
      expect(prisma.notaFiscal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null, status: 'PROCESSADA' } }),
      );
    });
  });

  describe('update', () => {
    it('atualiza todos os campos informados e audita', async () => {
      const { servico, prisma, audit } = montarServico({});

      const resultado = await servico.update(
        'nf-1',
        {
          numero: '99999',
          serie: '2',
          modelo: '65',
          chaveAcesso: 'nova-chave',
          dataEmissao: '2026-02-01T00:00:00.000Z',
          observacoes: 'Retificada',
        },
        user,
      );

      expect(prisma.notaFiscal.update).toHaveBeenCalledWith({
        where: { id: 'nf-1' },
        data: {
          updatedBy: 'u1',
          numero: '99999',
          serie: '2',
          modelo: '65',
          chaveAcesso: 'nova-chave',
          dataEmissao: new Date('2026-02-01T00:00:00.000Z'),
          observacoes: 'Retificada',
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'NOTA_FISCAL_ATUALIZADA', entityLabel: '12345', userId: 'u1' }),
      );
      expect(resultado.numero).toBe('12345');
    });

    it('não altera campos ausentes do DTO', async () => {
      const { servico, prisma } = montarServico({});

      await servico.update('nf-1', {}, user);

      expect(prisma.notaFiscal.update).toHaveBeenCalledWith({ where: { id: 'nf-1' }, data: { updatedBy: 'u1' } });
    });

    it('falha com NotFound quando a nota desaparece entre a leitura e a gravação', async () => {
      const { servico, prisma } = montarServico({});
      prisma.notaFiscal.findUnique = jest
        .fn()
        .mockResolvedValueOnce(notaCompleta())
        .mockResolvedValueOnce(null);

      await expect(servico.update('nf-1', { numero: '999' }, user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('transicionar', () => {
    it('falha com NotFound quando a nota não existe', async () => {
      const { servico } = montarServico({ nota: null });

      await expect(
        servico.transicionar('nf-x', StatusNotaFiscal.CANCELADA, 'sem nota', 'u1', 'DRE'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('aplica transição direta PROCESSADA para EM_CONFERENCIA', async () => {
      const { servico, prisma } = montarServico({ nota: notaCompleta({ status: 'PROCESSADA' }) });

      const resultado = await servico.transicionar('nf-1', StatusNotaFiscal.EM_CONFERENCIA, undefined, 'u1', 'DRE');

      expect(prisma.notaFiscal.updateMany).toHaveBeenCalledWith({
        where: { id: 'nf-1', status: 'PROCESSADA' },
        data: { status: 'EM_CONFERENCIA', updatedBy: 'u1' },
      });
      expect(resultado.status).toBe('PROCESSADA');
    });
  });

  describe('delegações', () => {
    it('conciliar delega para o serviço de conciliação fiscal', async () => {
      const { servico, conciliacaoService } = montarServico({});

      const resultado = await servico.conciliar('nf-1', user);

      expect(conciliacaoService.conciliar).toHaveBeenCalledWith('nf-1', user);
      expect(resultado).toEqual({ status: 'conciliada' });
    });

    it('uploadPdf delega para o serviço de documentos com tipo PDF', async () => {
      const { servico, documentoService } = montarServico({});
      const pdf = {
        fieldname: 'arquivo',
        originalname: 'assinado.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 10,
        buffer: Buffer.from('%PDF-1.4'),
      } as unknown as Express.Multer.File;

      const resultado = await servico.uploadPdf('nf-1', pdf, user);

      expect(documentoService.upload).toHaveBeenCalledWith('nf-1', pdf, 'PDF', 'PDF NF nf-1', user);
      expect(resultado).toEqual({ id: 'doc-1' });
    });
  });

  describe('receberArquivo (ramificações de observações)', () => {
    it('não grava observações em branco no caminho do XML', async () => {
      const { servico, prisma } = montarServico({});
      const processarXml = jest.spyOn(servico, 'processarXml').mockResolvedValue({ id: 'nf-9' } as never);

      await servico.receberArquivo(
        { tipo: 'XML', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1', observacoes: '   ' },
        {
          fieldname: 'arquivo',
          originalname: 'nf.xml',
          encoding: '7bit',
          mimetype: 'application/xml',
          size: 21,
          buffer: Buffer.from('<?xml version="1.0"?>'),
        } as unknown as Express.Multer.File,
        user,
      );

      expect(processarXml).toHaveBeenCalled();
      expect(prisma.notaFiscal.update).not.toHaveBeenCalled();
    });

    it('não grava observações ausentes no caminho do PDF', async () => {
      const { servico, prisma } = montarServico({ notaExistente: { id: 'nf-5' } });

      const resultado = await servico.receberArquivo(
        { tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        {
          fieldname: 'arquivo',
          originalname: 'nf.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 14,
          buffer: Buffer.from('%PDF-1.4 nota'),
        } as unknown as Express.Multer.File,
        user,
      );

      expect(resultado).toEqual({ id: 'nf-5' });
      expect(prisma.notaFiscal.update).not.toHaveBeenCalled();
    });

    it('propaga negação de escopo ao consultar a nota existente do PDF', async () => {
      const { servico } = montarServico({ exigirErro: new ForbiddenException('sem permissão') });

      await expect(
        servico.receberArquivo(
          { tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
          {
            fieldname: 'arquivo',
            originalname: 'nf.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            size: 14,
            buffer: Buffer.from('%PDF-1.4 nota'),
          } as unknown as Express.Multer.File,
          user,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
