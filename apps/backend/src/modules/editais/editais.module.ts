import { Module } from '@nestjs/common';
import { EditaisController } from './presentation/controllers/editais.controller';
import { EditaisService } from './application/services/editais.service';

@Module({
  controllers: [EditaisController],
  providers: [EditaisService],
})
export class EditaisModule {}
