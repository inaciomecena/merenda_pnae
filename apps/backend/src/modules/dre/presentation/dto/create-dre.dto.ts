import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateDREDto {
  @ApiProperty({ description: 'Nome da DRE' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ description: 'Código da DRE', required: false })
  @IsString()
  @IsOptional()
  codigo?: string;

  @ApiProperty({ description: 'ID da Entidade Executora' })
  @IsString()
  @IsNotEmpty()
  entidadeExecutoraId!: string;

  @ApiProperty({ description: 'Município sede', required: false })
  @IsString()
  @IsOptional()
  municipioSede?: string;
}

export class UpdateDREDto {
  @ApiProperty({ description: 'Nome da DRE', required: false })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ description: 'Código da DRE', required: false })
  @IsString()
  @IsOptional()
  codigo?: string;

  @ApiProperty({ description: 'Município sede', required: false })
  @IsString()
  @IsOptional()
  municipioSede?: string;

  @ApiProperty({ description: 'Ativo', required: false })
  @IsOptional()
  ativo?: boolean;
}

export class VincularEscolaDto {
  @ApiProperty({ description: 'ID da DRE' })
  @IsString()
  @IsNotEmpty()
  dreId!: string;

  @ApiProperty({ description: 'Data de início da vigência' })
  @IsNotEmpty()
  vigenciaInicio!: Date;

  @ApiProperty({ description: 'Data de fim da vigência', required: false })
  @IsOptional()
  vigenciaFim?: Date;
}

export class CreateEntidadeDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsString() @IsNotEmpty() uf!: string;
  @IsString() @IsOptional() tipo?: string;
  @IsString() @IsOptional() municipioId?: string;
  @IsString() @IsOptional() cnpj?: string;
}

export class UpdateEntidadeDto {
  @IsString() @IsOptional() nome?: string;
  @IsString() @IsOptional() uf?: string;
  @IsString() @IsOptional() tipo?: string;
  @IsString() @IsOptional() municipioId?: string;
  @IsString() @IsOptional() cnpj?: string;
  @IsOptional() ativo?: boolean;
}

