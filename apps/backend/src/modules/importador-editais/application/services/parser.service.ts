import { ParsedImportDocument } from '../types/importacao-parser.types';

export abstract class ParserService {
  abstract parse(buffer: Buffer, fileName: string): Promise<ParsedImportDocument>;
}
