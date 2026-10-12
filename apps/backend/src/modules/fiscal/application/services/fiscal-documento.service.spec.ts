import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalDocumentoService, TipoDocumentoFiscal } from './fiscal-documento.service';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

function notaFiscal(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    fornecedor: { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' },
    contrato: {
      id: 'contrato-1',
      numero: 'C-001',
      exercicio: 2026,
      dreId: 'dre-1',
      escolaId: null,
      produtorId: 'fornecedor-1',
    },
    ...overrides,
  };
}

function arquivo(opcoes: { mimetype?: string; nome?: string; conteudo?: Buffer; size?: number } = {}): Express.Multer.File {
  const buffer = opcoes.conteudo ?? Buffer.from('%PDF-1.4 conteudo fiscal');
  return {
    fieldname: 'arquivo',
    originalname: opcoes.nome ?? 'arquivo.pdf',
    encoding: '7bit',
    mimetype: opcoes.mimetype ?? 'application/pdf',
    size: opcoes.size ?? buffer.length,
    buffer,
  } as unknown as Express.Multer.File;
}

function pastaDaNota(notaFiscalId: string): string {
  return path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
}

function montarServico(
  opcoes: {
    nota?: Record<string, unknown> | null;
    documento?: Record<string, unknown> | null;
    lista?: Record<string, unknown>[];
    exigirErro?: Error;
  } = {},
) {
  const prisma = {
    notaFiscal: {
      findFirst: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : notaFiscal())),
    },
    notaFiscalDocumento: {
      findFirst: jest.fn(async () => opcoes.documento ?? null),
      findMany: jest.fn(async () => opcoes.lista ?? []),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'doc-1',
        ...args.data,
      })),
    },
  };

  const audit = { log: jest.fn(async () => undefined) };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
  };

  const servico = new FiscalDocumentoService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, audit, acesso };
}

function espionarArquivos() {
  const mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
  const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
  return { mkdir, writeFile };
}

