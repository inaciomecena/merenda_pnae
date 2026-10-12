import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ChamadasPublicasController } from './presentation/chamadas-publicas.controller';
import { ChamadasPublicasService } from './application/chamadas-publicas.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ChamadasPublicasController],
  providers: [ChamadasPublicasService],
})
export class ChamadasPublicasModule {}
