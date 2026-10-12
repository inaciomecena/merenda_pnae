import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CategoriaParticipante, StatusHabilitacaoChamada, StatusRecursoChamada, StatusSelecaoChamada } from '@prisma/client';

export class CreateChamadaDto {
  @IsString() editalId!: string;
  @IsString() numero!: string;
  @IsInt() @Min(2000) exercicio!: number;
  @IsString() objeto!: string;
  @IsOptional() @IsString() entidadeExecutoraId?: string;
  @IsOptional() @IsString() dreId?: string;
  @IsOptional() @IsString() municipioId?: string;
  @IsDateString() inscricoesInicio!: string;
  @IsDateString() inscricoesFim!: string;
  @IsOptional() @IsDateString() dataAbertura?: string;
  @IsOptional() @IsDateString() prazoDocumentos?: string;
  @IsOptional() @IsString() localApresentacao?: string;
  @IsOptional() @IsString() formaApresentacao?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) escolaIds?: string[];
}

export class UpdateChamadaDto extends CreateChamadaDto {
  @IsOptional() @IsInt() @Min(1) versao?: number;
}

export class InscricaoDto {
  @IsString() produtorId!: string;
  @IsEnum(CategoriaParticipante) categoria!: CategoriaParticipante;
  @IsOptional() @IsString() representante?: string;
  @IsOptional() @IsString() contato?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class ProjetoItemDto {
  @IsString() produto!: string;
  @IsOptional() @IsString() editalItemId?: string;
  @IsOptional() @IsNumber() @Min(0) quantidade?: number;
  @IsOptional() @IsString() unidade?: string;
  @IsNumber() @Min(0) precoUnitario!: number;
  @IsOptional() @IsString() especificacao?: string;
}

export class ProjetoDto {
  @IsString() produtorId!: string;
  @IsEnum(CategoriaParticipante) categoria!: CategoriaParticipante;
  @IsOptional() @IsString() identificacaoProjeto?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ProjetoItemDto) itens!: ProjetoItemDto[];
}

export class HabilitacaoDto {
  @IsEnum(StatusHabilitacaoChamada) status!: StatusHabilitacaoChamada;
  @IsOptional() @IsString() parecer?: string;
  @IsOptional() @IsString() pendencias?: string;
}

export class ClassificacaoDto {
  @IsString() propostaId!: string;
  @IsString() editalItemId!: string;
  @IsInt() @Min(1) prioridade!: number;
  @IsString() criterio!: string;
  @IsOptional() @IsNumber() valorConsiderado?: number;
  @IsOptional() @IsString() justificativa?: string;
}

export class SelecaoDto {
  @IsEnum(StatusSelecaoChamada) status!: StatusSelecaoChamada;
  @IsNumber() @Min(0) quantidade!: number;
  @IsOptional() @IsString() justificativa?: string;
}

export class RecursoDto {
  @IsString() produtorId!: string;
  @IsOptional() @IsString() propostaId?: string;
  @IsString() fundamentacao!: string;
  @IsOptional() @IsDateString() prazoFinal?: string;
}

export class DecisaoRecursoDto {
  @IsEnum(StatusRecursoChamada) status!: StatusRecursoChamada;
  @IsString() decisao!: string;
}

export class HomologacaoDto {
  @IsString() fundamentacao!: string;
  @IsOptional() @IsString() resultadoId?: string;
}