describe('SDD-005: documentos fiscais (upload, download e listagem)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('upload', () => {
    it('falha com NotFound quando a nota fiscal não existe e não consulta permissão', async () => {
      const { servico, acesso } = montarServico({ nota: null });

      await expect(servico.upload('nf-1', arquivo(), 'PDF', 'NF', user)).rejects.toBeInstanceOf(NotFoundException);
      expect(acesso.exigir).not.toHaveBeenCalled();
    });

    it('autoriza o upload com a operação PROCESSAR e propaga a negação de escopo', async () => {
      const { servico, acesso } = montarServico({ exigirErro: new ForbiddenException('fora do escopo') });

      await expect(servico.upload('nf-1', arquivo(), 'PDF', 'NF', user)).rejects.toBeInstanceOf(ForbiddenException);
      expect(acesso.exigir).toHaveBeenCalledWith(user, { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, 'PROCESSAR');
    });

    it('rejeita arquivo sem conteúdo', async () => {
      const { servico } = montarServico({});
      const vazio = arquivo({ conteudo: Buffer.alloc(0) });

      await expect(servico.upload('nf-1', vazio, 'PDF', 'NF', user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita arquivo acima do limite de 10 MB', async () => {
      const { servico } = montarServico({});
      const grande = arquivo({ size: 11 * 1024 * 1024 });

      await expect(servico.upload('nf-1', grande, 'PDF', 'NF', user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita MIME type não fiscal', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.upload('nf-1', arquivo({ mimetype: 'image/png' }), 'OUTRO', 'foto', user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita PDF sem a assinatura de magic bytes', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.upload('nf-1', arquivo({ mimetype: 'application/pdf', conteudo: Buffer.from('NAO_E_PDF') }), 'PDF', 'NF', user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita XML sem abertura de tag', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.upload(
          'nf-1',
          arquivo({ mimetype: 'application/xml', conteudo: Buffer.from('notasfiscais'), nome: 'nf.xml' }),
          'XML',
          'NF',
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('grava o PDF no storage, calcula o sha256 e audita o anexo', async () => {
      const { servico, prisma, audit } = montarServico({});
      const { mkdir, writeFile } = espionarArquivos();
      const conteudo = Buffer.from('%PDF-1.4 conteudo fiscal');
      const pdf = arquivo({ conteudo, nome: 'nota.pdf' });

      const resultado = await servico.upload('nf-1', pdf, 'PDF', 'Nota fiscal em PDF', user);

      expect(mkdir).toHaveBeenCalledWith(pastaDaNota('nf-1'), { recursive: true });
      const caminhoGravado = String(writeFile.mock.calls[0][0]);
      expect(path.dirname(caminhoGravado)).toBe(pastaDaNota('nf-1'));
      expect(path.basename(caminhoGravado)).toMatch(/^[0-9a-f-]{36}\.pdf$/);
      expect(writeFile).toHaveBeenCalledWith(caminhoGravado, conteudo, { flag: 'wx' });
      const hashEsperado = createHash('sha256').update(conteudo).digest('hex');
      expect(prisma.notaFiscalDocumento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notaFiscalId: 'nf-1',
          tipo: 'PDF',
          versao: 1,
          titulo: 'Nota fiscal em PDF',
          mimeType: 'application/pdf',
          tamanhoBytes: conteudo.length,
          hashSha256: hashEsperado,
          createdBy: 'u1',
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          action: 'DOCUMENTO_FISCAL_ANEXADO',
          entity: 'NotaFiscalDocumento',
          entityId: 'doc-1',
          entityLabel: 'Nota fiscal em PDF',
          newValues: expect.stringContaining('"versao":1'),
        }),
      );
      expect(resultado).toEqual({
        id: 'doc-1',
        tipo: 'PDF',
        versao: 1,
        titulo: 'Nota fiscal em PDF',
        hashSha256: hashEsperado,
      });
    });

    it('incrementa a versão do documento e usa o nome original quando o título é vazio', async () => {
      const { servico, prisma } = montarServico({ documento: { id: 'doc-anterior', versao: 2 } });
      espionarArquivos();

      const resultado = await servico.upload('nf-1', arquivo({ nome: 'scan.pdf' }), 'PDF', '', user);

      expect(prisma.notaFiscalDocumento.findFirst).toHaveBeenCalledWith({
        where: { notaFiscalId: 'nf-1', tipo: 'PDF' },
        orderBy: { versao: 'desc' },
      });
      expect(prisma.notaFiscalDocumento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ versao: 3, titulo: 'scan.pdf' }),
      });
      expect(resultado.versao).toBe(3);
    });

    it('aceita XML com mimetype text/xml que inicia por tag', async () => {
      const { servico, prisma } = montarServico({});
      espionarArquivos();

      await servico.upload(
        'nf-1',
        arquivo({ mimetype: 'text/xml', conteudo: Buffer.from('<nfeProc'), nome: 'nf.xml' }),
        'XML',
        'XML da NF-e',
        user,
      );

      expect(prisma.notaFiscalDocumento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ mimeType: 'text/xml' }),
      });
      expect(prisma.notaFiscalDocumento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ arquivoNome: expect.stringMatching(/\.xml$/) }),
      });
    });
  });

  describe('download', () => {
    const caminhoValido = path.join(pastaDaNota('nf-1'), 'doc.pdf');

    it('serve o arquivo com integridade sha256 confere e autoriza com CONSULTAR', async () => {
      const conteudo = Buffer.from('%PDF-1.4 conteudo');
      const { servico, prisma, acesso } = montarServico({
        documento: {
          id: 'doc-1',
          arquivoPath: caminhoValido,
          arquivoNome: 'doc.pdf',
          mimeType: 'application/pdf',
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
        },
      });
      const readFile = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.download('nf-1', 'doc-1', user);

      expect(acesso.exigir).toHaveBeenCalledWith(user, { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, 'CONSULTAR');
      expect(prisma.notaFiscalDocumento.findFirst).toHaveBeenCalledWith({ where: { id: 'doc-1', notaFiscalId: 'nf-1' } });
      expect(readFile).toHaveBeenCalledWith(caminhoValido);
      expect(resultado).toEqual({ caminho: caminhoValido, nome: 'doc.pdf', mimeType: 'application/pdf' });
    });

    it('aplica nome e MIME type padrão quando o documento não os possui', async () => {
      const conteudo = Buffer.from('%PDF-1.4 conteudo');
      const { servico } = montarServico({
        documento: {
          id: 'doc-9',
          arquivoPath: caminhoValido,
          arquivoNome: null,
          mimeType: null,
          hashSha256: createHash('sha256').update(conteudo).digest('hex'),
        },
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(conteudo);

      const resultado = await servico.download('nf-1', 'doc-9', user);

      expect(resultado.nome).toBe('documento-doc-9.pdf');
      expect(resultado.mimeType).toBe('application/octet-stream');
    });

    it('falha com NotFound quando o documento não existe ou não possui caminho', async () => {
      const semDocumento = montarServico({ documento: null });
      await expect(semDocumento.servico.download('nf-1', 'doc-x', user)).rejects.toBeInstanceOf(NotFoundException);

      const semCaminho = montarServico({ documento: { id: 'doc-1', arquivoPath: null, hashSha256: 'abc' } });
      await expect(semCaminho.servico.download('nf-1', 'doc-1', user)).rejects.toBeInstanceOf(NotFoundException);

      const semHash = montarServico({ documento: { id: 'doc-1', arquivoPath: caminhoValido, hashSha256: null } });
      await expect(semHash.servico.download('nf-1', 'doc-1', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('impede path traversal para fora da pasta da nota fiscal', async () => {
      const { servico } = montarServico({
        documento: {
          id: 'doc-1',
          arquivoPath: path.resolve(process.cwd(), 'storage', 'fiscal', 'nf-1', '..', '..', 'segredo.pdf'),
          arquivoNome: 'segredo.pdf',
          mimeType: 'application/pdf',
          hashSha256: 'abc',
        },
      });

      await expect(servico.download('nf-1', 'doc-1', user)).rejects.toBeInstanceOf(ConflictException);
    });

    it('detecta divergência de integridade quando o arquivo foi alterado', async () => {
      const { servico } = montarServico({
        documento: {
          id: 'doc-1',
          arquivoPath: caminhoValido,
          arquivoNome: 'doc.pdf',
          mimeType: 'application/pdf',
          hashSha256: createHash('sha256').update('conteudo-original').digest('hex'),
        },
      });
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('conteudo-adulterado'));

      await expect(servico.download('nf-1', 'doc-1', user)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('listar', () => {
    it('lista os documentos da nota autorizando com CONSULTAR', async () => {
      const documentos = [
        {
          id: 'doc-1',
          tipo: 'XML',
          versao: 1,
          titulo: 'XML NF-e 12345',
          arquivoNome: 'doc.xml',
          mimeType: 'application/xml',
          tamanhoBytes: 120,
          hashSha256: 'abc123',
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ];
      const { servico, prisma, acesso } = montarServico({ lista: documentos });

      const resultado = await servico.listar('nf-1', user);

      expect(acesso.exigir).toHaveBeenCalledWith(user, { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' }, 'CONSULTAR');
      expect(prisma.notaFiscalDocumento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { notaFiscalId: 'nf-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(resultado).toEqual(documentos);
    });

    it('falha com NotFound quando a nota fiscal não existe', async () => {
      const { servico } = montarServico({ nota: null });

      await expect(servico.listar('nf-1', user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
