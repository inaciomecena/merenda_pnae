import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { PropostaPdfData } from './pdf-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { DocxGeneratorService } from './docx-generator.service';
import { TipoPropostaDto } from '../../presentation/dto/proposta.dto';
export declare class DocumentGeneratorService {
    private readonly prisma;
    private readonly pdfGenerator;
    private readonly docxGenerator;
    constructor(prisma: PrismaService, pdfGenerator: PdfGeneratorService, docxGenerator: DocxGeneratorService);
    preview(editalId: string, produtorId: string, tipoDocumento: TipoPropostaDto): Promise<PropostaPdfData>;
    generate(propostaId: string): Promise<{
        pdfPath: string;
        docxPath: string;
    }>;
    getFilePath(propostaId: string, tipo: 'pdf' | 'docx'): Promise<string>;
}
