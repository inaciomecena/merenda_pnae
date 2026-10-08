import { Module } from '@nestjs/common';
import { ReportsController } from './presentation/controllers/reports.controller';
import { ReportsService } from './application/services/reports.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
