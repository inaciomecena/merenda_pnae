import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, Length, Matches } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'ID da escola vinculada (legado, uma escola)' })
  @IsOptional()
  @IsString()
  escolaId?: string;

  @ApiPropertyOptional({ description: 'IDs das escolas vinculadas (múltiplas)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  escolaIds?: string[];

  @ApiPropertyOptional({ description: 'ID do município vinculado' })
  @IsOptional()
  @IsString()
  municipioId?: string;

  @ApiPropertyOptional({ description: 'Data de publicação (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dataPublicacao?: string;
}
