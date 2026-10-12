import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { FiscalAcessoService } from './fiscal-acesso.service';
import { FISCAL_LIMITE_ARQUIVO_BYTES, MIME_TYPES_FISCAIS, mimeTypeFiscalPermitido } from './fiscal-validacao';

export type TipoDocumentoFiscal = 'XML' | 'PDF' | 'OUTRO';

@Injectable()
export class FiscalDocumentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: FiscalAcessoService,
  ) {}

  private pasta(notaFiscalId: string): string {
    return path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
  }

  /**
   * Obtém a nota fiscal com validação de acesso.
   */
  private async obterNotaFiscal(id: string, user: AuthenticatedUser, operacao: 'CONSULTAR' | 'PROCESSAR') {
    const notaFiscal = await this.prisma.notaFiscal.findFirst({
      where: { id, deletedAt: null },
      include: {
        fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
        contrato: { select: { id: true, numero: true, exercicio: true, dreId: true, escolaId: true, produtorId: true } },
      },
    });
    if (!notaFiscal) throw new NotFoundException('Nota fiscal não encontrada.');
    await this.acesso.exigir(user, { contratoId: notaFiscal.contratoId, fornecedorId: notaFiscal.fornecedorId }, operacao);
    return notaFiscal;
  }

  /**
   * Faz upload de um arquivo fiscal (XML ou PDF) para uma nota fiscal.
   */
  async upload(
    notaFiscalId: string,
    arquivo: Express.Multer.File,
    tipo: TipoDocumentoFiscal,
    titulo: string,
    user: AuthenticatedUser,
  ) {
    await this.obterNotaFiscal(notaFiscalId, user, 'PROCESSAR');

    if (!arquivo?.buffer?.length) {
      throw new BadRequestException('Arquivo vazio.');
    }
    if (arquivo.size > FISCAL_LIMITE_ARQUIVO_BYTES) {
      throw new BadRequestException('Arquivo acima do limite de 10 MB.');
    }
    if (!mimeTypeFiscalPermitido(arquivo.mimetype)) {
      throw new BadRequestException('Use XML ou PDF.');
    }

    // Validar magic bytes
    const assinatura = arquivo.buffer.subarray(0, 8);
    if (arquivo.mimetype === 'application/pdf' && assinatura.subarray(0, 4).toString() !== '%PDF') {
      throw new BadRequestException('PDF inválido.');
    }
    if ((arquivo.mimetype === 'application/xml' || arquivo.mimetype === 'text/xml')) {
      const inicio = arquivo.buffer.subarray(0, 5).toString('utf8');
      if (!inicio.startsWith('<?xml') && !inicio.startsWith('<')) {
        throw new BadRequestException('XML inválido.');
      }
    }

    const extensao = MIME_TYPES_FISCAIS[arquivo.mimetype];
    const pasta = this.pasta(notaFiscalId);
    await fs.promises.mkdir(pasta, { recursive: true });

    const nome = `${randomUUID()}.${extensao}`;
    const arquivoPath = path.join(pasta, nome);
    await fs.promises.writeFile(arquivoPath, arquivo.buffer, { flag: 'wx' });

    // Versionamento automático
    const anterior = await this.prisma.notaFiscalDocumento.findFirst({
      where: { notaFiscalId, tipo },
      orderBy: { versao: 'desc' },
    });

    const documento = await this.prisma.notaFiscalDocumento.create({
      data: {
        notaFiscalId,
        tipo,
        versao: (anterior?.versao || 0) + 1,
        titulo: titulo || arquivo.originalname,
        arquivoPath,
        arquivoNome: nome,
        mimeType: arquivo.mimetype,
        tamanhoBytes: arquivo.buffer.length,
        hashSha256: createHash('sha256').update(arquivo.buffer).digest('hex'),
        createdBy: user.sub,
      },
    });

    await this.audit.log({
      userId: user.sub,
      action: 'DOCUMENTO_FISCAL_ANEXADO',
      entity: 'NotaFiscalDocumento',
      entityId: documento.id,
      entityLabel: titulo,
      newValues: JSON.stringify({
        notaFiscalId,
        tipo,
        versao: documento.versao,
        hashSha256: documento.hashSha256,
      }),
    });

    return {
      id: documento.id,
      tipo: documento.tipo,
      versao: documento.versao,
      titulo: documento.titulo,
      hashSha256: documento.hashSha256,
    };
  }

  /**
   * Retorna o caminho do arquivo para download com validação de integridade.
   */
  async download(notaFiscalId: string, documentoId: string, user: AuthenticatedUser) {
    await this.obterNotaFiscal(notaFiscalId, user, 'CONSULTAR');

    const documento = await this.prisma.notaFiscalDocumento.findFirst({
      where: { id: documentoId, notaFiscalId },
    });
    if (!documento?.arquivoPath || !documento.hashSha256) {
      throw new NotFoundException('Documento não encontrado.');
    }

    // Proteção contra path traversal
    const caminho = path.resolve(documento.arquivoPath);
    if (!caminho.startsWith(this.pasta(notaFiscalId) + path.sep)) {
      throw new ConflictException('Caminho documental inválido.');
    }

    // Validar integridade
    const hash = createHash('sha256').update(await fs.promises.readFile(caminho)).digest('hex');
    if (hash !== documento.hashSha256) {
      throw new ConflictException('Integridade do documento divergente.');
    }

    return {
      caminho,
      nome: documento.arquivoNome || `documento-${documento.id}.pdf`,
      mimeType: documento.mimeType || 'application/octet-stream',
    };
  }

  /**
   * Lista os documentos de uma nota fiscal.
   */
  async listar(notaFiscalId: string, user: AuthenticatedUser) {
    await this.obterNotaFiscal(notaFiscalId, user, 'CONSULTAR');

    const documentos = await this.prisma.notaFiscalDocumento.findMany({
      where: { notaFiscalId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tipo: true,
        versao: true,
        titulo: true,
        arquivoNome: true,
        mimeType: true,
        tamanhoBytes: true,
        hashSha256: true,
        createdAt: true,
      },
    });

    return documentos;
  }
}
