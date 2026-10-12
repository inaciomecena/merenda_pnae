import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';

export interface ArquivoFiscal {
  caminho: string;
  nome: string;
  mimeType: string;
}

@Injectable()
export class FiscalDocumentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Retorna pasta de armazenamento de documentos fiscais
   */
  private pasta(notaFiscalId: string): string {
    return path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
  }

  /**
   * Salva documento fiscal (XML ou PDF)
   */
  async salvarDocumento(
    notaFiscalId: string,
    tipo: 'XML' | 'PDF',
    titulo: string,
    buffer: Buffer,
    mimeType: string,
    user: AuthenticatedUser,
    observacao?: string,
  ): Promise<any> {
    const pasta = this.pasta(notaFiscalId);
    await fs.promises.mkdir(pasta, { recursive: true });

    const extensao = tipo === 'XML' ? 'xml' : 'pdf';
    const nome = `${randomUUID()}.${extensao}`;
    const arquivoPath = path.join(pasta, nome);

    // Salvar arquivo com flag 'wx' para prevenir sobrescrita
    await fs.promises.writeFile(arquivoPath, buffer, { flag: 'wx' });

    // Calcular hash SHA-256
    const hashSha256 = createHash('sha256').update(buffer).digest('hex');

    // Verificar versão anterior
    const anterior = await this.prisma.notaFiscalDocumento.findFirst({
      where: { notaFiscalId, tipo },
      orderBy: { versao: 'desc' },
    });

    // Criar registro no banco
    const documento = await this.prisma.notaFiscalDocumento.create({
      data: {
        notaFiscalId,
        tipo,
        versao: (anterior?.versao || 0) + 1,
        titulo,
        arquivoPath,
        arquivoNome: nome,
        mimeType,
        tamanhoBytes: buffer.length,
        hashSha256,
        observacao,
        createdBy: user.sub,
      },
    });

    // Auditar
    await this.audit.log({
      userId: user.sub,
      action: `DOCUMENTO_FISCAL_${tipo}_ANEXADO`,
      entity: 'NotaFiscalDocumento',
      entityId: documento.id,
      entityLabel: titulo,
      newValues: JSON.stringify({
        notaFiscalId,
        tipo,
        versao: documento.versao,
        hashSha256,
      }),
    });

    return {
      id: documento.id,
      tipo,
      versao: documento.versao,
      titulo,
      hashSha256,
    };
  }

  /**
   * Recupera arquivo fiscal validando integridade
   */
  async obterArquivo(
    notaFiscalId: string,
    documentoId: string,
  ): Promise<ArquivoFiscal> {
    const documento = await this.prisma.notaFiscalDocumento.findFirst({
      where: { id: documentoId, notaFiscalId },
    });

    if (!documento?.arquivoPath || !documento.hashSha256) {
      throw new NotFoundException('Documento não encontrado.');
    }

    const caminho = path.resolve(documento.arquivoPath);

    // Proteção contra path traversal
    if (!caminho.startsWith(this.pasta(notaFiscalId) + path.sep)) {
      throw new ConflictException('Caminho documental inválido.');
    }

    // Verificar integridade do arquivo
    const conteudo = await fs.promises.readFile(caminho);
    const hash = createHash('sha256').update(conteudo).digest('hex');

    if (hash !== documento.hashSha256) {
      throw new ConflictException('Integridade do documento divergente.');
    }

    return {
      caminho,
      nome: documento.arquivoNome || `documento-${documento.id}.${documento.tipo.toLowerCase()}`,
      mimeType: documento.mimeType || 'application/octet-stream',
    };
  }

  /**
   * Valida se arquivo é XML ou PDF válido
   */
  validarArquivo(buffer: Buffer, tipoEsperado: 'XML' | 'PDF'): void {
    if (tipoEsperado === 'XML') {
      // Verificar se começa com <?xml ou <
      const inicio = buffer.subarray(0, 10).toString('utf8').trim();
      if (!inicio.startsWith('<?xml') && !inicio.startsWith('<')) {
        throw new BadRequestException('Arquivo XML inválido.');
      }
    } else if (tipoEsperado === 'PDF') {
      // Verificar magic bytes do PDF
      const assinatura = buffer.subarray(0, 5).toString('ascii');
      if (assinatura !== '%PDF-') {
        throw new BadRequestException('Arquivo PDF inválido.');
      }
    }
  }

  /**
   * Lista documentos de uma nota fiscal
   */
  async listarDocumentos(notaFiscalId: string): Promise<any[]> {
    const documentos = await this.prisma.notaFiscalDocumento.findMany({
      where: { notaFiscalId },
      orderBy: [{ tipo: 'asc' }, { versao: 'desc' }],
    });

    return documentos.map((doc) => ({
      id: doc.id,
      tipo: doc.tipo,
      versao: doc.versao,
      titulo: doc.titulo,
      tamanhoBytes: doc.tamanhoBytes,
      hashSha256: doc.hashSha256,
      createdAt: doc.createdAt,
      createdBy: doc.createdBy,
    }));
  }

  /**
   * Obter último XML da nota fiscal
   */
  async obterUltimoXML(notaFiscalId: string): Promise<Buffer | null> {
    const documento = await this.prisma.notaFiscalDocumento.findFirst({
      where: { notaFiscalId, tipo: 'XML' },
      orderBy: { versao: 'desc' },
    });

    if (!documento?.arquivoPath) {
      return null;
    }

    try {
      return await fs.promises.readFile(documento.arquivoPath);
    } catch {
      return null;
    }
  }

  /**
   * Obter último PDF da nota fiscal
   */
  async obterUltimoPDF(notaFiscalId: string): Promise<Buffer | null> {
    const documento = await this.prisma.notaFiscalDocumento.findFirst({
      where: { notaFiscalId, tipo: 'PDF' },
      orderBy: { versao: 'desc' },
    });

    if (!documento?.arquivoPath) {
      return null;
    }

    try {
      return await fs.promises.readFile(documento.arquivoPath);
    } catch {
      return null;
    }
  }
}
