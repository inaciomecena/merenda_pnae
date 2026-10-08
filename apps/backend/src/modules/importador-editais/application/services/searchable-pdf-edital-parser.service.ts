import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { ParserService } from './parser.service';
import { ParsedImportDocument, ParsedImportItem } from '../types/importacao-parser.types';

const UNIT_ALIASES: Record<string, string> = {
  kg: 'KG',
  kilo: 'KG',
  quilo: 'KG',
  quilograma: 'KG',
  quilogramas: 'KG',
  unidade: 'UN',
  unidades: 'UN',
  un: 'UN',
  pacote: 'PCT',
  pacotes: 'PCT',
  litro: 'L',
  litros: 'L',
  mililitro: 'ML',
  mililitros: 'ML',
  ml: 'ML',
  l: 'L',
  caixa: 'CX',
  caixas: 'CX',
  maca: 'MACO',
  maco: 'MACO',
  macos: 'MACO',
  maço: 'MACO',
  maços: 'MACO',
  bandeja: 'BDJ',
  bandejas: 'BDJ',
  duzia: 'DZ',
  dúzia: 'DZ',
  duzias: 'DZ',
  dúzias: 'DZ',
};

const UNIT_PATTERN =
  '(Quilograma|Quilogramas|Kg|kg|Kilo|Quilo|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade|Unidades|Un|un|Pacote|Pacotes|Caixa|Caixas|Maço|Maços|Maco|Macos|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias)';

@Injectable()
export class SearchablePdfEditalParserService extends ParserService {
  async parse(buffer: Buffer, fileName: string): Promise<ParsedImportDocument> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const rawText = result.text ?? '';

      if (rawText.replace(/\s+/g, '').length < 100) {
        throw new BadRequestException(
          `O arquivo "${fileName}" nao possui texto pesquisavel suficiente (${rawText.replace(/\s+/g, '').length} caracteres). Verifique se o PDF nao e uma imagem digitalizada. Envie um PDF com texto selecionavel.`,
        );
      }

      const lines = this.cleanLines(rawText);
      const tableStartIndex = this.findTableStart(lines);

      if (tableStartIndex < 0) {
        throw new BadRequestException(
          `O arquivo "${fileName}" foi lido com sucesso, mas nao foi possivel localizar a tabela de itens. Verifique se o PDF contem uma tabela com colunas de produto, quantidade e unidade.`,
        );
      }

      const itemsSection = tableStartIndex >= 0 ? this.extractItemsSection(lines, tableStartIndex) : [];
      const items = this.parseItems(itemsSection);

      if (items.length === 0) {
        throw new BadRequestException(
          `O arquivo "${fileName}" contem uma tabela, mas nenhum item foi extraido. Verifique se o formato da tabela segue o padrao: numero do item, produto, especificacao, unidade e quantidade.`,
        );
      }
      const metadataLines = tableStartIndex >= 0 ? lines.slice(0, tableStartIndex) : lines;

