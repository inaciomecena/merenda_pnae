import { Module } from '@nestjs/common';
import { EditaisController } from './presentation/controllers/editais.controller';
import { EditaisService } from './application/services/editais.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EditaisController],
  providers: [EditaisService],
})
export class EditaisModule {}
