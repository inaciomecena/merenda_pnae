import { Module } from '@nestjs/common';
import { BalizamentoController } from './presentation/controllers/balizamento.controller';
import { BalizamentoService } from './application/services/balizamento.service';
import { MatchEngineService } from './application/services/match-engine.service';
import { TextNormalizerService } from './application/services/text-normalizer.service';

@Module({
  controllers: [BalizamentoController],
  providers: [BalizamentoService, MatchEngineService, TextNormalizerService],
})
export class BalizamentoModule {}
