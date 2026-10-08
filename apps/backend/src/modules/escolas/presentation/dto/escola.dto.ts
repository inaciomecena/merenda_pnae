import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateEscolaDto {
  @IsString()
  @Length(2, 160)
  nome!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Codigo INEP deve conter 8 digitos.' })
  codigo?: string;

  @IsString()
  municipioId!: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  responsavel?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateEscolaDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  nome?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Codigo INEP deve conter 8 digitos.' })
  codigo?: string;

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
  @IsString()
  responsavel?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
