import { Module } from '@nestjs/common';
import { ProdutoresController } from './presentation/controllers/produtores.controller';
import { ProdutoresService } from './application/services/produtores.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProdutoresController],
  providers: [ProdutoresService],
})
export class ProdutoresModule {}
