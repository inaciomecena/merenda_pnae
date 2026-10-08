import { Module } from '@nestjs/common';
import { EscolasController } from './presentation/controllers/escolas.controller';
import { EscolasService } from './application/services/escolas.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EscolasController],
  providers: [EscolasService],
})
export class EscolasModule {}
