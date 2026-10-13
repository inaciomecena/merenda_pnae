import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OportunidadesQueryDto {
  @IsOptional() @IsString() produto?: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() municipioId?: string;
  @IsOptional() @IsString() dreId?: string;
  @IsOptional() @IsIn(['ALTA_COMPATIBILIDADE','COMPATIBILIDADE_PARCIAL','COMPATIBILIDADE_POTENCIAL','DADOS_INSUFICIENTES','INCOMPATIBILIDADE_IDENTIFICADA']) compatibilidade?: string;
  @IsOptional() @IsIn(['PRAZO','COMPATIBILIDADE','MUNICIPIO','PRODUTO','PUBLICACAO']) ordenar?: string;
  @IsOptional() @IsNumber() page?: number;
  @IsOptional() @IsNumber() limit?: number;
}

export class InteresseOportunidadeDto {
  @IsOptional() @IsNumber() @Min(0.0001) quantidadePretendida?: number;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsBoolean() solicitarAssistencia?: boolean;
}
