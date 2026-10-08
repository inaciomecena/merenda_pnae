import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateProdutoReferenciaDto {
  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  subcategoria?: string;

  @IsOptional()
  @IsString()
  unidadePadrao?: string;

  @IsOptional()
  @IsString()
  palavrasChave?: string;

  @IsOptional()
  @IsString()
  sinonimos?: string;

  @IsOptional()
  @IsBoolean()
  agriculturaFamiliar?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateProdutoReferenciaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  subcategoria?: string;

  @IsOptional()
  @IsString()
  unidadePadrao?: string;

  @IsOptional()
  @IsString()
  palavrasChave?: string;

  @IsOptional()
  @IsString()
  sinonimos?: string;

  @IsOptional()
  @IsBoolean()
  agriculturaFamiliar?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
