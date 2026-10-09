import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateProdutorDto {
  @IsOptional() @IsObject() dadosDocumentais?: Record<string, string>;
  @IsString()
  @Length(2, 160)
  nome!: string;

  @IsOptional()
  @IsString()
  cpfCnpj?: string;

  @IsString()
  municipioId!: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProdutorDto {
  @IsOptional() @IsObject() dadosDocumentais?: Record<string, string>;
  @IsOptional()
  @IsString()
  @Length(2, 160)
  nome?: string;

  @IsOptional()
  @IsString()
  cpfCnpj?: string;

  @IsOptional()
  @IsString()
  municipioId?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateProdutorProdutoDto {
  @IsString()
  @Length(2, 160)
  produto!: string;

  @IsOptional()
  @IsString()
  capacidade?: string;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsString()
  periodoProducao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  precoSugerido?: number;
}

export class UpdateProdutorProdutoDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  produto?: string;

  @IsOptional()
  @IsString()
  capacidade?: string;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsString()
  periodoProducao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  precoSugerido?: number;
}
