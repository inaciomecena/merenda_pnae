import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ConfiguracaoInstitucionalDto {
  @IsString() chave!: string;
  @IsString() valor!: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsIn(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']) escopo?: string;
  @IsOptional() @IsIn(['ADMINISTRATIVA', 'NORMATIVA', 'SISTEMA']) origem?: string;
  @IsOptional() @IsBoolean() permiteSobrescrita?: boolean;
  @IsOptional() @IsString() dreId?: string;
  @IsOptional() @IsString() escolaId?: string;
  @IsOptional() @IsString() municipioId?: string;
  @IsOptional() @IsDateString() vigenteDesde?: string;
  @IsOptional() @IsDateString() vigenteAte?: string;
  @IsOptional() @IsString() observacao?: string;
}

export class ParametroOperacionalDto {
  @IsString() codigo!: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsIn(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']) escopo?: string;
  @IsOptional() @IsString() unidade?: string;
  @IsOptional() @IsIn(['ADMINISTRATIVA', 'NORMATIVA', 'SISTEMA']) origem?: string;
  @IsOptional() @IsString() fonteNormativa?: string;
  @IsOptional() @IsBoolean() permiteAlteracao?: boolean;
  @IsOptional() @IsIn(['ATIVO', 'PENDENTE_VALIDACAO', 'INATIVO']) status?: string;
  @IsOptional() @IsString() valor?: string;
  @IsOptional() @IsString() justificativa?: string;
  @IsOptional() @IsString() dreId?: string;
  @IsOptional() @IsString() escolaId?: string;
  @IsOptional() @IsString() municipioId?: string;
  @IsOptional() @IsDateString() vigenteDesde?: string;
  @IsOptional() @IsDateString() vigenteAte?: string;
}

export class NotificacaoDto {
  @IsString() userId!: string;
  @IsString() tipo!: string;
  @IsString() titulo!: string;
  @IsString() mensagem!: string;
  @IsOptional() @IsString() referenciaTipo?: string;
  @IsOptional() @IsString() referenciaId?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsString() origem?: string;
  @IsString() dedupeKey!: string;
  @IsOptional() @IsIn(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']) escopo?: string;
  @IsOptional() @IsString() dreId?: string;
  @IsOptional() @IsString() escolaId?: string;
  @IsOptional() @IsString() municipioId?: string;
}

export class ChecklistDto {
  @IsString() nome!: string;
  @IsOptional() @IsIn(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']) escopo?: string;
  @IsOptional() @IsString() dreId?: string;
  @IsOptional() @IsString() escolaId?: string;
  @IsOptional() @IsString() municipioId?: string;
  @IsOptional() @IsString() observacao?: string;
}

export class ChecklistItemDto {
  @IsString() codigo!: string;
  @IsString() titulo!: string;
  @IsOptional() @IsIn(['PENDENTE', 'EM_ANALISE', 'CONCLUIDO', 'BLOQUEADO']) status?: string;
  @IsOptional() @IsString() evidencia?: string;
  @IsOptional() @IsString() responsavelId?: string;
  @IsOptional() @IsDateString() prazo?: string;
  @IsOptional() @IsString() observacao?: string;
  @IsOptional() @IsString() pendencia?: string;
}

export class ChecklistStatusDto {
  @IsIn(['NAO_INICIADO', 'EM_CONFIGURACAO', 'PENDENTE_VALIDACAO', 'APTO_PARA_HOMOLOGACAO', 'HOMOLOGADO_OPERACIONALMENTE', 'BLOQUEADO']) status!: string;
  @IsOptional() @IsString() observacao?: string;
}

export class PageQuery {
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}
