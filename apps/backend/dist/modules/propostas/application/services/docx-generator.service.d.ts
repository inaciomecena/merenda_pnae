import type { PropostaPdfData } from './pdf-generator.service';
export declare class DocxGeneratorService {
    generate(data: PropostaPdfData, outputPath: string): Promise<string>;
    private buildInfoTable;
    private buildItensTable;
}
