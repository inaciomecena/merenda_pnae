import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^\d+(\.\d{1,4})?$/;

export class ItemContratoDto {
  @ApiProperty()
  @IsString()
  propostaItemId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DECIMAL)
  quantidade?: string;
}

export class CreateContratoDto {
  @ApiProperty()
  @IsString()
  propostaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2000)
  exercicio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  escolaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipioId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objeto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA)
  vigenciaInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA)
  vigenciaFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condicoesFornecimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condicoesPagamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fiscalizacao?: string;

  @ApiPropertyOptional({ type: [ItemContratoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemContratoDto)
  itens?: ItemContratoDto[];
}

export class UpdateContratoDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  versao!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  escolaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipioId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objeto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA)
  vigenciaInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA)
  vigenciaFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condicoesFornecimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condicoesPagamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fiscalizacao?: string;

  @ApiPropertyOptional({ type: [ItemContratoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemContratoDto)
  itens?: ItemContratoDto[];
}

export class SignatarioDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  nome!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiProperty({ enum: ['CONTRATANTE', 'CONTRATADO', 'TESTEMUNHA'] })
  @IsIn(['CONTRATANTE', 'CONTRATADO', 'TESTEMUNHA'])
  papel!: 'CONTRATANTE' | 'CONTRATADO' | 'TESTEMUNHA';
}

export class EnviarAssinaturaDto {
  @ApiProperty({ type: [SignatarioDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => SignatarioDto)
  signatarios!: SignatarioDto[];
}

export class FormalizarDto {
  @ApiProperty()
  @Matches(DATA)
  dataFormalizacao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentoId?: string;
}

export class TransicaoDto {
  @ApiProperty({ enum: ['VIGENTE', 'SUSPENSO', 'ENCERRADO', 'RESCINDIDO', 'CANCELADO', 'RASCUNHO'] })
  @IsIn(['VIGENTE', 'SUSPENSO', 'ENCERRADO', 'RESCINDIDO', 'CANCELADO', 'RASCUNHO'])
  para!: 'VIGENTE' | 'SUSPENSO' | 'ENCERRADO' | 'RESCINDIDO' | 'CANCELADO' | 'RASCUNHO';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class AnexoDocumentoDto {
  @ApiProperty({ enum: ['CONTRATO_ASSINADO', 'COMPLEMENTAR', 'ADITIVO'] })
  @IsIn(['CONTRATO_ASSINADO', 'COMPLEMENTAR', 'ADITIVO'])
  tipo!: 'CONTRATO_ASSINADO' | 'COMPLEMENTAR' | 'ADITIVO';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aditivoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class AditivoItemDto {
  @ApiProperty()
  @IsString()
  contratoItemId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DECIMAL)
  quantidadeNova?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DECIMAL)
  valorUnitarioNovo?: string;
}

export class CreateAditivoDto {
  @ApiProperty({ enum: ['PRAZO', 'VALOR', 'QUANTIDADE', 'RETIFICACAO', 'OUTRO'] })
  @IsIn(['PRAZO', 'VALOR', 'QUANTIDADE', 'RETIFICACAO', 'OUTRO'])
  tipo!: 'PRAZO' | 'VALOR' | 'QUANTIDADE' | 'RETIFICACAO' | 'OUTRO';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoOutro?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  justificativa!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA)
  data?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA)
  vigenciaFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^-?\d+(\.\d{1,2})?$/)
  valorAlteracao?: string;

  @ApiPropertyOptional({ type: [AditivoItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AditivoItemDto)
  itens?: AditivoItemDto[];
}
