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
exports.ContratosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const policy_service_1 = require("../../../../common/auth/policy.service");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const documento_renderer_1 = require("../../../composicao-editais/application/domain/documento-renderer");
const contrato_datas_1 = require("../domain/contrato-datas");
const contrato_decimal_1 = require("../domain/contrato-decimal");
const contrato_escopo_1 = require("../domain/contrato-escopo");
const contrato_estado_1 = require("../domain/contrato-estado");
const contrato_saldos_1 = require("../domain/contrato-saldos");
const contrato_validacao_1 = require("../domain/contrato-validacao");
const minuta_contrato_1 = require("../domain/minuta-contrato");
const contrato_presenter_1 = require("./contrato-presenter");
const ORDENACAO = {
    numero: 'numero',
    exercicio: 'exercicio',
    valor: 'valorAtualizado',
    vigencia: 'vigenciaFim',
    situacao: 'status',
    criacao: 'createdAt',
};
let ContratosService = class ContratosService {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async indicadores(query, user) {
        this.exigir(user, 'CONSULTAR');
        const dias = Math.min(Math.max(Number(query.dias || 30) || 30, 1), 365);
        const where = { deletedAt: null, ...(await this.escopo(user)) };
        const hoje = (0, contrato_datas_1.dataInstitucional)((0, contrato_datas_1.hojeInstitucional)());
        const limite = new Date(hoje);
        limite.setUTCDate(limite.getUTCDate() + dias);
        const statusFormais = ['VIGENTE', 'SUSPENSO', 'ENCERRADO'];
        const formais = { ...where, status: { in: statusFormais } };
        const [total, vigentes, aguardandoAssinatura, proximosVencimento, soma] = await Promise.all([
            this.prisma.contrato.count({ where }),
            this.prisma.contrato.count({ where: { ...where, status: 'VIGENTE' } }),
            this.prisma.contrato.count({ where: { ...where, status: 'AGUARDANDO_ASSINATURA' } }),
            this.prisma.contrato.count({ where: { ...where, status: 'VIGENTE', vigenciaFim: { gte: hoje, lte: limite } } }),
            this.prisma.contrato.aggregate({ where: formais, _sum: { valorInicial: true, valorAtualizado: true } }),
        ]);
        return {
            total,
            vigentes,
            aguardandoAssinatura,
            proximosVencimento,
            diasProximidade: dias,
            valorInicial: (0, contrato_presenter_1.texto)(soma._sum.valorInicial ?? 0, 2),
            valorAtualizado: (0, contrato_presenter_1.texto)(soma._sum.valorAtualizado ?? 0, 2),
            limiteLegal: await this.lerLimite(),
        };
    }
    async findAll(query, user) {
        this.exigir(user, 'CONSULTAR');
        const page = Math.max(Number(query.page || 1) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit || 20) || 20, 1), 100);
        const campo = ORDENACAO[(query.ordenar || 'criacao')] || 'createdAt';
        const direcao = query.ordem === 'asc' ? 'asc' : 'desc';
        const where = { deletedAt: null, ...(await this.escopo(user)) };
        if (query.numero)
            where.numero = { contains: query.numero };
        if (query.exercicio)
            where.exercicio = Number(query.exercicio);
        if (query.editalId)
            where.editalId = query.editalId;
        if (query.produtorId)
            where.produtorId = query.produtorId;
        if (query.dreId)
            where.dreId = query.dreId;
        if (query.municipioId)
            where.municipioId = query.municipioId;
        if (query.status) {
            if (!(0, contrato_estado_1.statusValido)(query.status))
                throw new common_1.BadRequestException('Situação inválida.');
            where.status = query.status;
        }
        if (query.vigenciaInicio || query.vigenciaFim) {
            where.vigenciaInicio = query.vigenciaInicio ? { gte: (0, contrato_datas_1.dataInstitucional)(query.vigenciaInicio) } : undefined;
            where.vigenciaFim = query.vigenciaFim ? { lte: (0, contrato_datas_1.dataInstitucional)(query.vigenciaFim) } : undefined;
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.contrato.findMany({
                where, skip: (page - 1) * limit, take: limit, orderBy: { [campo]: direcao },
                include: {
                    edital: { select: { id: true, numero: true, ano: true, titulo: true } },
                    produtor: { select: { id: true, nome: true } },
                    escola: { select: { id: true, nome: true } },
                    dre: { select: { id: true, nome: true, codigo: true } },
                    municipio: { select: { id: true, nome: true, uf: true } },
                },
            }),
            this.prisma.contrato.count({ where }),
        ]);
        return { items: items.map(contrato_presenter_1.apresentarContrato), total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        this.exigir(user, 'CONSULTAR');
        const contrato = await this.obter(id, user);
        const pendencias = await this.pendencias(contrato);
        return { ...(0, contrato_presenter_1.apresentarContrato)(contrato), pendencias };
    }
    async origens(editalId, user) {
        this.exigir(user, 'CRIAR');
        const edital = await this.prisma.edital.findFirst({
            where: { id: editalId, deletedAt: null },
            include: { municipio: true, escola: true, escolasVinculadas: { include: { escola: true } }, itens: { where: { deletedAt: null } } },
        });
        if (!edital)
            throw new common_1.NotFoundException('Edital não encontrado.');
        await this.garantirEditalNoEscopo(user, edital);
        const propostas = await this.prisma.proposta.findMany({
            where: { editalId, deletedAt: null },
            include: { produtor: { select: { id: true, nome: true, cpfCnpj: true } }, itens: { where: { deletedAt: null }, include: { match: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const comprometidos = await this.compromissos(edital.itens.map((item) => item.id));
        const escolas = this.escolasDoEdital(edital);
        const vinculos = escolas.length ? await this.prisma.vinculoEscolaDRE.findMany({
            where: { escolaId: { in: escolas.map((item) => item.id) }, ativo: true, vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }] },
            include: { dre: { select: { id: true, nome: true, codigo: true } } },
        }) : [];
        return {
            edital: { id: edital.id, numero: edital.numero, ano: edital.ano, titulo: edital.titulo, objeto: edital.objeto, municipio: edital.municipio, escolas, vinculos },
            propostas: propostas.map((proposta) => {
                const origem = this.origensDosItens(proposta.itens, edital.itens, comprometidos, proposta.id);
                const montado = (0, contrato_saldos_1.montarItensContrato)(origem);
                const pendencias = [
                    proposta.status !== 'FINALIZADA' ? 'Não há resultado homologado nem proposta finalizada equivalente.' : '',
                    ...montado.bloqueios,
                    ...montado.pendencias,
                ].filter(Boolean);
                return {
                    id: proposta.id, numero: proposta.numero, tipoDocumento: proposta.tipoDocumento, status: proposta.status,
                    produtor: proposta.produtor, elegivel: pendencias.length === 0, pendencias,
                    itens: origem.map((item) => ({ ...item, selecionado: montado.itens.find((calculado) => calculado.propostaItemId === item.propostaItemId) || null })),
                };
            }),
        };
    }
    async create(dto, ctx) {
        this.exigir(ctx.user, 'CRIAR');
        if ((0, contrato_estado_1.contemStatusDireto)(dto))
            throw new common_1.BadRequestException('A situação não pode ser alterada diretamente.');
        const criado = await this.idempotente(ctx.idempotencyKey, 'CRIAR_CONTRATO', () => this.criar(dto, ctx.user));
        if (!criado.reaproveitada)
            await this.auditar(ctx, 'CRIAR', criado.resultado.id, criado.resultado.numero, null, { status: 'RASCUNHO' });
        return criado.resultado;
    }
    async update(id, dto, ctx) {
        this.exigir(ctx.user, 'EDITAR');
        if ((0, contrato_estado_1.contemStatusDireto)(dto))
            throw new common_1.BadRequestException('A situação não pode ser alterada diretamente.');
        const atual = await this.obter(id, ctx.user);
        const bloqueio = (0, contrato_estado_1.motivoOperacaoBloqueada)(atual.status, 'EDITAR');
        if (bloqueio)
            throw new common_1.BadRequestException(bloqueio);
        if (ctx.user.role === 'DRE' && dto.dreId)
            await this.policy.requireDREAccess(ctx.user, dto.dreId);
        const data = {
            versao: { increment: 1 }, updatedBy: ctx.user.sub,
            ...(dto.numero !== undefined ? { numero: dto.numero } : {}),
            ...(dto.escolaId !== undefined ? { escolaId: dto.escolaId } : {}),
            ...(dto.dreId !== undefined ? { dreId: dto.dreId } : {}),
            ...(dto.municipioId !== undefined ? { municipioId: dto.municipioId } : {}),
            ...(dto.objeto !== undefined ? { objeto: dto.objeto } : {}),
            ...(dto.observacoes !== undefined ? { observacoes: dto.observacoes } : {}),
            ...(dto.condicoesFornecimento !== undefined ? { condicoesFornecimento: dto.condicoesFornecimento } : {}),
            ...(dto.condicoesPagamento !== undefined ? { condicoesPagamento: dto.condicoesPagamento } : {}),
            ...(dto.fiscalizacao !== undefined ? { fiscalizacao: dto.fiscalizacao } : {}),
            ...(dto.vigenciaInicio ? { vigenciaInicio: (0, contrato_datas_1.dataInstitucional)(dto.vigenciaInicio) } : {}),
            ...(dto.vigenciaFim ? { vigenciaFim: (0, contrato_datas_1.dataInstitucional)(dto.vigenciaFim) } : {}),
        };
        const alterado = await this.prisma.contrato.updateMany({ where: { id, versao: dto.versao, status: 'RASCUNHO', deletedAt: null }, data });
        if (alterado.count !== 1)
            throw new common_1.ConflictException('Contrato alterado por outra operação ou fora de rascunho. Recarregue.');
        if (dto.itens?.length)
            await this.atualizarQuantidades(id, dto.itens, ctx.user);
        await this.auditar(ctx, 'ALTERAR', id, atual.numero, { versao: atual.versao }, { versao: atual.versao + 1 });
        return this.findOne(id, ctx.user);
    }
    async validar(id, user) {
        this.exigir(user, 'CONFERIR');
        const contrato = await this.obter(id, user);
        return { id, status: contrato.status, pendencias: await this.pendencias(contrato) };
    }
    async encaminharConferencia(id, ctx) {
        this.exigir(ctx.user, 'CONFERIR');
        const contrato = await this.obter(id, ctx.user);
        const erros = (0, contrato_validacao_1.bloqueia)(await this.pendencias(contrato), 'conferencia');
        if (erros.length)
            throw new common_1.BadRequestException({ message: 'Dados obrigatórios pendentes.', erros });
        return this.mudarEstado(contrato, 'EM_CONFERENCIA', ctx, 'ENCAMINHAR_CONFERENCIA');
    }
    async enviarAssinatura(id, dto, ctx) {
        this.exigir(ctx.user, 'FORMALIZAR');
        const contrato = await this.obter(id, ctx.user);
        if (!(0, contrato_estado_1.podeTransicionar)(contrato.status, 'AGUARDANDO_ASSINATURA'))
            throw new common_1.BadRequestException('Transição para assinatura não permitida.');
        const papeis = new Set(dto.signatarios.map((item) => item.papel));
        if (!papeis.has('CONTRATANTE') || !papeis.has('CONTRATADO'))
            throw new common_1.BadRequestException('Identifique o signatário do contratante e do contratado.');
        await this.prisma.$transaction(async (tx) => {
            const alterado = await tx.contrato.updateMany({
                where: { id, status: contrato.status, versao: contrato.versao, deletedAt: null },
                data: { status: 'AGUARDANDO_ASSINATURA', versao: { increment: 1 }, updatedBy: ctx.user.sub },
            });
            if (alterado.count !== 1)
                throw new common_1.ConflictException('Contrato alterado por outra operação. Recarregue.');
            await tx.contratoSignatario.deleteMany({ where: { contratoId: id, documentoRegistradoEm: null } });
            await tx.contratoSignatario.createMany({ data: dto.signatarios.map((item) => ({
                    contratoId: id, nome: item.nome.trim(), cargo: item.cargo, papel: item.papel, enviadoEm: new Date(), createdBy: ctx.user.sub,
                })) });
        });
        await this.auditar(ctx, 'ENVIAR_ASSINATURA', id, contrato.numero, { status: contrato.status }, { status: 'AGUARDANDO_ASSINATURA', signatarios: dto.signatarios.length });
        return this.findOne(id, ctx.user);
    }
    async formalizar(id, dto, ctx) {
        this.exigir(ctx.user, 'FORMALIZAR');
        const resultado = await this.idempotente(ctx.idempotencyKey, 'FORMALIZAR_CONTRATO', () => this.formalizarInterno(id, dto, ctx.user));
        if (!resultado.reaproveitada)
            await this.auditar(ctx, 'FORMALIZAR', id, resultado.resultado.contrato?.numero || resultado.resultado.numero, { status: resultado.resultado.anterior }, { status: resultado.resultado.contrato?.status || resultado.resultado.status, assinaturaDigital: false });
        return resultado.resultado.contrato || resultado.resultado;
    }
    async transicionar(id, dto, ctx) {
        this.exigir(ctx.user, dto.para === 'CANCELADO' || dto.para === 'RASCUNHO' ? 'CONFERIR' : 'FORMALIZAR');
        const contrato = await this.obter(id, ctx.user);
        if (!(0, contrato_estado_1.podeTransicionar)(contrato.status, dto.para))
            throw new common_1.BadRequestException(`Transição ${contrato.status} → ${dto.para} não permitida.`);
        if (dto.para === 'VIGENTE') {
            if (!contrato.instrumentoExternoRegistrado)
                throw new common_1.BadRequestException('Formalização externa ainda não registrada.');
            if (!contrato.vigenciaInicio || !contrato.vigenciaFim)
                throw new common_1.BadRequestException('Vigência incompleta.');
            const vigencia = (0, contrato_datas_1.vigenciaPermiteAtivacao)(contrato.vigenciaInicio, contrato.vigenciaFim);
            if (!vigencia.ok)
                throw new common_1.BadRequestException(vigencia.motivo);
        }
        if (dto.para === 'CANCELADO' && contrato.instrumentoExternoRegistrado)
            throw new common_1.BadRequestException('Instrumento já registrado deve ser rescindido, não cancelado.');
        if (dto.para === 'RESCINDIDO' && contrato.status === 'AGUARDANDO_ASSINATURA' && !contrato.instrumentoExternoRegistrado) {
            throw new common_1.BadRequestException('Sem instrumento registrado, use o cancelamento.');
        }
        if ((dto.para === 'ENCERRADO' || dto.para === 'RESCINDIDO' || dto.para === 'SUSPENSO') && !dto.motivo?.trim()) {
            throw new common_1.BadRequestException('Informe o motivo da transição.');
        }
        const acao = dto.para === 'SUSPENSO' ? 'SUSPENDER' : dto.para === 'ENCERRADO' ? 'ENCERRAR' : dto.para === 'RESCINDIDO' ? 'RESCINDIR' : dto.para === 'CANCELADO' ? 'CANCELAR' : 'ATIVAR_VIGENCIA';
        return this.mudarEstado(contrato, dto.para, ctx, acao, dto.motivo);
    }
    async gerarMinuta(id, ctx) {
        this.exigir(ctx.user, 'DOCUMENTO_GRAVAR');
        const contrato = await this.obter(id, ctx.user);
        const bloqueio = (0, contrato_estado_1.motivoOperacaoBloqueada)(contrato.status, 'MINUTA');
        if (bloqueio)
            throw new common_1.BadRequestException(bloqueio);
        if (contrato.instrumentoExternoRegistrado)
            throw new common_1.BadRequestException('Não é possível gerar nova minuta após o instrumento externo.');
        const template = await this.templateMinuta(contrato.editalId);
        const valores = this.valoresMinuta(contrato);
        const preenchido = (0, minuta_contrato_1.preencherMinuta)(template.conteudo, valores);
        const versao = (contrato.documentos.filter((doc) => doc.tipo === 'MINUTA').length || 0) + 1;
        const base = path.resolve(process.cwd(), 'storage', 'contratos', id, `minuta-v${versao}-${Date.now()}`);
        const pdf = await (0, documento_renderer_1.renderPdf)(this.entradaDocumento(contrato, preenchido.texto, versao, ctx.user.sub), `${base}.pdf`);
        const docx = await (0, documento_renderer_1.renderDocx)(this.entradaDocumento(contrato, preenchido.texto, versao, ctx.user.sub), `${base}.docx`);
        const documentos = [];
        for (const arquivo of [pdf, docx]) {
            const buffer = await fs.promises.readFile(arquivo);
            documentos.push(await this.prisma.contratoDocumento.create({ data: {
                    contratoId: id, tipo: 'MINUTA', versao, titulo: `Minuta v${versao} ${path.extname(arquivo).slice(1).toUpperCase()}`,
                    arquivoPath: path.relative(process.cwd(), arquivo), arquivoNome: path.basename(arquivo),
                    mimeType: arquivo.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    tamanhoBytes: buffer.length, hashSha256: (0, crypto_1.createHash)('sha256').update(buffer).digest('hex'),
                    assinaturaDigital: false, geradoEm: new Date(), geradoPor: ctx.user.sub, createdBy: ctx.user.sub,
                    observacao: `Origem do modelo: ${template.origem}. Pendências: ${preenchido.pendentes.join(', ') || 'nenhuma'}.`,
                } }));
        }
        await this.auditar(ctx, 'GERAR_MINUTA', id, contrato.numero, null, { versao, origem: template.origem, pendentes: preenchido.pendentes, assinaturaDigital: false });
        return { origem: template.origem, pendentes: preenchido.pendentes, documentos: documentos.map((doc) => ({ id: doc.id, tipo: doc.tipo, versao: doc.versao, titulo: doc.titulo, hashSha256: doc.hashSha256, assinaturaDigital: false })) };
    }
    async listarDocumentos(id, user) {
        this.exigir(user, 'DOCUMENTO_LER');
        const contrato = await this.obter(id, user);
        return contrato.documentos.map((doc) => ({ ...doc, arquivoPath: undefined, assinaturaDigital: false }));
    }
    async anexar(id, arquivo, dto, ctx) {
        this.exigir(ctx.user, 'DOCUMENTO_GRAVAR');
        const contrato = await this.obter(id, ctx.user);
        if (contrato_estado_1.STATUS_TERMINAIS.includes(contrato.status))
            throw new common_1.BadRequestException('Contrato encerrado não recebe novos documentos.');
        if (dto.tipo === 'CONTRATO_ASSINADO' && !['EM_CONFERENCIA', 'AGUARDANDO_ASSINATURA'].includes(contrato.status)) {
            throw new common_1.BadRequestException('O contrato assinado só pode ser anexado durante a formalização.');
        }
        if (contrato.documentos.some((doc) => doc.tipo === dto.tipo && doc.formalizado && dto.tipo === 'CONTRATO_ASSINADO')) {
            throw new common_1.BadRequestException('Documento formalizado não pode ser substituído.');
        }
        const versao = contrato.documentos.filter((doc) => doc.tipo === dto.tipo).reduce((max, doc) => Math.max(max, doc.versao), 0) + 1;
        const nome = `${Date.now()}-${arquivo.originalname.replace(/[^\w.\-]+/g, '_')}`;
        const pasta = path.resolve(process.cwd(), 'storage', 'contratos', id);
        await fs.promises.mkdir(pasta, { recursive: true });
        const absoluto = path.join(pasta, nome);
        await fs.promises.writeFile(absoluto, arquivo.buffer);
        const documento = await this.prisma.contratoDocumento.create({ data: {
                contratoId: id, aditivoId: dto.aditivoId, tipo: dto.tipo, versao, titulo: dto.titulo || arquivo.originalname,
                arquivoPath: path.relative(process.cwd(), absoluto), arquivoNome: arquivo.originalname, mimeType: arquivo.mimetype,
                tamanhoBytes: arquivo.size, hashSha256: (0, crypto_1.createHash)('sha256').update(arquivo.buffer).digest('hex'),
                assinaturaDigital: false, origemAssinatura: dto.tipo === 'COMPLEMENTAR' ? null : 'EXTERNA_DOCUMENTAL',
                observacao: dto.observacao, createdBy: ctx.user.sub,
            } });
        await this.auditar(ctx, 'UPLOAD_DOCUMENTO', id, contrato.numero, null, { tipo: dto.tipo, versao, hashSha256: documento.hashSha256, assinaturaDigital: false });
        return { id: documento.id, tipo: documento.tipo, versao, hashSha256: documento.hashSha256, assinaturaDigital: false, origemAssinatura: documento.origemAssinatura };
    }
    async arquivo(id, documentoId, user) {
        this.exigir(user, 'DOCUMENTO_LER');
        const contrato = await this.obter(id, user);
        const documento = contrato.documentos.find((item) => item.id === documentoId);
        if (!documento?.arquivoPath)
            throw new common_1.NotFoundException('Documento não encontrado.');
        const absoluto = this.caminhoSeguro(documento.arquivoPath);
        if (!fs.existsSync(absoluto))
            throw new common_1.NotFoundException('Arquivo não encontrado no armazenamento.');
        const hash = (0, crypto_1.createHash)('sha256').update(await fs.promises.readFile(absoluto)).digest('hex');
        if (documento.hashSha256 && hash !== documento.hashSha256)
            throw new common_1.ConflictException('Integridade do anexo divergente. O download foi bloqueado.');
        return { caminho: absoluto, nome: documento.arquivoNome || path.basename(absoluto) };
    }
    async historico(id, user) {
        this.exigir(user, 'CONSULTAR');
        await this.obter(id, user);
        const logs = await this.prisma.auditLog.findMany({ where: { entity: 'Contrato', entityId: id }, orderBy: { createdAt: 'desc' }, take: 200 });
        return logs.map((item) => ({
            id: item.id, acao: item.action, criadoEm: item.createdAt, usuarioId: item.userId, papel: item.userRole,
            anterior: item.oldValues ? JSON.parse(item.oldValues) : null,
            posterior: item.newValues ? JSON.parse(item.newValues) : null,
            correlacaoId: item.metadata ? JSON.parse(item.metadata).correlacaoId : null,
        }));
    }
    async auditoria(id, user) {
        this.exigir(user, 'AUDITORIA');
        await this.obter(id, user);
        const logs = await this.prisma.auditLog.findMany({ where: { entity: 'Contrato', entityId: id }, orderBy: { createdAt: 'desc' }, take: 200 });
        return logs.map((item) => ({ ...item, userEmail: undefined, userName: undefined }));
    }
    async listarAditivos(id, user) {
        this.exigir(user, 'CONSULTAR');
        const contrato = await this.obter(id, user);
        return (0, contrato_presenter_1.apresentarContrato)(contrato).aditivos;
    }
    async criarAditivo(id, dto, ctx) {
        this.exigir(ctx.user, 'ADITIVO');
        const contrato = await this.obter(id, ctx.user);
        const bloqueio = (0, contrato_estado_1.motivoOperacaoBloqueada)(contrato.status, 'ADITIVO');
        if (bloqueio)
            throw new common_1.BadRequestException(bloqueio);
        if (!dto.justificativa.trim())
            throw new common_1.BadRequestException('Justificativa obrigatória.');
        if (dto.tipo === 'OUTRO')
            await this.exigirOutroAutorizado();
        if (dto.tipo === 'PRAZO' && !dto.vigenciaFim)
            throw new common_1.BadRequestException('Aditivo de prazo exige a nova data final.');
        if (dto.tipo === 'QUANTIDADE' && !dto.itens?.length)
            throw new common_1.BadRequestException('Aditivo de quantidade exige os itens.');
        const aberto = contrato.aditivos.find((item) => item.status !== 'FORMALIZADO' && item.status !== 'CANCELADO');
        if (aberto)
            throw new common_1.BadRequestException('Já existe aditivo não formalizado neste contrato.');
        const aditivo = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_contratos WHERE id = ${id} FOR UPDATE`;
            const ultimo = await tx.aditivoContrato.aggregate({ where: { contratoId: id }, _max: { numeroSequencial: true } });
            return tx.aditivoContrato.create({ data: {
                    contratoId: id, numeroSequencial: (ultimo._max.numeroSequencial || 0) + 1, tipo: dto.tipo, tipoOutro: dto.tipoOutro,
                    justificativa: dto.justificativa.trim(), data: dto.data ? (0, contrato_datas_1.dataInstitucional)(dto.data) : null,
                    vigenciaFim: dto.vigenciaFim ? (0, contrato_datas_1.dataInstitucional)(dto.vigenciaFim) : null,
                    valorAlteracao: dto.valorAlteracao || '0.00', status: 'RASCUNHO', responsavelId: ctx.user.sub, createdBy: ctx.user.sub,
                    itens: dto.itens?.length ? { create: dto.itens.map((item) => {
                            const atual = contrato.itens.find((origem) => origem.id === item.contratoItemId);
                            if (!atual)
                                throw new common_1.BadRequestException('Item contratual não pertence a este contrato.');
                            return {
                                contratoItemId: atual.id,
                                quantidadeAnterior: atual.quantidadeContratada,
                                quantidadeNova: item.quantidadeNova || atual.quantidadeContratada,
                                valorUnitarioAnterior: atual.valorUnitario,
                                valorUnitarioNovo: item.valorUnitarioNovo || atual.valorUnitario,
                                valorTotalAnterior: atual.valorTotal,
                                valorTotalNovo: atual.valorTotal,
                            };
                        }) } : undefined,
                }, include: { itens: true } });
        });
        await this.auditar(ctx, 'CRIAR_ADITIVO', id, contrato.numero, null, { aditivoId: aditivo.id, numero: aditivo.numeroSequencial, tipo: dto.tipo, aplicado: false });
        return aditivo;
    }
    async formalizarAditivo(id, aditivoId, ctx) {
        this.exigir(ctx.user, 'ADITIVO');
        const resultado = await this.idempotente(ctx.idempotencyKey, `FORMALIZAR_ADITIVO:${aditivoId}`, () => this.formalizarAditivoInterno(id, aditivoId, ctx.user));
        if (!resultado.reaproveitada)
            await this.auditar(ctx, 'FORMALIZAR_ADITIVO', id, resultado.resultado.numero || resultado.resultado.contrato?.numero, { valorAtualizado: resultado.resultado.valorAnterior }, { valorAtualizado: resultado.resultado.valorNovo, aditivoId });
        return resultado.resultado.contrato || resultado.resultado;
    }
    async gerarMinutaAditivo(id, aditivoId, ctx) {
        this.exigir(ctx.user, 'DOCUMENTO_GRAVAR');
        const contrato = await this.obter(id, ctx.user);
        const aditivo = contrato.aditivos.find((item) => item.id === aditivoId);
        if (!aditivo)
            throw new common_1.NotFoundException('Aditivo não encontrado.');
        const html = (0, minuta_contrato_1.conteudoAditivo)({
            numero: aditivo.numeroSequencial, contratoNumero: contrato.numero, exercicio: contrato.exercicio, tipo: aditivo.tipoOutro || aditivo.tipo,
            justificativa: aditivo.justificativa, valorAlteracao: (0, contrato_presenter_1.texto)(aditivo.valorAlteracao, 2) || '0.00',
            vigenciaFim: aditivo.vigenciaFim ? aditivo.vigenciaFim.toISOString().slice(0, 10) : null,
        });
        const base = path.resolve(process.cwd(), 'storage', 'contratos', id, `aditivo-${aditivo.numeroSequencial}-${Date.now()}`);
        const pdf = await (0, documento_renderer_1.renderPdf)(this.entradaDocumento(contrato, html, aditivo.numeroSequencial, ctx.user.sub), `${base}.pdf`);
        const buffer = await fs.promises.readFile(pdf);
        const documento = await this.prisma.contratoDocumento.create({ data: {
                contratoId: id, aditivoId, tipo: 'ADITIVO', versao: aditivo.numeroSequencial, titulo: `Minuta do aditivo ${aditivo.numeroSequencial}`,
                arquivoPath: path.relative(process.cwd(), pdf), arquivoNome: path.basename(pdf), mimeType: 'application/pdf',
                tamanhoBytes: buffer.length, hashSha256: (0, crypto_1.createHash)('sha256').update(buffer).digest('hex'), assinaturaDigital: false,
                geradoEm: new Date(), geradoPor: ctx.user.sub, createdBy: ctx.user.sub,
            } });
        await this.auditar(ctx, 'GERAR_MINUTA_ADITIVO', id, contrato.numero, null, { aditivoId, documentoId: documento.id, assinaturaDigital: false });
        return { id: documento.id, hashSha256: documento.hashSha256, assinaturaDigital: false };
    }
    async criar(dto, user) {
        return this.prisma.$transaction(async (tx) => {
            const proposta = await tx.proposta.findFirst({
                where: { id: dto.propostaId, deletedAt: null },
                include: { edital: { include: { municipio: true, escola: true, escolasVinculadas: true, documento: true } }, produtor: true, itens: { where: { deletedAt: null }, include: { match: true } } },
            });
            if (!proposta)
                throw new common_1.NotFoundException('Proposta não encontrada.');
            if (proposta.status !== 'FINALIZADA')
                throw new common_1.BadRequestException('Não há resultado homologado nem proposta finalizada equivalente.');
            if (['RASCUNHO', 'CANCELADO'].includes(proposta.edital.status))
                throw new common_1.BadRequestException('Edital não está em condição de contratação.');
            await this.garantirEditalNoEscopo(user, proposta.edital);
            const editalItens = await tx.editalItem.findMany({ where: { editalId: proposta.editalId, deletedAt: null } });
            const ids = editalItens.map((item) => item.id);
            if (ids.length)
                await tx.$queryRaw `SELECT id FROM pnae_edital_itens WHERE id IN (${client_1.Prisma.join(ids)}) FOR UPDATE`;
            const comprometidos = await this.compromissos(ids, tx);
            const origem = this.origensDosItens(proposta.itens, editalItens, comprometidos, proposta.id);
            const montado = (0, contrato_saldos_1.montarItensContrato)(origem, dto.itens);
            if (montado.bloqueios.length)
                throw new common_1.BadRequestException({ message: 'Contratação acima do saldo ou com dados indispensáveis ausentes.', erros: montado.bloqueios });
            const vinculo = await this.resolverVinculo(tx, user, proposta.edital, dto);
            const exercicio = dto.exercicio || proposta.edital.ano;
            const numero = dto.numero || await this.proximoNumero(tx, exercicio);
            const limite = await this.lerLimite(tx);
            if (limite.valor) {
                const ja = await this.somaFornecedor(tx, proposta.produtorId, exercicio);
                if (ja.add((0, contrato_decimal_1.dinheiro)(montado.valorTotal)).gt(limite.valor))
                    throw new common_1.BadRequestException('Valor excede o limite institucional configurado para o fornecedor no exercício.');
            }
            const contrato = await tx.contrato.create({ data: {
                    numero, exercicio, editalId: proposta.editalId, chamadaPublica: `${proposta.edital.numero}/${proposta.edital.ano}`,
                    propostaId: proposta.id, produtorId: proposta.produtorId, escolaId: vinculo.escolaId, dreId: vinculo.dreId, municipioId: vinculo.municipioId,
                    valorInicial: montado.valorTotal, valorAtualizado: montado.valorTotal, status: 'RASCUNHO',
                    objeto: dto.objeto || proposta.edital.objeto, observacoes: dto.observacoes,
                    condicoesFornecimento: dto.condicoesFornecimento || proposta.edital.documento?.regrasEntrega,
                    condicoesPagamento: dto.condicoesPagamento || proposta.edital.documento?.formaPagamento,
                    fiscalizacao: dto.fiscalizacao, vigenciaInicio: dto.vigenciaInicio ? (0, contrato_datas_1.dataInstitucional)(dto.vigenciaInicio) : null,
                    vigenciaFim: dto.vigenciaFim ? (0, contrato_datas_1.dataInstitucional)(dto.vigenciaFim) : null, createdBy: user.sub,
                    itens: { create: montado.itens.map((item) => ({ ...item, quantidadeAditivada: '0.0000', createdBy: user.sub })) },
                }, include: { itens: true } });
            return (0, contrato_presenter_1.apresentarContrato)(contrato);
        });
    }
    async formalizarInterno(id, dto, user) {
        const contrato = await this.obter(id, user);
        if (contrato.status !== 'AGUARDANDO_ASSINATURA')
            throw new common_1.BadRequestException('A formalização exige o estado aguardando assinatura.');
        const documento = contrato.documentos.find((item) => item.tipo === 'CONTRATO_ASSINADO' && (!dto.documentoId || item.id === dto.documentoId));
        if (!documento?.arquivoPath || !documento.hashSha256)
            throw new common_1.BadRequestException('Registre o documento assinado externamente antes de formalizar.');
        const absoluto = this.caminhoSeguro(documento.arquivoPath);
        if (!fs.existsSync(absoluto))
            throw new common_1.BadRequestException('Arquivo assinado não encontrado.');
        const hash = (0, crypto_1.createHash)('sha256').update(await fs.promises.readFile(absoluto)).digest('hex');
        if (hash !== documento.hashSha256)
            throw new common_1.ConflictException('Integridade do anexo divergente.');
        const pendencias = await this.pendencias(contrato, { documentoAssinado: true, hashConferido: true, dataFormalizacao: dto.dataFormalizacao });
        const erros = (0, contrato_validacao_1.bloqueia)(pendencias, 'formalizacao').filter((item) => !item.includes('vigência ainda não iniciou'));
        const vigencia = contrato.vigenciaInicio && contrato.vigenciaFim ? (0, contrato_datas_1.vigenciaPermiteAtivacao)(contrato.vigenciaInicio, contrato.vigenciaFim) : { ok: false, motivo: 'Vigência incompleta.' };
        if (erros.length)
            throw new common_1.BadRequestException({ message: 'Formalização bloqueada.', erros });
        const para = vigencia.ok ? 'VIGENTE' : contrato.status;
        const dataAto = (0, contrato_datas_1.dataInstitucional)(dto.dataFormalizacao);
        await this.prisma.$transaction(async (tx) => {
            const alterado = await tx.contrato.updateMany({
                where: { id, status: 'AGUARDANDO_ASSINATURA', versao: contrato.versao, deletedAt: null },
                data: {
                    status: para, versao: { increment: 1 }, instrumentoExternoRegistrado: true, instrumentoRegistradoEm: new Date(),
                    dataAssinatura: dataAto, updatedBy: user.sub,
                },
            });
            if (alterado.count !== 1)
                throw new common_1.ConflictException('Contrato alterado por outra operação. Recarregue.');
            await tx.contratoDocumento.update({ where: { id: documento.id }, data: { formalizado: true } });
            await tx.contratoSignatario.updateMany({ where: { contratoId: id }, data: { documentoRegistradoEm: dataAto, documentoId: documento.id } });
        });
        return { contrato: await this.findOne(id, user), anterior: contrato.status };
    }
    async formalizarAditivoInterno(id, aditivoId, user) {
        const contrato = await this.obter(id, user);
        const aditivo = contrato.aditivos.find((item) => item.id === aditivoId);
        if (!aditivo || aditivo.status === 'FORMALIZADO')
            throw new common_1.NotFoundException('Aditivo não formalizável.');
        if (contrato.status !== 'VIGENTE')
            throw new common_1.BadRequestException('Somente contrato vigente recebe aditivo formalizado.');
        const documento = contrato.documentos.find((item) => item.aditivoId === aditivoId && item.tipo === 'ADITIVO' && item.hashSha256);
        if (!documento?.arquivoPath)
            throw new common_1.BadRequestException('Anexe o instrumento externo do aditivo antes de formalizar. A minuta gerada não formaliza o aditivo.');
        const hash = (0, crypto_1.createHash)('sha256').update(await fs.promises.readFile(this.caminhoSeguro(documento.arquivoPath))).digest('hex');
        if (hash !== documento.hashSha256)
            throw new common_1.ConflictException('Integridade do aditivo divergente.');
        const valorAnterior = (0, contrato_presenter_1.texto)(contrato.valorAtualizado, 2);
        await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_contratos WHERE id = ${id} FOR UPDATE`;
            const atual = await tx.contrato.findFirst({ where: { id, status: 'VIGENTE', deletedAt: null }, include: { itens: true, aditivos: true } });
            if (!atual)
                throw new common_1.ConflictException('Contrato não está vigente.');
            const ids = atual.itens.map((item) => item.editalItemId).filter((item) => Boolean(item));
            if (ids.length)
                await tx.$queryRaw `SELECT id FROM pnae_edital_itens WHERE id IN (${client_1.Prisma.join(ids)}) FOR UPDATE`;
            let delta = new client_1.Prisma.Decimal(0);
            if (aditivo.tipo === 'QUANTIDADE' || aditivo.tipo === 'VALOR' || aditivo.tipo === 'RETIFICACAO') {
                for (const efeito of aditivo.itens) {
                    const item = atual.itens.find((origem) => origem.id === efeito.contratoItemId);
                    if (item) {
                        await tx.$queryRaw `SELECT id FROM pnae_contrato_itens WHERE id = ${item.id} FOR UPDATE`;
                        const aceito = await tx.entregaItem.aggregate({ where: { programacaoItem: { contratoItemId: item.id }, entrega: { status: 'ACEITA' } }, _sum: { quantidadeAceita: true } });
                        const reservado = await tx.programacaoEntregaItem.aggregate({ where: { contratoItemId: item.id, programacao: { deletedAt: null, status: { in: ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'] } } }, _sum: { quantidadeReservada: true } });
                        const aceitoQtd = aceito._sum.quantidadeAceita || new client_1.Prisma.Decimal(0);
                        const reservadoQtd = reservado._sum.quantidadeReservada || new client_1.Prisma.Decimal(0);
                        if ((0, contrato_decimal_1.quantidadeDecimal)(efeito.quantidadeNova).lt(aceitoQtd.add(reservadoQtd)))
                            throw new common_1.BadRequestException('Aditivo reduz quantidade abaixo do total aceito e reservado.');
                    }
                    if (!item?.editalItemId)
                        throw new common_1.BadRequestException('Item do aditivo sem vínculo de edital.');
                    const editalItem = await tx.editalItem.findUnique({ where: { id: item.editalItemId } });
                    const comprometido = await this.compromissos([item.editalItemId], tx, id);
                    const vigente = (0, contrato_decimal_1.quantidadeDecimal)(item.quantidadeContratada).add((0, contrato_decimal_1.quantidadeDecimal)(item.quantidadeAditivada));
                    const saldo = (0, contrato_decimal_1.quantidadeDecimal)(editalItem?.quantidade || 0).sub((0, contrato_decimal_1.quantidadeDecimal)(comprometido.get(item.editalItemId)?.quantidade || 0)).add(vigente);
                    const calculo = (0, contrato_saldos_1.efeitoAditivoQuantidade)({
                        quantidadeAtual: (0, contrato_presenter_1.texto)(vigente, 4) || '0.0000',
                        quantidadeNova: (0, contrato_presenter_1.texto)(efeito.quantidadeNova, 4) || '0.0000',
                        valorUnitario: (0, contrato_presenter_1.texto)(efeito.valorUnitarioNovo, 4) || '0.0000',
                        saldoEdital: (0, contrato_presenter_1.texto)(saldo, 4) || '0.0000',
                    });
                    if (!calculo.ok)
                        throw new common_1.BadRequestException(calculo.motivo);
                    const totalNovo = (0, contrato_decimal_1.dinheiro)(calculo.valorTotalNovo);
                    delta = delta.add(totalNovo.sub((0, contrato_decimal_1.dinheiro)(item.valorTotal)));
                    await tx.aditivoItem.update({ where: { id: efeito.id }, data: { valorTotalNovo: totalNovo } });
                    await tx.contratoItem.update({ where: { id: item.id }, data: {
                            quantidadeAditivada: (0, contrato_decimal_1.quantidadeDecimal)(efeito.quantidadeNova).sub((0, contrato_decimal_1.quantidadeDecimal)(item.quantidadeContratada)),
                            quantidadeDisponivel: (0, contrato_decimal_1.quantidadeDecimal)(efeito.quantidadeNova).sub((await tx.entregaItem.aggregate({ where: { programacaoItem: { contratoItemId: item.id }, entrega: { status: 'ACEITA' } }, _sum: { quantidadeAceita: true } }))._sum.quantidadeAceita || new client_1.Prisma.Decimal(0)),
                            valorUnitario: efeito.valorUnitarioNovo,
                            valorTotal: totalNovo,
                            updatedBy: user.sub,
                        } });
                }
            }
            if (aditivo.tipo === 'VALOR' && !aditivo.itens.length)
                delta = (0, contrato_decimal_1.dinheiro)(aditivo.valorAlteracao);
            if (aditivo.tipo === 'PRAZO' && aditivo.vigenciaFim && atual.vigenciaInicio && aditivo.vigenciaFim < atual.vigenciaInicio) {
                throw new common_1.BadRequestException('Nova vigência é anterior ao início do contrato.');
            }
            await this.aplicarTetoAditivo(tx, atual.valorInicial, delta);
            const formalizados = atual.aditivos.filter((item) => item.status === 'FORMALIZADO').map((item) => item.valorAlteracao);
            const valorNovo = (0, contrato_saldos_1.consolidarValor)(atual.valorInicial, [...formalizados, delta]);
            await tx.aditivoContrato.update({ where: { id: aditivoId }, data: { status: 'FORMALIZADO', formalizadoEm: new Date(), valorAlteracao: delta, updatedBy: user.sub } });
            await tx.contratoDocumento.update({ where: { id: documento.id }, data: { formalizado: true } });
            await tx.contrato.update({ where: { id }, data: {
                    valorAtualizado: valorNovo, vigenciaFim: aditivo.tipo === 'PRAZO' && aditivo.vigenciaFim ? aditivo.vigenciaFim : undefined,
                    versao: { increment: 1 }, updatedBy: user.sub,
                } });
        });
        return { contrato: await this.findOne(id, user), numero: contrato.numero, valorAnterior, valorNovo: (await this.obter(id, user)).valorAtualizado.toString() };
    }
    async atualizarQuantidades(id, itens, user) {
        await this.prisma.$transaction(async (tx) => {
            const contrato = await tx.contrato.findFirst({ where: { id, status: 'RASCUNHO', deletedAt: null }, include: { itens: true, proposta: { include: { itens: { include: { match: true } } } } } });
            if (!contrato)
                throw new common_1.ConflictException('Rascunho não encontrado para atualizar itens.');
            const editalItens = await tx.editalItem.findMany({ where: { editalId: contrato.editalId, deletedAt: null } });
            const ids = editalItens.map((item) => item.id);
            if (ids.length)
                await tx.$queryRaw `SELECT id FROM pnae_edital_itens WHERE id IN (${client_1.Prisma.join(ids)}) FOR UPDATE`;
            const comprometidos = await this.compromissos(ids, tx, id);
            const montado = (0, contrato_saldos_1.montarItensContrato)(this.origensDosItens(contrato.proposta.itens, editalItens, comprometidos, contrato.propostaId), itens);
            if (montado.bloqueios.length)
                throw new common_1.BadRequestException({ message: 'Quantidade inválida.', erros: montado.bloqueios });
            for (const item of montado.itens) {
                await tx.contratoItem.updateMany({ where: { contratoId: id, propostaItemId: item.propostaItemId }, data: {
                        quantidadeContratada: item.quantidadeContratada, valorTotal: item.valorTotal, quantidadeDisponivel: item.quantidadeDisponivel, updatedBy: user.sub,
                    } });
            }
            await tx.contrato.update({ where: { id }, data: { valorInicial: montado.valorTotal, valorAtualizado: montado.valorTotal, updatedBy: user.sub } });
        });
    }
    async mudarEstado(contrato, para, ctx, acao, motivo) {
        const alterado = await this.prisma.contrato.updateMany({
            where: { id: contrato.id, status: contrato.status, versao: contrato.versao, deletedAt: null },
            data: { status: para, versao: { increment: 1 }, updatedBy: ctx.user.sub },
        });
        if (alterado.count !== 1)
            throw new common_1.ConflictException('Contrato alterado por outra operação. Recarregue.');
        await this.auditar(ctx, acao, contrato.id, contrato.numero, { status: contrato.status }, { status: para, motivo: motivo || null });
        return this.findOne(contrato.id, ctx.user);
    }
    async pendencias(contrato, extra = {}) {
        const vigencia = contrato.vigenciaInicio && contrato.vigenciaFim ? (0, contrato_datas_1.vigenciaPermiteAtivacao)(contrato.vigenciaInicio, contrato.vigenciaFim) : undefined;
        const limite = await this.lerLimite();
        let excedido = false;
        if (limite.valor) {
            const soma = await this.somaFornecedor(this.prisma, contrato.produtorId, contrato.exercicio);
            excedido = soma.gt(limite.valor);
        }
        return (0, contrato_validacao_1.validarContrato)({
            objeto: contrato.objeto, escolaId: contrato.escolaId, dreId: contrato.dreId, municipioId: contrato.municipioId,
            vigenciaInicio: contrato.vigenciaInicio, vigenciaFim: contrato.vigenciaFim, quantidadeItens: contrato.itens.length,
            documentoAssinado: extra.documentoAssinado ?? contrato.documentos.some((doc) => doc.tipo === 'CONTRATO_ASSINADO'),
            hashConferido: extra.hashConferido,
            signatarioContratante: contrato.signatarios.some((item) => item.papel === 'CONTRATANTE'),
            signatarioContratado: contrato.signatarios.some((item) => item.papel === 'CONTRATADO'),
            dataFormalizacao: extra.dataFormalizacao || (contrato.dataAssinatura ? 'informada' : null),
            vigenciaOk: vigencia?.ok,
            motivoVigencia: vigencia?.motivo,
            limite: { configurado: Boolean(limite.valor), excedido, mensagem: limite.valor ? 'Limite institucional configurado.' : 'Regra de limite individual não configurada; verificação legal não aplicada.' },
        });
    }
    async compromissos(ids, tx = this.prisma, ignorarContratoId) {
        const mapa = new Map();
        if (!ids.length)
            return mapa;
        const itens = await tx.contratoItem.findMany({
            where: { deletedAt: null, editalItemId: { in: ids }, contrato: { deletedAt: null, status: { in: [...contrato_estado_1.STATUS_COMPROMETEM_SALDO] }, ...(ignorarContratoId ? { id: { not: ignorarContratoId } } : {}) } },
            select: { editalItemId: true, propostaItemId: true, quantidadeContratada: true, quantidadeAditivada: true, valorTotal: true },
        });
        for (const item of itens) {
            if (!item.editalItemId)
                continue;
            const atual = mapa.get(item.editalItemId) || { quantidade: new client_1.Prisma.Decimal(0), valor: new client_1.Prisma.Decimal(0), propostas: new Map() };
            const qtd = (0, contrato_decimal_1.quantidadeDecimal)(item.quantidadeContratada).add((0, contrato_decimal_1.quantidadeDecimal)(item.quantidadeAditivada));
            atual.quantidade = atual.quantidade.add(qtd);
            atual.valor = atual.valor.add((0, contrato_decimal_1.dinheiro)(item.valorTotal));
            atual.propostas.set(item.propostaItemId, (atual.propostas.get(item.propostaItemId) || new client_1.Prisma.Decimal(0)).add(qtd));
            mapa.set(item.editalItemId, atual);
        }
        return mapa;
    }
    origensDosItens(itens, editalItens, comprometidos, _propostaId) {
        return itens.map((item) => {
            const editalItemId = item.match?.editalItemId || null;
            const editalItem = editalItens.find((origem) => origem.id === editalItemId);
            const saldo = editalItemId ? comprometidos.get(editalItemId) : undefined;
            return {
                propostaItemId: item.id, editalItemId, produto: item.produto, descricao: item.especificacao, unidade: item.unidade,
                quantidadeProposta: (0, contrato_presenter_1.texto)(item.quantidade, 4), valorUnitario: (0, contrato_presenter_1.texto)(item.precoUnitario, 4),
                quantidadeEdital: (0, contrato_presenter_1.texto)(editalItem?.quantidade, 4), valorEdital: (0, contrato_presenter_1.texto)(editalItem?.valorTotal, 2),
                quantidadeComprometidaEdital: (0, contrato_presenter_1.texto)(saldo?.quantidade || 0, 4), valorComprometidoEdital: (0, contrato_presenter_1.texto)(saldo?.valor || 0, 2),
                quantidadeComprometidaProposta: (0, contrato_presenter_1.texto)(saldo?.propostas.get(item.id) || 0, 4),
            };
        });
    }
    escolasDoEdital(edital) {
        const mapa = new Map();
        if (edital.escola)
            mapa.set(edital.escola.id, edital.escola);
        for (const vinculo of edital.escolasVinculadas || [])
            mapa.set(vinculo.escola.id, vinculo.escola);
        return [...mapa.values()];
    }
    async resolverVinculo(tx, user, edital, dto) {
        const escolas = this.escolasDoEdital(edital);
        const escolaId = dto.escolaId || (escolas.length === 1 ? escolas[0].id : null);
        if (dto.escolaId && escolas.length && !escolas.some((item) => item.id === dto.escolaId))
            throw new common_1.BadRequestException('Unidade contratante não vinculada ao edital.');
        if (escolaId && user.role === 'DRE')
            await this.policy.requireEscolaAccess(user, escolaId);
        const vinculos = escolaId ? await tx.vinculoEscolaDRE.findMany({ where: { escolaId, ativo: true, vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }] } }) : [];
        let dreId = dto.dreId || (vinculos.length === 1 ? vinculos[0].dreId : null);
        if (user.role === 'DRE') {
            const autorizadas = await this.policy.getAuthorizedDREIds(user);
            if (!dto.dreId && autorizadas.length === 1)
                dreId = autorizadas[0];
            if (!dreId || !autorizadas.includes(dreId))
                throw new common_1.ForbiddenException('DRE fora do seu escopo.');
            if (escolaId && vinculos.length && !vinculos.some((item) => item.dreId === dreId))
                throw new common_1.ForbiddenException('A unidade não possui vínculo vigente com a DRE informada.');
        }
        const escola = escolaId ? await tx.escola.findFirst({ where: { id: escolaId, deletedAt: null } }) : null;
        let municipioId = dto.municipioId || null;
        if (!municipioId && escola?.municipioId && (!edital.municipioId || edital.municipioId === escola.municipioId))
            municipioId = escola.municipioId;
        if (!municipioId && edital.municipioId && !escola)
            municipioId = edital.municipioId;
        return { escolaId, dreId, municipioId };
    }
    async garantirEditalNoEscopo(user, edital) {
        if (user.role === 'ADMIN')
            return;
        if (user.role !== 'DRE')
            throw new common_1.ForbiddenException('Perfil sem permissão para originar contrato.');
        const escolas = [edital.escolaId, ...(edital.escolasVinculadas || []).map((item) => item.escolaId)].filter((item) => Boolean(item));
        if (!escolas.length)
            return;
        const autorizadas = await this.policy.getAuthorizedEscolaIds(user);
        if (!escolas.some((id) => autorizadas.includes(id)))
            throw new common_1.ForbiddenException('Edital fora do escopo da DRE.');
    }
    async proximoNumero(tx, exercicio) {
        const total = await tx.contrato.count({ where: { exercicio } });
        return `CT-${exercicio}-${String(total + 1).padStart(4, '0')}`;
    }
    async somaFornecedor(tx, produtorId, exercicio) {
        const soma = await tx.contrato.aggregate({
            where: { produtorId, exercicio, deletedAt: null, status: { in: [...contrato_estado_1.STATUS_COMPROMETEM_SALDO] } },
            _sum: { valorAtualizado: true },
        });
        return (0, contrato_decimal_1.dinheiro)(soma._sum.valorAtualizado || 0);
    }
    async lerLimite(tx = this.prisma) {
        const config = await tx.systemConfig.findUnique({ where: { chave: 'contrato.limite.fornecedor.anual' } });
        if (!config?.valor?.trim())
            return { valor: null, invalido: false };
        try {
            return { valor: (0, contrato_decimal_1.dinheiro)(config.valor), invalido: false };
        }
        catch {
            return { valor: null, invalido: true };
        }
    }
    async exigirOutroAutorizado() {
        const config = await this.prisma.systemConfig.findUnique({ where: { chave: 'contrato.aditivo.tipo.outro.autorizado' } });
        if (config?.valor !== 'true')
            throw new common_1.BadRequestException('Tipo OUTRO não está autorizado na configuração institucional.');
    }
    async aplicarTetoAditivo(tx, valorInicial, delta) {
        const config = await tx.systemConfig.findUnique({ where: { chave: 'contrato.aditivo.limite.percentual' } });
        if (!config?.valor?.trim())
            return;
        const limite = (0, contrato_decimal_1.dinheiro)(config.valor);
        const percentual = valorInicial.eq(0) ? new client_1.Prisma.Decimal(0) : delta.abs().div(valorInicial).mul(100);
        if (percentual.gt(limite))
            throw new common_1.BadRequestException('Alteração excede o percentual máximo configurado para aditivos.');
    }
    async templateMinuta(editalId) {
        const anexo = await this.prisma.editalAnexo.findFirst({
            where: { tipo: 'ANEXO_VII', incluido: true, documento: { editalId } },
            include: { template: true, templateVersao: true },
        });
        const institucional = await this.prisma.templateDocumento.findFirst({ where: { tipo: 'ANEXO_VII', ativo: true, deletedAt: null }, orderBy: { updatedAt: 'desc' } });
        return (0, minuta_contrato_1.selecionarTemplateMinuta)({
            anexoEdital: anexo?.conteudoManual || anexo?.templateVersao?.conteudo || anexo?.template?.conteudo,
            templateInstitucional: institucional?.conteudo,
        });
    }
    valoresMinuta(contrato) {
        const valores = {};
        const colocar = (chave, valor) => { if (valor?.trim())
            valores[chave] = valor.trim(); };
        colocar('contrato.numero', contrato.numero);
        colocar('edital.numero', contrato.edital?.numero);
        colocar('edital.ano', contrato.edital?.ano ? String(contrato.edital.ano) : null);
        colocar('edital.objeto', contrato.objeto);
        colocar('edital.processoAdministrativo', contrato.edital?.documento?.processoAdministrativo);
        colocar('edital.municipio.nome', contrato.municipio?.nome || contrato.edital?.municipio?.nome);
        colocar('edital.municipio.uf', contrato.municipio?.uf || contrato.edital?.municipio?.uf);
        colocar('produtor.nome', contrato.produtor?.nome);
        colocar('produtor.cpfCnpj', contrato.produtor?.cpfCnpj);
        colocar('produtor.endereco', contrato.produtor?.endereco);
        colocar('produtor.telefone', contrato.produtor?.telefone);
        colocar('projeto.valorTotal', (0, contrato_presenter_1.texto)(contrato.valorAtualizado, 2));
        colocar('entidade.nome', contrato.escola?.nome || contrato.dre?.nome);
        if (contrato.vigenciaInicio && contrato.vigenciaFim)
            colocar('edital.prazoVigencia', `${contrato.vigenciaInicio.toISOString().slice(0, 10)} a ${contrato.vigenciaFim.toISOString().slice(0, 10)}`);
        colocar('edital.regrasEntrega', contrato.condicoesFornecimento);
        colocar('edital.formaPagamento', contrato.condicoesPagamento);
        return valores;
    }
    entradaDocumento(contrato, conteudo, versao, usuario) {
        return {
            numero: contrato.edital?.numero || contrato.chamadaPublica || contrato.numero,
            ano: contrato.edital?.ano || contrato.exercicio,
            titulo: `Minuta contratual ${contrato.numero} — não assinada`,
            versao, usuario, geradoEm: new Date().toISOString(), valores: this.valoresMinuta(contrato),
            secoes: [{ titulo: 'Minuta de contrato', tipo: 'ANEXO_VII', ordem: 1, conteudo }],
            itens: (0, minuta_contrato_1.tabelaItensMinuta)(contrato.itens.map((item) => ({
                produto: item.produto, descricao: item.descricao, unidade: item.unidade, quantidade: (0, contrato_presenter_1.texto)(item.quantidadeContratada, 4) || '',
                valorUnitario: (0, contrato_presenter_1.texto)(item.valorUnitario, 4) || '', valorTotal: (0, contrato_presenter_1.texto)(item.valorTotal, 2) || '',
            }))),
            escolas: contrato.escola?.nome ? [contrato.escola.nome] : [],
            fornecedores: contrato.produtor?.nome ? [contrato.produtor.nome] : [],
        };
    }
    async idempotente(chave, operacao, fn) {
        if (chave) {
            const existente = await this.prisma.idempotenciaOperacao.findUnique({ where: { chave } });
            if (existente?.resposta)
                return { resultado: JSON.parse(existente.resposta), reaproveitada: true };
        }
        try {
            const resultado = await fn();
            if (chave) {
                const recursoId = resultado.id || resultado.contrato?.id || resultado.contrato?.numero;
                await this.prisma.idempotenciaOperacao.create({ data: { chave, operacao, recursoId: String(recursoId || ''), resposta: JSON.stringify((0, contrato_presenter_1.serializar)(resultado)) } });
            }
            return { resultado, reaproveitada: false };
        }
        catch (erro) {
            if (chave && erro.code === 'P2002') {
                const existente = await this.prisma.idempotenciaOperacao.findUnique({ where: { chave } });
                if (existente?.resposta)
                    return { resultado: JSON.parse(existente.resposta), reaproveitada: true };
            }
            throw erro;
        }
    }
    async obter(id, user) {
        const contrato = await this.prisma.contrato.findFirst({
            where: { id, deletedAt: null, ...(await this.escopo(user)) },
            include: {
                edital: { include: { municipio: true, documento: true } },
                proposta: { select: { id: true, numero: true, tipoDocumento: true, status: true } },
                produtor: { select: { id: true, nome: true, cpfCnpj: true, endereco: true, telefone: true } },
                escola: { select: { id: true, nome: true } },
                dre: { select: { id: true, nome: true, codigo: true } },
                municipio: true,
                itens: { where: { deletedAt: null } },
                aditivos: { where: { deletedAt: null }, include: { itens: true }, orderBy: { numeroSequencial: 'asc' } },
                documentos: { orderBy: { createdAt: 'desc' } },
                signatarios: true,
            },
        });
        if (!contrato)
            throw new common_1.NotFoundException('Contrato não encontrado.');
        return contrato;
    }
    async escopo(user) {
        if (user.role === 'ADMIN')
            return {};
        if (user.role === 'DRE')
            return (0, contrato_escopo_1.filtroEscopo)('DRE', { dres: await this.policy.getAuthorizedDREIds(user), escolas: [], produtores: [] });
        if (user.role === 'ESCOLA')
            return (0, contrato_escopo_1.filtroEscopo)('ESCOLA', { dres: [], escolas: await this.policy.getAuthorizedEscolaIds(user), produtores: [] });
        if (user.role === 'PRODUTOR' || user.role === 'REPRESENTANTE' || user.role === 'EXTENSIONISTA') {
            return (0, contrato_escopo_1.filtroEscopo)(user.role, { dres: [], escolas: [], produtores: await this.policy.getAuthorizedProdutorIds(user) });
        }
        return { id: { in: [] } };
    }
    exigir(user, acao) {
        if (!(0, contrato_escopo_1.podeOperar)(user.role, acao))
            throw new common_1.ForbiddenException('Operação não autorizada para este perfil.');
    }
    caminhoSeguro(relativo) {
        const base = path.resolve(process.cwd(), 'storage', 'contratos');
        const absoluto = path.resolve(process.cwd(), relativo);
        if (!absoluto.startsWith(base))
            throw new common_1.BadRequestException('Caminho de documento inválido.');
        return absoluto;
    }
    async auditar(ctx, acao, id, numero, anterior, posterior) {
        await this.audit.log({
            userId: ctx.user.sub, userRole: ctx.user.role, action: acao, entity: 'Contrato', entityId: id, entityLabel: numero,
            oldValues: anterior, newValues: posterior,
            metadata: { correlacaoId: ctx.correlacaoId || (0, crypto_1.randomUUID)(), executorId: ctx.user.sub },
        });
    }
};
exports.ContratosService = ContratosService;
exports.ContratosService = ContratosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        policy_service_1.PolicyService,
        audit_service_1.AuditService])
], ContratosService);
//# sourceMappingURL=contratos.service.js.map