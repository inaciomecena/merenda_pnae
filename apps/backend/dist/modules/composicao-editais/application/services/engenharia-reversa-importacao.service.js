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
exports.EngenhariaReversaImportacaoService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const pdf_parse_1 = require("pdf-parse");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const engenharia_reversa_1 = require("../domain/engenharia-reversa");
const placeholders_1 = require("../domain/placeholders");
const composicao_edital_service_1 = require("./composicao-edital.service");
const templates_documento_service_1 = require("./templates-documento.service");
let EngenhariaReversaImportacaoService = class EngenhariaReversaImportacaoService {
    prisma;
    composicao;
    templates;
    constructor(prisma, composicao, templates) {
        this.prisma = prisma;
        this.composicao = composicao;
        this.templates = templates;
    }
    async montar(importacaoId, opcoes) {
        const importacao = await this.prisma.importLog.findFirst({ where: { id: importacaoId, deletedAt: null } });
        if (!importacao)
            throw new common_1.NotFoundException('Importação não encontrada.');
        const buffer = opcoes?.buffer || await fs.promises.readFile(importacao.arquivoCaminho);
        const extraido = await this.lerPdf(buffer);
        const analise = (0, engenharia_reversa_1.analisarTextoEdital)(extraido.texto, extraido.paginas);
        const editalId = opcoes?.editalId || importacao.editalId;
        const estrutura = await this.prisma.importacaoEstrutura.upsert({
            where: { importLogId: importacaoId },
            update: {
                editalId,
                textoExtraido: extraido.texto,
                secoesJson: JSON.stringify(analise.secoes),
                anexosJson: JSON.stringify(analise.anexos),
                tabelasJson: JSON.stringify(analise.tabelas),
                assinaturasJson: JSON.stringify(analise.assinaturas),
                confiancaGeral: analise.confiancaGeral,
                parametrizado: analise.parametrizado,
            },
            create: {
                importLogId: importacaoId,
                editalId,
                textoExtraido: extraido.texto,
                secoesJson: JSON.stringify(analise.secoes),
                anexosJson: JSON.stringify(analise.anexos),
                tabelasJson: JSON.stringify(analise.tabelas),
                assinaturasJson: JSON.stringify(analise.assinaturas),
                confiancaGeral: analise.confiancaGeral,
                parametrizado: analise.parametrizado,
            },
        });
        await this.prisma.importacaoCampo.deleteMany({ where: { estruturaId: estrutura.id } });
        if (analise.campos.length) {
            await this.prisma.importacaoCampo.createMany({
                data: analise.campos.map((campo) => ({
                    estruturaId: estrutura.id,
                    chave: campo.chave,
                    rotulo: campo.rotulo,
                    valor: campo.valor,
                    valorExtraido: campo.valorExtraido,
                    trecho: campo.trecho,
                    origem: placeholders_1.STATUS_REVISAO.EXTRAIDO,
                    confianca: campo.confianca,
                    paginaOrigem: campo.paginaOrigem,
                    secao: campo.secao,
                    editavel: campo.editavel,
                    sensivel: campo.sensivel,
                    statusRevisao: campo.statusRevisao,
                })),
            });
        }
        return this.obter(importacaoId);
    }
    async obter(importacaoId) {
        const estrutura = await this.prisma.importacaoEstrutura.findUnique({
            where: { importLogId: importacaoId },
            include: { campos: { orderBy: { chave: 'asc' } }, importLog: true },
        });
        if (!estrutura)
            throw new common_1.NotFoundException('Estrutura da importação ainda não foi gerada.');
        return {
            ...estrutura,
            secoes: this.parseJson(estrutura.secoesJson),
            anexos: this.parseJson(estrutura.anexosJson),
            tabelas: this.parseJson(estrutura.tabelasJson),
            assinaturas: this.parseJson(estrutura.assinaturasJson),
            arquivoFonte: estrutura.importLog.arquivoCaminho,
            arquivoNome: estrutura.importLog.arquivoNome,
        };
    }
    async atualizarCampos(importacaoId, campos) {
        const estrutura = await this.prisma.importacaoEstrutura.findUnique({ where: { importLogId: importacaoId } });
        if (!estrutura)
            throw new common_1.NotFoundException('Estrutura da importação ainda não foi gerada.');
        for (const campo of campos) {
            const where = campo.id ? { id: campo.id } : undefined;
            const alvo = where
                ? await this.prisma.importacaoCampo.findFirst({ where: { id: campo.id, estruturaId: estrutura.id } })
                : await this.prisma.importacaoCampo.findFirst({ where: { estruturaId: estrutura.id, chave: campo.chave } });
            if (!alvo)
                continue;
            await this.prisma.importacaoCampo.update({
                where: { id: alvo.id },
                data: {
                    valor: campo.valor ?? null,
                    statusRevisao: campo.statusRevisao || placeholders_1.STATUS_REVISAO.CONFIRMADO,
                    origem: 'manual',
                },
            });
        }
        return this.obter(importacaoId);
    }
    async aplicar(importacaoId, modo, usuarioId, editalDestinoId) {
        const estrutura = await this.obter(importacaoId);
        if (modo === 'ATUALIZAR') {
            const editalId = editalDestinoId || estrutura.editalId || estrutura.importLog.editalId;
            if (!editalId)
                throw new common_1.BadRequestException('A importação ainda não possui edital para atualizar.');
            return this.aplicarNoEdital(editalId, estrutura, usuarioId, false);
        }
        return this.criarNovo(estrutura, usuarioId);
    }
    async aplicarNoEdital(editalId, estrutura, usuarioId, novo) {
        const edital = await this.composicao.obter(editalId);
        this.composicao.assertEditavel(edital.documento?.statusComposicao);
        const confirmados = new Map(estrutura.campos.filter((campo) => campo.statusRevisao === placeholders_1.STATUS_REVISAO.CONFIRMADO && campo.valor).map((campo) => [campo.chave, campo.valor]));
        const documento = edital.documento
            ? await this.prisma.editalDocumento.update({
                where: { id: edital.documento.id },
                data: {
                    origem: 'IMPORTACAO',
                    arquivoFonte: estrutura.arquivoFonte,
                    importacaoId: estrutura.importLogId,
                    conteudoManual: novo ? estrutura.parametrizado : edital.documento.conteudoManual,
                    statusComposicao: 'EM_CONFERENCIA',
                    processoAdministrativo: novo ? null : (confirmados.get('edital.processoAdministrativo') || edital.documento.processoAdministrativo),
                    legislacaoAplicavel: confirmados.get('edital.legislacaoAplicavel') || (novo ? null : edital.documento.legislacaoAplicavel),
                    localRecebimento: confirmados.get('edital.localSessao') || (novo ? null : edital.documento.localRecebimento),
                    comissao: confirmados.get('edital.comissao') || (novo ? null : edital.documento.comissao),
                    foro: confirmados.get('edital.foro') || (novo ? null : edital.documento.foro),
                    updatedBy: usuarioId,
                },
            })
            : await this.prisma.editalDocumento.create({
                data: {
                    editalId,
                    origem: 'IMPORTACAO',
                    arquivoFonte: estrutura.arquivoFonte,
                    importacaoId: estrutura.importLogId,
                    conteudoManual: estrutura.parametrizado,
                    statusComposicao: 'EM_CONFERENCIA',
                    createdBy: usuarioId,
                    updatedBy: usuarioId,
                },
            });
        if (!edital.documento) {
            await this.templates.garantirPadroes(usuarioId);
            const templates = await this.prisma.templateDocumento.findMany({
                where: { deletedAt: null, ativo: true },
                include: { versoes: { orderBy: { numero: 'desc' }, take: 1 } },
            });
            const detectados = new Set((estrutura.anexos || []).map((anexo) => anexo.tipo));
            detectados.add('EDITAL_PRINCIPAL');
            for (const template of templates) {
                if (!detectados.has(template.tipo) && template.tipo !== 'EDITAL_PRINCIPAL')
                    continue;
                await this.prisma.editalAnexo.create({
                    data: {
                        documentoId: documento.id,
                        templateId: template.id,
                        templateVersaoId: template.versoes[0]?.id,
                        tipo: template.tipo,
                        ordem: template.ordem,
                        titulo: (estrutura.anexos || []).find((anexo) => anexo.tipo === template.tipo)?.titulo || template.titulo,
                        incluido: template.tipo === 'EDITAL_PRINCIPAL' || detectados.has(template.tipo),
                    },
                });
            }
        }
        for (const campo of estrutura.campos) {
            await this.prisma.editalVariavel.upsert({
                where: { documentoId_chave_escopo: { documentoId: documento.id, chave: campo.chave, escopo: '' } },
                update: {
                    valor: campo.statusRevisao === placeholders_1.STATUS_REVISAO.CONFIRMADO ? campo.valor : null,
                    valorExtraido: campo.valorExtraido,
                    origem: campo.origem,
                    confianca: campo.confianca,
                    paginaOrigem: campo.paginaOrigem,
                    sensivel: campo.sensivel,
                    statusRevisao: campo.statusRevisao,
                },
                create: {
                    documentoId: documento.id,
                    chave: campo.chave,
                    valor: campo.statusRevisao === placeholders_1.STATUS_REVISAO.CONFIRMADO ? campo.valor : null,
                    valorExtraido: campo.valorExtraido,
                    origem: campo.origem,
                    confianca: campo.confianca,
                    paginaOrigem: campo.paginaOrigem,
                    sensivel: campo.sensivel,
                    statusRevisao: campo.statusRevisao,
                },
            });
        }
        return this.composicao.obter(editalId);
    }
    async criarNovo(estrutura, usuarioId) {
        const confirmado = (chave) => estrutura.campos.find((campo) => campo.chave === chave && campo.statusRevisao === placeholders_1.STATUS_REVISAO.CONFIRMADO)?.valor;
        const criado = await this.composicao.criar({
            numero: confirmado('edital.numero') || 'A-DEFINIR',
            ano: Number(confirmado('edital.ano')) || new Date().getFullYear(),
            titulo: confirmado('edital.titulo') || estrutura.arquivoNome || 'Edital a partir de importação',
            objeto: confirmado('edital.objeto') || undefined,
        }, usuarioId);
        await this.prisma.editalDocumento.update({
            where: { editalId: criado.id },
            data: {
                origem: 'IMPORTACAO',
                arquivoFonte: estrutura.arquivoFonte,
                importacaoId: estrutura.importLogId,
                conteudoManual: estrutura.parametrizado,
                statusComposicao: 'EM_CONFERENCIA',
            },
        });
        const documento = await this.prisma.editalDocumento.findUnique({ where: { editalId: criado.id } });
        if (documento) {
            for (const campo of estrutura.campos) {
                const usar = campo.statusRevisao === placeholders_1.STATUS_REVISAO.CONFIRMADO && !campo.sensivel;
                await this.prisma.editalVariavel.upsert({
                    where: { documentoId_chave_escopo: { documentoId: documento.id, chave: campo.chave, escopo: '' } },
                    update: {
                        valor: usar ? campo.valor : null,
                        valorExtraido: campo.valorExtraido,
                        sensivel: campo.sensivel,
                        statusRevisao: campo.sensivel ? placeholders_1.STATUS_REVISAO.PENDENTE : campo.statusRevisao,
                        paginaOrigem: campo.paginaOrigem,
                        confianca: campo.confianca,
                        origem: 'extraido_automaticamente',
                    },
                    create: {
                        documentoId: documento.id,
                        chave: campo.chave,
                        valor: usar ? campo.valor : null,
                        valorExtraido: campo.valorExtraido,
                        sensivel: campo.sensivel,
                        statusRevisao: campo.sensivel ? placeholders_1.STATUS_REVISAO.PENDENTE : campo.statusRevisao,
                        paginaOrigem: campo.paginaOrigem,
                        confianca: campo.confianca,
                        origem: 'extraido_automaticamente',
                    },
                });
            }
        }
        return this.composicao.obter(criado.id);
    }
    async lerPdf(buffer) {
        const parser = new pdf_parse_1.PDFParse({ data: buffer });
        try {
            const result = await parser.getText();
            const paginas = (result.pages || []).map((pagina, index) => ({
                numero: index + 1,
                texto: pagina.text || '',
            }));
            return { texto: result.text || paginas.map((pagina) => pagina.texto).join('\n'), paginas };
        }
        finally {
            await parser.destroy();
        }
    }
    parseJson(valor) {
        if (!valor)
            return [];
        try {
            return JSON.parse(valor);
        }
        catch {
            return [];
        }
    }
};
exports.EngenhariaReversaImportacaoService = EngenhariaReversaImportacaoService;
exports.EngenhariaReversaImportacaoService = EngenhariaReversaImportacaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        composicao_edital_service_1.ComposicaoEditalService,
        templates_documento_service_1.TemplatesDocumentoService])
], EngenhariaReversaImportacaoService);
//# sourceMappingURL=engenharia-reversa-importacao.service.js.map