import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BalizamentoService } from '../../application/services/balizamento.service';
import { AtualizarStatusMatchDto, CriarMatchManualDto } from '../dto/balizamento.dto';

@ApiTags('balizamento')
@Controller({ path: 'balizamento', version: '1' })
export class BalizamentoController {
  constructor(private readonly service: BalizamentoService) {}

  @Post('editais/:editalId/executar')
  @ApiOperation({ summary: 'Executar balizamento automático do edital' })
  executar(@Param('editalId') editalId: string) {
    return this.service.executar(editalId);
  }

  @Get('editais/:editalId')
  @ApiOperation({ summary: 'Listar resultado do balizamento por edital' })
  findByEdital(@Param('editalId') editalId: string, @Query() query: any) {
    return this.service.findByEdital(editalId, query);
  }

  @Get('editais/:editalId/itens/:itemId')
  @ApiOperation({ summary: 'Listar matches de um item do edital' })
  findByItem(@Param('editalId') editalId: string, @Param('itemId') itemId: string) {
    return this.service.findByItem(editalId, itemId);
  }

  @Post('matches/manual')
  @ApiOperation({ summary: 'Criar vínculo manual entre item do edital e produtor' })
  createManual(@Body() dto: CriarMatchManualDto) {
    return this.service.createManual(dto);
  }

  @Put('matches/:matchId/aprovar')
  @ApiOperation({ summary: 'Aprovar match' })
  aprovar(@Param('matchId') matchId: string, @Body() dto: AtualizarStatusMatchDto) {
    return this.service.aprovar(matchId, dto.observacoes);
  }

  @Put('matches/:matchId/rejeitar')
  @ApiOperation({ summary: 'Rejeitar match' })
  rejeitar(@Param('matchId') matchId: string, @Body() dto: AtualizarStatusMatchDto) {
    return this.service.rejeitar(matchId, dto.observacoes);
  }

  @Delete('matches/:matchId')
  @ApiOperation({ summary: 'Remover match' })
  remove(@Param('matchId') matchId: string) {
    return this.service.remove(matchId);
  }
}
