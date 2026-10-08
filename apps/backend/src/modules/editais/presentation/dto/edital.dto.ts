import { IsDateString, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateEditalDto {
  @IsString()
  @Length(2, 120)
  numero!: string;

  @IsInt()
  ano!: number;

  @IsString()
  @Length(2, 200)
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  escolaId?: string;

  @IsOptional()
  @IsDateString()
  dataPublicacao?: string;
}

export class UpdateEditalDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  numero?: string;

  @IsOptional()
  @IsInt()
  ano?: number;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  escolaId?: string;

  @IsOptional()
  @IsDateString()
  dataPublicacao?: string;
}
