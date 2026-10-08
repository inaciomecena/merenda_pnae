import { Module } from '@nestjs/common';
import { HomologacaoController } from './presentation/controllers/homologacao.controller';
import { HomologacaoService } from './application/services/homologacao.service';

@Module({
  controllers: [HomologacaoController],
  providers: [HomologacaoService],
  exports: [HomologacaoService],
})
export class HomologacaoModule {}
