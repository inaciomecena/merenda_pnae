import { Module } from '@nestjs/common';
import { ProdutosReferenciaController } from './presentation/controllers/produtos-referencia.controller';
import { ProdutosReferenciaService } from './application/services/produtos-referencia.service';

@Module({
  controllers: [ProdutosReferenciaController],
  providers: [ProdutosReferenciaService],
})
export class ProdutosReferenciaModule {}
