import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PrestacaoContasController, TransparenciaController } from './presentation/prestacao-contas.controller';
import { PrestacaoContasService } from './application/prestacao-contas.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [PrestacaoContasController, TransparenciaController],
  providers: [PrestacaoContasService],
  exports: [PrestacaoContasService],
})
export class PrestacaoContasModule {}
