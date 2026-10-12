import { Type, Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const DECIMAL = /^\d+(\.\d{1,4})?$/;

export class ItemProgramacaoDto {
  @ApiProperty()
  @IsString()
  contratoItemId!: string;

  @ApiProperty()
  @Matches(DECIMAL)
  quantidadeProgramada!: string;
}

export class CreateProgramacaoEntregaDto {
  @ApiProperty()
  @IsString()
  contratoId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidadeEscolarId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string;

  @ApiProperty()
  @Matches(DATA)
  dataPrevista!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  periodoEntrega?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ type: [ItemProgramacaoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemProgramacaoDto)
  itens!: ItemProgramacaoDto[];
}

export class UpdateProgramacaoEntregaDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  versao!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivoReprogramacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA)
  dataPrevista?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  periodoEntrega?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ type: [ItemProgramacaoDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemProgramacaoDto)
  itens?: ItemProgramacaoDto[];
}

export class ConfirmarProgramacaoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class CancelarProgramacaoDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  motivo!: string;
}

export class ItemEntregaDto {
  @ApiProperty()
  @IsString()
  programacaoItemId!: string;

  @ApiProperty()
  @Matches(DECIMAL)
  quantidadeInformada!: string;

  @ApiProperty()
  @Matches(DECIMAL)
  quantidadeAceita!: string;

  @ApiProperty()
  @Matches(DECIMAL)
  quantidadeRejeitada!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoRejeicao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class CreateEntregaDto {
  @ApiProperty()
  @IsString()
  programacaoId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string;

  @ApiProperty()
  @Matches(DATA)
  dataEntrega!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numeroDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ type: [ItemEntregaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemEntregaDto)
  itens!: ItemEntregaDto[];
}

export class ConferirEntregaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class AceitarEntregaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class EstornarEntregaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  motivo!: string;
}

export class OcorrenciaEntregaDto {
  @ApiProperty({ enum: ['ENTREGA_INCOMPLETA', 'PRODUTO_DIVERGENTE', 'QUANTIDADE_DIVERGENTE', 'PRODUTO_DANIFICADO', 'PROBLEMA_QUALIDADE', 'PRODUTO_VENCIDO', 'ENTREGA_FORA_PRAZO', 'RECUSA_RECEBIMENTO', 'OUTRO'] })
  @IsIn(['ENTREGA_INCOMPLETA', 'PRODUTO_DIVERGENTE', 'QUANTIDADE_DIVERGENTE', 'PRODUTO_DANIFICADO', 'PROBLEMA_QUALIDADE', 'PRODUTO_VENCIDO', 'ENTREGA_FORA_PRAZO', 'RECUSA_RECEBIMENTO', 'OUTRO'])
  tipo!: 'ENTREGA_INCOMPLETA' | 'PRODUTO_DIVERGENTE' | 'QUANTIDADE_DIVERGENTE' | 'PRODUTO_DANIFICADO' | 'PROBLEMA_QUALIDADE' | 'PRODUTO_VENCIDO' | 'ENTREGA_FORA_PRAZO' | 'RECUSA_RECEBIMENTO' | 'OUTRO';

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  descricao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entregaItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidencias?: string;
}

export class TratarOcorrenciaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  tratativa!: string;

  @ApiProperty({ enum: ['RESOLVIDA', 'NAO_APLICAVEL'] })
  @IsIn(['RESOLVIDA', 'NAO_APLICAVEL'])
  status!: 'RESOLVIDA' | 'NAO_APLICAVEL';
}

export class AnexoEntregaDto {
  @ApiPropertyOptional({ description: 'Indica que o PDF anexado contém assinatura realizada fora do sistema.' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  assinadoExternamente?: boolean;
  @ApiProperty({ enum: ['COMPROVANTE_ENTREGA', 'NOTA_FISCAL', 'RECIBO', 'TERMO_RECEBIMENTO', 'EVIDENCIA_FOTOGRAFICA', 'OUTRO'] })
  @IsIn(['COMPROVANTE_ENTREGA', 'NOTA_FISCAL', 'RECIBO', 'TERMO_RECEBIMENTO', 'EVIDENCIA_FOTOGRAFICA', 'OUTRO'])
  tipo!: 'COMPROVANTE_ENTREGA' | 'NOTA_FISCAL' | 'RECIBO' | 'TERMO_RECEBIMENTO' | 'EVIDENCIA_FOTOGRAFICA' | 'OUTRO';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class TransicaoProgramacaoDto {
  @ApiProperty({ enum: ['PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'CANCELADA', 'RASCUNHO'] })
  @IsIn(['PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'CANCELADA', 'RASCUNHO'])
  para!: 'PROGRAMADA' | 'CONFIRMADA' | 'EM_ENTREGA' | 'PARCIALMENTE_RECEBIDA' | 'RECEBIDA' | 'CANCELADA' | 'RASCUNHO';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class TransicaoEntregaDto {
  @ApiProperty({ enum: ['EM_CONFERENCIA', 'CONFERIDA', 'ACEITA', 'COM_DIVERGENCIA', 'CANCELADA'] })
  @IsIn(['EM_CONFERENCIA', 'CONFERIDA', 'ACEITA', 'COM_DIVERGENCIA', 'CANCELADA'])
  para!: 'EM_CONFERENCIA' | 'CONFERIDA' | 'ACEITA' | 'COM_DIVERGENCIA' | 'CANCELADA';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class TransicaoOcorrenciaDto {
  @ApiProperty({ enum: ['EM_TRATATIVA', 'RESOLVIDA', 'NAO_APLICAVEL'] })
  @IsIn(['EM_TRATATIVA', 'RESOLVIDA', 'NAO_APLICAVEL'])
  para!: 'EM_TRATATIVA' | 'RESOLVIDA' | 'NAO_APLICAVEL';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  tratativa?: string;
}
