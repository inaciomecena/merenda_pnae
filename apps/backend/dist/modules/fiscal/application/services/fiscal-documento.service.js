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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalDocumentoService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const fiscal_acesso_service_1 = require("./fiscal-acesso.service");
const fiscal_validacao_1 = require("./fiscal-validacao");
let FiscalDocumentoService = class FiscalDocumentoService {
    prisma;
    audit;
    acesso;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    pasta(notaFiscalId) {
        return path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
    }
    async obterNotaFiscal(id, user, operacao) {
        const notaFiscal = await this.prisma.notaFiscal.findFirst({
            where: { id, deletedAt: null },
            include: {
                fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
                contrato: { select: { id: true, numero: true, exercicio: true, dreId: true, escolaId: true, produtorId: true } },
            },
        });
        if (!notaFiscal)
            throw new common_1.NotFoundException('Nota fiscal não encontrada.');
        await this.acesso.exigir(user, { contratoId: notaFiscal.contratoId, fornecedorId: notaFiscal.fornecedorId }, operacao);
        return notaFiscal;
    }
    async upload(notaFiscalId, arquivo, tipo, titulo, user) {
        await this.obterNotaFiscal(notaFiscalId, user, 'PROCESSAR');
        if (!arquivo?.buffer?.length) {
            throw new common_1.BadRequestException('Arquivo vazio.');
        }
        if (arquivo.size > fiscal_validacao_1.FISCAL_LIMITE_ARQUIVO_BYTES) {
            throw new common_1.BadRequestException('Arquivo acima do limite de 10 MB.');
        }
        if (!(0, fiscal_validacao_1.mimeTypeFiscalPermitido)(arquivo.mimetype)) {
            throw new common_1.BadRequestException('Use XML ou PDF.');
        }
        const assinatura = arquivo.buffer.subarray(0, 8);
        if (arquivo.mimetype === 'application/pdf' && assinatura.subarray(0, 4).toString() !== '%PDF') {
            throw new common_1.BadRequestException('PDF inválido.');
        }
        if ((arquivo.mimetype === 'application/xml' || arquivo.mimetype === 'text/xml')) {
            const inicio = arquivo.buffer.subarray(0, 5).toString('utf8');
            if (!inicio.startsWith('<?xml') && !inicio.startsWith('<')) {
                throw new common_1.BadRequestException('XML inválido.');
            }
        }
        const extensao = fiscal_validacao_1.MIME_TYPES_FISCAIS[arquivo.mimetype];
        const pasta = this.pasta(notaFiscalId);
        await fs.promises.mkdir(pasta, { recursive: true });
        const nome = `${(0, crypto_1.randomUUID)()}.${extensao}`;
        const arquivoPath = path.join(pasta, nome);
        await fs.promises.writeFile(arquivoPath, arquivo.buffer, { flag: 'wx' });
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
                hashSha256: (0, crypto_1.createHash)('sha256').update(arquivo.buffer).digest('hex'),
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
    async download(notaFiscalId, documentoId, user) {
        await this.obterNotaFiscal(notaFiscalId, user, 'CONSULTAR');
        const documento = await this.prisma.notaFiscalDocumento.findFirst({
            where: { id: documentoId, notaFiscalId },
        });
        if (!documento?.arquivoPath || !documento.hashSha256) {
            throw new common_1.NotFoundException('Documento não encontrado.');
        }
        const caminho = path.resolve(documento.arquivoPath);
        if (!caminho.startsWith(this.pasta(notaFiscalId) + path.sep)) {
            throw new common_1.ConflictException('Caminho documental inválido.');
        }
        const hash = (0, crypto_1.createHash)('sha256').update(await fs.promises.readFile(caminho)).digest('hex');
        if (hash !== documento.hashSha256) {
            throw new common_1.ConflictException('Integridade do documento divergente.');
        }
        return {
            caminho,
            nome: documento.arquivoNome || `documento-${documento.id}.pdf`,
            mimeType: documento.mimeType || 'application/octet-stream',
        };
    }
    async listar(notaFiscalId, user) {
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
};
exports.FiscalDocumentoService = FiscalDocumentoService;
exports.FiscalDocumentoService = FiscalDocumentoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        fiscal_acesso_service_1.FiscalAcessoService])
], FiscalDocumentoService);
//# sourceMappingURL=fiscal-documento.service.js.map