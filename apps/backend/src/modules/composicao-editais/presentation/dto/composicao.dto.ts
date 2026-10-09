import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

export class CreateTemplateDocumentoDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @IsInt()
  numeroAnexo?: number;

  @IsString()
  @Length(2, 180)
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsInt()
  ordem?: number;

  @IsOptional()
  @IsString()
  formato?: string;

  @IsOptional()
  @IsString()
  conteudo?: string;

  @IsOptional()
  @IsDateString()
  vigenciaInicio?: string;

  @IsOptional()
  @IsDateString()
  vigenciaFim?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateTemplateDocumentoDto {
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsInt() numeroAnexo?: number;
  @IsOptional() @IsString() @Length(2, 180) titulo?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsString() formato?: string;
  @IsOptional() @IsString() conteudo?: string;
  @IsOptional() @IsDateString() vigenciaInicio?: string;
  @IsOptional() @IsDateString() vigenciaFim?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class StatusTemplateDto {
  @IsBoolean()
  ativo!: boolean;
}

export class AnexoComposicaoDto {
  @IsString()
  tipo!: string;

  @IsString()
  titulo!: string;

  @IsInt()
  ordem!: number;

  @IsBoolean()
  incluido!: boolean;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  templateVersaoId?: string;

  @IsOptional()
  @IsString()
  conteudoManual?: string;
}

export class VariavelComposicaoDto {
  @IsString()
  chave!: string;

  @IsOptional()
  @IsString()
  valor?: string;

  @IsOptional()
  @IsString()
  escopo?: string;

  @IsOptional()
  @IsString()
  statusRevisao?: string;
}

export class CreateComposicaoDto {
  @IsString() @Length(1, 120) numero!: string;
  @IsInt() ano!: number;
  @IsString() @Length(2, 200) titulo!: string;
  @IsOptional() @IsString() objeto?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() municipioId?: string;
  @IsOptional() @IsString() escolaId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) escolaIds?: string[];
  @IsOptional() @IsString() processoAdministrativo?: string;
  @IsOptional() @IsDateString() dataPublicacao?: string;
  @IsOptional() @IsString() localRecebimento?: string;
  @IsOptional() @IsDateString() dataRecebimento?: string;
  @IsOptional() @IsString() horarioRecebimento?: string;
  @IsOptional() @IsString() comissao?: string;
  @IsOptional() @IsString() legislacaoAplicavel?: string;
  @IsOptional() @IsString() prazoVigencia?: string;
  @IsOptional() @IsString() condicoesParticipacao?: string;
  @IsOptional() @IsString() criteriosHabilitacao?: string;
  @IsOptional() @IsString() regrasEntrega?: string;
  @IsOptional() @IsString() formaPagamento?: string;
  @IsOptional() @IsString() penalidades?: string;
  @IsOptional() @IsString() foro?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class UpdateComposicaoDto extends PartialType(CreateComposicaoDto) {
  @IsOptional() @IsString() statusComposicao?: string;
}

export class ItemComposicaoDto {
  @IsOptional() @IsInt() numeroItem?: number;
  @IsString() produtoOriginal!: string;
  @IsOptional() @IsString() especificacao?: string;
  @IsOptional() @IsNumber() quantidade?: number;
  @IsOptional() @IsString() unidade?: string;
  @IsOptional() @IsNumber() precoUnitario?: number;
}

export class SalvarItensDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemComposicaoDto)
  itens!: ItemComposicaoDto[];
}

export class SalvarAnexosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnexoComposicaoDto)
  anexos!: AnexoComposicaoDto[];
}

export class SalvarVariaveisDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariavelComposicaoDto)
  variaveis!: VariavelComposicaoDto[];
}

export class AtualizarCamposImportacaoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariavelComposicaoDto)
  campos!: Array<{ id?: string; chave: string; valor?: string; statusRevisao?: string }>;
}

export class AplicarEstruturaDto {
  @IsString()
  modo!: 'ATUALIZAR' | 'CRIAR_NOVO';

  @IsOptional()
  @IsString()
  editalDestinoId?: string;
}