      return {
        titulo: this.extractTitle(metadataLines, fileName),
        numero: this.extractNumero(lines, fileName),
        ano: this.extractAno(lines, fileName),
        municipio: this.extractMunicipio(lines, fileName),
        escola: this.extractEscola(lines),
        objeto: this.extractObjeto(lines),
        data: this.extractData(lines),
        observacoes: items.some((item) => item.pendenteConferencia)
          ? 'Há itens com extração parcial que precisam de conferência.'
          : undefined,
        itens: items,
        possuiTextoPesquisavel: true,
      };
    } finally {
      await parser.destroy();
    }
  }

  private cleanLines(text: string): string[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const cleaned: string[] = [];

    let skipStandalonePageNumber = false;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const next = lines[index + 1];

      if (/^-- \d+ of \d+ --$/i.test(line)) {
        skipStandalonePageNumber = true;
        continue;
      }

      if (skipStandalonePageNumber && /^\d+$/.test(line)) {
        skipStandalonePageNumber = false;
        continue;
      }

      skipStandalonePageNumber = false;

      cleaned.push(line);
    }

    return cleaned;
  }

  private findTableStart(lines: string[]): number {
    const idx = lines.findIndex((line) => /PRODUTO COM/i.test(line));
    if (idx >= 0) return idx;

    for (let i = 0; i < lines.length - 3; i++) {
      const line = lines[i];
      const next1 = lines[i + 1];
      const next2 = lines[i + 2];
      const next3 = lines[i + 3];
      if (/ESPECIFICAÇÃO TÉCNICA/i.test(line) && /MEDIDA|UNIDADE/i.test(next1) && /QUANTIDADE/i.test(next2)) {
        return i;
      }
      if (/ESPECIFICAÇÃO TÉCNICA/i.test(line) && /QUANTIDADE/i.test(next1)) {
        return i;
      }
      if (/UNIDADE DE/i.test(line) && /MEDIDA/i.test(next1) && /QUANTIDADE/i.test(next2)) {
        return i - 1 >= 0 ? i - 1 : i;
      }
    }

    return -1;
  }

  private extractItemsSection(lines: string[], startIndex: number): string[] {
    const section = lines.slice(startIndex);
    const itemsSection: string[] = [];
    let foundItem = false;

    for (const line of section) {
      if (/^\d+[.)]?\s*$/.test(line)) {
        foundItem = true;
      }

      if (foundItem && /^\d+[.)]\s+[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ]/.test(line)) {
        break;
      }

      itemsSection.push(line);
    }

    return itemsSection;
  }

  private parseItems(lines: string[]): ParsedImportItem[] {
    const blocks: string[][] = [];
    let current: string[] = [];

    for (const line of lines) {
      const inlineItemMatch = line.match(/^(\d+)\s+(.+)$/);
      const dottedItemMatch = line.match(/^(\d+)\.\s*$/);

      if (/^\d+$/.test(line) || dottedItemMatch) {
        if (current.length > 0) {
          blocks.push(current);
        }

        const num = dottedItemMatch ? dottedItemMatch[1] : line;
        current = [num];
        continue;
      }

      if (
        inlineItemMatch &&
        /[A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç]/.test(inlineItemMatch[2]) &&
        !/^R\$/i.test(inlineItemMatch[2])
      ) {
        if (current.length > 0) {
          blocks.push(current);
        }

        current = [inlineItemMatch[1], inlineItemMatch[2]];
        continue;
      }

      if (!current.length) {
        continue;
      }

      current.push(line);
    }

    if (current.length > 0) {
      blocks.push(current);
    }

    return blocks
      .map((block) => this.parseItemBlock(block))
      .filter((item): item is ParsedImportItem => item !== null);
  }

  private parseItemBlock(block: string[]): ParsedImportItem | null {
    const numberLine = block[0];
    const numeroItem = Number(numberLine);

    if (!Number.isInteger(numeroItem)) {
      return null;
    }

    const summaryIndex = block.findIndex((line) => /R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}\s+R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}$/.test(line));
    const summaryLine = summaryIndex >= 0 ? block[summaryIndex] : undefined;

    const unitQtyIndex = block.findIndex((line) => this.isUnitQuantityLine(line) && !/R\$/.test(line));
    const unitQtyLine = unitQtyIndex >= 0 ? block[unitQtyIndex] : undefined;

    const skipIndices = new Set<number>();
    if (summaryIndex >= 0) skipIndices.add(summaryIndex);
    if (unitQtyIndex >= 0 && unitQtyIndex !== summaryIndex) skipIndices.add(unitQtyIndex);

    const detailLines = block.slice(1).filter((_, i) => !skipIndices.has(i + 1));
    const detailText = detailLines.join(' ').replace(/\s+/g, ' ').trim();
    // O nome sempre começa nas primeiras linhas do bloco. Usar esse recorte
    // evita que uma linha de especificação (ex.: "sujidades") vire o produto
    // quando o PDF quebra a descrição entre páginas.
    const headerText = block.slice(1, 6).join(' ').replace(/\s+/g, ' ').trim();
    const extracted = this.extractProductName(headerText || detailText);
    const produtoOriginal = extracted.produtoOriginal;
    const especificacao = detailText || extracted.especificacao;
    const observacoes = extracted.observacoes;

    let summary = summaryLine ? this.parseSummaryLine(summaryLine) : undefined;

    if (!summary?.quantidade && unitQtyLine) {
      summary = this.parseUnitQuantityLine(unitQtyLine, summary);
    }

    const quantidade = summary?.quantidade;
    const unidade = summary?.unidade;
    const precoUnitario = summary?.precoUnitario;
    const valorTotal = summary?.valorTotal;
    const pendenteConferencia = !produtoOriginal || !quantidade || !unidade;

    return {
      numeroItem,
      produtoOriginal: produtoOriginal || `ITEM ${numeroItem}`,
      especificacao,
      quantidade,
      unidade,
      precoUnitario,
      valorTotal,
      observacoes,
      pendenteConferencia,
    };
  }

  private parseSummaryLine(line: string): { unidade?: string; quantidade?: number; precoUnitario?: number; valorTotal?: number } {
    const regex = new RegExp(
      `^(?<prefix>.*?)(?:(?<unit>${UNIT_PATTERN})\\s+)?(?<quantity>\\d+(?:\\.\\d{3})*(?:,\\d+)?)\\s+R\\$\\s*(?<unitPrice>\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s+R\\$\\s*(?<total>\\d{1,3}(?:\\.\\d{3})*,\\d{2})$`,
      'i',
    );

    const match = line.match(regex);
    if (!match?.groups) {
      return {};
    }

    const rawUnit = match.groups.unit || this.findTrailingUnit(match.groups.prefix || '');

    return {
      unidade: rawUnit ? this.normalizeUnit(rawUnit) : undefined,
      quantidade: this.parseDecimal(match.groups.quantity),
      precoUnitario: this.parseDecimal(match.groups.unitPrice),
      valorTotal: this.parseDecimal(match.groups.total),
    };
  }

  private findTrailingUnit(value: string): string | undefined {
    const normalized = value.trim().split(/\s+/).at(-1);
    return normalized || undefined;
  }

  private isUnitQuantityLine(line: string): boolean {
    return /^(?:Quilograma|Quilogramas|Kg|kg|Kilo|Quilo|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade|Unidades|Un|un|Pacote|Pacotes|Caixa|Caixas|Maço|Maços|Maco|Macos|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias|Unidade de \d+\s*(?:Kg|kg|g|ml|l|L|un|unidades)?)/i.test(line);
  }

  private parseUnitQuantityLine(line: string, existing?: { unidade?: string; quantidade?: number; precoUnitario?: number; valorTotal?: number }): { unidade?: string; quantidade?: number; precoUnitario?: number; valorTotal?: number } {
    const unitMatch = line.match(/^(Quilograma|Quilogramas|Kg|kg|Kilo|Quilo|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade de \d+\s*(?:Kg|kg|g|ml|l|L|un|unidades)?|Unidade|Unidades|Un|un|Pacote|Pacotes|Caixa|Caixas|Maço|Maços|Maco|Macos|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias)\s+(\d[\d.]*)$/i);

    if (unitMatch) {
      return {
        unidade: this.normalizeUnit(unitMatch[1]),
        quantidade: this.parseDecimal(unitMatch[2]),
        precoUnitario: existing?.precoUnitario,
        valorTotal: existing?.valorTotal,
      };
    }

    const qtyMatch = line.match(/^(\d[\d.]*)$/);
    if (qtyMatch) {
      return {
        unidade: existing?.unidade,
        quantidade: this.parseDecimal(qtyMatch[1]),
        precoUnitario: existing?.precoUnitario,
        valorTotal: existing?.valorTotal,
      };
    }

    return existing || {};
  }

  private extractProductName(detailText: string): { produtoOriginal: string; especificacao?: string; observacoes?: string } {
    if (!detailText) {
      return { produtoOriginal: '' };
    }

    const firstComma = detailText.indexOf(',');
    if (firstComma > 0) {
      const produtoOriginal = detailText.slice(0, firstComma).trim();
      const remainder = detailText.slice(firstComma + 1).trim();
      return {
        produtoOriginal,
        especificacao: detailText,
        observacoes: remainder || undefined,
      };
    }

    const firstPeriod = detailText.indexOf('.');
    if (firstPeriod > 0) {
      const produtoOriginal = detailText.slice(0, firstPeriod).trim();
      return {
        produtoOriginal,
        especificacao: detailText,
      };
    }

    return {
      produtoOriginal: detailText.slice(0, 120).trim(),
      especificacao: detailText,
    };
  }

  private extractTitle(lines: string[], fileName: string): string {
    const titleLine =
      lines.find((line) => /(Edital|CHAMADA PÚBLICA|PREGÃO PRESENCIAL)/i.test(line)) ||
      fileName.replace(/\.pdf$/i, '');

    return titleLine.trim();
  }

  private extractNumero(lines: string[], fileName: string): string | undefined {
    const joined = `${lines.slice(0, 30).join(' ')} ${fileName}`;
    const match = joined.match(/(?:n[ºo°]\s*|N[ºO°]\s*|P[ÚU]BLICA\s+)(\d{1,4}\/\d{4})/i);
    return match?.[1];
  }

  private extractAno(lines: string[], fileName: string): number | undefined {
    const numero = this.extractNumero(lines, fileName);
    if (numero) {
      return Number(numero.split('/').at(-1));
    }

    const joined = `${lines.join(' ')} ${fileName}`;
    const yearMatch = joined.match(/ano letivo de (\d{4})/i) || joined.match(/\b(20\d{2})\b/);
    return yearMatch ? Number(yearMatch[1]) : undefined;
  }

  private extractMunicipio(lines: string[], fileName: string): string | undefined {
    const fromFileName = fileName.match(/-\s*([A-ZÁÀÃÂÉÊÍÓÔÕÚÇa-záàãâéêíóôõúç\s]+)\.pdf$/i);
    if (fromFileName?.[1]) {
      return fromFileName[1].replace(/\s+/g, ' ').trim();
    }

    const joined = `${lines.join(' ')} ${fileName}`;
    const matches = [...joined.matchAll(/munic[ií]pio de\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÇa-záàãâéêíóôõúç\s]+?)(?:\/MT|-MT|, MT| no ano|, para| para)/gi)];
    const lastMatch = matches.at(-1);
    return lastMatch?.[1]?.replace(/\s+/g, ' ').trim();
  }

  private extractEscola(lines: string[]): string | undefined {
    const joined = lines.slice(0, 80).join(' ');
    const match =
      joined.match(/na\s+(Escola\s+.+?),\s+situada/i) ||
      joined.match(/(Escola\s+Estadual\s+.+?),\s+situada/i);
    return match?.[1]?.replace(/\s+/g, ' ').trim();
  }

  private extractObjeto(lines: string[]): string | undefined {
    const joined = lines.join(' ');
    const directMatch = joined.match(/OBJETO:\s*(.+?)(?:CRIT[ÉE]RIO DE JULGAMENTO|1\. PRE[ÂA]MBULO|1\. OBJETO)/i);
    if (directMatch?.[1]) {
      return directMatch[1].replace(/\s+/g, ' ').trim();
    }

    const sectionMatch = joined.match(/1\.1\.\s*O objeto.+?(?:PNAE[\.,]?)(.+?)(?:especifica[cç][õo]es|2\. DOS PRE[ÇC]OS)/i);
    return sectionMatch?.[0]?.replace(/\s+/g, ' ').trim();
  }

  private extractData(lines: string[]): string | undefined {
    const joined = lines.slice(0, 80).join(' ');
    const numericMatch = joined.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
    if (numericMatch) {
      return this.normalizeDate(numericMatch[1]);
    }

    const extensoMatch = joined.match(
      /\b(\d{1,2}\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4})\b/i,
    );

    return extensoMatch ? this.normalizeDate(extensoMatch[1]) : undefined;
  }

  private normalizeDate(value: string): string {
    const months: Record<string, string> = {
      janeiro: '01',
      fevereiro: '02',
      março: '03',
      marco: '03',
      abril: '04',
      maio: '05',
      junho: '06',
      julho: '07',
      agosto: '08',
      setembro: '09',
      outubro: '10',
      novembro: '11',
      dezembro: '12',
    };

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      return `${year}-${month}-${day}`;
    }

    const match = value.match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);
    if (!match) {
      return value;
    }

    const day = match[1].padStart(2, '0');
    const month = months[match[2].toLowerCase()] || '01';
    const year = match[3];

    return `${year}-${month}-${day}`;
  }

  private parseDecimal(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private normalizeUnit(value: string): string {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return UNIT_ALIASES[normalized] || value.toUpperCase();
  }
}
