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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepararSecoes = prepararSecoes;
exports.renderPdf = renderPdf;
exports.renderDocx = renderDocx;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const docx_1 = require("docx");
const placeholders_1 = require("./placeholders");
const templates_padrao_1 = require("./templates-padrao");
function tabelaEspecial(chave, input) {
    if (chave === 'itens')
        return input.itens;
    if (chave === 'escolas')
        return input.escolas.map((escola) => ({ colunas: [escola] }));
    if (chave === 'fornecedores')
        return input.fornecedores.length ? input.fornecedores.map((item) => ({ colunas: [item] })) : [{ colunas: ['A preencher na seleção da chamada'] }];
    return [];
}
function partesDoConteudo(conteudo) {
    const partes = [];
    const regex = /\{\{(itens|escolas|fornecedores|assinaturas)\}\}/g;
    let cursor = 0;
    for (const match of conteudo.matchAll(regex)) {
        const index = match.index ?? 0;
        if (index > cursor)
            partes.push({ tipo: 'texto', valor: conteudo.slice(cursor, index) });
        partes.push({ tipo: match[1] === 'assinaturas' ? 'assinaturas' : 'tabela', valor: match[1] });
        cursor = index + match[0].length;
    }
    if (cursor < conteudo.length)
        partes.push({ tipo: 'texto', valor: conteudo.slice(cursor) });
    return partes.filter((parte) => parte.tipo !== 'texto' || parte.valor.trim());
}
function prepararSecoes(input) {
    return [...input.secoes]
        .sort((a, b) => a.ordem - b.ordem)
        .map((secao) => {
        const texto = (0, templates_padrao_1.htmlParaTexto)(secao.conteudo || '');
        const aplicado = (0, placeholders_1.aplicarPlaceholders)(texto, input.valores);
        return { titulo: secao.titulo, partes: partesDoConteudo(aplicado.texto) };
    });
}
function drawTable(doc, linhas) {
    if (!linhas.length) {
        doc.fontSize(10).font('Helvetica-Oblique').text('Tabela sem linhas.');
        return;
    }
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const count = Math.max(...linhas.map(l => l.colunas.length));
    const widths = Array.from({ length: count }, (_v, i) => count >= 5 ? (i === 0 ? width * 0.4 : width * 0.6 / (count - 1)) : width / count);
    const row = (linha, header) => {
        doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
        const height = Math.max(22, ...linha.colunas.map((text, i) => doc.heightOfString(text, { width: widths[i] - 8 }) + 10));
        let x = doc.page.margins.left;
        const y = doc.y;
        linha.colunas.forEach((text, i) => {
            if (header)
                doc.rect(x, y, widths[i], height).fill('#edf2f7');
            doc.rect(x, y, widths[i], height).strokeColor('#9aa5b1').stroke();
            doc.fillColor('#000000').text(text, x + 4, y + 5, { width: widths[i] - 8 });
            x += widths[i];
        });
        doc.x = doc.page.margins.left;
        doc.y = y + height;
    };
    linhas.forEach((linha, index) => {
        doc.fontSize(8);
        const needed = Math.max(22, ...linha.colunas.map((text, i) => doc.heightOfString(text, { width: widths[i] - 8 }) + 10));
        if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            if (index > 0)
                row(linhas[0], true);
        }
        row(linha, index === 0);
    });
}
function renderPdf(input, outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const secoes = prepararSecoes(input);
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 56, bufferPages: true });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        doc.fontSize(12).font('Helvetica-Bold').text('SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Programa Nacional de Alimentação Escolar — PNAE', { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(13).font('Helvetica-Bold').text(`Chamada pública nº ${input.numero}/${input.ano}`, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(input.titulo, { align: 'center' });
        doc.moveDown(0.8);
        for (const [index, secao] of secoes.entries()) {
            if (input.separarSecoes && index > 0)
                doc.addPage();
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#01287C').text(secao.titulo);
            doc.moveDown(0.3);
            doc.fillColor('#000000');
            for (const parte of secao.partes) {
                if (parte.tipo === 'texto') {
                    doc.fontSize(10).font('Helvetica').text(parte.valor, { align: 'justify' });
                    doc.moveDown(0.4);
                }
                else if (parte.tipo === 'tabela') {
                    drawTable(doc, tabelaEspecial(parte.valor, input));
                    doc.moveDown(0.4);
                }
                else {
                    doc.moveDown(1.2);
                    doc.fontSize(10).text('________________________________');
                    doc.text('Assinatura do responsável');
                    doc.text('Nome, cargo e documento — a preencher');
                    doc.moveDown(0.6);
                }
            }
            doc.moveDown(0.6);
        }
        const range = doc.bufferedPageRange();
        for (let index = 0; index < range.count; index += 1) {
            doc.switchToPage(index);
            const bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            doc.fontSize(8).font('Helvetica').fillColor('#444444');
            doc.text(`PNAE · versão ${input.versao} · ${input.geradoEm} · ${input.usuario}`, 56, 28, { width: 480, align: 'right', lineBreak: false });
            doc.text(`Página ${index + 1} de ${range.count}`, 56, doc.page.height - 36, { width: 480, align: 'center', lineBreak: false });
            doc.page.margins.bottom = bottom;
        }
        doc.end();
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
    });
}
function paragrafo(texto, bold = false) {
    return new docx_1.Paragraph({
        spacing: { after: 120 },
        children: [new docx_1.TextRun({ text: texto, bold, font: 'Arial', size: bold ? 24 : 20 })],
    });
}
function tabelaDocx(linhas) {
    return new docx_1.Table({
        width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
        rows: (linhas.length ? linhas : [{ colunas: ['—'] }]).map((linha) => new docx_1.TableRow({
            children: linha.colunas.map((coluna) => new docx_1.TableCell({
                width: { size: Math.floor(100 / Math.max(linha.colunas.length, 1)), type: docx_1.WidthType.PERCENTAGE },
                children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: coluna, font: 'Arial', size: 18 })] })],
            })),
        })),
    });
}
async function renderDocx(input, outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const secoes = prepararSecoes(input);
    const children = [
        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [new docx_1.TextRun({ text: 'SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO', bold: true, font: 'Arial', size: 24 })] }),
        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, children: [new docx_1.TextRun({ text: `Chamada pública nº ${input.numero}/${input.ano}`, bold: true, font: 'Arial', size: 28 })] }),
        new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, spacing: { after: 240 }, children: [new docx_1.TextRun({ text: input.titulo, font: 'Arial', size: 20 })] }),
    ];
    for (const [index, secao] of secoes.entries()) {
        if (input.separarSecoes && index > 0)
            children.push(new docx_1.Paragraph({ pageBreakBefore: true, children: [] }));
        children.push(paragrafo(secao.titulo, true));
        for (const parte of secao.partes) {
            if (parte.tipo === 'texto')
                children.push(paragrafo(parte.valor));
            else if (parte.tipo === 'tabela')
                children.push(tabelaDocx(tabelaEspecial(parte.valor, input)));
            else {
                children.push(paragrafo('________________________________'));
                children.push(paragrafo('Assinatura do responsável — nome, cargo e documento a preencher'));
            }
        }
    }
    const doc = new docx_1.Document({
        sections: [{
                properties: { page: { margin: { top: 1000, bottom: 900, left: 900, right: 900 } } },
                headers: {
                    default: new docx_1.Header({
                        children: [new docx_1.Paragraph({
                                alignment: docx_1.AlignmentType.RIGHT,
                                children: [new docx_1.TextRun({ text: `PNAE · versão ${input.versao} · ${input.geradoEm} · ${input.usuario}`, font: 'Arial', size: 16, color: '444444' })],
                            })],
                    }),
                },
                footers: {
                    default: new docx_1.Footer({
                        children: [new docx_1.Paragraph({
                                alignment: docx_1.AlignmentType.CENTER,
                                children: [
                                    new docx_1.TextRun({ text: 'Página ', font: 'Arial', size: 16 }),
                                    new docx_1.TextRun({ children: [docx_1.PageNumber.CURRENT], font: 'Arial', size: 16 }),
                                    new docx_1.TextRun({ text: ' de ', font: 'Arial', size: 16 }),
                                    new docx_1.TextRun({ children: [docx_1.PageNumber.TOTAL_PAGES], font: 'Arial', size: 16 }),
                                ],
                            })],
                    }),
                },
                children,
            }],
    });
    const buffer = await docx_1.Packer.toBuffer(doc);
    await fs.promises.writeFile(outputPath, buffer);
    return outputPath;
}
//# sourceMappingURL=documento-renderer.js.map