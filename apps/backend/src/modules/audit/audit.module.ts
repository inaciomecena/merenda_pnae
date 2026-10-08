import { Module } from '@nestjs/common';
import { AuditController } from './presentation/controllers/audit.controller';
import { AuditService } from './application/services/audit.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
