import { Module } from '@nestjs/common';
import { EscolasController } from './presentation/controllers/escolas.controller';
import { EscolasService } from './application/services/escolas.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EscolasController],
  providers: [EscolasService],
})
export class EscolasModule {}
