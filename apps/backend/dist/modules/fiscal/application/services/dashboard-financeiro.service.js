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
exports.DashboardFinanceiroService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const fiscal_acesso_service_1 = require("./fiscal-acesso.service");
let DashboardFinanceiroService = class DashboardFinanceiroService {
    prisma;
    acesso;
    constructor(prisma, acesso) {
        this.prisma = prisma;
        this.acesso = acesso;
    }
    escopoLiquidacao(filtroNota, filtroContrato) {
        return {
            OR: [
                { notaFiscalId: null, contrato: filtroContrato },
                { notaFiscal: { AND: [filtroNota], contrato: filtroContrato } },
            ],
        };
    }
    escopoNota(filtroNota, filtroContrato) {
        return { AND: [filtroNota], contrato: filtroContrato };
    }
    negativoZero(valor) {
        return valor.lt(0) ? new client_1.Prisma.Decimal(0) : valor;
    }
    async totaisFinanceirosCom(filtroNota, filtroContrato) {
        const [atesto, liquidacao, pagamento] = await Promise.all([
            this.prisma.atesto.aggregate({
                where: {
                    status: { in: ['ATESTADO', 'RETIFICADO'] },
                    notaFiscal: this.escopoNota(filtroNota, filtroContrato),
                },
                _sum: { valorAtestado: true },
            }),
            this.prisma.liquidacao.aggregate({
                where: { status: { not: 'CANCELADA' }, ...this.escopoLiquidacao(filtroNota, filtroContrato) },
                _sum: { valorLiquidado: true },
            }),
            this.prisma.pagamento.aggregate({
                where: {
                    status: { in: ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'] },
                    liquidacao: this.escopoLiquidacao(filtroNota, filtroContrato),
                },
                _sum: { valorPago: true },
            }),
        ]);
        return {
            atestado: atesto._sum.valorAtestado ?? new client_1.Prisma.Decimal(0),
            liquidado: liquidacao._sum.valorLiquidado ?? new client_1.Prisma.Decimal(0),
            pago: pagamento._sum.valorPago ?? new client_1.Prisma.Decimal(0),
        };
    }
    async totaisFinanceiros(user) {
        const filtroNota = await this.acesso.filtroNotaFiscal(user);
        const filtroContrato = await this.acesso.filtroContrato(user);
        return this.totaisFinanceirosCom(filtroNota, filtroContrato);
    }
    async totaisCompletos(user) {
        const filtroNota = await this.acesso.filtroNotaFiscal(user);
        const filtroContrato = await this.acesso.filtroContrato(user);
        const escopoNota = this.escopoNota(filtroNota, filtroContrato);
        const [contratos, itensAceitos, faturado, conciliado, financeiros] = await Promise.all([
            this.prisma.contrato.aggregate({
                where: { ...filtroContrato, deletedAt: null },
                _sum: { valorAtualizado: true },
            }),
            this.prisma.entregaItem.findMany({
                where: {
                    deletedAt: null,
                    entrega: {
                        deletedAt: null,
                        status: 'ACEITA',
                        programacao: { deletedAt: null, contrato: { ...filtroContrato, deletedAt: null } },
                    },
                },
                select: {
                    quantidadeAceita: true,
                    programacaoItem: { select: { valorUnitarioContratual: true } },
                },
            }),
            this.prisma.notaFiscal.aggregate({
                where: { deletedAt: null, status: { not: 'CANCELADA' }, ...escopoNota },
                _sum: { valorTotal: true },
            }),
            this.prisma.notaFiscal.aggregate({
                where: {
                    deletedAt: null,
                    status: { not: 'CANCELADA' },
                    resultadoConciliacao: { in: ['CONCILIADA', 'CONCILIADA_COM_RESSALVAS'] },
                    ...escopoNota,
                },
                _sum: { valorTotal: true },
            }),
            this.totaisFinanceirosCom(filtroNota, filtroContrato),
        ]);
        const recebido = itensAceitos.reduce((acc, item) => acc.add(item.quantidadeAceita.mul(item.programacaoItem.valorUnitarioContratual)), new client_1.Prisma.Decimal(0));
        return {
            contratado: contratos._sum.valorAtualizado ?? new client_1.Prisma.Decimal(0),
            recebido,
            faturado: faturado._sum.valorTotal ?? new client_1.Prisma.Decimal(0),
            conciliado: conciliado._sum.valorTotal ?? new client_1.Prisma.Decimal(0),
            atestado: financeiros.atestado,
            liquidado: financeiros.liquidado,
            pago: financeiros.pago,
        };
    }
    async indicadores(user) {
        const totais = await this.totaisCompletos(user);
        return {
            contratado: totais.contratado.toString(),
            recebidoAceito: totais.recebido.toString(),
            faturado: totais.faturado.toString(),
            conciliado: totais.conciliado.toString(),
            atestado: totais.atestado.toString(),
            liquidado: totais.liquidado.toString(),
            pago: totais.pago.toString(),
        };
    }
    async saldos(user) {
        const totais = await this.totaisFinanceiros(user);
        return {
            aLiquidar: this.negativoZero(totais.atestado.sub(totais.liquidado)).toString(),
            aPagar: this.negativoZero(totais.liquidado.sub(totais.pago)).toString(),
        };
    }
    async pendencias(user) {
        const filtroNota = await this.acesso.filtroNotaFiscal(user);
        const filtroContrato = await this.acesso.filtroContrato(user);
        const limite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [notas, liquidacoes, pagamentos, divergencias] = await Promise.all([
            this.prisma.notaFiscal.findMany({
                where: {
                    deletedAt: null,
                    status: { in: ['PENDENTE_CONFERENCIA', 'EM_CONFERENCIA', 'AGUARDANDO_ATESTO'] },
                    ...this.escopoNota(filtroNota, filtroContrato),
                },
                select: { id: true, numero: true, status: true },
                orderBy: { dataRecebimento: 'asc' },
            }),
            this.prisma.liquidacao.findMany({
                where: {
                    status: 'REGISTRADA',
                    dataLiquidacao: { lt: limite },
                    pagamentos: { none: { status: { in: ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'] } } },
                    ...this.escopoLiquidacao(filtroNota, filtroContrato),
                },
                select: { id: true, numeroProcesso: true },
                orderBy: { dataLiquidacao: 'asc' },
            }),
            this.prisma.pagamento.findMany({
                where: {
                    status: 'PARCIAL',
                    liquidacao: this.escopoLiquidacao(filtroNota, filtroContrato),
                },
                select: { id: true, numeroOrdemPagamento: true },
                orderBy: { dataPagamento: 'asc' },
            }),
            this.prisma.divergenciaFiscal.findMany({
                where: {
                    status: 'ABERTA',
                    severidade: 'IMPEDITIVA',
                    notaFiscal: { deletedAt: null, ...this.escopoNota(filtroNota, filtroContrato) },
                },
                select: { id: true, descricao: true, notaFiscal: { select: { numero: true } } },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        const itens = [];
        for (const nota of notas) {
            if (nota.status === 'PENDENTE_CONFERENCIA') {
                itens.push({
                    id: nota.id,
                    tipo: 'CONFERENCIA_PENDENTE',
                    descricao: `NF ${nota.numero} aguardando conferência`,
                    gravidade: 'MEDIA',
                });
            }
            else if (nota.status === 'AGUARDANDO_ATESTO') {
                itens.push({
                    id: nota.id,
                    tipo: 'ATESTO_PENDENTE',
                    descricao: `NF ${nota.numero} aguardando atesto`,
                    gravidade: 'ALTA',
                });
            }
            else if (nota.status === 'EM_CONFERENCIA') {
                itens.push({
                    id: nota.id,
                    tipo: 'CONFERENCIA_EM_ANDAMENTO',
                    descricao: `NF ${nota.numero} em conferência`,
                    gravidade: 'BAIXA',
                });
            }
        }
        for (const liquidacao of liquidacoes) {
            itens.push({
                id: liquidacao.id,
                tipo: 'LIQUIDACAO_SEM_PAGAMENTO',
                descricao: `Liquidação ${liquidacao.numeroProcesso ?? liquidacao.id} sem pagamento há mais de 30 dias`,
                gravidade: 'ALTA',
            });
        }
        for (const pagamento of pagamentos) {
            itens.push({
                id: pagamento.id,
                tipo: 'PAGAMENTO_PARCIAL',
                descricao: `Pagamento ${pagamento.numeroOrdemPagamento ?? pagamento.id} realizado parcialmente`,
                gravidade: 'MEDIA',
            });
        }
        for (const divergencia of divergencias) {
            itens.push({
                id: divergencia.id,
                tipo: 'DIVERGENCIA_IMPEDIMENTO',
                descricao: `NF ${divergencia.notaFiscal.numero} com divergência impeditiva: ${divergencia.descricao}`,
                gravidade: 'ALTA',
            });
        }
        return itens.slice(0, 50);
    }
    async divergencias(user) {
        const filtroNota = await this.acesso.filtroNotaFiscal(user);
        const filtroContrato = await this.acesso.filtroContrato(user);
        const linhas = await this.prisma.divergenciaFiscal.findMany({
            where: {
                status: { in: ['ABERTA', 'EM_ANALISE'] },
                notaFiscal: { deletedAt: null, ...this.escopoNota(filtroNota, filtroContrato) },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                tipo: true,
                descricao: true,
                notaFiscalId: true,
                notaFiscal: { select: { numero: true } },
            },
        });
        return linhas.map((linha) => ({
            id: linha.id,
            notaFiscalId: linha.notaFiscalId,
            notaFiscalNumero: linha.notaFiscal.numero,
            tipo: linha.tipo,
            descricao: linha.descricao,
        }));
    }
    async grafico(user) {
        const totais = await this.totaisCompletos(user);
        const entradas = [
            { label: 'Contratado', valor: totais.contratado },
            { label: 'Recebido', valor: totais.recebido },
            { label: 'Faturado', valor: totais.faturado },
            { label: 'Conciliado', valor: totais.conciliado },
            { label: 'Atestado', valor: totais.atestado },
            { label: 'Liquidado', valor: totais.liquidado },
            { label: 'Pago', valor: totais.pago },
        ];
        const maior = entradas.reduce((acc, entrada) => (entrada.valor.gt(acc) ? entrada.valor : acc), new client_1.Prisma.Decimal(0));
        const base = totais.contratado.gt(0) ? totais.contratado : maior;
        return entradas.map((entrada) => {
            let percentual = 0;
            if (base.gt(0)) {
                const bruto = Number(entrada.valor.div(base).mul(100).toString());
                percentual = Number.isFinite(bruto) ? Math.min(100, Math.max(0, Math.round(bruto))) : 0;
            }
            return { label: entrada.label, valor: entrada.valor.toString(), percentual };
        });
    }
};
exports.DashboardFinanceiroService = DashboardFinanceiroService;
exports.DashboardFinanceiroService = DashboardFinanceiroService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fiscal_acesso_service_1.FiscalAcessoService])
], DashboardFinanceiroService);
//# sourceMappingURL=dashboard-financeiro.service.js.map