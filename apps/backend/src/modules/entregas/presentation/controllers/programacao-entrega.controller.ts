import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ProgramacaoEntregaService } from '../../application/services/programacao-entrega.service';
import {
  CreateProgramacaoEntregaDto,
  UpdateProgramacaoEntregaDto,
  ConfirmarProgramacaoDto,
  CancelarProgramacaoDto,
  TransicaoProgramacaoDto,
} from '../dto/entrega.dto';

@ApiTags('ProgramaÃ§Ã£o de Entregas')
@ApiBearerAuth()
@Controller('programacoes-entrega')
@Roles('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA')
export class ProgramacaoEntregaController {
  constructor(private readonly service: ProgramacaoEntregaService) {}

  @Post()
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Criar programaÃ§Ã£o de entrega' })
  @ApiResponse({ status: 201, description: 'ProgramaÃ§Ã£o criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados invÃ¡lidos' })
  @ApiResponse({ status: 404, description: 'Contrato nÃ£o encontrado' })
  async create(@Body() dto: CreateProgramacaoEntregaDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar programaÃ§Ãµes de entrega' })
  @ApiQuery({ name: 'contratoId', required: false })
  @ApiQuery({ name: 'fornecedorId', required: false })
  @ApiQuery({ name: 'unidadeEscolarId', required: false })
  @ApiQuery({ name: 'dreId', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dataInicio', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'dataFim', required: false, example: '2026-12-31' })
  @ApiResponse({ status: 200, description: 'Lista de programaÃ§Ãµes' })
  async findAll(
    @Query('contratoId') contratoId?: string,
    @Query('fornecedorId') fornecedorId?: string,
    @Query('unidadeEscolarId') unidadeEscolarId?: string,
    @Query('dreId') dreId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('produto') produto?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    return this.service.findAll({
      contratoId,
      fornecedorId,
      unidadeEscolarId,
      dreId,
      municipioId,
      status,
      dataInicio,
      dataFim,
      produto,
      page,
      limit,
    }, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar programaÃ§Ã£o por ID' })
  @ApiResponse({ status: 200, description: 'ProgramaÃ§Ã£o encontrada' })
  @ApiResponse({ status: 404, description: 'ProgramaÃ§Ã£o nÃ£o encontrada' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.service.findById(id, req.user);
  }

  @Get('calendario/mes')
  async calendario(@Query('mes') mes: string, @Request() req: any) {
    return this.service.calendario(mes, req.user);
  }

  @Get(':id/historico')
  @Roles('ADMIN', 'DRE')
  async historico(@Param('id') id: string, @Request() req: any) {
    return this.service.historico(id, req.user);
  }

  @Put(':id')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Atualizar programaÃ§Ã£o (apenas rascunho)' })
  @ApiResponse({ status: 200, description: 'ProgramaÃ§Ã£o atualizada' })
  @ApiResponse({ status: 400, description: 'Somente rascunhos podem ser editados' })
  @ApiResponse({ status: 404, description: 'ProgramaÃ§Ã£o nÃ£o encontrada' })
  async update(@Param('id') id: string, @Body() dto: UpdateProgramacaoEntregaDto, @Request() req: any) {
    return this.service.update(id, dto, req.user.sub, req.user.role);
  }

  @Post(':id/confirmar')
  @Roles('ADMIN', 'DRE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar programaÃ§Ã£o' })
  @ApiResponse({ status: 200, description: 'ProgramaÃ§Ã£o confirmada' })
  @ApiResponse({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' })
  async confirmar(@Param('id') id: string, @Body() dto: ConfirmarProgramacaoDto, @Request() req: any) {
    return this.service.confirmar(id, dto.idempotencyKey, req.user.sub, req.user.role);
  }

  @Post(':id/cancelar')
  @Roles('ADMIN', 'DRE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar programaÃ§Ã£o' })
  @ApiResponse({ status: 200, description: 'ProgramaÃ§Ã£o cancelada' })
  async cancelar(@Param('id') id: string, @Body() dto: CancelarProgramacaoDto, @Request() req: any) {
    return this.service.cancelar(id, dto.motivo, req.user.sub, req.user.role);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Transicionar status da programaÃ§Ã£o' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' })
  async transicionar(@Param('id') id: string, @Body() dto: TransicaoProgramacaoDto, @Request() req: any) {
    return this.service.transicionar(id, dto.para as any, dto.motivo, req.user.sub, req.user.role);
  }
}

