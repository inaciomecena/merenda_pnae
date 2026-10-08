import { Module } from '@nestjs/common';
import { EscolasController } from './presentation/controllers/escolas.controller';
import { EscolasService } from './application/services/escolas.service';

@Module({
  controllers: [EscolasController],
  providers: [EscolasService],
})
export class EscolasModule {}
