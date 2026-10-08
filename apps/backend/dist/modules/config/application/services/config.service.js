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
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let ConfigService = class ConfigService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.systemConfig.findMany({ orderBy: { chave: 'asc' } });
    }
    async get(chave) {
        const config = await this.prisma.systemConfig.findUnique({ where: { chave } });
        return config?.valor || null;
    }
    async getMany(chaves) {
        const configs = await this.prisma.systemConfig.findMany({
            where: { chave: { in: chaves } },
        });
        const map = {};
        for (const c of configs)
            map[c.chave] = c.valor;
        return map;
    }
    async set(chave, valor, descricao, tipo) {
        return this.prisma.systemConfig.upsert({
            where: { chave },
            create: { chave, valor, descricao, tipo: tipo || 'texto' },
            update: { valor, descricao, tipo },
        });
    }
    async setMany(configs) {
        const results = [];
        for (const c of configs) {
            results.push(await this.set(c.chave, c.valor, c.descricao, c.tipo));
        }
        return results;
    }
    async remove(chave) {
        return this.prisma.systemConfig.delete({ where: { chave } });
    }
    async initDefaults() {
        const defaults = [
            { chave: 'sistema.nome', valor: 'SAGAE PNAE', descricao: 'Nome do sistema', tipo: 'texto' },
            { chave: 'sistema.versao', valor: '1.0.0', descricao: 'Versão do sistema', tipo: 'texto' },
            { chave: 'orgao.nome', valor: 'Governo do Estado de Mato Grosso', descricao: 'Nome do órgão', tipo: 'texto' },
            { chave: 'orgao.secretaria', valor: 'Secretaria de Estado de Educação', descricao: 'Secretaria responsável', tipo: 'texto' },
            { chave: 'orgao.programa', valor: 'Programa Nacional de Alimentação Escolar — PNAE', descricao: 'Programa', tipo: 'texto' },
            { chave: 'documento.validade_padrao', valor: '30', descricao: 'Validade padrão das propostas (dias)', tipo: 'numero' },
            { chave: 'documento.prazo_entrega_padrao', valor: '15', descricao: 'Prazo padrão de entrega (dias)', tipo: 'numero' },
            { chave: 'upload.tamanho_maximo_mb', valor: '50', descricao: 'Tamanho máximo de upload (MB)', tipo: 'numero' },
            { chave: 'upload.tipos_permitidos', valor: '.pdf', descricao: 'Tipos de arquivo permitidos', tipo: 'texto' },
        ];
        return this.setMany(defaults);
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigService);
//# sourceMappingURL=config.service.js.map