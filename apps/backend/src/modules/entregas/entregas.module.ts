import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ProgramacaoEntregaController } from './presentation/controllers/programacao-entrega.controller';
import { EntregaController } from './presentation/controllers/entrega.controller';
import {
  OcorrenciaEntregaController,
  OcorrenciaEntregaGlobalController,
} from './presentation/controllers/ocorrencia-entrega.controller';
import { SaldoContratoController } from './presentation/controllers/saldo-contrato.controller';
import { ProgramacaoEntregaService } from './application/services/programacao-entrega.service';
import { EntregaService } from './application/services/entrega.service';
import { OcorrenciaEntregaService } from './application/services/ocorrencia-entrega.service';
import { SaldoContratoService } from './application/services/saldo-contrato.service';
import { EntregaAcessoService } from './application/services/entrega-acesso.service';
import { EntregaDocumentoService } from './application/services/entrega-documento.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [
    ProgramacaoEntregaController,
    EntregaController,
    OcorrenciaEntregaController,
    OcorrenciaEntregaGlobalController,
    SaldoContratoController,
  ],
  providers: [ProgramacaoEntregaService, EntregaService, OcorrenciaEntregaService, SaldoContratoService, EntregaAcessoService, EntregaDocumentoService],
  exports: [ProgramacaoEntregaService, EntregaService, OcorrenciaEntregaService, SaldoContratoService],
})
export class EntregasModule {}
