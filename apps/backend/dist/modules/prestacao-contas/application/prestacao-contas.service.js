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
exports.PrestacaoContasService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pdfkit_1 = __importDefault(require("pdfkit"));
const XLSX = __importStar(require("xlsx"));
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const policy_service_1 = require("../../../common/auth/policy.service");
const audit_service_1 = require("../../audit/application/services/audit.service");
const dinheiro = (value) => new client_1.Prisma.Decimal(value ?? 0).toFixed(2);
const data = (value, campo = 'data') => {
    if (!value)
        return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        throw new common_1.BadRequestException(`${campo} invalida.`);
    return parsed;
};
let PrestacaoContasService = class PrestacaoContasService {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async contratosWhere(filters, user) {
        const where = {
            deletedAt: null,
            ...(user ? {} : { status: { in: ['VIGENTE', 'SUSPENSO', 'ENCERRADO'] }, edital: { status: 'ATIVO' } }),
            ...(filters.exercicio ? { exercicio: filters.exercicio } : {}),
            ...(filters.municipioId ? { municipioId: filters.municipioId } : {}),
            ...(filters.dreId ? { dreId: filters.dreId } : {}),
            ...(filters.escolaId ? { escolaId: filters.escolaId } : {}),
            ...(filters.editalId ? { editalId: filters.editalId } : {}),
            ...(filters.contratoId ? { id: filters.contratoId } : {}),
            ...(filters.fornecedorId ? { produtorId: filters.fornecedorId } : {}),
        };
        if (!user || user.role === 'ADMIN')
            return where;
        if (user.role === 'DRE')
            where.dreId = { in: await this.policy.getAuthorizedDREIds(user) };
        else if (user.role === 'ESCOLA')
            where.escolaId = { in: await this.policy.getAuthorizedEscolaIds(user) };
        else
            where.produtorId = { in: await this.policy.getAuthorizedProdutorIds(user) };
        return where;
    }
    async linhas(filters, user) {
        const periodoInicio = data(filters.periodoInicio, 'periodoInicio');
        const periodoFim = data(filters.periodoFim, 'periodoFim');
        if (periodoInicio && periodoFim && periodoFim < periodoInicio)
            throw new common_1.BadRequestException('periodoFim deve ser posterior ao periodoInicio.');
        const intervalo = (field) => periodoInicio || periodoFim ? { [field]: { ...(periodoInicio ? { gte: periodoInicio } : {}), ...(periodoFim ? { lte: periodoFim } : {}) } } : {};
        const contratos = await this.prisma.contrato.findMany({
            where: await this.contratosWhere(filters, user),
            include: {
                municipio: { select: { nome: true } }, dre: { select: { nome: true } }, escola: { select: { nome: true } },
                edital: { select: { numero: true } }, produtor: { select: { nome: true } },
                itens: { where: { deletedAt: null }, select: { id: true, valorUnitario: true } },
            }, orderBy: [{ exercicio: 'desc' }, { numero: 'asc' }],
        });
        if (!contratos.length)
            return [];
        const ids = contratos.map((c) => c.id);
        const [entregas, notas, atestos, liquidacoes, pagamentos, docs, divergencias] = await Promise.all([
            this.prisma.entregaItem.findMany({ where: { deletedAt: null, entrega: { ...intervalo('dataEntrega'), programacao: { contratoId: { in: ids } }, status: 'ACEITA', deletedAt: null } }, select: { quantidadeAceita: true, programacaoItem: { select: { valorUnitarioContratual: true, contratoItem: { select: { contratoId: true } } } } } }),
            this.prisma.notaFiscal.findMany({ where: { ...intervalo('dataEmissao'), contratoId: { in: ids }, deletedAt: null, status: { not: 'CANCELADA' } }, select: { contratoId: true, valorTotal: true, documentos: { select: { id: true } } } }),
            this.prisma.atesto.findMany({ where: { ...intervalo('dataAtesto'), contratoId: { in: ids }, status: { in: ['ATESTADO', 'RETIFICADO'] } }, select: { contratoId: true, valorAtestado: true, hashSha256: true } }),
            this.prisma.liquidacao.findMany({ where: { ...intervalo('dataLiquidacao'), contratoId: { in: ids }, status: { not: 'CANCELADA' } }, select: { contratoId: true, valorLiquidado: true, hashSha256: true } }),
            this.prisma.pagamento.findMany({ where: { ...intervalo('dataPagamento'), contratoId: { in: ids }, status: { in: ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'] } }, select: { contratoId: true, valorPago: true, comprovantePath: true } }),
            this.prisma.contratoDocumento.findMany({ where: { contratoId: { in: ids } }, select: { contratoId: true, id: true } }),
            this.prisma.divergenciaFiscal.findMany({ where: { notaFiscal: { contratoId: { in: ids } }, status: { in: ['ABERTA', 'EM_ANALISE'] } }, select: { notaFiscal: { select: { contratoId: true } } } }),
        ]);
        const soma = (rows, field, id) => rows.filter((r) => r.contratoId === id).reduce((a, r) => a.add(r[field] ?? 0), new client_1.Prisma.Decimal(0));
        return contratos.map((c) => {
            const recebido = entregas.filter((e) => e.programacaoItem.contratoItem.contratoId === c.id).reduce((a, e) => a.add(e.quantidadeAceita.mul(e.programacaoItem.valorUnitarioContratual)), new client_1.Prisma.Decimal(0));
            const nf = notas.filter((n) => n.contratoId === c.id);
            const faturado = nf.reduce((a, n) => a.add(n.valorTotal), new client_1.Prisma.Decimal(0));
            const pendencias = nf.filter((n) => n.documentos.length === 0).length
                + atestos.filter((a) => a.contratoId === c.id && !a.hashSha256).length
                + liquidacoes.filter((l) => l.contratoId === c.id && !l.hashSha256).length
                + pagamentos.filter((p) => p.contratoId === c.id && !p.comprovantePath).length;
            const pago = soma(pagamentos, 'valorPago', c.id);
            const contratado = new client_1.Prisma.Decimal(c.valorAtualizado);
            const liquidado = soma(liquidacoes, 'valorLiquidado', c.id);
            const financeiro = pago.eq(0) ? 'PENDENTE' : pago.lt(liquidado) ? 'PARCIAL' : 'PAGO';
            return {
                contratoId: c.id, numero: c.numero, exercicio: c.exercicio, municipio: c.municipio?.nome ?? null, dre: c.dre?.nome ?? null,
                escola: c.escola?.nome ?? null, edital: c.edital?.numero ?? null, fornecedor: c.produtor.nome,
                contratado: dinheiro(contratado), recebido: dinheiro(recebido), faturado: dinheiro(faturado),
                atestado: dinheiro(soma(atestos, 'valorAtestado', c.id)), liquidado: dinheiro(liquidado), pago: dinheiro(pago),
                saldoContratual: dinheiro(contratado.sub(recebido)), pendenciasDocumentais: pendencias,
                divergencias: divergencias.filter((d) => d.notaFiscal.contratoId === c.id).length,
                statusDocumental: pendencias ? 'PENDENTE' : 'REGULAR', statusFinanceiro: financeiro,
            };
        }).filter((l) => (!filters.statusDocumental || l.statusDocumental === filters.statusDocumental) && (!filters.statusFinanceiro || l.statusFinanceiro === filters.statusFinanceiro));
    }
    async demonstrativo(filters, user) {
        const linhas = await this.linhas(filters, user);
        const totals = linhas.reduce((a, l) => { for (const k of ['contratado', 'recebido', 'faturado', 'atestado', 'liquidado', 'pago', 'saldoContratual'])
            a[k] = new client_1.Prisma.Decimal(a[k] || 0).add(l[k]); return a; }, {});
        return { filtros: filters, geradoEm: new Date().toISOString(), indicadores: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, dinheiro(v)])), pendenciasDocumentais: linhas.reduce((a, l) => a + l.pendenciasDocumentais, 0), divergencias: linhas.reduce((a, l) => a + l.divergencias, 0), linhas };
    }
    async prestacaoScope(user) {
        if (user.role === 'ADMIN')
            return {};
        if (user.role === 'DRE')
            return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
        if (user.role === 'ESCOLA')
            return { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
        return { id: { in: [] } };
    }
    async listarPrestacoes(user) { return this.prisma.prestacaoContas.findMany({ where: await this.prestacaoScope(user), include: { dre: { select: { nome: true } }, escola: { select: { nome: true } }, documentos: { select: { id: true, tipo: true, titulo: true, createdAt: true } } }, orderBy: { updatedAt: 'desc' } }); }
    async criarPrestacao(input, user) {
        if (!['ADMIN', 'DRE', 'ESCOLA'].includes(user.role))
            throw new common_1.ForbiddenException('Perfil sem permissao para prestar contas.');
        const inicio = data(input.periodoInicio, 'periodoInicio');
        const fim = data(input.periodoFim, 'periodoFim');
        if (fim < inicio)
            throw new common_1.BadRequestException('periodoFim deve ser posterior ao periodoInicio.');
        if (user.role === 'DRE' && (!input.dreId || !(await this.policy.getAuthorizedDREIds(user)).includes(input.dreId)))
            throw new common_1.ForbiddenException('DRE fora do escopo institucional.');
        if (user.role === 'ESCOLA' && input.escolaId !== user.escolaId)
            throw new common_1.ForbiddenException('Escola fora do escopo institucional.');
        const criado = await this.prisma.prestacaoContas.create({ data: { exercicio: input.exercicio, periodoInicio: inicio, periodoFim: fim, dreId: input.dreId, escolaId: input.escolaId, observacoes: input.observacoes, createdBy: user.sub, updatedBy: user.sub } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CRIAR_PRESTACAO_CONTAS', entity: 'PrestacaoContas', entityId: criado.id, newValues: input });
        return criado;
    }
    async atualizarPrestacao(id, input, user) {
        const atual = await this.prisma.prestacaoContas.findUnique({ where: { id } });
        if (!atual)
            throw new common_1.NotFoundException('Prestacao de contas nao encontrada.');
        if (atual.status !== 'RASCUNHO' && atual.status !== 'DEVOLVIDA')
            throw new common_1.BadRequestException('Somente rascunhos ou devolvidas podem ser editados.');
        if (user.role !== 'ADMIN' && atual.createdBy !== user.sub)
            throw new common_1.ForbiddenException('Prestacao fora do escopo institucional.');
        const inicio = input.periodoInicio ? data(input.periodoInicio, 'periodoInicio') : atual.periodoInicio;
        const fim = input.periodoFim ? data(input.periodoFim, 'periodoFim') : atual.periodoFim;
        if (fim < inicio)
            throw new common_1.BadRequestException('periodoFim deve ser posterior ao periodoInicio.');
        const alterado = await this.prisma.prestacaoContas.updateMany({ where: { id, versao: input.versao, status: { in: ['RASCUNHO', 'DEVOLVIDA'] } }, data: { ...(input.exercicio !== undefined ? { exercicio: input.exercicio } : {}), periodoInicio: inicio, periodoFim: fim, ...(input.dreId !== undefined ? { dreId: input.dreId } : {}), ...(input.escolaId !== undefined ? { escolaId: input.escolaId } : {}), ...(input.observacoes !== undefined ? { observacoes: input.observacoes } : {}), versao: { increment: 1 }, updatedBy: user.sub } });
        if (alterado.count !== 1)
            throw new common_1.ConflictException('Prestacao alterada por outra operacao ou versao desatualizada.');
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'ALTERAR_PRESTACAO_CONTAS', entity: 'PrestacaoContas', entityId: id, oldValues: { versao: input.versao }, newValues: { ...input, versao: input.versao + 1 } });
        return this.prisma.prestacaoContas.findUnique({ where: { id } });
    }
    async transicionar(id, status, justificativa, user) {
        const atual = await this.prisma.prestacaoContas.findUnique({ where: { id } });
        if (!atual)
            throw new common_1.NotFoundException('Prestacao de contas nao encontrada.');
        if (user.role !== 'ADMIN' && atual.createdBy !== user.sub) {
            if (user.role === 'DRE' && (!atual.dreId || !(await this.policy.getAuthorizedDREIds(user)).includes(atual.dreId)))
                throw new common_1.ForbiddenException('Prestacao fora do escopo institucional.');
            if (user.role === 'ESCOLA' && (!atual.escolaId || !(await this.policy.getAuthorizedEscolaIds(user)).includes(atual.escolaId)))
                throw new common_1.ForbiddenException('Prestacao fora do escopo institucional.');
            if (!['DRE', 'ESCOLA'].includes(user.role))
                throw new common_1.ForbiddenException('Prestacao fora do escopo institucional.');
        }
        const permitidas = { RASCUNHO: ['EM_CONFERENCIA', 'CANCELADA'], EM_CONFERENCIA: ['ENVIADA', 'DEVOLVIDA'], ENVIADA: ['EM_ANALISE', 'DEVOLVIDA'], EM_ANALISE: ['APROVADA', 'DEVOLVIDA'], DEVOLVIDA: ['RASCUNHO'], APROVADA: [], CANCELADA: [] };
        if (!permitidas[atual.status].includes(status))
            throw new common_1.BadRequestException(`Transicao ${atual.status} -> ${status} nao permitida.`);
        if (status === 'DEVOLVIDA' && !justificativa?.trim())
            throw new common_1.BadRequestException('Justificativa obrigatoria para devolucao.');
        const agora = new Date();
        const atualizado = await this.prisma.prestacaoContas.update({ where: { id }, data: { status, justificativa: justificativa?.trim(), versao: { increment: 1 }, updatedBy: user.sub, ...(status === 'ENVIADA' ? { enviadoEm: agora } : {}), ...(status === 'EM_ANALISE' || status === 'APROVADA' ? { analisadoEm: agora } : {}), ...(status === 'APROVADA' ? { aprovadoEm: agora } : {}), ...(status === 'DEVOLVIDA' ? { devolvidoEm: agora } : {}) } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: `PRESTACAO_${status}`, entity: 'PrestacaoContas', entityId: id, oldValues: { status: atual.status }, newValues: { status, justificativa } });
        return atualizado;
    }
    async exportar(filters, formato, user) {
        const dados = await this.demonstrativo(filters, user);
        await this.audit.log({ userId: user.sub, userRole: user.role, action: `EXPORTAR_PRESTACAO_${formato.toUpperCase()}`, entity: 'PrestacaoContas', metadata: { filtros: filters } });
        if (formato === 'csv') {
            const headers = Object.keys(dados.linhas[0] ?? { contratoId: '', numero: '' });
            const rows = dados.linhas.map((l) => headers.map((h) => JSON.stringify(l[h] ?? '')).join(';'));
            return { contentType: 'text/csv; charset=utf-8', extension: 'csv', body: `\uFEFF${headers.join(';')}\n${rows.join('\n')}` };
        }
        if (formato === 'xlsx') {
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dados.linhas), 'Demonstrativo');
            return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx', body: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) };
        }
        const doc = new pdfkit_1.default({ margin: 36 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.fontSize(16).text('Demonstrativo de Prestacao de Contas');
        doc.fontSize(9).text(`Gerado em ${new Date().toLocaleString('pt-BR')}`);
        doc.moveDown();
        for (const l of dados.linhas)
            doc.text(`${l.numero} | ${l.fornecedor} | Contratado R$ ${l.contratado} | Pago R$ ${l.pago} | Pendencias ${l.pendenciasDocumentais}`);
        doc.end();
        await new Promise((resolve) => doc.on('end', () => resolve()));
        return { contentType: 'application/pdf', extension: 'pdf', body: Buffer.concat(chunks) };
    }
    async transparencia(filters) {
        const dados = await this.linhas(filters);
        return dados.map((l) => ({ contrato: l.numero, exercicio: l.exercicio, municipio: l.municipio, dre: l.dre, escola: l.escola, edital: l.edital, fornecedor: l.fornecedor, valorContratado: l.contratado, execucaoFinanceira: { faturado: l.faturado, pago: l.pago }, execucaoFisica: { recebido: l.recebido }, situacao: l.statusFinanceiro }));
    }
};
exports.PrestacaoContasService = PrestacaoContasService;
exports.PrestacaoContasService = PrestacaoContasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService, audit_service_1.AuditService])
], PrestacaoContasService);
//# sourceMappingURL=prestacao-contas.service.js.map