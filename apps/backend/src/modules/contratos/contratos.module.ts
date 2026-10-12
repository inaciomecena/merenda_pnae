import { Module } from '@nestjs/common';
import { ContratosController } from './presentation/controllers/contratos.controller';
import { ContratosService } from './application/services/contratos.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ComposicaoEditaisModule } from '../composicao-editais/composicao-editais.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, ComposicaoEditaisModule],
  controllers: [ContratosController],
  providers: [ContratosService],
  exports: [ContratosService],
})
export class ContratosModule {}