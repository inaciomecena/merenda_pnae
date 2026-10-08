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
exports.DocumentGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const pdf_generator_service_1 = require("./pdf-generator.service");
const docx_generator_service_1 = require("./docx-generator.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let DocumentGeneratorService = class DocumentGeneratorService {
    prisma;
    pdfGenerator;
    docxGenerator;
    constructor(prisma, pdfGenerator, docxGenerator) {
        this.prisma = prisma;
        this.pdfGenerator = pdfGenerator;
        this.docxGenerator = docxGenerator;
    }
    async preview(editalId, produtorId, tipoDocumento) {
        const edital = await this.prisma.edital.findUnique({ where: { id: editalId }, include: { municipio: true } });
        if (!edital)
            throw new common_1.NotFoundException('Edital nao encontrado. Verifique se o edital foi importado e confirmado.');
        const produtor = await this.prisma.produtor.findUnique({ where: { id: produtorId }, include: { municipio: true, produtos: true } });
        if (!produtor)
            throw new common_1.NotFoundException('Produtor nao encontrado. Verifique se o produtor foi cadastrado com endereco e municipio.');
        const matches = await this.prisma.match.findMany({
            where: {
                editalId,
                produtorId,
                status: 'APROVADO',
                deletedAt: null,
            },
            include: { editalItem: true, produtorProduto: true },
        });
        if (!matches.length) {
            throw new common_1.BadRequestException(`Nenhum match aprovado encontrado para o edital "${edital.numero}/${edital.ano}" e o produtor "${produtor.nome}". Acesse o modulo de Balizamento para aprovar matches antes de gerar propostas.`);
        }
        const itens = matches.map(m => {
            const item = m.editalItem;
            const prodProduto = m.produtorProduto;
            const qtd = Number(item.quantidade || 0);
            const preco = Number(prodProduto?.precoSugerido || item.precoUnitario || 0);
            return {
                produto: prodProduto?.produto || item.produtoOriginal,
                especificacao: item.especificacao || undefined,
                marca: prodProduto?.capacidade || undefined,
                quantidade: qtd || undefined,
                unidade: item.unidade || prodProduto?.unidade || undefined,
                precoUnitario: preco || undefined,
                valorTotal: qtd && preco ? qtd * preco : undefined,
                matchId: m.id,
            };
        });
        const valorTotal = itens.reduce((sum, i) => sum + (i.valorTotal || 0), 0);
        const now = new Date();
        return {
            numeroProposta: `PNAE-${edital.numero}/${edital.ano}-${tipoDocumento === 'ANEXO_III' ? 'A3' : 'PV'}`,
            tipoDocumento,
            edital: {
                numero: edital.numero,
                ano: edital.ano,
                titulo: edital.titulo,
                objeto: edital.objeto || undefined,
                municipio: edital.municipio ? { nome: edital.municipio.nome, uf: edital.municipio.uf } : undefined,
            },
            produtor: {
                nome: produtor.nome,
                cpfCnpj: produtor.cpfCnpj || undefined,
                telefone: produtor.telefone || undefined,
                endereco: produtor.endereco || undefined,
                municipio: { nome: produtor.municipio.nome, uf: produtor.municipio.uf },
            },
            itens,
            valorTotal,
            validadeDias: 30,
            prazoEntrega: 15,
            dataGeracao: now.toLocaleDateString('pt-BR'),
        };
    }
    async generate(propostaId) {
        const proposta = await this.prisma.proposta.findUnique({
            where: { id: propostaId },
            include: { edital: { include: { municipio: true } }, itens: true },
        });
        if (!proposta)
            throw new common_1.NotFoundException('Proposta nao encontrada.');
        if (proposta.itens.length === 0) {
            throw new common_1.BadRequestException('Esta proposta nao possui itens. Adicione itens antes de gerar os documentos. Os itens sao vinculados automaticamente dos matches aprovados no Balizamento.');
        }
        const produtor = proposta.produtorId
            ? await this.prisma.produtor.findUnique({ where: { id: proposta.produtorId }, include: { municipio: true } })
            : null;
        const edital = proposta.edital;
        const data = {
            numeroProposta: proposta.numero || `PNAE-${edital.numero}/${edital.ano}`,
            tipoDocumento: proposta.tipoDocumento,
            edital: {
                numero: edital.numero,
                ano: edital.ano,
                titulo: edital.titulo,
                objeto: edital.objeto || undefined,
                municipio: edital.municipio ? { nome: edital.municipio.nome, uf: edital.municipio.uf } : undefined,
            },
            produtor: {
                nome: produtor?.nome || '—',
                cpfCnpj: produtor?.cpfCnpj || undefined,
                telefone: produtor?.telefone || undefined,
                endereco: produtor?.endereco || undefined,
                municipio: produtor?.municipio ? { nome: produtor.municipio.nome, uf: produtor.municipio.uf } : { nome: '—', uf: 'MT' },
            },
            itens: proposta.itens.map(i => ({
                produto: i.produto,
                especificacao: i.especificacao || undefined,
                marca: i.marca || undefined,
                quantidade: i.quantidade ? Number(i.quantidade) : undefined,
                unidade: i.unidade || undefined,
                precoUnitario: i.precoUnitario ? Number(i.precoUnitario) : undefined,
                valorTotal: i.valorTotal ? Number(i.valorTotal) : undefined,
            })),
            valorTotal: proposta.valorTotal ? Number(proposta.valorTotal) : 0,
            validadeDias: proposta.validadeDias,
            prazoEntrega: proposta.prazoEntrega,
            observacao: proposta.observacao || undefined,
            dataGeracao: new Date().toLocaleDateString('pt-BR'),
        };
        const ano = edital.ano;
        const editalNum = edital.numero.replace(/[^a-zA-Z0-9]/g, '_');
        const produtorSlug = (produtor?.nome || 'sem_produtor').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const baseDir = path.join(process.cwd(), '..', '..', 'storage', 'propostas', String(ano), editalNum, produtorSlug);
        fs.mkdirSync(baseDir, { recursive: true });
        const tipoSlug = proposta.tipoDocumento === 'ANEXO_III' ? 'anexo_iii' : 'projeto_venda';
        const pdfPath = path.join(baseDir, `${tipoSlug}.pdf`);
        const docxPath = path.join(baseDir, `${tipoSlug}.docx`);
        await this.pdfGenerator.generate(data, pdfPath);
        await this.docxGenerator.generate(data, docxPath);
        await this.prisma.proposta.update({
            where: { id: propostaId },
            data: {
                status: 'GERADA',
                arquivoPdfPath: pdfPath,
                arquivoDocxPath: docxPath,
                updatedBy: 'system',
            },
        });
        return { pdfPath, docxPath };
    }
    async getFilePath(propostaId, tipo) {
        const proposta = await this.prisma.proposta.findUnique({ where: { id: propostaId } });
        if (!proposta)
            throw new common_1.NotFoundException('Proposta não encontrada');
        const filePath = tipo === 'pdf' ? proposta.arquivoPdfPath : proposta.arquivoDocxPath;
        if (!filePath || !fs.existsSync(filePath)) {
            throw new common_1.NotFoundException(`Arquivo ${tipo.toUpperCase()} não encontrado. Gere a proposta primeiro.`);
        }
        return filePath;
    }
};
exports.DocumentGeneratorService = DocumentGeneratorService;
exports.DocumentGeneratorService = DocumentGeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pdf_generator_service_1.PdfGeneratorService,
        docx_generator_service_1.DocxGeneratorService])
], DocumentGeneratorService);
//# sourceMappingURL=document-generator.service.js.map