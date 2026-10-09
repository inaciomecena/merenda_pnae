import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { aplicarPlaceholders } from './placeholders';
import { htmlParaTexto } from './templates-padrao';

export interface LinhaTabela {
  colunas: string[];
}

export interface SecaoRender {
  titulo: string;
  tipo: string;
  ordem: number;
  conteudo: string;
}

export interface DocumentoRenderInput {
  numero: string;
  ano: number;
  titulo: string;
  versao: number;
  usuario: string;
  geradoEm: string;
  valores: Record<string, string>;
  secoes: SecaoRender[];
  itens: LinhaTabela[];
  escolas: string[];
  fornecedores: string[];
  separarSecoes?: boolean;
}

function tabelaEspecial(chave: string, input: DocumentoRenderInput): LinhaTabela[] {
  if (chave === 'itens') return input.itens;
  if (chave === 'escolas') return input.escolas.map((escola) => ({ colunas: [escola] }));
  if (chave === 'fornecedores') return input.fornecedores.length ? input.fornecedores.map((item) => ({ colunas: [item] })) : [{ colunas: ['A preencher na seleção da chamada'] }];
  return [];
}

function partesDoConteudo(conteudo: string): Array<{ tipo: 'texto' | 'tabela' | 'assinaturas'; valor: string }> {
  const partes: Array<{ tipo: 'texto' | 'tabela' | 'assinaturas'; valor: string }> = [];
  const regex = /\{\{(itens|escolas|fornecedores|assinaturas)\}\}/g;
  let cursor = 0;
  for (const match of conteudo.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > cursor) partes.push({ tipo: 'texto', valor: conteudo.slice(cursor, index) });
    partes.push({ tipo: match[1] === 'assinaturas' ? 'assinaturas' : 'tabela', valor: match[1] });
    cursor = index + match[0].length;
  }
  if (cursor < conteudo.length) partes.push({ tipo: 'texto', valor: conteudo.slice(cursor) });
  return partes.filter((parte) => parte.tipo !== 'texto' || parte.valor.trim());
}

export function prepararSecoes(input: DocumentoRenderInput): Array<{ titulo: string; partes: ReturnType<typeof partesDoConteudo> }> {
  return [...input.secoes]
    .sort((a, b) => a.ordem - b.ordem)
    .map((secao) => {
      const texto = htmlParaTexto(secao.conteudo || '');
      const aplicado = aplicarPlaceholders(texto, input.valores);
      return { titulo: secao.titulo, partes: partesDoConteudo(aplicado.texto) };
    });
}

function drawTable(doc: any, linhas: LinhaTabela[]) {
  if (!linhas.length) {
    doc.fontSize(10).font('Helvetica-Oblique').text('Tabela sem linhas.');
    return;
  }
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const count = Math.max(...linhas.map(l => l.colunas.length));
  const widths = Array.from({ length: count }, (_v, i) => count >= 5 ? (i === 0 ? width * 0.4 : width * 0.6 / (count - 1)) : width / count);
  const row = (linha: LinhaTabela, header: boolean) => {
    doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
    const height = Math.max(22, ...linha.colunas.map((text, i) => doc.heightOfString(text, { width: widths[i] - 8 }) + 10));
    let x = doc.page.margins.left;
    const y = doc.y;
    linha.colunas.forEach((text, i) => {
      if (header) doc.rect(x, y, widths[i], height).fill('#edf2f7');
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
      if (index > 0) row(linhas[0], true);
    }
    row(linha, index === 0);
  });
}

export function renderPdf(input: DocumentoRenderInput, outputPath: string): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const secoes = prepararSecoes(input);

  return new Promise((resolve, reject) => {
    const doc = new (PDFDocument as any)({ size: 'A4', margin: 56, bufferPages: true });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(12).font('Helvetica-Bold').text('SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Programa Nacional de Alimentação Escolar — PNAE', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(13).font('Helvetica-Bold').text(`Chamada pública nº ${input.numero}/${input.ano}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(input.titulo, { align: 'center' });
    doc.moveDown(0.8);

    for (const [index, secao] of secoes.entries()) {
      if (input.separarSecoes && index > 0) doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#01287C').text(secao.titulo);
      doc.moveDown(0.3);
      doc.fillColor('#000000');
      for (const parte of secao.partes) {
        if (parte.tipo === 'texto') {
          doc.fontSize(10).font('Helvetica').text(parte.valor, { align: 'justify' });
          doc.moveDown(0.4);
        } else if (parte.tipo === 'tabela') {
          drawTable(doc, tabelaEspecial(parte.valor, input));
          doc.moveDown(0.4);
        } else {
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

function paragrafo(texto: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: texto, bold, font: 'Arial', size: bold ? 24 : 20 })],
  });
}

function tabelaDocx(linhas: LinhaTabela[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: (linhas.length ? linhas : [{ colunas: ['—'] }]).map((linha) => new TableRow({
      children: linha.colunas.map((coluna) => new TableCell({
        width: { size: Math.floor(100 / Math.max(linha.colunas.length, 1)), type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: coluna, font: 'Arial', size: 18 })] })],
      })),
    })),
  });
}

export async function renderDocx(input: DocumentoRenderInput, outputPath: string): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const secoes = prepararSecoes(input);
  const children: Array<Paragraph | Table> = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO', bold: true, font: 'Arial', size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Chamada pública nº ${input.numero}/${input.ano}`, bold: true, font: 'Arial', size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: input.titulo, font: 'Arial', size: 20 })] }),
  ];

  for (const [index, secao] of secoes.entries()) {
    if (input.separarSecoes && index > 0) children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
    children.push(paragrafo(secao.titulo, true));
    for (const parte of secao.partes) {
      if (parte.tipo === 'texto') children.push(paragrafo(parte.valor));
      else if (parte.tipo === 'tabela') children.push(tabelaDocx(tabelaEspecial(parte.valor, input)));
      else {
        children.push(paragrafo('________________________________'));
        children.push(paragrafo('Assinatura do responsável — nome, cargo e documento a preencher'));
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 900, left: 900, right: 900 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `PNAE · versão ${input.versao} · ${input.geradoEm} · ${input.usuario}`, font: 'Arial', size: 16, color: '444444' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Página ', font: 'Arial', size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16 }),
              new TextRun({ text: ' de ', font: 'Arial', size: 16 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16 }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.promises.writeFile(outputPath, buffer);
  return outputPath;
}
