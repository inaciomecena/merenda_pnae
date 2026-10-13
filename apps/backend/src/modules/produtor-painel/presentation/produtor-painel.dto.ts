import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UnidadeProdutivaDto {
  @IsString() @Length(2, 160) nome!: string;
  @IsString() municipioId!: string;
  @IsOptional() @IsString() comunidade?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) areaHectares?: number;
  @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @IsOptional() @IsIn(['ATIVA', 'INATIVA']) status?: 'ATIVA' | 'INATIVA';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) versao?: number;
}

export class ProdutoProdutorPainelDto {
  @IsOptional() @IsString() produtoReferenciaId?: string;
  @IsOptional() @IsString() unidadeProdutivaId?: string;
  @IsString() @Length(2, 160) produto!: string;
  @IsOptional() @IsString() capacidade?: string;
  @IsOptional() @IsString() unidade?: string;
  @IsOptional() @IsString() periodoProducao?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) precoSugerido?: number;
  @IsOptional() @IsIn(['ATIVO', 'INATIVO']) status?: 'ATIVO' | 'INATIVO';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) versao?: number;
}

export class SafraProducaoDto {
  @IsString() produtoProdutorId!: string;
  @IsOptional() @IsString() unidadeProdutivaId?: string;
  @IsString() @Length(2, 160) nome!: string;
  @IsDateString() inicio!: string;
  @IsDateString() fim!: string;
  @Type(() => Number) @IsNumber() @Min(0) quantidadePrevista!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) quantidadeColhida?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) perdas?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) quantidadeReservada?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) quantidadeComprometida?: number;
  @IsString() unidade!: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsIn(['PLANEJADA', 'EM_PRODUCAO', 'EM_COLHEITA', 'COLHIDA', 'ENCERRADA', 'CANCELADA']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) versao?: number;
}

export class SazonalidadeDto {
  @IsString() produtoProdutorId!: string;
  @IsOptional() @IsString() safraProducaoId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2200) anoReferencia?: number;
  @IsOptional() @IsString() unidadeProdutivaId?: string;
  @IsOptional() @IsIn(['PRODUCAO', 'COLHEITA', 'DISPONIBILIDADE']) tipoPeriodo?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) mes!: number;
  @Type(() => Number) @IsNumber() @Min(0) quantidadePrevista!: number;
  @IsString() unidade!: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class ListagemProdutorQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limite?: number;
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsString() unidadeProdutivaId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2200) ano?: number;
  @IsOptional() @IsString() status?: string;
}

export class DisponibilidadeDto {
  @IsString() safraProducaoId!: string;
  @IsString() produtoProdutorId!: string;
  @Type(() => Number) @IsNumber() @Min(0) quantidade!: number;
  @IsString() unidade!: string;
  @IsIn(['PREVISTA', 'CONFIRMADA', 'COMPROMETIDA', 'ENCERRADA']) status!: string;
  @IsString() origem!: string;
  @IsOptional() @IsString() origemId?: string;
  @IsOptional() @IsDateString() periodoInicio?: string;
  @IsOptional() @IsDateString() periodoFim?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class LogisticaDto {
  @IsString() modalidade!: string;
  @IsOptional() @IsString() municipiosAtendidos?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) capacidadeDiaria?: number;
  @IsOptional() @IsString() unidadeCapacidade?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) raioKm?: number;
  @IsOptional() ativo?: boolean;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) versao?: number;
}

export class AssistenciaTecnicaDto {
  @IsString() produtorId!: string;
  @IsString() extensionistaId!: string;
  @IsOptional() @IsString() escopo?: string;
  @IsDateString() vigenciaInicio!: string;
  @IsOptional() @IsDateString() vigenciaFim?: string;
  @IsOptional() @IsIn(['PENDENTE', 'ATIVA', 'SUSPENSA', 'ENCERRADA']) status?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class CatalogoSolicitacaoDto {
  @IsString() @Length(2, 160) nome!: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() unidadePadrao?: string;
  @IsOptional() @IsString() justificativa?: string;
}

export class CatalogoQueryDto {
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsIn(['true', 'false']) ativo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limite?: number;
}

export class CatalogoRevisaoDto {
  @IsIn(['APROVADA', 'REJEITADA']) status!: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class MapeamentoProdutoEditalDto {
  @IsString() produtoProdutorId!: string;
  @IsOptional() @IsString() produtoReferenciaId?: string;
  @IsString() editalItemId!: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) compatibilidade?: number;
  @IsOptional() @IsString() justificativa?: string;
}
