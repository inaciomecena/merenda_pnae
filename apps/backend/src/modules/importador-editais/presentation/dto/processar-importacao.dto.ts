import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ProcessarImportacaoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reprocessar?: boolean;
}
