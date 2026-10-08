import { ParserService } from './parser.service';
import { ParsedImportDocument } from '../types/importacao-parser.types';
export declare class SearchablePdfEditalParserService extends ParserService {
    parse(buffer: Buffer, fileName: string): Promise<ParsedImportDocument>;
    private cleanLines;
    private findTableStart;
    private extractItemsSection;
    private parseItems;
    private parseItemBlock;
    private parseSummaryLine;
    private findTrailingUnit;
    private isUnitQuantityLine;
    private parseUnitQuantityLine;
    private extractProductName;
    private extractTitle;
    private extractNumero;
    private extractAno;
    private extractMunicipio;
    private extractEscola;
    private extractObjeto;
    private extractData;
    private normalizeDate;
    private parseDecimal;
    private normalizeUnit;
}
