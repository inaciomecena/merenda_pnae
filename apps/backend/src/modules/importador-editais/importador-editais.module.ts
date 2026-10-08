import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ImportacoesController } from './presentation/controllers/importacoes.controller';
import { ImportacoesRepository } from './application/repositories/importacoes.repository';
import { ImportadorEditaisService } from './application/services/importador-editais.service';
import { ParserService } from './application/services/parser.service';
import { SearchablePdfEditalParserService } from './application/services/searchable-pdf-edital-parser.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImportacoesController],
  providers: [
    ImportacoesRepository,
    ImportadorEditaisService,
    SearchablePdfEditalParserService,
    {
      provide: ParserService,
      useExisting: SearchablePdfEditalParserService,
    },
  ],
})
export class ImportadorEditaisModule {}
