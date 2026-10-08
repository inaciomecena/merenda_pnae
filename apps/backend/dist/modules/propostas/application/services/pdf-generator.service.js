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
exports.PdfGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = __importStar(require("pdfkit"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let PdfGeneratorService = class PdfGeneratorService {
    async generate(data, outputPath) {
        const dir = path.dirname(outputPath);
        fs.mkdirSync(dir, { recursive: true });
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            this.drawHeader(doc, data);
            this.drawEditalInfo(doc, data);
            this.drawProdutorInfo(doc, data);
            this.drawItensTable(doc, data);
            this.drawTotais(doc, data);
            this.drawConditions(doc, data);
            this.drawSignature(doc, data);
            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        });
    }
    drawHeader(doc, data) {
        doc.fontSize(14).font('Helvetica-Bold').text('GOVERNO DO ESTADO DE MATO GROSSO', { align: 'center' });
        doc.fontSize(11).font('Helvetica').text('SECRETARIA DE ESTADO DE EDUCAÇÃO', { align: 'center' });
        doc.fontSize(10).text('Programa Nacional de Alimentação Escolar — PNAE', { align: 'center' });
        doc.moveDown(0.5);
        const title = data.tipoDocumento === 'ANEXO_III'
            ? 'ANEXO III — MODELO DE PROPOSTA DE PREÇOS'
            : 'PROJETO DE VENDA DA AGRICULTURA FAMILIAR';
        doc.fontSize(13).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').text(`Proposta nº ${data.numeroProposta}`, { align: 'center' });
        doc.moveDown(1);
        this.drawLine(doc);
        doc.moveDown(0.5);
    }
    drawEditalInfo(doc, data) {
        doc.fontSize(10).font('Helvetica-Bold').text('DADOS DA LICITAÇÃO/CHAMADA PÚBLICA');
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica');
        doc.text(`Número: ${data.edital.numero}/${data.edital.ano}    Modalidade: Pregão`);
        doc.text(`Objeto: ${data.edital.objeto || data.edital.titulo}`);
        doc.text(`Município: ${data.edital.municipio?.nome || '—'}-${data.edital.municipio?.uf || 'MT'}`);
        doc.moveDown(0.8);
    }
    drawProdutorInfo(doc, data) {
        doc.fontSize(10).font('Helvetica-Bold').text('DADOS DO PRODUTOR/LICITANTE');
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica');
        doc.text(`Nome/Razão Social: ${data.produtor.nome}    CPF/CNPJ: ${data.produtor.cpfCnpj || '—'}`);
        doc.text(`Endereço: ${data.produtor.endereco || '—'}`);
        doc.text(`Município: ${data.produtor.municipio?.nome || '—'}-${data.produtor.municipio?.uf || 'MT'}    Telefone: ${data.produtor.telefone || '—'}`);
        doc.text(`E-mail: ${data.produtor.email || '—'}`);
        doc.moveDown(0.8);
    }
    drawItensTable(doc, data) {
        doc.fontSize(10).font('Helvetica-Bold').text('ITENS DA PROPOSTA');
        doc.moveDown(0.3);
        const tableTop = doc.y;
        const colWidths = [30, 160, 60, 50, 70, 80];
        const headers = ['Item', 'Produto', 'Marca', 'Qtd.', 'Valor Unit.', 'Valor Total'];
        const startX = 50;
        doc.fontSize(8).font('Helvetica-Bold');
        let x = startX;
        for (let i = 0; i < headers.length; i++) {
            doc.text(headers[i], x, tableTop, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
            x += colWidths[i];
        }
        doc.moveTo(startX, tableTop + 12).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), tableTop + 12).stroke();
        doc.font('Helvetica').fontSize(8);
        let y = tableTop + 18;
        for (let i = 0; i < data.itens.length; i++) {
            const item = data.itens[i];
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            x = startX;
            const values = [
                String(i + 1),
                item.produto,
                item.marca || '—',
                item.quantidade ? `${item.quantidade} ${item.unidade || ''}` : '—',
                item.precoUnitario ? `R$ ${item.precoUnitario.toFixed(2)}` : '—',
                item.valorTotal ? `R$ ${item.valorTotal.toFixed(2)}` : '—',
            ];
            for (let j = 0; j < values.length; j++) {
                doc.text(values[j], x, y, { width: colWidths[j], align: j === 0 ? 'center' : 'left' });
                x += colWidths[j];
            }
            y += 16;
        }
        doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
        doc.moveDown(1);
    }
    drawTotais(doc, data) {
        doc.fontSize(10).font('Helvetica-Bold').text(`VALOR TOTAL DA PROPOSTA: R$ ${data.valorTotal.toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.5);
    }
    drawConditions(doc, data) {
        doc.fontSize(9).font('Helvetica-Bold').text('CONDIÇÕES');
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(9);
        doc.text(`• Validade da proposta: ${data.validadeDias} dias.`);
        doc.text(`• Prazo de entrega: ${data.prazoEntrega} dias após solicitação.`);
        if (data.observacao) {
            doc.text(`• Observações: ${data.observacao}`);
        }
        doc.moveDown(0.5);
    }
    drawSignature(doc, data) {
        const y = doc.y + 30;
        doc.fontSize(9).font('Helvetica');
        doc.text(data.edital.municipio?.nome || 'Município', 50, y, { align: 'center', width: 200 });
        doc.text(data.dataGeracao, 50, y + 12, { align: 'center', width: 200 });
        doc.moveTo(300, y + 40).lineTo(550, y + 40).stroke();
        doc.text('Assinatura do Representante Legal', 300, y + 45, { align: 'center', width: 250 });
    }
    drawLine(doc) {
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    }
};
exports.PdfGeneratorService = PdfGeneratorService;
exports.PdfGeneratorService = PdfGeneratorService = __decorate([
    (0, common_1.Injectable)()
], PdfGeneratorService);
//# sourceMappingURL=pdf-generator.service.js.map