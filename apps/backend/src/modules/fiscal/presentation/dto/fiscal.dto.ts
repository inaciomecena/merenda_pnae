import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { STATUS_NOTA_FISCAL } from '../../application/domain/fiscal-estado';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^\d+(\.\d{1,2})?$/;
const QUANTIDADE = /^\d+(\.\d{1,4})?$/;
const CHAVE_ACESSO = /^[0-9]{44}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class FiltrosNotaFiscalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resultadoConciliacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fornecedorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contratoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}

export class UploadNotaFiscalDto {
  @ApiProperty({ enum: ['XML', 'PDF'] })
  @IsIn(['XML', 'PDF'])
  tipo!: 'XML' | 'PDF';

  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'contratoId inválido.' })
  contratoId!: string;

  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'fornecedorId inválido.' })
  fornecedorId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}

export class ItemNotaFiscalDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  numeroItem!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoProduto?: string;

  @ApiProperty({ example: 'Arroz tipo 1' })
  @IsString()
  @MaxLength(300)
  descricao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ncm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  cfop?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unidadeComercial?: string;

  @ApiProperty({ example: '100.0000' })
  @IsString()
  @Matches(QUANTIDADE, { message: 'quantidade inválida.' })
  quantidade!: string;

  @ApiProperty({ example: '9.00' })
  @IsString()
  @Matches(DECIMAL, { message: 'valorUnitario inválido.' })
  valorUnitario!: string;

  @ApiProperty({ example: '900.00' })
  @IsString()
  @Matches(DECIMAL, { message: 'valorTotal inválido.' })
  valorTotal!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(UUID, { message: 'contratoItemId inválido.' })
  contratoItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}

/**
 * Cadastro manual de nota fiscal (operação administrativa — sem consulta a
 * sistemas externos). O XML continua sendo aceito como upload auxiliar.
 */
export class CriarNotaFiscalDto {
  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'contratoId inválido.' })
  contratoId!: string;

  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'fornecedorId inválido.' })
  fornecedorId!: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  numero!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  serie?: string;

  @ApiPropertyOptional({ example: '55' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  modelo?: string;

  @ApiPropertyOptional({ description: 'Chave de acesso informada manualmente (44 dígitos). Uso auxiliar — não representa autorização de sistemas externos.' })
  @IsOptional()
  @IsString()
  @Matches(CHAVE_ACESSO, { message: 'chaveAcesso deve conter 44 dígitos.' })
  chaveAcesso?: string;

  @ApiProperty()
  @IsDateString()
  dataEmissao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataRecebimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cnpjEmitente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cpfEmitente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentoDestinatario?: string;

  @ApiProperty({ example: '900.00' })
  @IsString()
  @Matches(DECIMAL, { message: 'valorProdutos inválido.' })
  valorProdutos!: string;

  @ApiProperty({ example: '1000.00' })
  @IsString()
  @Matches(DECIMAL, { message: 'valorTotal inválido.' })
  valorTotal!: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL, { message: 'valorDesconto inválido.' })
  valorDesconto?: string;

  @ApiPropertyOptional({ example: '100.00' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL, { message: 'valorFrete inválido.' })
  valorFrete?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL, { message: 'valorOutrasDespesas inválido.' })
  valorOutrasDespesas?: string;

  @ApiProperty({ type: [ItemNotaFiscalDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Informe ao menos um item.' })
  @ValidateNested({ each: true })
  @Type(() => ItemNotaFiscalDto)
  itens!: ItemNotaFiscalDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}

/**
 * Correção dos dados de uma nota fiscal antes da confirmação/atesto, com
 * transição opcional de status via máquina de estados.
 */
export class AtualizarNotaFiscalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  serie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5)
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(CHAVE_ACESSO, { message: 'chaveAcesso deve conter 44 dígitos.' })
  chaveAcesso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataEmissao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;

  @ApiPropertyOptional({ enum: STATUS_NOTA_FISCAL, description: 'Transição de status (máquina de estados) executada após a correção.' })
  @IsOptional()
  @IsIn(STATUS_NOTA_FISCAL, { message: 'Status inválido.' })
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}

/**
 * Associação manual de um recebimento (entrega aceita) a um item da nota fiscal.
 */
export class VincularRecebimentoDto {
  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'notaFiscalItemId inválido.' })
  notaFiscalItemId!: string;

  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'entregaId inválido.' })
  entregaId!: string;

  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'entregaItemId inválido.' })
  entregaItemId!: string;

  @ApiProperty({ example: '10.0000' })
  @IsString()
  @Matches(QUANTIDADE, { message: 'quantidadeVinculada inválida.' })
  quantidadeVinculada!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}

export class ItemChecklistDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  item!: string;

  @ApiProperty()
  @IsBoolean()
  conforme!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}

export class RegistrarConferenciaDto {
  @ApiProperty({ enum: ['APROVAR', 'REJEITAR'] })
  @IsIn(['APROVAR', 'REJEITAR'])
  acao!: 'APROVAR' | 'REJEITAR';

  @ApiPropertyOptional({ type: [ItemChecklistDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemChecklistDto)
  checklist?: ItemChecklistDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  justificativa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ressalvas?: string;
}

export class CriarAtestoDto {
  @ApiProperty({ enum: ['INTEGRAL', 'PARCIAL'] })
  @IsIn(['INTEGRAL', 'PARCIAL'])
  tipo!: 'INTEGRAL' | 'PARCIAL';

  @ApiProperty({ example: '1500.00' })
  @IsString()
  @Matches(DECIMAL, { message: 'valorAtestado inválido.' })
  valorAtestado!: string;

  @ApiPropertyOptional({ example: '2026-10-11' })
  @IsOptional()
  @IsString()
  @Matches(DATA, { message: 'dataAtesto inválida.' })
  dataAtesto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  justificativa?: string;
}

export class CriarLiquidacaoDto {
  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'notaFiscalId inválido.' })
  notaFiscalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(UUID, { message: 'atestoId inválido.' })
  atestoId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  numeroProcesso!: string;

  @ApiProperty({ example: '1500.00' })
  @IsString()
  @Matches(DECIMAL, { message: 'valorLiquidado inválido.' })
  valorLiquidado!: string;

  @ApiPropertyOptional({ description: 'Número da liquidação registrada fora da plataforma' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroLiquidacao?: string;

  @ApiPropertyOptional({ example: '2026-10-11' })
  @IsOptional()
  @IsString()
  @Matches(DATA, { message: 'dataLiquidacao inválida.' })
  dataLiquidacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}

export class CriarPagamentoDto {
  @ApiProperty()
  @IsString()
  @Matches(UUID, { message: 'liquidacaoId inválido.' })
  liquidacaoId!: string;

  @ApiProperty({ example: '1500.00' })
  @IsString()
  @Matches(DECIMAL, { message: 'valorPago inválido.' })
  valorPago!: string;

  @ApiPropertyOptional({ example: '2026-10-11' })
  @IsOptional()
  @IsString()
  @Matches(DATA, { message: 'dataPagamento inválida.' })
  dataPagamento?: string;

  @ApiProperty({ enum: ['INTEGRAL', 'PARCIAL'] })
  @IsIn(['INTEGRAL', 'PARCIAL'])
  tipo!: 'INTEGRAL' | 'PARCIAL';

  @ApiPropertyOptional({ description: 'Referência do pagamento registrado fora da plataforma (ordem/banco de origem manual)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroOrdemPagamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}

export class EstornarPagamentoDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  motivo!: string;
}

export class FiltrosLiquidacaoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notaFiscalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}

export class FiltrosPagamentoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  liquidacaoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
