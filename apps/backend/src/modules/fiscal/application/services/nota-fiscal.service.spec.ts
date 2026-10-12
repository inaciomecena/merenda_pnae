import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotaFiscalService } from './nota-fiscal.service';
import { StatusNotaFiscal } from '../domain/fiscal-estado';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

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
    ...overrides,
  };
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
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    xmlDocumentoId: null,
    pdfDocumentoId: null,
    ...overrides,
  };
}

function arquivo(opcoes: { mimetype?: string; nome?: string; conteudo?: Buffer } = {}): Express.Multer.File {
  const buffer = opcoes.conteudo ?? Buffer.from('%PDF-1.4 arquivo fiscal');
  return {
    fieldname: 'arquivo',
    originalname: opcoes.nome ?? 'arquivo.pdf',
    encoding: '7bit',
    mimetype: opcoes.mimetype ?? 'application/pdf',
    size: buffer.length,
    buffer,
  } as unknown as Express.Multer.File;
}

function montarServico(opcoes: {
  contrato?: Record<string, unknown> | null;
  notaExistente?: Record<string, unknown> | null;
  nota?: Record<string, unknown> | null;
  countUpdate?: number;
  exigirErro?: Error;
} = {}) {
  const prisma = {
    contrato: {
      findUnique: jest.fn(async () => ('contrato' in opcoes ? opcoes.contrato : contrato())),
    },
    notaFiscal: {
      findFirst: jest.fn(async () => opcoes.notaExistente ?? null),
      findUnique: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : notaCompleta())),
      update: jest.fn(async () => ({})),
      updateMany: jest.fn(async () => ({ count: opcoes.countUpdate ?? 1 })),
    },
  };

  const audit = { log: jest.fn(async () => undefined) };
  const xmlFiscal = { extrairDadosNFe: jest.fn(async () => ({})) };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
    filtroNotaFiscal: jest.fn(async () => ({})),
    filtroContrato: jest.fn(async () => ({})),
  };
  const documentoService = { upload: jest.fn(async () => ({ id: 'doc-1' })) };
  const conciliacaoService = { conciliar: jest.fn(async () => ({})) };

  const servico = new NotaFiscalService(
    prisma as never,
    audit as never,
    xmlFiscal as never,
    acesso as never,
    documentoService as never,
    conciliacaoService as never,
  );

  return { servico, prisma, audit, acesso, documentoService, xmlFiscal, conciliacaoService };
}

