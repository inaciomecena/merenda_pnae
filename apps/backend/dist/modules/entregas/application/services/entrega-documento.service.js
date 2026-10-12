"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregaDocumentoService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const entrega_acesso_service_1 = require("./entrega-acesso.service");
let EntregaDocumentoService = class EntregaDocumentoService {
    prisma;
    audit;
    acesso;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    pasta(entregaId) {
        return path.resolve(process.cwd(), 'storage', 'entregas', entregaId);
    }
    async obterEntrega(id, user, operacao) {
        const entrega = await this.prisma.entrega.findFirst({ where: { id, deletedAt: null }, include: {
                programacao: { include: { contrato: { include: { edital: true } } } },
                fornecedor: true, unidadeEscolar: true,
                itens: { include: { programacaoItem: true } },
                ocorrencias: { where: { deletedAt: null } },
            } });
        if (!entrega)
            throw new common_1.NotFoundException('Entrega não encontrada.');
        await this.acesso.exigir(user, entrega, operacao);
        return entrega;
    }
    async gerarTermo(id, user) {
        const entrega = await this.obterEntrega(id, user, 'RECEBER');
        if (entrega.status !== 'ACEITA')
            throw new common_1.BadRequestException('Confirme o recebimento antes de gerar o termo.');
        const doc = new pdfkit_1.default({ size: 'A4', margin: 48 });
        const partes = [];
        doc.on('data', (parte) => partes.push(parte));
        const pronto = new Promise((resolve, reject) => {
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
            if (item.motivoRejeicao)
                doc.text(`Motivo da rejeição: ${item.motivoRejeicao}`);
        }
        if (entrega.observacoes)
            doc.moveDown().text(`Observações: ${entrega.observacoes}`);
        if (entrega.ocorrencias.length) {
            doc.moveDown().text('Ocorrências:', { underline: true });
            for (const ocorrencia of entrega.ocorrencias)
                doc.text(`${ocorrencia.tipo}: ${ocorrencia.descricao}`);
        }
        doc.moveDown(3).text('________________________________________');
        doc.text('Responsável pelo recebimento (assinatura externa)');
        doc.moveDown().text('Este arquivo não contém assinatura digital.');
        doc.end();
        const buffer = await pronto;
        return this.salvar(id, user, 'TERMO_RECEBIMENTO', `Termo de recebimento ${entrega.numero}`, buffer, 'application/pdf', 'pdf');
    }
    async anexar(id, arquivo, dto, user) {
        await this.obterEntrega(id, user, 'RECEBER');
        if (!arquivo?.buffer?.length || arquivo.size > 10 * 1024 * 1024)
            throw new common_1.BadRequestException('Arquivo inválido ou acima de 10 MB.');
        const extensoes = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
        const extensao = extensoes[arquivo.mimetype];
        if (!extensao)
            throw new common_1.BadRequestException('Use PDF, JPG ou PNG.');
        const assinatura = arquivo.buffer.subarray(0, 8);
        if (extensao === 'pdf' && assinatura.subarray(0, 4).toString() !== '%PDF')
            throw new common_1.BadRequestException('PDF inválido.');
        if (extensao === 'png' && !assinatura.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
            throw new common_1.BadRequestException('PNG inválido.');
        if (extensao === 'jpg' && (assinatura[0] !== 0xff || assinatura[1] !== 0xd8))
            throw new common_1.BadRequestException('JPG inválido.');
        if (dto.assinadoExternamente && (extensao !== 'pdf' || !['TERMO_RECEBIMENTO', 'RECIBO'].includes(dto.tipo)))
            throw new common_1.BadRequestException('Assinatura externa deve constar em termo ou recibo PDF.');
        return this.salvar(id, user, dto.tipo, dto.titulo || arquivo.originalname, arquivo.buffer, arquivo.mimetype, extensao, dto.observacao, dto.assinadoExternamente);
    }
    async salvar(id, user, tipo, titulo, buffer, mimeType, extensao, observacao, assinadoExternamente = false) {
        const pasta = this.pasta(id);
        await fs.promises.mkdir(pasta, { recursive: true });
        const nome = `${(0, crypto_1.randomUUID)()}.${extensao}`;
        const arquivoPath = path.join(pasta, nome);
        await fs.promises.writeFile(arquivoPath, buffer, { flag: 'wx' });
        const anterior = await this.prisma.entregaDocumento.findFirst({ where: { entregaId: id, tipo }, orderBy: { versao: 'desc' } });
        const documento = await this.prisma.entregaDocumento.create({ data: {
                entregaId: id, tipo, versao: (anterior?.versao || 0) + 1, titulo, arquivoPath,
                arquivoNome: nome, mimeType, tamanhoBytes: buffer.length,
                hashSha256: (0, crypto_1.createHash)('sha256').update(buffer).digest('hex'),
                formalizado: assinadoExternamente, assinaturaDigital: false,
                origemAssinatura: assinadoExternamente ? 'EXTERNA_DOCUMENTAL' : undefined,
                geradoEm: tipo === 'TERMO_RECEBIMENTO' ? new Date() : undefined,
                geradoPor: tipo === 'TERMO_RECEBIMENTO' ? user.sub : undefined,
                observacao: assinadoExternamente ? `Assinatura externa declarada pelo usuário ${user.sub}. ${observacao || ''}` : observacao, createdBy: user.sub,
            } });
        await this.audit.log({ userId: user.sub, action: tipo === 'TERMO_RECEBIMENTO' ? 'TERMO_RECEBIMENTO_GERADO' : 'DOCUMENTO_ENTREGA_ANEXADO', entity: 'EntregaDocumento', entityId: documento.id, entityLabel: titulo, newValues: JSON.stringify({ entregaId: id, tipo, versao: documento.versao, hashSha256: documento.hashSha256 }) });
        return { id: documento.id, tipo, versao: documento.versao, titulo, hashSha256: documento.hashSha256, assinaturaDigital: false, origemAssinatura: documento.origemAssinatura };
    }
    async arquivo(entregaId, documentoId, user) {
        await this.obterEntrega(entregaId, user, 'CONSULTAR');
        const documento = await this.prisma.entregaDocumento.findFirst({ where: { id: documentoId, entregaId } });
        if (!documento?.arquivoPath || !documento.hashSha256)
            throw new common_1.NotFoundException('Documento não encontrado.');
        const caminho = path.resolve(documento.arquivoPath);
        if (!caminho.startsWith(this.pasta(entregaId) + path.sep))
            throw new common_1.ConflictException('Caminho documental inválido.');
        const hash = (0, crypto_1.createHash)('sha256').update(await fs.promises.readFile(caminho)).digest('hex');
        if (hash !== documento.hashSha256)
            throw new common_1.ConflictException('Integridade do documento divergente.');
        return { caminho, nome: documento.arquivoNome || `documento-${documento.id}.pdf`, mimeType: documento.mimeType || 'application/octet-stream' };
    }
};
exports.EntregaDocumentoService = EntregaDocumentoService;
exports.EntregaDocumentoService = EntregaDocumentoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, entrega_acesso_service_1.EntregaAcessoService])
], EntregaDocumentoService);
//# sourceMappingURL=entrega-documento.service.js.map