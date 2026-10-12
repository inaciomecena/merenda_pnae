import { Module } from '@nestjs/common';
import { GestaoOperacionalController, MonitoramentoController } from './gestao-operacional.controller';
import { GestaoOperacionalService } from './gestao-operacional.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [GestaoOperacionalController, MonitoramentoController],
  providers: [GestaoOperacionalService],
  exports: [GestaoOperacionalService],
})
export class GestaoOperacionalModule {}
