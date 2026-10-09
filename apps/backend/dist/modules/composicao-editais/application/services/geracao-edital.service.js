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
exports.GeracaoEditalService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdf_lib_1 = require("pdf-lib");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const documento_renderer_1 = require("../domain/documento-renderer");
const edital_pdf_layout_1 = require("../domain/edital-pdf-layout");
const placeholders_1 = require("../domain/placeholders");
const campos_produtor_1 = require("../domain/campos-produtor");
const validacao_geracao_1 = require("../domain/validacao-geracao");
const composicao_edital_service_1 = require("./composicao-edital.service");
let GeracaoEditalService = class GeracaoEditalService {
    prisma;
    composicao;
    constructor(prisma, composicao) {
        this.prisma = prisma;
        this.composicao = composicao;
    }
    async previa(editalId) {
        const pacote = await this.montar(editalId);
        return {
            validacao: pacote.validacao,
            secoes: pacote.input.secoes.map((secao) => ({ titulo: secao.titulo, tipo: secao.tipo, ordem: secao.ordem, conteudo: secao.conteudo })),
            versao: pacote.input.versao,
            origem: pacote.edital.documento?.origem,
            arquivoFonte: pacote.edital.documento?.arquivoFonte || pacote.edital.arquivoFonte,
            status: pacote.edital.documento?.statusComposicao,
        };
    }
    async gerar(editalId, usuario) {
        const pacote = await this.montar(editalId);
        if (!pacote.validacao.ok) {
            await this.registrar(pacote, usuario, 'VALIDACAO', null, pacote.validacao.erros.join(' '));
            throw new common_1.BadRequestException({ message: 'Revise as pendências abaixo para gerar o edital.', erros: pacote.validacao.erros });
        }
        const selo = Date.now();
        const pasta = path.resolve(process.cwd(), 'storage', 'editais-gerados', editalId);
        const base = path.join(pasta, `v${pacote.input.versao}-${selo}`);
        const pdfPath = await this.renderPacotePdf(pacote.input, `${base}.pdf`);
        const docxPath = await (0, documento_renderer_1.renderDocx)(pacote.input, `${base}.docx`);
        const versao = await this.prisma.editalVersao.upsert({
            where: { documentoId_numero: { documentoId: pacote.edital.documento.id, numero: pacote.input.versao } },
            update: { statusComposicao: 'GERADO', snapshot: JSON.stringify({ geradoEm: pacote.input.geradoEm, usuario: pacote.input.usuario }), motivo: 'Geração de documentos' },
            create: {
                documentoId: pacote.edital.documento.id,
                numero: pacote.input.versao,
                statusComposicao: 'GERADO',
                snapshot: JSON.stringify({ geradoEm: pacote.input.geradoEm, usuario: pacote.input.usuario }),
                motivo: 'Geração de documentos',
                createdBy: usuario.id,
            },
        });
        await this.registrar(pacote, usuario, 'SUCESSO', path.relative(process.cwd(), pdfPath), null, versao.id, 'PDF');
        await this.registrar(pacote, usuario, 'SUCESSO', path.relative(process.cwd(), docxPath), null, versao.id, 'DOCX');
        await this.prisma.editalDocumento.update({
            where: { id: pacote.edital.documento.id },
            data: { statusComposicao: 'GERADO', updatedBy: usuario.id },
        });
        return this.composicao.obter(editalId);
    }
    async renderPacotePdf(input, outputPath) {
        const fontes = (input.secoes || []).filter((secao) => secao.formato === 'PDF' && secao.arquivoBase);
        if (!fontes.length || fontes.length !== input.secoes.length)
            return (0, edital_pdf_layout_1.renderPdfEdital)(input, outputPath);
        const destino = await pdf_lib_1.PDFDocument.create();
        for (const secao of fontes.sort((a, b) => a.ordem - b.ordem)) {
            const caminho = path.isAbsolute(secao.arquivoBase) ? secao.arquivoBase : path.resolve(process.cwd(), secao.arquivoBase);
            if (!fs.existsSync(caminho))
                throw new common_1.BadRequestException(`Arquivo do template não encontrado: ${secao.titulo}.`);
            const origem = await pdf_lib_1.PDFDocument.load(await fs.promises.readFile(caminho));
            const paginas = await destino.copyPages(origem, origem.getPageIndices());
            paginas.forEach((pagina) => destino.addPage(pagina));
        }
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.promises.writeFile(outputPath, await destino.save());
        return outputPath;
    }
    async arquivo(editalId, formato) {
        const alvo = formato.toUpperCase() === 'DOCX' ? 'DOCX' : 'PDF';
        const geracao = await this.prisma.historicoGeracaoDocumento.findFirst({
            where: { editalId, formato: alvo, status: 'SUCESSO', arquivoPath: { not: null } },
            orderBy: { createdAt: 'desc' },
        });
        if (!geracao?.arquivoPath)
            throw new common_1.NotFoundException(`Nenhum ${alvo} gerado para este edital.`);
        const absoluto = path.isAbsolute(geracao.arquivoPath) ? geracao.arquivoPath : path.resolve(process.cwd(), geracao.arquivoPath);
        if (!fs.existsSync(absoluto))
            throw new common_1.NotFoundException('Arquivo gerado não encontrado no disco.');
        return { caminho: absoluto, nome: path.basename(absoluto), formato: alvo };
    }
    async montar(editalId) {
        const edital = await this.composicao.obter(editalId);
        if (!edital.documento)
            throw new common_1.BadRequestException('Edital sem composição documental. Salve a estrutura antes de gerar.');
        const valores = {};
        for (const variavel of edital.documento.variaveis) {
            if (variavel.escopo)
                continue;
            if (variavel.valor)
                valores[variavel.chave] = variavel.valor;
        }
        const secoes = edital.documento.anexos.filter((anexo) => anexo.incluido).map((anexo) => ({
            titulo: anexo.titulo,
            tipo: anexo.tipo,
            ordem: anexo.ordem,
            conteudo: anexo.conteudoManual || anexo.templateVersao?.conteudo || anexo.template?.conteudo || '',
            formato: anexo.templateVersao?.formato || anexo.template?.formato,
            arquivoBase: anexo.templateVersao?.arquivoBase || anexo.template?.arquivoBase,
            templateId: anexo.templateId,
            codigoModelo: anexo.template?.codigoModelo,
            finalidade: anexo.template?.finalidade,
            perfilFornecedor: anexo.template?.perfilFornecedor,
            vigenciaFim: anexo.templateVersao?.vigenciaFim || anexo.template?.vigenciaFim,
        }));
        if (edital.documento.conteudoManual) {
            const principal = secoes.find((secao) => secao.tipo === 'EDITAL_PRINCIPAL');
            if (principal)
                principal.conteudo = edital.documento.conteudoManual;
        }
        const usadas = new Set(secoes.flatMap((secao) => (0, placeholders_1.extrairPlaceholders)(secao.conteudo)));
        const pendentes = edital.documento.variaveis
            .filter((variavel) => !variavel.escopo && usadas.has(variavel.chave)
            && !placeholders_1.CHAVES_ESPECIAIS.has(variavel.chave) && !(0, campos_produtor_1.campoDoProjeto)(variavel.chave)
            && variavel.statusRevisao === placeholders_1.STATUS_REVISAO.PENDENTE
            && Boolean(variavel.valor?.trim() || variavel.valorExtraido?.trim()))
            .map((variavel) => variavel.chave);
        const validacao = (0, validacao_geracao_1.validarGeracao)({
            statusComposicao: edital.documento.statusComposicao,
            numero: edital.numero,
            ano: edital.ano,
            titulo: edital.titulo,
            objeto: edital.objeto,
            municipioNome: edital.municipio?.nome,
            dataPublicacao: edital.dataPublicacao,
            dataSessao: edital.documento.dataRecebimento,
            valores,
            variaveisPendentes: pendentes,
            anexos: secoes.map((secao) => ({
                tipo: secao.tipo,
                titulo: secao.titulo,
                incluido: true,
                templateId: secao.templateId,
                conteudo: secao.conteudo,
                vigenciaFim: secao.vigenciaFim,
            })),
            itens: edital.itens.map((item) => ({ produto: item.produtoOriginal, quantidade: item.quantidade?.toString(), unidade: item.unidade })),
            conteudos: secoes.map((secao) => secao.conteudo),
        });
        const valoresRenderizacao = { ...valores };
        for (const chave of usadas) {
            if (!placeholders_1.CHAVES_ESPECIAIS.has(chave) && !valoresRenderizacao[chave]?.trim())
                valoresRenderizacao[chave] = '________________';
        }
        const input = {
            numero: edital.numero,
            ano: edital.ano,
            titulo: edital.titulo,
            versao: edital.documento.versaoAtual,
            usuario: edital.documento.updatedBy || edital.documento.createdBy || 'sistema',
            geradoEm: new Date().toLocaleString('pt-BR'),
            valores: valoresRenderizacao,
            secoes,
            produtos: edital.itens.map((item, index) => ({
                numero: item.numeroItem ?? index + 1, produto: item.produtoOriginal, especificacao: item.especificacao || '',
                quantidade: item.quantidade?.toString() || '', unidade: item.unidade || '',
                precoUnitario: item.precoUnitario?.toString() || '',
                total: item.quantidade != null && item.precoUnitario != null ? String(Number(item.quantidade) * Number(item.precoUnitario)) : '',
            })),
            escolasDetalhes: edital.escolasVinculadas.map(({ escola }) => ({ nome: escola.nome, endereco: escola.endereco, telefone: escola.telefone })),
            itens: [
                { colunas: ['Item', 'Produto', 'Especificação', 'Quantidade', 'Unidade'] },
                ...edital.itens.map((item) => ({
                    colunas: [
                        String(item.numeroItem ?? ''),
                        item.produtoOriginal,
                        item.especificacao || '',
                        item.quantidade?.toString() || '',
                        item.unidade || '',
                    ],
                })),
            ],
            escolas: edital.escolasVinculadas.map((item) => item.escola.nome),
            fornecedores: (valores.fornecedores || '').split('\n').map((item) => item.trim()).filter(Boolean),
        };
        return { edital, validacao, input };
    }
    registrar(pacote, usuario, status, arquivoPath, mensagem, versaoId, formato = 'PDF') {
        return this.prisma.historicoGeracaoDocumento.create({
            data: {
                documentoId: pacote.edital.documento.id,
                editalId: pacote.edital.id,
                versaoId: versaoId || null,
                versaoNumero: pacote.input.versao,
                usuarioId: usuario.id,
                usuarioNome: usuario.nome,
                formato,
                arquivoPath,
                status,
                mensagem,
                ipAddress: usuario.ip,
            },
        });
    }
};
exports.GeracaoEditalService = GeracaoEditalService;
exports.GeracaoEditalService = GeracaoEditalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        composicao_edital_service_1.ComposicaoEditalService])
], GeracaoEditalService);
//# sourceMappingURL=geracao-edital.service.js.map