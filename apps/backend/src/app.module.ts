import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { HealthController } from './presentation/controllers/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { EditaisModule } from './modules/editais/editais.module';
import { ProdutosReferenciaModule } from './modules/produtos-referencia/produtos-referencia.module';
import { ProdutoresModule } from './modules/produtores/produtores.module';
import { ImportadorEditaisModule } from './modules/importador-editais/importador-editais.module';
import { BalizamentoModule } from './modules/balizamento/balizamento.module';
import { PropostasModule } from './modules/propostas/propostas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MunicipiosModule } from './modules/municipios/municipios.module';
import { EscolasModule } from './modules/escolas/escolas.module';
import { AuditModule } from './modules/audit/audit.module';
import { ConfigModule as SystemConfigModule } from './modules/config/config.module';
import { HomologacaoModule } from './modules/homologacao/homologacao.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { ComposicaoEditaisModule } from './modules/composicao-editais/composicao-editais.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    MunicipiosModule,
    EscolasModule,
    EditaisModule,
    ProdutosReferenciaModule,
    ProdutoresModule,
    ImportadorEditaisModule,
    BalizamentoModule,
    PropostasModule,
    DashboardModule,
    AuditModule,
    SystemConfigModule,
    HomologacaoModule,
    ReportsModule,
    UsersModule,
    ComposicaoEditaisModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