describe('SDD-005: nota fiscal (recebimento de arquivo e transição de status)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('receberArquivo', () => {
    it('exige um arquivo com conteúdo', async () => {
      const { servico, prisma } = montarServico({});

      await expect(
        servico.receberArquivo({ tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, arquivo({ conteudo: Buffer.alloc(0) }), user),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        servico.receberArquivo({ tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, undefined as never, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.contrato.findUnique).not.toHaveBeenCalled();
    });

    it('rejeita arquivo acima do limite de 10 MB', async () => {
      const { servico } = montarServico({});
      const grande = arquivo();
      grande.size = 11 * 1024 * 1024;

      await expect(
        servico.receberArquivo({ tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, grande, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falha com NotFound quando o contrato não existe', async () => {
      const { servico } = montarServico({ contrato: null });

      await expect(
        servico.receberArquivo({ tipo: 'PDF', contratoId: 'contrato-x', fornecedorId: 'fornecedor-1' }, arquivo(), user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita fornecedor diferente do produtor do contrato', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.receberArquivo({ tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'outro-produtor' }, arquivo(), user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falha com BadRequest no PDF quando não há nota fiscal para anexar', async () => {
      const { servico, acesso, documentoService } = montarServico({ notaExistente: null });

      await expect(
        servico.receberArquivo({ tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, arquivo(), user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'PROCESSAR',
      );
      expect(documentoService.upload).not.toHaveBeenCalled();
    });

    it('anexa o PDF na nota existente mais recente e grava as observações', async () => {
      const { servico, prisma, documentoService } = montarServico({
        notaExistente: { id: 'nf-5' },
      });
      const pdf = arquivo({ nome: 'nf.pdf' });

      const resultado = await servico.receberArquivo(
        { tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1', observacoes: '  Conferido na escola  ' },
        pdf,
        user,
      );

      expect(resultado).toEqual({ id: 'nf-5' });
      expect(prisma.notaFiscal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contratoId: 'contrato-1',
            fornecedorId: 'fornecedor-1',
            deletedAt: null,
            status: { not: 'CANCELADA' },
          }),
        }),
      );
      expect(documentoService.upload).toHaveBeenCalledWith('nf-5', pdf, 'PDF', 'nf.pdf', user);
      expect(prisma.notaFiscal.update).toHaveBeenCalledWith({
        where: { id: 'nf-5' },
        data: { observacoes: 'Conferido na escola', updatedBy: 'u1' },
      });
    });

    it('delega o XML para o processamento da NF-e e grava as observações', async () => {
      const { servico, prisma, documentoService } = montarServico({});
      const xml = arquivo({ mimetype: 'application/xml', nome: 'nf.xml', conteudo: Buffer.from('<?xml version="1.0"?>') });
      const processarXml = jest.spyOn(servico, 'processarXml').mockResolvedValue({ id: 'nf-9' } as never);

      const resultado = await servico.receberArquivo(
        { tipo: 'XML', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1', observacoes: 'XML importado' },
        xml,
        user,
      );

      expect(resultado).toEqual({ id: 'nf-9' });
      expect(processarXml).toHaveBeenCalledWith(xml.buffer, 'contrato-1', user);
      expect(documentoService.upload).not.toHaveBeenCalled();
      expect(prisma.notaFiscal.findFirst).not.toHaveBeenCalled();
      expect(prisma.notaFiscal.update).toHaveBeenCalledWith({
        where: { id: 'nf-9' },
        data: { observacoes: 'XML importado', updatedBy: 'u1' },
      });
    });

    it('bloqueia o recebimento sem permissão no escopo', async () => {
      const { servico, documentoService, acesso } = montarServico({
        exigirErro: new ForbiddenException('sem permissão'),
      });

      await expect(
        servico.receberArquivo({ tipo: 'PDF', contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, arquivo(), user),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'PROCESSAR',
      );
      expect(documentoService.upload).not.toHaveBeenCalled();
    });
  });

  describe('transicionar', () => {
    it('aplica a transição de status permitida e audita com old/new values', async () => {
      const { servico, prisma, audit } = montarServico({});
      prisma.notaFiscal.findUnique = jest
        .fn()
        .mockResolvedValueOnce(notaCompleta({ status: 'AGUARDANDO_ATESTO' }))
        .mockResolvedValueOnce(notaCompleta({ status: 'ATESTADA' }));

      const resultado = await servico.transicionar(
        'nf-1',
        StatusNotaFiscal.ATESTADA,
        'Estoque conferido',
        'u1',
        'DRE',
      );

      expect(prisma.notaFiscal.updateMany).toHaveBeenCalledWith({
        where: { id: 'nf-1', status: 'AGUARDANDO_ATESTO' },
        data: { status: 'ATESTADA', updatedBy: 'u1' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          action: 'NOTA_FISCAL_TRANSICIONADA',
          entity: 'NotaFiscal',
          entityId: 'nf-1',
          entityLabel: '12345',
          oldValues: JSON.stringify({ status: 'AGUARDANDO_ATESTO' }),
          newValues: JSON.stringify({ status: 'ATESTADA', motivo: 'Estoque conferido' }),
        }),
      );
      expect(resultado.status).toBe('ATESTADA');
    });

    it('recusa transição que não é permitida pela máquina de estados', async () => {
      const { servico, prisma, audit } = montarServico({
        nota: notaCompleta({ status: 'CANCELADA' }),
      });

      await expect(
        servico.transicionar('nf-1', StatusNotaFiscal.ATESTADA, 'tentativa', 'u1', 'DRE'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.notaFiscal.updateMany).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('falha com conflito quando o status mudou entre a leitura e a escrita', async () => {
      const { servico, audit } = montarServico({
        nota: notaCompleta({ status: 'AGUARDANDO_ATESTO' }),
        countUpdate: 0,
      });

      await expect(
        servico.transicionar('nf-1', StatusNotaFiscal.ATESTADA, 'Estoque conferido', 'u1', 'DRE'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(audit.log).not.toHaveBeenCalled();
    });
  });
});
