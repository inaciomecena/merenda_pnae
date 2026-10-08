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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocxGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const docx_1 = require("docx");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let DocxGeneratorService = class DocxGeneratorService {
    async generate(data, outputPath) {
        const dir = path.dirname(outputPath);
        fs.mkdirSync(dir, { recursive: true });
        const title = data.tipoDocumento === 'ANEXO_III'
            ? 'ANEXO III — MODELO DE PROPOSTA DE PREÇOS'
            : 'PROJETO DE VENDA DA AGRICULTURA FAMILIAR';
        const doc = new docx_1.Document({
            sections: [{
                    properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
                    children: [
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: 'GOVERNO DO ESTADO DE MATO GROSSO', bold: true, size: 28, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: 'SECRETARIA DE ESTADO DE EDUCAÇÃO', bold: true, size: 24, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: 'Programa Nacional de Alimentação Escolar — PNAE', size: 20, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: title, bold: true, size: 26, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: `Proposta nº ${data.numeroProposta}`, size: 20, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({
                            border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 1, color: '01287C' } },
                            children: [],
                        }),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: 'DADOS DA LICITAÇÃO/CHAMADA PÚBLICA', bold: true, size: 22, font: 'Arial' })] }),
                        this.buildInfoTable([
                            [`Número: ${data.edital.numero}/${data.edital.ano}`, 'Modalidade: Pregão'],
                            [`Objeto: ${data.edital.objeto || data.edital.titulo}`, ''],
                            [`Município: ${data.edital.municipio?.nome || '—'}-${data.edital.municipio?.uf || 'MT'}`, ''],
                        ]),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: 'DADOS DO PRODUTOR/LICITANTE', bold: true, size: 22, font: 'Arial' })] }),
                        this.buildInfoTable([
                            [`Nome/Razão Social: ${data.produtor.nome}`, `CPF/CNPJ: ${data.produtor.cpfCnpj || '—'}`],
                            [`Endereço: ${data.produtor.endereco || '—'}`, ''],
                            [`Município: ${data.produtor.municipio?.nome || '—'}-${data.produtor.municipio?.uf || 'MT'}`, `Telefone: ${data.produtor.telefone || '—'}`],
                            [`E-mail: ${data.produtor.email || '—'}`, ''],
                        ]),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: 'ITENS DA PROPOSTA', bold: true, size: 22, font: 'Arial' })] }),
                        this.buildItensTable(data),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.RIGHT, children: [
                                new docx_1.TextRun({ text: `VALOR TOTAL DA PROPOSTA: R$ ${data.valorTotal.toFixed(2)}`, bold: true, size: 22, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: 'CONDIÇÕES', bold: true, size: 22, font: 'Arial' })] }),
                        new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: `• Validade da proposta: ${data.validadeDias} dias.`, size: 20, font: 'Arial' })] }),
                        new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: `• Prazo de entrega: ${data.prazoEntrega} dias após solicitação.`, size: 20, font: 'Arial' })] }),
                        ...(data.observacao ? [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: `• Observações: ${data.observacao}`, size: 20, font: 'Arial' })] })] : []),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: `${data.edital.municipio?.nome || 'Município'}, ${data.dataGeracao}`, size: 20, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ text: '' }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: '________________________________________', size: 20, font: 'Arial' }),
                            ] }),
                        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                                new docx_1.TextRun({ text: 'Assinatura do Representante Legal', size: 20, font: 'Arial' }),
                            ] }),
                    ],
                }],
        });
        const buffer = await docx_1.Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
    }
    buildInfoTable(rows) {
        return new docx_1.Table({
            width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
            rows: rows.map(row => new docx_1.TableRow({
                children: row.map(cell => new docx_1.TableCell({
                    width: { size: 50, type: docx_1.WidthType.PERCENTAGE },
                    children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: cell || '—', size: 20, font: 'Arial' })] })],
                })),
            })),
        });
    }
    buildItensTable(data) {
        const headers = ['Item', 'Produto', 'Marca', 'Qtd.', 'Valor Unit.', 'Valor Total'];
        const headerRow = new docx_1.TableRow({
            tableHeader: true,
            children: headers.map(h => new docx_1.TableCell({
                shading: { type: docx_1.ShadingType.SOLID, color: '01287C' },
                children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [
                            new docx_1.TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18, font: 'Arial' }),
                        ] })],
            })),
        });
        const dataRows = data.itens.map((item, i) => new docx_1.TableRow({
            children: [
                new docx_1.TableCell({ children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [new docx_1.TextRun({ text: String(i + 1), size: 18, font: 'Arial' })] })] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: item.produto, size: 18, font: 'Arial' })] })] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: item.marca || '—', size: 18, font: 'Arial' })] })] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: item.quantidade ? `${item.quantidade} ${item.unidade || ''}` : '—', size: 18, font: 'Arial' })] })] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: item.precoUnitario ? `R$ ${item.precoUnitario.toFixed(2)}` : '—', size: 18, font: 'Arial' })] })] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: item.valorTotal ? `R$ ${item.valorTotal.toFixed(2)}` : '—', size: 18, font: 'Arial' })] })] }),
            ],
        }));
        return new docx_1.Table({
            width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
        });
    }
};
exports.DocxGeneratorService = DocxGeneratorService;
exports.DocxGeneratorService = DocxGeneratorService = __decorate([
    (0, common_1.Injectable)()
], DocxGeneratorService);
//# sourceMappingURL=docx-generator.service.js.map