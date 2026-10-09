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
exports.TemplatesDocumentoService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const placeholders_1 = require("../domain/placeholders");
const templates_padrao_1 = require("../domain/templates-padrao");
const templates_dre_1 = require("../domain/templates-dre");
const uploadDir = path.resolve(process.cwd(), 'storage', 'templates');
let TemplatesDocumentoService = class TemplatesDocumentoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            await this.garantirPadroes('system');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'erro desconhecido';
            console.warn(`Templates padrão não foram semeados: ${message}`);
        }
    }
    listarVariaveis() {
        return placeholders_1.VARIAVEIS_DISPONIVEIS;
    }
    async anexosPadrao() {
        const modelos = await this.listar({ ativo: 'true' });
        const selecionados = new Map();
        for (const modelo of modelos) {
            const chave = `${modelo.tipo}:${modelo.finalidade}:${modelo.perfilFornecedor || ''}`;
            if (!selecionados.has(chave))
                selecionados.set(chave, modelo);
        }
        return [...selecionados.values()].map((modelo, ordem) => ({
            tipo: modelo.tipo, titulo: modelo.titulo, ordem, incluido: true,
            templateId: modelo.id, templateVersaoId: modelo.versoes[0]?.id,
        }));
    }
    async listar(query) {
        const where = {
            deletedAt: null,
            ...(query.tipo ? { tipo: query.tipo } : {}),
            ...(query.ativo === 'true' ? { ativo: true } : {}),
            ...(query.ativo === 'false' ? { ativo: false } : {}),
            ...(query.search ? { titulo: { contains: query.search } } : {}),
        };
        return this.prisma.templateDocumento.findMany({
            where,
            orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
            include: { versoes: { orderBy: { numero: 'desc' }, take: 1 } },
        });
    }
    async buscar(id) {
        const item = await this.prisma.templateDocumento.findFirst({
            where: { id, deletedAt: null },
            include: { versoes: { orderBy: { numero: 'desc' } }, campos: { orderBy: { ordem: 'asc' } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Template não encontrado.');
        return item;
    }
    async garantirPadroes(usuarioId) {
        for (const modelo of templates_dre_1.MODELOS_DRE) {
            const semeado = await this.prisma.templateDocumento.findUnique({ where: { codigoModelo: modelo.arquivo } });
            if (semeado)
                continue;
            const legado = templates_padrao_1.TEMPLATES_PADRAO.find(item => item.tipo === modelo.tipo);
            let existente = await this.prisma.templateDocumento.findFirst({
                where: { tipo: modelo.tipo, deletedAt: null, titulo: modelo.titulo },
            });
            if (existente && existente.conteudo !== legado?.conteudo) {
                await this.prisma.templateDocumento.update({ where: { id: existente.id }, data: { codigoModelo: modelo.arquivo } });
                continue;
            }
            if (legado && ['EDITAL', 'PROJETO_VENDA'].includes(modelo.finalidade)) {
                existente = await this.prisma.templateDocumento.findFirst({
                    where: { tipo: modelo.tipo, titulo: legado.titulo, conteudo: legado.conteudo, deletedAt: null },
                });
            }
            const dados = {
                tipo: modelo.tipo, titulo: modelo.titulo, finalidade: modelo.finalidade,
                perfilFornecedor: modelo.perfilFornecedor, ordem: modelo.ordem,
                descricao: `Texto editável baseado em docs/dre/${modelo.arquivo}.`,
                formato: 'HTML', conteudo: modelo.conteudo,
            };
            if (existente) {
                await this.atualizar(existente.id, dados, usuarioId);
                await this.prisma.templateDocumento.update({ where: { id: existente.id }, data: { codigoModelo: modelo.arquivo } });
                continue;
            }
            const criado = await this.criar({
                ...dados,
                numeroAnexo: modelo.tipo === 'EDITAL_PRINCIPAL' ? undefined : ['ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V', 'ANEXO_VI', 'ANEXO_VII'].indexOf(modelo.tipo) + 1,
                ativo: true,
            }, usuarioId);
            await this.prisma.templateDocumento.update({ where: { id: criado.id }, data: { codigoModelo: modelo.arquivo } });
        }
    }
    async criar(dto, usuarioId) {
        this.assertFormato(dto.formato || 'HTML');
        if (dto.conteudo)
            this.assertPlaceholders(dto.conteudo);
        const template = await this.prisma.templateDocumento.create({
            data: {
                tipo: dto.tipo,
                numeroAnexo: dto.numeroAnexo ?? null,
                titulo: dto.titulo,
                descricao: dto.descricao,
                finalidade: dto.finalidade || 'EDITAL',
                perfilFornecedor: dto.perfilFornecedor || null,
                ordem: dto.ordem ?? 0,
                formato: (dto.formato || 'HTML'),
                conteudo: dto.conteudo,
                ativo: dto.ativo ?? true,
                vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null,
                vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null,
                versaoAtual: 1,
                createdBy: usuarioId,
                updatedBy: usuarioId,
            },
        });
        await this.criarVersao(template.id, 1, dto.titulo, dto.conteudo, dto.formato || 'HTML', null, dto.vigenciaInicio, dto.vigenciaFim, usuarioId, 'Versão inicial');
        await this.sincronizarCampos(template.id, dto.conteudo || '', dto.tipo);
        return this.buscar(template.id);
    }
    async atualizar(id, dto, usuarioId) {
        const atual = await this.buscar(id);
        if (dto.conteudo)
            this.assertPlaceholders(dto.conteudo);
        if (dto.formato)
            this.assertFormato(dto.formato);
        const conteudoMudou = dto.conteudo !== undefined && dto.conteudo !== atual.conteudo;
        const vigenciaMudou = dto.vigenciaInicio !== undefined || dto.vigenciaFim !== undefined;
        const novaVersao = conteudoMudou || vigenciaMudou || dto.arquivoBase || (dto.formato !== undefined && dto.formato !== atual.formato) || (dto.titulo !== undefined && dto.titulo !== atual.titulo);
        const versaoAtual = novaVersao ? atual.versaoAtual + 1 : atual.versaoAtual;
        await this.prisma.templateDocumento.update({
            where: { id },
            data: {
                ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
                ...(dto.numeroAnexo !== undefined ? { numeroAnexo: dto.numeroAnexo } : {}),
                ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
                ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
                ...(dto.finalidade !== undefined ? { finalidade: dto.finalidade } : {}),
                ...(dto.perfilFornecedor !== undefined ? { perfilFornecedor: dto.perfilFornecedor || null } : {}),
                ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
                ...(dto.formato !== undefined ? { formato: dto.formato } : {}),
                ...(dto.conteudo !== undefined ? { conteudo: dto.conteudo } : {}),
                ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
                ...(dto.vigenciaInicio !== undefined ? { vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null } : {}),
                ...(dto.vigenciaFim !== undefined ? { vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null } : {}),
                versaoAtual,
                updatedBy: usuarioId,
            },
        });
        if (novaVersao) {
            await this.criarVersao(id, versaoAtual, dto.titulo || atual.titulo, dto.conteudo ?? atual.conteudo, dto.formato || atual.formato, atual.arquivoBase, dto.vigenciaInicio, dto.vigenciaFim, usuarioId, 'Atualização do template');
            await this.sincronizarCampos(id, dto.conteudo ?? atual.conteudo ?? '', dto.tipo || atual.tipo);
        }
        return this.buscar(id);
    }
    async duplicar(id, usuarioId) {
        const atual = await this.buscar(id);
        return this.criar({
            tipo: atual.tipo,
            numeroAnexo: atual.numeroAnexo ?? undefined,
            titulo: `${atual.titulo} (cópia)`,
            descricao: atual.descricao ?? undefined,
            finalidade: atual.finalidade,
            perfilFornecedor: atual.perfilFornecedor ?? undefined,
            ordem: atual.ordem,
            formato: atual.formato,
            conteudo: atual.conteudo ?? undefined,
            ativo: false,
        }, usuarioId);
    }
    async alterarStatus(id, ativo, usuarioId) {
        await this.buscar(id);
        return this.prisma.templateDocumento.update({ where: { id }, data: { ativo, updatedBy: usuarioId } });
    }
    async remover(id, usuarioId) {
        await this.buscar(id);
        const usados = await this.prisma.editalAnexo.count({
            where: { templateId: id, documento: { geracoes: { some: { status: 'SUCESSO' } } } },
        });
        if (usados > 0) {
            throw new common_1.BadRequestException('Template vinculado a edital já gerado não pode ser excluído. Inative-o ou crie uma nova versão.');
        }
        await this.prisma.editalAnexo.deleteMany({ where: { templateId: id } });
        return this.prisma.templateDocumento.update({ where: { id }, data: { deletedAt: new Date(), ativo: false, updatedBy: usuarioId } });
    }
    async enviarArquivo(id, file, usuarioId) {
        const atual = await this.buscar(id);
        const ext = path.extname(file.originalname).toLowerCase();
        if (!['.html', '.htm', '.txt', '.docx', '.pdf'].includes(ext)) {
            throw new common_1.BadRequestException('Envie um arquivo HTML, TXT, DOCX ou PDF.');
        }
        fs.mkdirSync(uploadDir, { recursive: true });
        const destino = path.join(uploadDir, `${Date.now()}-${path.basename(file.originalname).replace(/[<>:"/\\|?*]+/g, '')}`);
        await fs.promises.rename(file.path, destino).catch(async () => {
            await fs.promises.copyFile(file.path, destino);
        });
        let conteudo = atual.conteudo;
        let formato = atual.formato;
        if (ext === '.pdf') {
            formato = atual.conteudo?.trim() && ['HTML', 'TEXTO'].includes(atual.formato) ? atual.formato : 'PDF';
            conteudo = atual.conteudo;
        }
        else if (ext === '.docx') {
            formato = atual.conteudo?.trim() && ['HTML', 'TEXTO'].includes(atual.formato) ? atual.formato : 'DOCX';
            conteudo = atual.conteudo;
        }
        else {
            formato = ext === '.txt' ? 'TEXTO' : 'HTML';
            conteudo = await fs.promises.readFile(destino, 'utf8');
        }
        if (conteudo)
            this.assertPlaceholders(conteudo);
        const versaoAtual = atual.versaoAtual + 1;
        await this.prisma.templateDocumento.update({
            where: { id },
            data: { arquivoBase: path.relative(process.cwd(), destino), conteudo, formato: formato, versaoAtual, updatedBy: usuarioId },
        });
        await this.criarVersao(id, versaoAtual, atual.titulo, conteudo, formato, path.relative(process.cwd(), destino), undefined, undefined, usuarioId, `Arquivo ${file.originalname}`);
        await this.sincronizarCampos(id, conteudo || '', atual.tipo);
        return this.buscar(id);
    }
    async caminhoArquivo(id) {
        const item = await this.buscar(id);
        const modeloDre = item.codigoModelo && templates_dre_1.MODELOS_DRE.some(m => m.arquivo === item.codigoModelo);
        const referencia = modeloDre ? [path.resolve(process.cwd(), '..', '..', 'docs', 'dre', item.codigoModelo), path.resolve(process.cwd(), 'docs', 'dre', item.codigoModelo)].find(p => fs.existsSync(p)) : undefined;
        if (!item.arquivoBase && !referencia)
            throw new common_1.NotFoundException('Template sem arquivo-base.');
        const absoluto = item.arquivoBase ? (path.isAbsolute(item.arquivoBase) ? item.arquivoBase : path.resolve(process.cwd(), item.arquivoBase)) : referencia;
        if (!fs.existsSync(absoluto))
            throw new common_1.NotFoundException('Arquivo-base não encontrado.');
        return { caminho: absoluto, nome: path.basename(absoluto) };
    }
    assertFormato(formato) {
        if (!['HTML', 'DOCX', 'TEXTO', 'PDF'].includes(formato))
            throw new common_1.BadRequestException('Formato de template não suportado.');
    }
    assertPlaceholders(conteudo) {
        const invalidos = (0, placeholders_1.extrairPlaceholders)(conteudo).filter((chave) => !(0, placeholders_1.catalogoPorChave)(chave));
        if (invalidos.length)
            throw new common_1.BadRequestException(`Placeholders inválidos: ${invalidos.join(', ')}.`);
    }
    async criarVersao(templateId, numero, titulo, conteudo, formato, arquivoBase, vigenciaInicio, vigenciaFim, usuarioId, observacao) {
        await this.prisma.templateVersao.create({
            data: {
                templateId,
                numero,
                titulo,
                conteudo: conteudo ?? null,
                formato: formato,
                arquivoBase: arquivoBase ?? null,
                vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : null,
                vigenciaFim: vigenciaFim ? new Date(vigenciaFim) : null,
                observacao,
                createdBy: usuarioId,
            },
        });
    }
    async sincronizarCampos(templateId, conteudo, tipo) {
        const chaves = (0, placeholders_1.extrairPlaceholders)(conteudo);
        await this.prisma.campoTemplate.deleteMany({ where: { templateId } });
        if (!chaves.length)
            return;
        await this.prisma.campoTemplate.createMany({
            data: chaves.map((chave, ordem) => {
                const catalogo = (0, placeholders_1.catalogoPorChave)(chave);
                return {
                    templateId,
                    chave,
                    rotulo: catalogo?.rotulo || chave,
                    tipo: catalogo?.tipo || 'texto',
                    obrigatorio: catalogo?.obrigatorio || false,
                    valorPadrao: catalogo?.valorPadrao,
                    repetitivo: catalogo?.repetitivo || false,
                    anexoTipo: tipo,
                    ordem,
                };
            }),
        });
    }
};
exports.TemplatesDocumentoService = TemplatesDocumentoService;
exports.TemplatesDocumentoService = TemplatesDocumentoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TemplatesDocumentoService);
//# sourceMappingURL=templates-documento.service.js.map