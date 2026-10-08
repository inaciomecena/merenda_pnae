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
var ImportadorEditaisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportadorEditaisService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const importacoes_repository_1 = require("../repositories/importacoes.repository");
const parser_service_1 = require("./parser.service");
const docsDir = path.resolve(process.cwd(), '..', '..', 'docs');
let ImportadorEditaisService = ImportadorEditaisService_1 = class ImportadorEditaisService {
    repository;
    parserService;
    logger = new common_1.Logger(ImportadorEditaisService_1.name);
    constructor(repository, parserService) {
        this.repository = repository;
        this.parserService = parserService;
    }
    async onModuleInit() {
        try {
            await this.sincronizarPdfsDaPastaDocs(true);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.warn(`Falha ao sincronizar PDFs da pasta docs na inicialização: ${message}`);
        }
    }
    async registrarUpload(file, dto) {
        const importacao = await this.repository.createImportLog({
            arquivoNome: dto.nomeArquivo?.trim() || file.originalname,
            arquivoCaminho: file.path,
            origem: 'UPLOAD',
            status: dto.processarAutomaticamente ? client_1.StatusImportacao.PROCESSANDO : client_1.StatusImportacao.AGUARDANDO_PROCESSAMENTO,
            createdBy: 'importador-editais',
        });
        if (dto.processarAutomaticamente) {
            return this.processarImportacao(importacao.id, true);
        }
        return importacao;
    }
    async listarImportacoes(query) {
        await this.sincronizarDocs(false);
        return this.repository.list(query);
    }
    async sincronizarDocs(processarAutomaticamente = false) {
        return this.sincronizarPdfsDaPastaDocs(processarAutomaticamente);
    }
    async buscarImportacao(id) {
        const item = await this.repository.findById(id);
        if (!item) {
            throw new common_1.NotFoundException('Importação não encontrada.');
        }
        return item;
    }
    async processarImportacao(id, reprocessar = false) {
        const importacao = await this.buscarImportacao(id);
        const processedStatuses = new Set([
            client_1.StatusImportacao.PROCESSADO,
            client_1.StatusImportacao.PENDENTE_CONFERENCIA,
            client_1.StatusImportacao.CONFIRMADO,
        ]);
        if (!reprocessar && processedStatuses.has(importacao.status)) {
            return importacao;
        }
        if (!fs.existsSync(importacao.arquivoCaminho)) {
            await this.repository.updateImportLog(importacao.id, {
                status: client_1.StatusImportacao.ERRO,
                mensagemErro: 'Arquivo PDF não encontrado no caminho salvo.',
                updatedBy: 'importador-editais',
            });
            throw new common_1.BadRequestException('Arquivo PDF não encontrado no caminho salvo.');
        }
        const startedAt = Date.now();
        await this.repository.updateImportLog(importacao.id, {
            status: client_1.StatusImportacao.PROCESSANDO,
            mensagemErro: null,
            updatedBy: 'importador-editais',
        });
        try {
            const buffer = await fs.promises.readFile(importacao.arquivoCaminho);
            const parsed = await this.parserService.parse(buffer, importacao.arquivoNome);
            const municipio = await this.repository.resolveMunicipioByName(parsed.municipio);
            const escola = await this.repository.resolveEscolaByName(parsed.escola, municipio?.id);
            const edital = await this.repository.upsertEditalFromImport(importacao.id, importacao.editalId, {
                numero: parsed.numero || this.fallbackNumero(importacao.arquivoNome),
                ano: parsed.ano || new Date().getFullYear(),
                titulo: parsed.titulo,
                descricao: parsed.observacoes,
                objeto: parsed.objeto,
                observacoes: parsed.observacoes,
                arquivoFonte: importacao.arquivoCaminho,
                municipioId: municipio?.id,
                escolaId: escola?.id,
                dataPublicacao: parsed.data ? new Date(parsed.data) : undefined,
            });
            const hasPendingItems = parsed.itens.some((item) => item.pendenteConferencia);
            await this.repository.createEditalItems(edital.id, parsed.itens.map((item) => ({
                editalId: edital.id,
                numeroItem: item.numeroItem,
                produtoOriginal: item.produtoOriginal,
                especificacao: item.especificacao,
                quantidade: item.quantidade ?? null,
                unidade: item.unidade ?? null,
                precoUnitario: item.precoUnitario ?? null,
                valorTotal: item.valorTotal ?? null,
                observacoes: item.observacoes,
                status: item.pendenteConferencia ? client_1.StatusItemEdital.PENDENTE_CONFERENCIA : client_1.StatusItemEdital.IMPORTADO,
                pendenteEdicao: item.pendenteConferencia,
                importadoAutomaticamente: true,
                createdBy: 'importador-editais',
            })));
            await this.repository.updateImportLog(importacao.id, {
                editalId: edital.id,
                tituloExtraido: parsed.titulo,
                numeroExtraido: parsed.numero,
                anoExtraido: parsed.ano,
                municipioNome: parsed.municipio,
                escolaNome: parsed.escola,
                objeto: parsed.objeto,
                resumo: parsed.observacoes,
                quantidadeItens: parsed.itens.length,
                tempoProcessamentoMs: Date.now() - startedAt,
                processadoEm: new Date(),
                status: hasPendingItems ? client_1.StatusImportacao.PENDENTE_CONFERENCIA : client_1.StatusImportacao.PROCESSADO,
                updatedBy: 'importador-editais',
            });
            return this.buscarImportacao(importacao.id);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF.';
            await this.repository.updateImportLog(importacao.id, {
                status: client_1.StatusImportacao.ERRO,
                mensagemErro: message,
                tempoProcessamentoMs: Date.now() - startedAt,
                updatedBy: 'importador-editais',
            });
            throw error;
        }
    }
    async confirmarImportacao(id, dto) {
        const importacao = await this.buscarImportacao(id);
        if (!importacao.editalId) {
            throw new common_1.BadRequestException('A importação ainda não gerou um edital para confirmação.');
        }
        return this.repository.confirmImportacao(id, importacao.editalId, dto.itens);
    }
    async sincronizarPdfsDaPastaDocs(processarAutomaticamente) {
        if (!fs.existsSync(docsDir)) {
            return { encontrados: 0, criados: 0, processados: 0, importacoes: [] };
        }
        const files = (await fs.promises.readdir(docsDir, { encoding: 'utf8' }))
            .filter((file) => file.toLowerCase().endsWith('.pdf'))
            .map((file) => ({
            nome: file,
            caminho: path.join(docsDir, file),
        }));
        const importacoes = [];
        let criados = 0;
        let processados = 0;
        for (const file of files) {
            const existente = await this.repository.findByFilePath(file.caminho);
            if (existente) {
                importacoes.push(existente);
                continue;
            }
            const created = await this.repository.createImportLog({
                arquivoNome: file.nome,
                arquivoCaminho: file.caminho,
                origem: 'DOCS',
                status: client_1.StatusImportacao.AGUARDANDO_PROCESSAMENTO,
                createdBy: 'importador-editais',
            });
            criados += 1;
            if (processarAutomaticamente) {
                importacoes.push(await this.processarImportacao(created.id, true));
                processados += 1;
            }
            else {
                importacoes.push(created);
            }
        }
        return { encontrados: files.length, criados, processados, importacoes };
    }
    fallbackNumero(fileName) {
        const match = fileName.match(/(\d{1,4}[ -_]?\d{4}|\d{1,4}\/\d{4})/);
        return match?.[1]?.replace(/[ _-]/g, '/') || `AUTO-${Date.now()}`;
    }
};
exports.ImportadorEditaisService = ImportadorEditaisService;
exports.ImportadorEditaisService = ImportadorEditaisService = ImportadorEditaisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [importacoes_repository_1.ImportacoesRepository,
        parser_service_1.ParserService])
], ImportadorEditaisService);
//# sourceMappingURL=importador-editais.service.js.map