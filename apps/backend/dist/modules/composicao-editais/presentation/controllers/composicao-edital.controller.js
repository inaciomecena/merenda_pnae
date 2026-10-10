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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposicaoEditalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fs = __importStar(require("fs"));
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const composicao_edital_service_1 = require("../../application/services/composicao-edital.service");
const geracao_edital_service_1 = require("../../application/services/geracao-edital.service");
const composicao_dto_1 = require("../dto/composicao.dto");
let ComposicaoEditalController = class ComposicaoEditalController {
    composicao;
    geracao;
    prisma;
    constructor(composicao, geracao, prisma) {
        this.composicao = composicao;
        this.geracao = geracao;
        this.prisma = prisma;
    }
    criar(dto, req) {
        return this.composicao.criar(dto, this.usuarioId(req));
    }
    obter(id) {
        return this.composicao.obter(id);
    }
    atualizar(id, dto, req) {
        return this.composicao.atualizar(id, dto, this.usuarioId(req));
    }
    itens(id, dto, req) {
        return this.composicao.salvarItens(id, dto.itens, this.usuarioId(req));
    }
    anexos(id, dto, req) {
        return this.composicao.salvarAnexos(id, dto.anexos, this.usuarioId(req));
    }
    variaveis(id, dto, req) {
        return this.composicao.salvarVariaveis(id, dto.variaveis, this.usuarioId(req));
    }
    duplicar(id, req) {
        return this.composicao.duplicar(id, this.usuarioId(req));
    }
    novaVersao(id, req) {
        return this.composicao.novaVersao(id, this.usuarioId(req));
    }
    publicar(id, req) {
        return this.composicao.publicar(id, this.usuarioId(req));
    }
    cancelar(id, req) {
        return this.composicao.cancelar(id, this.usuarioId(req));
    }
    previa(id) {
        return this.geracao.previa(id);
    }
    async gerar(id, req) {
        const usuario = await this.usuario(req);
        return this.geracao.gerar(id, usuario);
    }
    async download(id, formato = 'pdf', res) {
        const arquivo = await this.geracao.arquivo(id, formato);
        const contentType = arquivo.formato === 'DOCX'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome}"`);
        fs.createReadStream(arquivo.caminho).pipe(res);
    }
    usuarioId(req) {
        return req.user?.sub || 'system';
    }
    async usuario(req) {
        const id = this.usuarioId(req);
        const user = id === 'system' ? null : await this.prisma.user.findUnique({ where: { id } });
        const forwarded = req.headers['x-forwarded-for'];
        return {
            id,
            nome: user?.name || req.user?.email || 'sistema',
            ip: typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress,
        };
    }
};
exports.ComposicaoEditalController = ComposicaoEditalController;
__decorate([
    (0, common_1.Post)('composicao'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar edital do zero com composição documental' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [composicao_dto_1.CreateComposicaoDto, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "criar", null);
__decorate([
    (0, common_1.Get)(':id/composicao'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter composição, anexos, variáveis, versões e última geração' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "obter", null);
__decorate([
    (0, common_1.Patch)(':id/composicao'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar estrutura do edital' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.UpdateComposicaoDto, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Post)(':id/composicao/itens'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Substituir itens do edital em composição' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.SalvarItensDto, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "itens", null);
__decorate([
    (0, common_1.Post)(':id/composicao/anexos'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Selecionar, ordenar e versionar anexos' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.SalvarAnexosDto, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "anexos", null);
__decorate([
    (0, common_1.Post)(':id/composicao/variaveis'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Salvar variáveis e marcar revisão' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.SalvarVariaveisDto, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "variaveis", null);
__decorate([
    (0, common_1.Post)(':id/composicao/duplicar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Duplicar edital sem copiar dados sensíveis' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "duplicar", null);
__decorate([
    (0, common_1.Post)(':id/composicao/nova-versao'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Abrir nova versão sem alterar a publicação anterior' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "novaVersao", null);
__decorate([
    (0, common_1.Post)(':id/composicao/publicar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Publicar edital gerado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "publicar", null);
__decorate([
    (0, common_1.Post)(':id/composicao/cancelar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar edital ainda não publicado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "cancelar", null);
__decorate([
    (0, common_1.Get)(':id/composicao/previa'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Prévia textual e validação antes da geração' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComposicaoEditalController.prototype, "previa", null);
__decorate([
    (0, common_1.Post)(':id/composicao/gerar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar PDF e DOCX do edital e anexos' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ComposicaoEditalController.prototype, "gerar", null);
__decorate([
    (0, common_1.Get)(':id/composicao/download'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Baixar PDF ou DOCX gerado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('formato')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ComposicaoEditalController.prototype, "download", null);
exports.ComposicaoEditalController = ComposicaoEditalController = __decorate([
    (0, swagger_1.ApiTags)('composicao-editais'),
    (0, common_1.Controller)({ path: 'editais', version: '1' }),
    __metadata("design:paramtypes", [composicao_edital_service_1.ComposicaoEditalService,
        geracao_edital_service_1.GeracaoEditalService,
        prisma_service_1.PrismaService])
], ComposicaoEditalController);
//# sourceMappingURL=composicao-edital.controller.js.map