import { Module } from '@nestjs/common';
import { DREService } from './application/services/dre.service';
import { DREController, EscolaVinculoDREController, EntidadesExecutorasController } from './presentation/controllers/dre.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PolicyService } from '../../common/auth/policy.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DREController, EscolaVinculoDREController, EntidadesExecutorasController],
  providers: [DREService, PolicyService],
  exports: [DREService],
})
export class DREModule {}
