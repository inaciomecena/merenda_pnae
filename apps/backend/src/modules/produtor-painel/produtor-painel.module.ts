import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ProdutorPainelController, CatalogoProdutosController } from './presentation/produtor-painel.controller';
import { ProdutorPainelService } from './application/produtor-painel.service';

@Module({ imports: [AuthModule, AuditModule], controllers: [ProdutorPainelController, CatalogoProdutosController], providers: [ProdutorPainelService] })
export class ProdutorPainelModule {}
