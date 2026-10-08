import { Module } from '@nestjs/common';
import { ConfigController } from './presentation/controllers/config.controller';
import { ConfigService } from './application/services/config.service';

@Module({
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
