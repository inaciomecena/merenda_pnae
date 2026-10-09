import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ComposicaoEditalService } from './application/services/composicao-edital.service';
import { EngenhariaReversaImportacaoService } from './application/services/engenharia-reversa-importacao.service';
import { GeracaoEditalService } from './application/services/geracao-edital.service';
import { TemplatesDocumentoService } from './application/services/templates-documento.service';
import { ComposicaoEditalController } from './presentation/controllers/composicao-edital.controller';
import { TemplatesDocumentoController } from './presentation/controllers/templates-documento.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TemplatesDocumentoController, ComposicaoEditalController],
  providers: [
    TemplatesDocumentoService,
    ComposicaoEditalService,
    GeracaoEditalService,
    EngenhariaReversaImportacaoService,
  ],
  exports: [EngenhariaReversaImportacaoService, TemplatesDocumentoService],
})
export class ComposicaoEditaisModule {}
