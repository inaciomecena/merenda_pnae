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
exports.ImportacaoService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let ImportacaoService = class ImportacaoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listarArquivosPdf() {
        const dir = path.resolve(process.cwd(), '..', '..', 'docs');
        const files = fs.existsSync(dir) ? fs.readdirSync(dir, { encoding: 'utf8' }).filter((file) => file.endsWith('.pdf')) : [];
        return files.map((file) => ({ nome: file, caminho: path.join(dir, file) }));
    }
    async findAll(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const where = {
            deletedAt: null,
            ...(query.status ? { status: query.status } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.importLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.importLog.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async create(dto) {
        return this.prisma.importLog.create({
            data: {
                arquivoNome: dto.arquivoNome,
                arquivoCaminho: path.resolve(process.cwd(), '..', '..', 'docs', dto.arquivoNome),
                origem: 'LEGACY',
                status: dto.status,
                resumo: dto.resumo,
                createdBy: dto.createdBy,
                ...(dto.editalId ? { edital: { connect: { id: dto.editalId } } } : {}),
            },
        });
    }
};
exports.ImportacaoService = ImportacaoService;
exports.ImportacaoService = ImportacaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportacaoService);
//# sourceMappingURL=importacao.service.js.map