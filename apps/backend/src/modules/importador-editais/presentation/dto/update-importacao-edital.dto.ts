import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateImportacaoEditalDto {
  @ApiPropertyOptional({ description: 'Número do edital' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  numero?: string;

  @ApiPropertyOptional({ description: 'Ano do edital' })
  @IsOptional()
  @IsInt()
  ano?: number;

  @ApiPropertyOptional({ description: 'Título do edital' })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  titulo?: string;

  @ApiPropertyOptional({ description: 'Descrição do edital' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: 'Objeto do edital' })
  @IsOptional()
  @IsString()
  objeto?: string;

  @ApiPropertyOptional({ description: 'ID da escola vinculada' })
  @IsOptional()
  @IsString()
  escolaId?: string;

  @ApiPropertyOptional({ description: 'ID do município vinculado' })
  @IsOptional()
  @IsString()
  municipioId?: string;

  @ApiPropertyOptional({ description: 'Data de publicação (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dataPublicacao?: string;
}
