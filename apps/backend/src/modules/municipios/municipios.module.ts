import { Module } from '@nestjs/common';
import { MunicipiosController } from './presentation/controllers/municipios.controller';
import { MunicipiosService } from './application/services/municipios.service';

@Module({
  controllers: [MunicipiosController],
  providers: [MunicipiosService],
})
export class MunicipiosModule {}
