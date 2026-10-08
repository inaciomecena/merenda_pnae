import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarMatchManualDto {
  @IsString()
  @IsNotEmpty()
  editalItemId!: string;

  @IsOptional()
  @IsString()
  editalId?: string;

  @IsOptional()
  @IsString()
  produtoReferenciaId?: string;

  @IsString()
  @IsNotEmpty()
  produtorId!: string;

  @IsString()
  @IsNotEmpty()
  produtorProdutoId!: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class AtualizarStatusMatchDto {
  @IsOptional()
  @IsString()
  observacoes?: string;
}
