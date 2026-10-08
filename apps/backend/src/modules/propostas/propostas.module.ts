import { Module } from '@nestjs/common';
import { PropostasController } from './presentation/controllers/propostas.controller';
import { PropostasService } from './application/services/propostas.service';
import { DocumentGeneratorService } from './application/services/document-generator.service';
import { PdfGeneratorService } from './application/services/pdf-generator.service';
import { DocxGeneratorService } from './application/services/docx-generator.service';

@Module({
  controllers: [PropostasController],
  providers: [PropostasService, DocumentGeneratorService, PdfGeneratorService, DocxGeneratorService],
  exports: [PropostasService],
})
export class PropostasModule {}
