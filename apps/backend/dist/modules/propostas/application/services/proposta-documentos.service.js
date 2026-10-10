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
exports.PropostaDocumentosService = void 0;
exports.camposDosModelos = camposDosModelos;
exports.validarDocumentos = validarDocumentos;
const common_1 = require("@nestjs/common");
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const policy_service_1 = require("../../../../common/auth/policy.service");
const campos_produtor_1 = require("../../../composicao-editais/application/domain/campos-produtor");
const placeholders_1 = require("../../../composicao-editais/application/domain/placeholders");
const documento_renderer_1 = require("../../../composicao-editais/application/domain/documento-renderer");
const templates_padrao_1 = require("../../../composicao-editais/application/domain/templates-padrao");
const especiais = new Set(['itens', 'escolas', 'fornecedores', 'assinaturas']);
function camposDosModelos(modelos) {
    return [...new Set(modelos.flatMap(m => (0, placeholders_1.extrairPlaceholders)(m.conteudo)))].filter(chave => !especiais.has(chave)).map(chave => ({
        chave,
        rotulo: (0, placeholders_1.catalogoPorChave)(chave)?.rotulo || chave,
        obrigatorio: campos_produtor_1.CAMPOS_PRODUTOR.find(c => c[0] === chave)?.[2] ?? (['entidade.cnpj', 'edital.dataPublicacao'].includes(chave) || (0, placeholders_1.catalogoPorChave)(chave)?.obrigatorio || false),
        multiline: chave.startsWith('grupo.') || chave === 'projeto.cronograma',
    }));
}
function validarDocumentos(modelos, valores) {
    const erros = [];
    if (!modelos.some(m => m.finalidade === 'PROJETO_VENDA'))
        erros.push('Selecione um modelo de projeto de venda.');
    const perfis = new Set(modelos.map(m => m.perfilFornecedor).filter(Boolean));
    if (perfis.size > 1)
        erros.push('O projeto e as declarações devem ser do mesmo perfil de fornecedor.');
    for (const campo of camposDosModelos(modelos)) {
        if (campo.obrigatorio && !valores[campo.chave]?.trim())
            erros.push(`Preencha ${campo.rotulo}.`);
    }
    for (const modelo of modelos) {
        if (!modelo.conteudo.trim())
            erros.push(`Modelo sem texto editável: ${modelo.titulo}.`);
        if (modelo.vigenciaInicio && new Date(modelo.vigenciaInicio).getTime() > Date.now())
            erros.push(`Modelo ainda fora da vigência: ${modelo.titulo}.`);
        if (modelo.vigenciaFim && new Date(modelo.vigenciaFim).getTime() < Date.now())
            erros.push(`Modelo vencido: ${modelo.titulo}.`);
        const invalidas = (0, placeholders_1.extrairPlaceholders)(modelo.conteudo).filter(chave => !(0, placeholders_1.catalogoPorChave)(chave));
        if (invalidas.length)
            erros.push(`Variáveis desconhecidas: ${invalidas.join(', ')}.`);
    }
    return erros;
}
let PropostaDocumentosService = class PropostaDocumentosService {
    prisma;
    policy;
    constructor(prisma, policy) {
        this.prisma = prisma;
        this.policy = policy;
    }
    async carregar(id, user) {
        const proposta = await this.prisma.proposta.findFirst({
            where: { id, deletedAt: null },
            include: {
                produtor: { include: { municipio: true } }, itens: { where: { deletedAt: null } },
                edital: { include: { municipio: true, escola: true, escolasVinculadas: { include: { escola: true } }, documento: { include: { variaveis: true, anexos: { include: { templateVersao: true } } } } } },
            },
        });
        if (!proposta)
            throw new common_1.NotFoundException('Proposta não encontrada.');
        if ((user?.role === 'EXTENSIONISTA' || user?.role === 'PRODUTOR')) {
            if (!proposta.produtorId)
                throw new common_1.ForbiddenException('Proposta sem fornecedor representado.');
            await this.policy.requireProdutorAccess(user, proposta.produtorId);
        }
        if (user?.role === 'ESCOLA')
            throw new common_1.ForbiddenException('Documentos privados de proposta não pertencem à escola.');
        return proposta;
    }
    config(json) {
        if (!json)
            return null;
        return JSON.parse(json);
    }
    async preparar(id, user) {
        const proposta = await this.carregar(id, user);
        const templates = await this.prisma.templateDocumento.findMany({
            where: { deletedAt: null, ativo: true, finalidade: { in: ['PROJETO_VENDA', 'PRODUCAO_PROPRIA', 'CONTROLE_LIMITE'] } },
            include: { versoes: { orderBy: { numero: 'desc' }, take: 1 } },
            orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
        });
        const modelos = templates.flatMap(t => {
            const vinculo = proposta.edital.documento?.anexos.find(a => a.incluido && a.templateId === t.id);
            const fixada = vinculo?.templateVersao;
            const v = fixada && ['HTML', 'TEXTO'].includes(fixada.formato) && fixada.conteudo ? fixada : t.versoes[0];
            if (!v || !v.conteudo || !['HTML', 'TEXTO'].includes(v.formato))
                return [];
            return [{ templateId: t.id, versaoId: v.id, numero: v.numero, titulo: v.titulo, tipo: t.tipo,
                    finalidade: t.finalidade, perfilFornecedor: t.perfilFornecedor, conteudo: v.conteudo,
                    vigenciaInicio: v.vigenciaInicio?.toISOString(), vigenciaFim: v.vigenciaFim?.toISOString(),
                    vinculadoEdital: !!fixada && v.id === fixada.id }];
        });
        const salvo = this.config(proposta.documentosJson);
        const valores = this.valoresAutomaticos(proposta);
        const selecionados = salvo?.modelos || modelos.filter(m => m.perfilFornecedor === 'INDIVIDUAL');
        return { modelos, selecionados, valores: { ...valores, ...salvo?.valores }, campos: camposDosModelos([...modelos, ...(salvo?.modelos || [])]), status: proposta.status };
    }
    async salvar(id, dto, user) {
        const proposta = await this.carregar(id, user);
        if (user && user.role !== 'ADMIN' && proposta.produtorId)
            await this.policy.requireProdutorAction(user, proposta.produtorId, 'EDITAR_PROPOSTA');
        if (['FINALIZADA', 'CANCELADA'].includes(proposta.status))
            throw new common_1.BadRequestException('Proposta finalizada ou cancelada não pode ser alterada.');
        if (!dto.modelos.length)
            throw new common_1.BadRequestException('Selecione os modelos para o projeto.');
        if (new Set(dto.modelos.map(m => m.templateId)).size !== dto.modelos.length)
            throw new common_1.BadRequestException('Há modelos duplicados.');
        const disponiveis = await this.preparar(id, user);
        const anterior = this.config(proposta.documentosJson);
        const snapshots = [];
        for (const escolha of dto.modelos) {
            const antigo = anterior?.modelos.find(m => m.templateId === escolha.templateId && m.versaoId === escolha.versaoId);
            if (antigo) {
                snapshots.push(antigo);
                continue;
            }
            const modelo = disponiveis.modelos.find(m => m.templateId === escolha.templateId && m.versaoId === escolha.versaoId);
            if (!modelo)
                throw new common_1.BadRequestException('Modelo indisponível ou versão alterada. Reabra a conferência dos documentos.');
            snapshots.push(modelo);
        }
        const permitidas = new Set(placeholders_1.VARIAVEIS_DISPONIVEIS.map(v => v.chave));
        const valores = {};
        for (const [chave, valor] of Object.entries(dto.valores)) {
            if (!permitidas.has(chave) || especiais.has(chave) || typeof valor !== 'string' || valor.length > 20000 || valor.includes('{{'))
                throw new common_1.BadRequestException(`Valor inválido: ${chave}.`);
            valores[chave] = valor.trim();
        }
        const automaticos = this.valoresAutomaticos(proposta);
        for (const chave of ['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.municipio', 'produtor.telefone', 'edital.numero', 'edital.ano', 'projeto.valorTotal']) {
            if (automaticos[chave])
                valores[chave] = automaticos[chave];
        }
        const config = { modelos: snapshots, valores, salvoEm: new Date().toISOString(), salvoPor: user?.sub };
        await this.prisma.proposta.update({ where: { id }, data: { documentosJson: JSON.stringify(config), status: 'RASCUNHO', arquivoPdfPath: null, arquivoDocxPath: null, updatedBy: user?.sub } });
        return { ...config, pendencias: validarDocumentos(snapshots, valores) };
    }
    async gerar(id, user) {
        const proposta = await this.carregar(id, user);
        if (user && user.role !== 'ADMIN' && proposta.produtorId)
            await this.policy.requireProdutorAction(user, proposta.produtorId, 'EDITAR_PROPOSTA');
        if (['FINALIZADA', 'CANCELADA'].includes(proposta.status))
            throw new common_1.BadRequestException('Proposta finalizada ou cancelada não pode ser regerada.');
        const config = this.config(proposta.documentosJson);
        if (!config)
            throw new common_1.BadRequestException('Abra Anexos e declarações, selecione os modelos da DRE e confira os dados antes de gerar.');
        const valores = { ...config.valores };
        const automaticos = this.valoresAutomaticos(proposta);
        for (const chave of ['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.municipio', 'produtor.telefone', 'edital.numero', 'edital.ano', 'projeto.valorTotal'])
            valores[chave] = automaticos[chave] || valores[chave] || '';
        const erros = validarDocumentos(config.modelos, valores);
        if (!proposta.produtor || !proposta.itens.length)
            erros.push('Vincule um produtor e os itens ao projeto.');
        for (const item of proposta.itens) {
            if (Number(item.quantidade) <= 0 || Number(item.precoUnitario) <= 0 || !item.unidade)
                erros.push(`Confira quantidade, unidade e preço do produto ${item.produto}.`);
        }
        if (erros.length)
            throw new common_1.BadRequestException(erros);
        const secoes = config.modelos.map((m, ordem) => ({ ...m, titulo: `${m.titulo} · v${m.numero}`, ordem, conteudo: m.conteudo.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (token, chave) => especiais.has(chave) ? token : (valores[chave] || '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) }));
        const input = {
            numero: proposta.edital.numero, ano: proposta.edital.ano, titulo: `Projeto de venda — ${proposta.produtor.nome}`,
            versao: 1, usuario: user?.sub || config.salvoPor || 'extensionista', geradoEm: new Date().toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' }),
            valores, secoes, separarSecoes: true,
            itens: this.itensTabela(proposta),
            escolas: proposta.edital.escolasVinculadas.map(e => e.escola.nome), fornecedores: [proposta.produtor.nome],
        };
        const base = path.resolve(process.cwd(), 'storage', 'propostas', id, (0, crypto_1.randomUUID)());
        const pdfPath = await (0, documento_renderer_1.renderPdf)(input, `${base}.pdf`);
        const docxPath = await (0, documento_renderer_1.renderDocx)(input, `${base}.docx`);
        await this.prisma.proposta.update({ where: { id }, data: {
                status: 'GERADA', arquivoPdfPath: pdfPath, arquivoDocxPath: docxPath,
                documentosJson: JSON.stringify({ ...config, valores, geradoEm: new Date().toISOString() }), updatedBy: user?.sub,
            } });
        return { pdfPath, docxPath };
    }
    async previa(id, user) {
        const proposta = await this.carregar(id, user);
        const config = this.config(proposta.documentosJson);
        if (!config)
            throw new common_1.BadRequestException('Salve a seleção dos documentos primeiro.');
        const valores = { ...this.valoresAutomaticos(proposta), ...config.valores };
        return {
            pendencias: validarDocumentos(config.modelos, valores),
            documentos: config.modelos.map(m => ({ titulo: m.titulo, versao: m.numero, texto: (0, templates_padrao_1.htmlParaTexto)(m.conteudo).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_token, chave) => {
                    if (chave === 'itens')
                        return this.itensTabela(proposta).map(l => l.colunas.join(' | ')).join('\n');
                    return valores[chave] || (camposDosModelos([m]).find(c => c.chave === chave)?.obrigatorio ? `[PENDENTE: ${(0, placeholders_1.catalogoPorChave)(chave)?.rotulo || chave}]` : '—');
                }) })),
        };
    }
    itensTabela(proposta) {
        return [{ colunas: ['Produto / especificação', 'Unidade', 'Quantidade', 'Preço unitário', 'Total'] },
            ...proposta.itens.map(i => ({ colunas: [i.produto + (i.especificacao ? ` — ${i.especificacao}` : ''), i.unidade || '', String(i.quantidade || ''), dinheiro(Number(i.precoUnitario)), dinheiro(Number(i.quantidade) * Number(i.precoUnitario))] }))];
    }
    valoresAutomaticos(p) {
        const produtor = p.produtor;
        const edital = p.edital;
        const valores = Object.fromEntries((edital.documento?.variaveis || []).filter(v => !v.escopo && !especiais.has(v.chave) && v.statusRevisao === 'confirmado' && v.valor).map(v => [v.chave, v.valor]));
        const escola = edital.escola || edital.escolasVinculadas[0]?.escola;
        return { ...valores, ...(produtor?.dadosDocumentais || {}),
            'edital.numero': edital.numero, 'edital.ano': String(edital.ano), 'edital.titulo': edital.titulo,
            'edital.municipio.nome': edital.municipio?.nome || '', 'edital.municipio.uf': edital.municipio?.uf || 'MT',
            'edital.dataPublicacao': edital.dataPublicacao?.toLocaleDateString('pt-BR', { timeZone: 'America/Cuiaba' }) || '',
            'produtor.nome': produtor?.nome || '', 'produtor.cpfCnpj': produtor?.cpfCnpj || '',
            'produtor.endereco': produtor?.endereco || '', 'produtor.telefone': produtor?.telefone || '',
            'produtor.municipio': produtor ? `${produtor.municipio.nome}/${produtor.municipio.uf}` : '',
            'entidade.nome': valores['entidade.nome'] || escola?.nome || '',
            'entidade.cnpj': valores['entidade.cnpj'] || '',
            'entidade.endereco': valores['entidade.endereco'] || escola?.endereco || '',
            'entidade.municipio': valores['entidade.municipio'] || (edital.municipio ? `${edital.municipio.nome}/${edital.municipio.uf}` : ''),
            'entidade.telefone': valores['entidade.telefone'] || escola?.telefone || '',
            'projeto.local': produtor?.municipio.nome || '',
            'projeto.data': new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Cuiaba' }),
            'projeto.cronograma': valores['edital.regrasEntrega'] || '',
            'projeto.valorTotal': dinheiro(p.itens.reduce((sum, i) => sum + Number(i.quantidade) * Number(i.precoUnitario), 0)), };
    }
};
exports.PropostaDocumentosService = PropostaDocumentosService;
exports.PropostaDocumentosService = PropostaDocumentosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService])
], PropostaDocumentosService);
function dinheiro(value) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
//# sourceMappingURL=proposta-documentos.service.js.map