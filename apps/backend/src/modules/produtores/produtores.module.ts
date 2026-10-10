import { Module } from '@nestjs/common';
import { ProdutoresController } from './presentation/controllers/produtores.controller';
import { ProdutoresService } from './application/services/produtores.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProdutoresController],
  providers: [ProdutoresService],
})
export class ProdutoresModule {}
