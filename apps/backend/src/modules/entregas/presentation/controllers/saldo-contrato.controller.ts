import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Request } from '@nestjs/common';
import { SaldoContratoService } from '../../application/services/saldo-contrato.service';

@ApiTags('Saldos Contratuais e ExecuÃ§Ã£o')
@ApiBearerAuth()
@Controller('saldos-contratos')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA')
export class SaldoContratoController {
  constructor(private readonly service: SaldoContratoService) {}

  @Get(':contratoId')
  @ApiOperation({ summary: 'Consultar saldo e execuÃ§Ã£o do contrato' })
  @ApiResponse({ status: 200, description: 'Saldo e execuÃ§Ã£o do contrato' })
  @ApiResponse({ status: 404, description: 'Contrato nÃ£o encontrado' })
  async consultarSaldo(@Param('contratoId') contratoId: string, @Request() req: any) {
    return this.service.consultarSaldoContrato(contratoId, req.user);
  }

  @Get(':contratoId/periodo')
  @ApiOperation({ summary: 'Consultar saldo e execuÃ§Ã£o por perÃ­odo' })
  @ApiQuery({ name: 'dataInicio', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'dataFim', required: true, example: '2026-12-31' })
  @ApiResponse({ status: 200, description: 'Saldo e resumo do perÃ­odo' })
  @ApiResponse({ status: 404, description: 'Contrato nÃ£o encontrado' })
  async consultarSaldoPorPeriodo(
    @Param('contratoId') contratoId: string,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @Request() req: any,
  ) {
    return this.service.consultarSaldoContratoPorPeriodo(contratoId, new Date(dataInicio), new Date(dataFim), req.user);
  }

  @Get('execucao/geral')
  @ApiOperation({ summary: 'Consultar execuÃ§Ã£o geral com filtros institucionais' })
  @ApiQuery({ name: 'dreId', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  @ApiQuery({ name: 'fornecedorId', required: false })
  @ApiQuery({ name: 'escolaId', required: false })
  @ApiResponse({ status: 200, description: 'ExecuÃ§Ã£o consolidada' })
  async consultarExecucaoGeral(
    @Query('dreId') dreId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('fornecedorId') fornecedorId?: string,
    @Query('escolaId') escolaId?: string,
    @Request() req?: any,
  ) {
    return this.service.consultarExecutorGeral({
      dreId,
      municipioId,
      fornecedorId,
      escolaId,
    }, req.user);
  }
}

