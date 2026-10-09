"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposicaoEditalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const placeholders_1 = require("../domain/placeholders");
const templates_documento_service_1 = require("./templates-documento.service");
const CAMPOS_DOCUMENTO = [
    'processoAdministrativo',
    'localRecebimento',
    'dataRecebimento',
    'horarioRecebimento',
    'comissao',
    'legislacaoAplicavel',
    'prazoVigencia',
    'condicoesParticipacao',
    'criteriosHabilitacao',
    'regrasEntrega',
    'formaPagamento',
    'penalidades',
    'foro',
    'observacoesDocumento',
];
let ComposicaoEditalService = class ComposicaoEditalService {
    prisma;
    templates;
    constructor(prisma, templates) {
        this.prisma = prisma;
        this.templates = templates;
    }
    async criar(dto, usuarioId) {
        await this.templates.garantirPadroes(usuarioId);
        const edital = await this.prisma.edital.create({
            data: {
                numero: dto.numero,
                ano: dto.ano,
                titulo: dto.titulo,
                objeto: dto.objeto,
                descricao: dto.descricao,
                status: 'RASCUNHO',
                municipioId: dto.municipioId || null,
                escolaId: dto.escolaId || dto.escolaIds?.[0] || null,
                dataPublicacao: dto.dataPublicacao ? new Date(dto.dataPublicacao) : null,
                observacoes: dto.observacoes,
                createdBy: usuarioId,
            },
        });
        await this.syncEscolas(edital.id, dto.escolaIds || (dto.escolaId ? [dto.escolaId] : []));
        const documento = await this.prisma.editalDocumento.create({
            data: {
                editalId: edital.id,
                statusComposicao: 'RASCUNHO',
                origem: 'MANUAL',
                ...this.dadosDocumento(dto),
                createdBy: usuarioId,
                updatedBy: usuarioId,
            },
        });
        await this.anexarTemplatesPadrao(documento.id);
        await this.sincronizarVariaveis(documento.id);
        await this.salvarSnapshot(documento.id, 'Criação do edital', usuarioId);
        return this.obter(edital.id);
    }
    async obter(editalId) {
        const edital = await this.prisma.edital.findFirst({
            where: { id: editalId, deletedAt: null },
            include: {
                municipio: true,
                escola: true,
                escolasVinculadas: { include: { escola: true } },
                itens: { where: { deletedAt: null }, orderBy: { numeroItem: 'asc' } },
                documento: {
                    include: {
                        anexos: { orderBy: { ordem: 'asc' }, include: { template: true, templateVersao: true } },
                        variaveis: { orderBy: { chave: 'asc' } },
                        versoes: { orderBy: { numero: 'desc' } },
                        geracoes: { orderBy: { createdAt: 'desc' }, take: 8 },
                    },
                },
            },
        });
        if (!edital)
            throw new common_1.NotFoundException('Edital não encontrado.');
        return edital;
    }
    async atualizar(editalId, dto, usuarioId) {
        const atual = await this.obter(editalId);
        this.assertEditavel(atual.documento?.statusComposicao);
        await this.prisma.edital.update({
            where: { id: editalId },
            data: {
                ...(dto.numero !== undefined ? { numero: dto.numero } : {}),
                ...(dto.ano !== undefined ? { ano: dto.ano } : {}),
                ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
                ...(dto.objeto !== undefined ? { objeto: dto.objeto } : {}),
                ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
                ...(dto.municipioId !== undefined ? { municipioId: dto.municipioId || null } : {}),
                ...(dto.escolaId !== undefined ? { escolaId: dto.escolaId || null } : {}),
                ...(dto.dataPublicacao !== undefined ? { dataPublicacao: dto.dataPublicacao ? new Date(dto.dataPublicacao) : null } : {}),
                ...(dto.observacoes !== undefined ? { observacoes: dto.observacoes } : {}),
                updatedBy: usuarioId,
            },
        });
        if (dto.escolaIds)
            await this.syncEscolas(editalId, dto.escolaIds);
        if (!atual.documento) {
            await this.prisma.editalDocumento.create({
                data: { editalId, origem: 'MANUAL', statusComposicao: 'RASCUNHO', ...this.dadosDocumento(dto), createdBy: usuarioId, updatedBy: usuarioId },
            });
        }
        else {
            await this.prisma.editalDocumento.update({
                where: { id: atual.documento.id },
                data: {
                    ...this.dadosDocumento(dto),
                    ...(dto.statusComposicao && dto.statusComposicao !== 'PUBLICADO' ? { statusComposicao: dto.statusComposicao } : {}),
                    updatedBy: usuarioId,
                },
            });
        }
        const documentoId = (await this.prisma.editalDocumento.findUnique({ where: { editalId } })).id;
        await this.sincronizarVariaveis(documentoId);
        return this.obter(editalId);
    }
    async salvarAnexos(editalId, anexos, usuarioId) {
        const atual = await this.obter(editalId);
        this.assertEditavel(atual.documento?.statusComposicao);
        const documento = await this.garantirDocumento(editalId, usuarioId);
        await this.prisma.editalAnexo.deleteMany({ where: { documentoId: documento.id } });
        for (const anexo of anexos) {
            if (anexo.templateVersaoId) {
                const versao = await this.prisma.templateVersao.findUnique({ where: { id: anexo.templateVersaoId } });
                if (!versao)
                    throw new common_1.BadRequestException(`Versão de template não encontrada para ${anexo.titulo}.`);
            }
            await this.prisma.editalAnexo.create({
                data: {
                    documentoId: documento.id,
                    tipo: anexo.tipo,
                    titulo: anexo.titulo,
                    ordem: anexo.ordem,
                    incluido: anexo.incluido,
                    templateId: anexo.templateId || null,
                    templateVersaoId: anexo.templateVersaoId || null,
                    conteudoManual: anexo.conteudoManual || null,
                },
            });
        }
        await this.prisma.editalDocumento.update({ where: { id: documento.id }, data: { statusComposicao: 'EM_CONFERENCIA', updatedBy: usuarioId } });
        return this.obter(editalId);
    }
    async salvarVariaveis(editalId, variaveis, usuarioId) {
        const atual = await this.obter(editalId);
        this.assertEditavel(atual.documento?.statusComposicao);
        const documento = await this.garantirDocumento(editalId, usuarioId);
        for (const variavel of variaveis) {
            if (!(0, placeholders_1.catalogoPorChave)(variavel.chave))
                throw new common_1.BadRequestException(`Variável inválida: ${variavel.chave}.`);
            const escopo = variavel.escopo || '';
            await this.prisma.editalVariavel.upsert({
                where: { documentoId_chave_escopo: { documentoId: documento.id, chave: variavel.chave, escopo } },
                update: {
                    valor: variavel.valor ?? null,
                    statusRevisao: variavel.statusRevisao || placeholders_1.STATUS_REVISAO.CONFIRMADO,
                    origem: 'manual',
                },
                create: {
                    documentoId: documento.id,
                    chave: variavel.chave,
                    escopo,
                    valor: variavel.valor ?? null,
                    statusRevisao: variavel.statusRevisao || placeholders_1.STATUS_REVISAO.CONFIRMADO,
                    origem: 'manual',
                    sensivel: Boolean((0, placeholders_1.catalogoPorChave)(variavel.chave)?.sensivel),
                    obrigatorio: Boolean((0, placeholders_1.catalogoPorChave)(variavel.chave)?.obrigatorio),
                },
            });
        }
        return this.obter(editalId);
    }
    async salvarItens(editalId, itens, usuarioId) {
        const atual = await this.obter(editalId);
        this.assertEditavel(atual.documento?.statusComposicao);
        await this.prisma.editalItem.updateMany({ where: { editalId, deletedAt: null }, data: { deletedAt: new Date(), updatedBy: usuarioId } });
        for (const [index, item] of itens.entries()) {
            const quantidade = item.quantidade == null ? null : Number(item.quantidade);
            const preco = item.precoUnitario == null ? null : Number(item.precoUnitario);
            await this.prisma.editalItem.create({
                data: {
                    editalId,
                    numeroItem: item.numeroItem || index + 1,
                    produtoOriginal: item.produtoOriginal,
                    especificacao: item.especificacao,
                    quantidade,
                    unidade: item.unidade,
                    precoUnitario: preco,
                    valorTotal: quantidade != null && preco != null ? quantidade * preco : null,
                    status: quantidade == null || !item.unidade ? 'PENDENTE_EDICAO' : 'CONFIRMADO',
                    pendenteEdicao: quantidade == null || !item.unidade,
                    createdBy: usuarioId,
                },
            });
        }
        return this.obter(editalId);
    }
    async duplicar(editalId, usuarioId) {
        const atual = await this.obter(editalId);
        const criado = await this.criar({
            numero: 'A-DEFINIR',
            ano: new Date().getFullYear(),
            titulo: `${atual.titulo} (cópia)`,
            objeto: atual.objeto,
            descricao: atual.descricao,
            condicoesParticipacao: atual.documento?.condicoesParticipacao,
            criteriosHabilitacao: atual.documento?.criteriosHabilitacao,
            regrasEntrega: atual.documento?.regrasEntrega,
            formaPagamento: atual.documento?.formaPagamento,
            penalidades: atual.documento?.penalidades,
            prazoVigencia: atual.documento?.prazoVigencia,
        }, usuarioId);
        const destino = await this.prisma.editalDocumento.findUnique({ where: { editalId: criado.id } });
        if (destino && atual.documento) {
            await this.prisma.editalDocumento.update({
                where: { id: destino.id },
                data: { origem: 'COPIA', conteudoManual: atual.documento.conteudoManual },
            });
            await this.prisma.editalVariavel.updateMany({
                where: { documentoId: destino.id, sensivel: true },
                data: { valor: null, statusRevisao: placeholders_1.STATUS_REVISAO.PENDENTE, origem: 'manual' },
            });
        }
        if (atual.itens.length && destino) {
            await this.prisma.editalItem.createMany({
                data: atual.itens.map((item) => ({
                    editalId: criado.id,
                    numeroItem: item.numeroItem,
                    produtoOriginal: item.produtoOriginal,
                    especificacao: item.especificacao,
                    quantidade: null,
                    unidade: item.unidade,
                    precoUnitario: null,
                    valorTotal: null,
                    status: 'PENDENTE_EDICAO',
                    pendenteEdicao: true,
                    createdBy: usuarioId,
                })),
            });
        }
        return this.obter(criado.id);
    }
    async novaVersao(editalId, usuarioId, motivo = 'Nova versão a partir do documento publicado ou gerado') {
        const atual = await this.obter(editalId);
        if (!atual.documento)
            throw new common_1.BadRequestException('Edital sem composição documental.');
        if (atual.documento.statusComposicao === 'CANCELADO') {
            throw new common_1.BadRequestException('Edital cancelado não abre nova versão. Duplique-o.');
        }
        await this.salvarSnapshot(atual.documento.id, motivo, usuarioId);
        const proxima = atual.documento.versaoAtual + 1;
        await this.prisma.editalDocumento.update({
            where: { id: atual.documento.id },
            data: { versaoAtual: proxima, statusComposicao: 'RASCUNHO', publicadoEm: null, updatedBy: usuarioId },
        });
        await this.salvarSnapshot(atual.documento.id, 'Versão de trabalho aberta', usuarioId);
        return this.obter(editalId);
    }
    async publicar(editalId, usuarioId) {
        const atual = await this.obter(editalId);
        if (!atual.documento)
            throw new common_1.BadRequestException('Edital sem composição documental.');
        if (atual.documento.statusComposicao !== 'GERADO') {
            throw new common_1.BadRequestException('Somente um edital já gerado pode ser publicado.');
        }
        await this.prisma.editalDocumento.update({
            where: { id: atual.documento.id },
            data: { statusComposicao: 'PUBLICADO', publicadoEm: new Date(), updatedBy: usuarioId },
        });
        await this.prisma.edital.update({ where: { id: editalId }, data: { status: 'ATIVO', updatedBy: usuarioId } });
        await this.salvarSnapshot(atual.documento.id, 'Publicação', usuarioId);
        return this.obter(editalId);
    }
    async cancelar(editalId, usuarioId) {
        const atual = await this.obter(editalId);
        if (atual.documento?.statusComposicao === 'PUBLICADO') {
            throw new common_1.BadRequestException('Documento publicado não pode ser alterado. Crie uma nova versão antes de cancelar o conteúdo.');
        }
        if (atual.documento) {
            await this.prisma.editalDocumento.update({
                where: { id: atual.documento.id },
                data: { statusComposicao: 'CANCELADO', updatedBy: usuarioId },
            });
        }
        await this.prisma.edital.update({ where: { id: editalId }, data: { status: 'CANCELADO', updatedBy: usuarioId } });
        return this.obter(editalId);
    }
    assertEditavel(status) {
        if (status === 'PUBLICADO') {
            throw new common_1.BadRequestException('Documento publicado não pode ser alterado. Crie uma nova versão.');
        }
        if (status === 'CANCELADO') {
            throw new common_1.BadRequestException('Documento cancelado não pode ser alterado.');
        }
    }
    dadosDocumento(dto) {
        const data = {};
        for (const campo of CAMPOS_DOCUMENTO) {
            const origem = campo === 'observacoesDocumento' ? dto.observacoesDocumento ?? dto.observacoes : dto[campo];
            if (origem !== undefined)
                data[campo] = campo.startsWith('data') && origem ? new Date(origem) : origem || null;
        }
        if (dto.dataRecebimento !== undefined)
            data.dataRecebimento = dto.dataRecebimento ? new Date(dto.dataRecebimento) : null;
        return data;
    }
    async syncEscolas(editalId, escolaIds) {
        await this.prisma.editalEscola.deleteMany({ where: { editalId } });
        if (!escolaIds?.length)
            return;
        await this.prisma.editalEscola.createMany({
            data: [...new Set(escolaIds)].map((escolaId) => ({ editalId, escolaId })),
        });
    }
    async garantirDocumento(editalId, usuarioId) {
        const existente = await this.prisma.editalDocumento.findUnique({ where: { editalId } });
        if (existente)
            return existente;
        return this.prisma.editalDocumento.create({
            data: { editalId, origem: 'MANUAL', statusComposicao: 'RASCUNHO', createdBy: usuarioId, updatedBy: usuarioId },
        });
    }
    async anexarTemplatesPadrao(documentoId) {
        const templates = await this.prisma.templateDocumento.findMany({
            where: { deletedAt: null, ativo: true },
            include: { versoes: { orderBy: { numero: 'desc' }, take: 1 } },
            orderBy: { ordem: 'asc' },
        });
        const porTipo = new Map();
        for (const template of templates) {
            if (!porTipo.has(template.tipo))
                porTipo.set(template.tipo, template);
        }
        for (const template of porTipo.values()) {
            await this.prisma.editalAnexo.create({
                data: {
                    documentoId,
                    templateId: template.id,
                    templateVersaoId: template.versoes[0]?.id,
                    tipo: template.tipo,
                    ordem: template.ordem,
                    titulo: template.titulo,
                    incluido: true,
                },
            });
        }
    }
    async sincronizarVariaveis(documentoId) {
        const documento = await this.prisma.editalDocumento.findUnique({
            where: { id: documentoId },
            include: { edital: { include: { municipio: true, escolasVinculadas: { include: { escola: true } } } } },
        });
        if (!documento)
            return;
        const edital = documento.edital;
        const valores = {
            'edital.numero': edital.numero,
            'edital.ano': String(edital.ano),
            'edital.titulo': edital.titulo,
            'edital.objeto': edital.objeto,
            'edital.descricao': edital.descricao,
            'edital.municipio.nome': edital.municipio?.nome || null,
            'edital.municipio.uf': edital.municipio?.uf || null,
            'edital.processoAdministrativo': documento.processoAdministrativo,
            'edital.dataPublicacao': edital.dataPublicacao ? edital.dataPublicacao.toLocaleDateString('pt-BR') : null,
            'edital.dataSessao': documento.dataRecebimento ? documento.dataRecebimento.toLocaleDateString('pt-BR') : null,
            'edital.horarioSessao': documento.horarioRecebimento,
            'edital.localSessao': documento.localRecebimento,
            'edital.comissao': documento.comissao,
            'edital.legislacaoAplicavel': documento.legislacaoAplicavel,
            'edital.prazoVigencia': documento.prazoVigencia,
            'edital.condicoesParticipacao': documento.condicoesParticipacao,
            'edital.criteriosHabilitacao': documento.criteriosHabilitacao,
            'edital.regrasEntrega': documento.regrasEntrega,
            'edital.formaPagamento': documento.formaPagamento,
            'edital.penalidades': documento.penalidades,
            'edital.foro': documento.foro,
            'edital.observacoes': documento.observacoesDocumento || edital.observacoes,
            'entidade.nome': 'Secretaria de Estado de Educação de Mato Grosso',
            escolas: edital.escolasVinculadas.map((item) => item.escola.nome).join('\n') || null,
        };
        for (const catalogo of placeholders_1.VARIAVEIS_DISPONIVEIS) {
            const existente = await this.prisma.editalVariavel.findUnique({
                where: { documentoId_chave_escopo: { documentoId, chave: catalogo.chave, escopo: '' } },
            });
            const valorCalculado = valores[catalogo.chave] ?? catalogo.valorPadrao ?? null;
            if (existente?.origem === 'manual' && existente.valor)
                continue;
            const origemImportacao = documento.origem === 'IMPORTACAO';
            const valor = origemImportacao && catalogo.sensivel ? (existente?.valor ?? null) : valorCalculado;
            const statusRevisao = existente?.statusRevisao
                || (origemImportacao && catalogo.sensivel ? placeholders_1.STATUS_REVISAO.PENDENTE : (valor ? placeholders_1.STATUS_REVISAO.CONFIRMADO : placeholders_1.STATUS_REVISAO.PENDENTE));
            await this.prisma.editalVariavel.upsert({
                where: { documentoId_chave_escopo: { documentoId, chave: catalogo.chave, escopo: '' } },
                update: {
                    valor: existente?.statusRevisao === placeholders_1.STATUS_REVISAO.PENDENTE ? existente.valor : valor,
                    obrigatorio: catalogo.obrigatorio,
                    sensivel: catalogo.sensivel,
                },
                create: {
                    documentoId,
                    chave: catalogo.chave,
                    valor,
                    valorExtraido: valorCalculado,
                    origem: origemImportacao ? 'extraido_automaticamente' : 'manual',
                    obrigatorio: catalogo.obrigatorio,
                    sensivel: catalogo.sensivel,
                    statusRevisao,
                },
            });
        }
    }
    async salvarSnapshot(documentoId, motivo, usuarioId) {
        const documento = await this.prisma.editalDocumento.findUnique({
            where: { id: documentoId },
            include: { anexos: true, variaveis: true, edital: true },
        });
        if (!documento)
            return;
        await this.prisma.editalVersao.upsert({
            where: { documentoId_numero: { documentoId, numero: documento.versaoAtual } },
            update: { statusComposicao: documento.statusComposicao, snapshot: JSON.stringify(documento), motivo, createdBy: usuarioId },
            create: {
                documentoId,
                numero: documento.versaoAtual,
                statusComposicao: documento.statusComposicao,
                snapshot: JSON.stringify(documento),
                motivo,
                createdBy: usuarioId,
            },
        });
    }
};
exports.ComposicaoEditalService = ComposicaoEditalService;
exports.ComposicaoEditalService = ComposicaoEditalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        templates_documento_service_1.TemplatesDocumentoService])
], ComposicaoEditalService);
//# sourceMappingURL=composicao-edital.service.js.map