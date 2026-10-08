import { Injectable } from '@nestjs/common';
import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, TextRun,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import type { PropostaPdfData } from './pdf-generator.service';

@Injectable()
export class DocxGeneratorService {
  async generate(data: PropostaPdfData, outputPath: string): Promise<string> {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const title = data.tipoDocumento === 'ANEXO_III'
      ? 'ANEXO III — MODELO DE PROPOSTA DE PREÇOS'
      : 'PROJETO DE VENDA DA AGRICULTURA FAMILIAR';

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'GOVERNO DO ESTADO DE MATO GROSSO', bold: true, size: 28, font: 'Arial' }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'SECRETARIA DE ESTADO DE EDUCAÇÃO', bold: true, size: 24, font: 'Arial' }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Programa Nacional de Alimentação Escolar — PNAE', size: 20, font: 'Arial' }),
          ]}),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: title, bold: true, size: 26, font: 'Arial' }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: `Proposta nº ${data.numeroProposta}`, size: 20, font: 'Arial' }),
          ]}),
          new Paragraph({ text: '' }),
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '01287C' } },
            children: [],
          }),
          new Paragraph({ text: '' }),

          new Paragraph({ children: [new TextRun({ text: 'DADOS DA LICITAÇÃO/CHAMADA PÚBLICA', bold: true, size: 22, font: 'Arial' })] }),
          this.buildInfoTable([
            [`Número: ${data.edital.numero}/${data.edital.ano}`, 'Modalidade: Pregão'],
            [`Objeto: ${data.edital.objeto || data.edital.titulo}`, ''],
            [`Município: ${data.edital.municipio?.nome || '—'}-${data.edital.municipio?.uf || 'MT'}`, ''],
          ]),
          new Paragraph({ text: '' }),

          new Paragraph({ children: [new TextRun({ text: 'DADOS DO PRODUTOR/LICITANTE', bold: true, size: 22, font: 'Arial' })] }),
          this.buildInfoTable([
            [`Nome/Razão Social: ${data.produtor.nome}`, `CPF/CNPJ: ${data.produtor.cpfCnpj || '—'}`],
            [`Endereço: ${data.produtor.endereco || '—'}`, ''],
            [`Município: ${data.produtor.municipio?.nome || '—'}-${data.produtor.municipio?.uf || 'MT'}`, `Telefone: ${data.produtor.telefone || '—'}`],
            [`E-mail: ${data.produtor.email || '—'}`, ''],
          ]),
          new Paragraph({ text: '' }),

          new Paragraph({ children: [new TextRun({ text: 'ITENS DA PROPOSTA', bold: true, size: 22, font: 'Arial' })] }),
          this.buildItensTable(data),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [
            new TextRun({ text: `VALOR TOTAL DA PROPOSTA: R$ ${data.valorTotal.toFixed(2)}`, bold: true, size: 22, font: 'Arial' }),
          ]}),
          new Paragraph({ text: '' }),

          new Paragraph({ children: [new TextRun({ text: 'CONDIÇÕES', bold: true, size: 22, font: 'Arial' })] }),
          new Paragraph({ children: [new TextRun({ text: `• Validade da proposta: ${data.validadeDias} dias.`, size: 20, font: 'Arial' })] }),
          new Paragraph({ children: [new TextRun({ text: `• Prazo de entrega: ${data.prazoEntrega} dias após solicitação.`, size: 20, font: 'Arial' })] }),
          ...(data.observacao ? [new Paragraph({ children: [new TextRun({ text: `• Observações: ${data.observacao}`, size: 20, font: 'Arial' })] })] : []),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),

          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: `${data.edital.municipio?.nome || 'Município'}, ${data.dataGeracao}`, size: 20, font: 'Arial' }),
          ]}),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: '________________________________________', size: 20, font: 'Arial' }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Assinatura do Representante Legal', size: 20, font: 'Arial' }),
          ]}),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  private buildInfoTable(rows: string[][]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(row =>
        new TableRow({
          children: row.map(cell =>
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: cell || '—', size: 20, font: 'Arial' })] })],
            })
          ),
        })
      ),
    });
  }

  private buildItensTable(data: PropostaPdfData): Table {
    const headers = ['Item', 'Produto', 'Marca', 'Qtd.', 'Valor Unit.', 'Valor Total'];
    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map(h =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: '01287C' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18, font: 'Arial' }),
          ]})],
        })
      ),
    });

    const dataRows = data.itens.map((item, i) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), size: 18, font: 'Arial' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.produto, size: 18, font: 'Arial' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.marca || '—', size: 18, font: 'Arial' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.quantidade ? `${item.quantidade} ${item.unidade || ''}` : '—', size: 18, font: 'Arial' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.precoUnitario ? `R$ ${item.precoUnitario.toFixed(2)}` : '—', size: 18, font: 'Arial' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.valorTotal ? `R$ ${item.valorTotal.toFixed(2)}` : '—', size: 18, font: 'Arial' })] })] }),
        ],
      })
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    });
  }
}
