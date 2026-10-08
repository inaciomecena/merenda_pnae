import { Module } from '@nestjs/common';
import { ImportacaoController } from './presentation/controllers/importacao.controller';
import { ImportacaoService } from './application/services/importacao.service';

@Module({
  controllers: [ImportacaoController],
  providers: [ImportacaoService],
})
export class ImportacaoModule {}
