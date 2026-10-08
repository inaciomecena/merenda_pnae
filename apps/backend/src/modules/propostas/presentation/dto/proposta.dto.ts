import { IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoPropostaDto {
  ANEXO_III = 'ANEXO_III',
  PROJETO_VENDA = 'PROJETO_VENDA',
}

export class PropostaItemDto {
  @ApiProperty()
  @IsString()
  produto!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  especificacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantidade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precoUnitario?: number;

  @ApiPropertyOptional()
  @IsOptional()
  matchId?: string;
}

export class CreatePropostaDto {
  @ApiProperty()
  @IsString()
  editalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  produtorId?: string;

  @ApiPropertyOptional({ enum: TipoPropostaDto })
  @IsOptional()
  @IsEnum(TipoPropostaDto)
  tipoDocumento?: TipoPropostaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  validadeDias?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  prazoEntrega?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({ type: [PropostaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropostaItemDto)
  itens?: PropostaItemDto[];
}

export class UpdatePropostaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  produtorId?: string;

  @ApiPropertyOptional({ enum: TipoPropostaDto })
  @IsOptional()
  @IsEnum(TipoPropostaDto)
  tipoDocumento?: TipoPropostaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  validadeDias?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  prazoEntrega?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({ type: [PropostaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropostaItemDto)
  itens?: PropostaItemDto[];
}

export class PreviewPropostaDto {
  @ApiProperty()
  @IsString()
  editalId!: string;

  @ApiProperty()
  @IsString()
  produtorId!: string;

  @ApiProperty({ enum: TipoPropostaDto })
  @IsEnum(TipoPropostaDto)
  tipoDocumento!: TipoPropostaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  validadeDias?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  prazoEntrega?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class GerarPropostaDto {
  @ApiProperty()
  @IsString()
  propostaId!: string;
}
