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
exports.HomologacaoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
let HomologacaoService = class HomologacaoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    ambienteAtual() {
        if (process.env.AMBIENTE_HOMOLOGACAO === 'true')
            return 'HOMOLOGACAO';
        if (process.env.NODE_ENV === 'production')
            return 'PRODUCAO';
        return 'DESENVOLVIMENTO';
    }
    async getStatus() {
        const [editais, editalItens, produtores, produtosRef, matches, propostas, users, escolas, municipios, auditLogs,] = await Promise.all([
            this.prisma.edital.count({ where: { deletedAt: null } }),
            this.prisma.editalItem.count({ where: { deletedAt: null } }),
            this.prisma.produtor.count({ where: { deletedAt: null } }),
            this.prisma.produtoReferencia.count({ where: { deletedAt: null } }),
            this.prisma.match.count({ where: { deletedAt: null } }),
            this.prisma.proposta.count({ where: { deletedAt: null } }),
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.escola.count({ where: { deletedAt: null } }),
            this.prisma.municipio.count({ where: { deletedAt: null } }),
            this.prisma.auditLog.count(),
        ]);
        const matchesPorStatus = await this.prisma.match.groupBy({
            by: ['status'],
            _count: { status: true },
            where: { deletedAt: null },
        });
        const propostasPorStatus = await this.prisma.proposta.groupBy({
            by: ['status'],
            _count: { status: true },
            where: { deletedAt: null },
        });
        const ultimosErros = await this.prisma.auditLog.findMany({
            where: { action: 'ERROR' },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        const ultimosEventos = await this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const dbStatus = await this.checkDatabase();
        return {
            timestamp: new Date().toISOString(),
            ambiente: this.ambienteAtual(),
            db: dbStatus,
            counts: {
                editais, editalItens, produtores, produtosRef, matches, propostas,
                users, escolas, municipios, auditLogs,
            },
            matchesPorStatus: Object.fromEntries(matchesPorStatus.map(m => [m.status, m._count.status])),
            propostasPorStatus: Object.fromEntries(propostasPorStatus.map(p => [p.status, p._count.status])),
            ultimosErros,
            ultimosEventos,
        };
    }
    async getRelatorio(usuario) {
        const status = await this.getStatus();
        const now = new Date();
        return {
            data: now.toLocaleDateString('pt-BR'),
            hora: now.toLocaleTimeString('pt-BR'),
            responsavel: usuario || 'ADMIN',
            ambiente: status.ambiente,
            resumo: {
                editais: status.counts.editais,
                itensImportados: status.counts.editalItens,
                produtores: status.counts.produtores,
                produtosReferencia: status.counts.produtosRef,
                matches: status.counts.matches,
                propostas: status.counts.propostas,
                usuarios: status.counts.users,
                escolas: status.counts.escolas,
                municipios: status.counts.municipios,
            },
            matchesPorStatus: status.matchesPorStatus,
            propostasPorStatus: status.propostasPorStatus,
            erros: status.ultimosErros.map(e => ({
                data: e.createdAt,
                endpoint: e.endpoint,
                mensagem: e.newValues ? JSON.parse(e.newValues)?.error : 'Erro desconhecido',
            })),
            observacoes: [
                'Sistema em modo de homologacao.',
                'Validar todos os fluxos com dados reais.',
                'Verificar integracao com PDF parser.',
                'Confirmar calculos de balizamento.',
            ],
        };
    }
    async exportarCSV(tipo, editalId) {
        switch (tipo) {
            case 'itens': return this.exportarItens(editalId);
            case 'matches': return this.exportarMatches(editalId);
            case 'propostas': return this.exportarPropostas();
            default:
                return { erro: 'Tipo invalido. Use: itens, matches, propostas' };
        }
    }
    async exportarItens(editalId) {
        const where = { deletedAt: null };
        if (editalId)
            where.editalId = editalId;
        const itens = await this.prisma.editalItem.findMany({
            where,
            include: { edital: { select: { numero: true, ano: true } } },
            orderBy: [{ editalId: 'asc' }, { numeroItem: 'asc' }],
        });
        const header = 'Edital;Numero Item;Produto;Especificacao;Quantidade;Unidade;Preco Unitario;Valor Total;Status\n';
        const rows = itens.map(i => `${i.edital.numero}/${i.edital.ano};${i.numeroItem};${i.produtoOriginal};${(i.especificacao || '').replace(/;/g, ',')};${i.quantidade || ''};${i.unidade || ''};${i.precoUnitario || ''};${i.valorTotal || ''};${i.status}`).join('\n');
        return { contentType: 'text/csv; charset=utf-8', filename: 'itens-export.csv', data: header + rows };
    }
    async exportarMatches(editalId) {
        const where = { deletedAt: null };
        if (editalId)
            where.editalId = editalId;
        const matches = await this.prisma.match.findMany({
            where,
            include: {
                edital: { select: { numero: true, ano: true } },
                editalItem: { select: { produtoOriginal: true } },
                produtor: { select: { nome: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const header = 'Edital;Item;Produto;Produtor;Score;Status;Origem\n';
        const rows = matches.map(m => `${m.edital?.numero || ''}/${m.edital?.ano || ''};${m.editalItem.produtoOriginal};${m.editalItem.produtoOriginal};${m.produtor?.nome || ''};${m.scoreMatch};${m.status};${m.origemMatch}`).join('\n');
        return { contentType: 'text/csv; charset=utf-8', filename: 'matches-export.csv', data: header + rows };
    }
    async exportarPropostas() {
        const propostas = await this.prisma.proposta.findMany({
            where: { deletedAt: null },
            include: {
                edital: { select: { numero: true, ano: true } },
                produtor: { select: { nome: true } },
                itens: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const header = 'Numero;Edital;Produtor;Tipo;Itens;Valor Total;Status;Data Criacao\n';
        const rows = propostas.map(p => `${p.numero || ''};${p.edital.numero}/${p.edital.ano};${p.produtor?.nome || ''};${p.tipoDocumento};${p.itens.length};${p.valorTotal || ''};${p.status};${p.createdAt.toLocaleDateString('pt-BR')}`).join('\n');
        return { contentType: 'text/csv; charset=utf-8', filename: 'propostas-export.csv', data: header + rows };
    }
    async checkDatabase() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { status: 'CONECTADO', message: 'Banco de dados respondendo normalmente' };
        }
        catch (e) {
            return { status: 'ERRO', message: e.message };
        }
    }
    async executarSeedTeste() {
        if (this.ambienteAtual() === 'PRODUCAO') {
            throw new common_1.ForbiddenException('Seed de teste indisponível em produção.');
        }
        try {
            const projectRoot = path.resolve(__dirname, '../../../../..');
            const seedPath = path.join(projectRoot, 'prisma', 'seed-test.ts');
            if (!fs.existsSync(seedPath)) {
                return { success: false, message: 'Arquivo seed-test.ts nao encontrado' };
            }
            (0, child_process_1.execFileSync)(process.execPath, [require.resolve('ts-node/dist/bin.js'), seedPath], {
                cwd: projectRoot,
                timeout: 60000,
                stdio: 'pipe',
            });
            return { success: true, message: 'Seed de teste executado com sucesso' };
        }
        catch (e) {
            return { success: false, message: `Erro ao executar seed: ${e.message}` };
        }
    }
};
exports.HomologacaoService = HomologacaoService;
exports.HomologacaoService = HomologacaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HomologacaoService);
//# sourceMappingURL=homologacao.service.js.map