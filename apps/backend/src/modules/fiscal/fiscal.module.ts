import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotaFiscalController } from './presentation/controllers/nota-fiscal.controller';
import { LiquidacaoController } from './presentation/controllers/liquidacao.controller';
import { PagamentoController } from './presentation/controllers/pagamento.controller';
import { DashboardFinanceiroController } from './presentation/controllers/dashboard-financeiro.controller';
import { NotaFiscalService } from './application/services/nota-fiscal.service';
import { XmlFiscalService } from './application/services/xml-fiscal.service';
import { FiscalDocumentoService } from './application/services/fiscal-documento.service';
import { ConciliacaoFiscalService } from './application/services/conciliacao-fiscal.service';
import { FiscalAcessoService } from './application/services/fiscal-acesso.service';
import { ConferenciaFiscalService } from './application/services/conferencia-fiscal.service';
import { AtestoService } from './application/services/atesto.service';
import { LiquidacaoService } from './application/services/liquidacao.service';
import { PagamentoService } from './application/services/pagamento.service';
import { DashboardFinanceiroService } from './application/services/dashboard-financeiro.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [
    NotaFiscalController,
    LiquidacaoController,
    PagamentoController,
    DashboardFinanceiroController,
  ],
  providers: [
    NotaFiscalService,
    XmlFiscalService,
    FiscalDocumentoService,
    ConciliacaoFiscalService,
    FiscalAcessoService,
    ConferenciaFiscalService,
    AtestoService,
    LiquidacaoService,
    PagamentoService,
    DashboardFinanceiroService,
  ],
  exports: [NotaFiscalService, FiscalDocumentoService],
})
export class FiscalModule {}
