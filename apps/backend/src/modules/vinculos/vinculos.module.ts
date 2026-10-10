import { Module } from '@nestjs/common';
import { VinculosService } from './application/services/vinculos.service';
import { VinculosController, RepresentacoesController } from './presentation/controllers/vinculos.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [VinculosController, RepresentacoesController],
  providers: [VinculosService],
  exports: [VinculosService],
})
export class VinculosModule {}
