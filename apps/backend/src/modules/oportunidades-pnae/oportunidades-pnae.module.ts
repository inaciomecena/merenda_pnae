import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { OportunidadesPnaeController } from './presentation/oportunidades-pnae.controller';
import { OportunidadesPnaeService } from './application/oportunidades-pnae.service';

@Module({ imports: [AuthModule, AuditModule], controllers: [OportunidadesPnaeController], providers: [OportunidadesPnaeService] })
export class OportunidadesPnaeModule {}
