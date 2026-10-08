import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateMunicipioDto {
  @IsString()
  @Length(2, 120)
  nome!: string;

  @IsString()
  @Length(2, 2)
  @Matches(/^MT$/i, { message: 'UF deve ser MT.' })
  uf!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7}$/, { message: 'Codigo IBGE deve conter 7 digitos.' })
  codigoIbge?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateMunicipioDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nome?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^MT$/i, { message: 'UF deve ser MT.' })
  uf?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7}$/, { message: 'Codigo IBGE deve conter 7 digitos.' })
  codigoIbge?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
