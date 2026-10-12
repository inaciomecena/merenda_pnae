import { Module } from '@nestjs/common';
import { VinculosService } from './application/services/vinculos.service';
import { BootstrapVinculoService } from './application/services/bootstrap-vinculo.service';
import { VinculosController, RepresentacoesController } from './presentation/controllers/vinculos.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [VinculosController, RepresentacoesController],
  providers: [VinculosService, BootstrapVinculoService],
  exports: [VinculosService],
})
export class VinculosModule {}
