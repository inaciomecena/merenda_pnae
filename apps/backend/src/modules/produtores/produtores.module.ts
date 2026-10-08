import { Module } from '@nestjs/common';
import { ProdutoresController } from './presentation/controllers/produtores.controller';
import { ProdutoresService } from './application/services/produtores.service';

@Module({
  controllers: [ProdutoresController],
  providers: [ProdutoresService],
})
export class ProdutoresModule {}
