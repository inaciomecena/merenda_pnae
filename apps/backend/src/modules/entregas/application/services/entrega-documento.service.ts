import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { EntregaAcessoService } from './entrega-acesso.service';
import { AnexoEntregaDto } from '../../presentation/dto/entrega.dto';

@Injectable()
export class EntregaDocumentoService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly acesso: EntregaAcessoService) {}

  private pasta(entregaId: string) {
    return path.resolve(process.cwd(), 'storage', 'entregas', entregaId);
  }

  private async obterEntrega(id: string, user: AuthenticatedUser, operacao: 'CONSULTAR' | 'RECEBER') {
    const entrega = await this.prisma.entrega.findFirst({ where: { id, deletedAt: null }, include: {
      programacao: { include: { contrato: { include: { edital: true } } } },
      fornecedor: true, unidadeEscolar: true,
      itens: { include: { programacaoItem: true } },
      ocorrencias: { where: { deletedAt: null } },
    } });
    if (!entrega) throw new NotFoundException('Entrega não encontrada.');
    await this.acesso.exigir(user, entrega, operacao);
    return entrega;
  }

  async gerarTermo(id: string, user: AuthenticatedUser) {
    const entrega = await this.obterEntrega(id, user, 'RECEBER');
    if (entrega.status !== 'ACEITA') throw new BadRequestException('Confirme o recebimento antes de gerar o termo.');
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const partes: Buffer[] = [];
    doc.on('data', (parte: Buffer) => partes.push(parte));
    const pronto = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(partes)));
      doc.on('error', reject);
    });
    doc.fontSize(16).text('PNAE — TERMO DE RECEBIMENTO', { align: 'center' });
    doc.moveDown().fontSize(10);
    doc.text(`Contrato: ${entrega.programacao.contrato.numero}/${entrega.programacao.contrato.exercicio}`);
    doc.text(`Edital: ${entrega.programacao.contrato.edital.numero}/${entrega.programacao.contrato.edital.ano}`);
    doc.text(`Fornecedor: ${entrega.fornecedor.nome}`);
    doc.text(`Unidade escolar: ${entrega.unidadeEscolar.nome}`);
    doc.text(`Entrega: ${entrega.numero} — ${entrega.dataEntrega.toISOString().slice(0, 10)}`);
    doc.text(`Conferido por: ${entrega.conferidaPor || '—'}  Aceito por: ${entrega.aceitaPor || '—'}`);
    doc.moveDown().fontSize(11).text('Produtos', { underline: true });
    for (const item of entrega.itens) {
      doc.fontSize(10).text(`${item.programacaoItem.produto} (${item.programacaoItem.unidadeMedida || 'un.'})`);
      doc.text(`Entregue: ${item.quantidadeInformada}  Aceito: ${item.quantidadeAceita}  Rejeitado: ${item.quantidadeRejeitada}`);
      if (item.motivoRejeicao) doc.text(`Motivo da rejeição: ${item.motivoRejeicao}`);
    }
    if (entrega.observacoes) doc.moveDown().text(`Observações: ${entrega.observacoes}`);
    if (entrega.ocorrencias.length) {
      doc.moveDown().text('Ocorrências:', { underline: true });
      for (const ocorrencia of entrega.ocorrencias) doc.text(`${ocorrencia.tipo}: ${ocorrencia.descricao}`);
    }
    doc.moveDown(3).text('________________________________________');
    doc.text('Responsável pelo recebimento (assinatura externa)');
    doc.moveDown().text('Este arquivo não contém assinatura digital.');
    doc.end();
    const buffer = await pronto;
    return this.salvar(id, user, 'TERMO_RECEBIMENTO', `Termo de recebimento ${entrega.numero}`, buffer, 'application/pdf', 'pdf');
  }

  async anexar(id: string, arquivo: Express.Multer.File, dto: AnexoEntregaDto, user: AuthenticatedUser) {
    await this.obterEntrega(id, user, 'RECEBER');
    if (!arquivo?.buffer?.length || arquivo.size > 10 * 1024 * 1024) throw new BadRequestException('Arquivo inválido ou acima de 10 MB.');
    const extensoes: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
    const extensao = extensoes[arquivo.mimetype];
    if (!extensao) throw new BadRequestException('Use PDF, JPG ou PNG.');
    const assinatura = arquivo.buffer.subarray(0, 8);
    if (extensao === 'pdf' && assinatura.subarray(0, 4).toString() !== '%PDF') throw new BadRequestException('PDF inválido.');
    if (extensao === 'png' && !assinatura.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new BadRequestException('PNG inválido.');
    if (extensao === 'jpg' && (assinatura[0] !== 0xff || assinatura[1] !== 0xd8)) throw new BadRequestException('JPG inválido.');
    if (dto.assinadoExternamente && (extensao !== 'pdf' || !['TERMO_RECEBIMENTO', 'RECIBO'].includes(dto.tipo))) throw new BadRequestException('Assinatura externa deve constar em termo ou recibo PDF.');
    return this.salvar(id, user, dto.tipo, dto.titulo || arquivo.originalname, arquivo.buffer, arquivo.mimetype, extensao, dto.observacao, dto.assinadoExternamente);
  }

  private async salvar(id: string, user: AuthenticatedUser, tipo: AnexoEntregaDto['tipo'], titulo: string, buffer: Buffer, mimeType: string, extensao: string, observacao?: string, assinadoExternamente = false) {
    const pasta = this.pasta(id);
    await fs.promises.mkdir(pasta, { recursive: true });
    const nome = `${randomUUID()}.${extensao}`;
    const arquivoPath = path.join(pasta, nome);
    await fs.promises.writeFile(arquivoPath, buffer, { flag: 'wx' });
    const anterior = await this.prisma.entregaDocumento.findFirst({ where: { entregaId: id, tipo }, orderBy: { versao: 'desc' } });
    const documento = await this.prisma.entregaDocumento.create({ data: {
      entregaId: id, tipo, versao: (anterior?.versao || 0) + 1, titulo, arquivoPath,
      arquivoNome: nome, mimeType, tamanhoBytes: buffer.length,
      hashSha256: createHash('sha256').update(buffer).digest('hex'),
      formalizado: assinadoExternamente, assinaturaDigital: false,
      origemAssinatura: assinadoExternamente ? 'EXTERNA_DOCUMENTAL' : undefined,
      geradoEm: tipo === 'TERMO_RECEBIMENTO' ? new Date() : undefined,
      geradoPor: tipo === 'TERMO_RECEBIMENTO' ? user.sub : undefined,
      observacao: assinadoExternamente ? `Assinatura externa declarada pelo usuário ${user.sub}. ${observacao || ''}` : observacao, createdBy: user.sub,
    } });
    await this.audit.log({ userId: user.sub, action: tipo === 'TERMO_RECEBIMENTO' ? 'TERMO_RECEBIMENTO_GERADO' : 'DOCUMENTO_ENTREGA_ANEXADO', entity: 'EntregaDocumento', entityId: documento.id, entityLabel: titulo, newValues: JSON.stringify({ entregaId: id, tipo, versao: documento.versao, hashSha256: documento.hashSha256 }) });
    return { id: documento.id, tipo, versao: documento.versao, titulo, hashSha256: documento.hashSha256, assinaturaDigital: false, origemAssinatura: documento.origemAssinatura };
  }

  async arquivo(entregaId: string, documentoId: string, user: AuthenticatedUser) {
    await this.obterEntrega(entregaId, user, 'CONSULTAR');
    const documento = await this.prisma.entregaDocumento.findFirst({ where: { id: documentoId, entregaId } });
    if (!documento?.arquivoPath || !documento.hashSha256) throw new NotFoundException('Documento não encontrado.');
    const caminho = path.resolve(documento.arquivoPath);
    if (!caminho.startsWith(this.pasta(entregaId) + path.sep)) throw new ConflictException('Caminho documental inválido.');
    const hash = createHash('sha256').update(await fs.promises.readFile(caminho)).digest('hex');
    if (hash !== documento.hashSha256) throw new ConflictException('Integridade do documento divergente.');
    return { caminho, nome: documento.arquivoNome || `documento-${documento.id}.pdf`, mimeType: documento.mimeType || 'application/octet-stream' };
  }
}
