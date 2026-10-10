import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';

export class CreateVinculoDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'] })
  @IsEnum(['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'])
  funcao!: 'ADMIN' | 'DRE' | 'ESCOLA' | 'EXTENSIONISTA' | 'PRODUTOR' | 'REPRESENTANTE';

  @ApiProperty({ description: 'ID da DRE', required: false })
  @IsString()
  @IsOptional()
  dreId?: string;

  @ApiProperty({ description: 'ID da escola', required: false })
  @IsString()
  @IsOptional()
  escolaId?: string;

  @ApiProperty({ description: 'ID do município', required: false })
  @IsString()
  @IsOptional()
  municipioId?: string;

  @ApiProperty({ description: 'ID do produtor', required: false })
  @IsString()
  @IsOptional()
  produtorId?: string;

  @ApiProperty({ description: 'Data de início da vigência' })
  @IsDateString()
  vigenciaInicio!: string;

  @ApiProperty({ description: 'Data de fim da vigência', required: false })
  @IsDateString()
  @IsOptional()
  vigenciaFim?: string;
}

export class CreateRepresentacaoDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'ID do produtor' })
  @IsString()
  @IsNotEmpty()
  produtorId!: string;

  @ApiProperty({ description: 'Tipo de representação', required: false })
  @IsString()
  @IsOptional()
  tipoRepresentacao?: string;

  @ApiProperty({ description: 'Permissões separadas por vírgula: CONSULTAR,EDITAR_PRODUTOR,EDITAR_PROPOSTA', required: false })
  @IsString()
  @IsOptional()
  permissoes?: string;

  @ApiProperty({ description: 'Documento de autorização', required: false })
  @IsString()
  @IsOptional()
  autorizacaoDocumento?: string;

  @ApiProperty({ description: 'Data de início da vigência' })
  @IsDateString()
  vigenciaInicio!: string;

  @ApiProperty({ description: 'Data de fim da vigência', required: false })
  @IsDateString()
  @IsOptional()
  vigenciaFim?: string;
}

export class RevokeRepresentacaoDto {
  @ApiProperty({ description: 'Motivo da revogação' })
  @IsString()
  @IsNotEmpty()
  motivo!: string;
}

export class UpdateRepresentacaoDto {
  @IsString() @IsOptional() permissoes?: string;
  @IsDateString() @IsOptional() vigenciaFim?: string;
  @IsString() @IsOptional() autorizacaoDocumento?: string;
  @IsString() @IsNotEmpty() justificativa!: string;
}

