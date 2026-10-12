import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { EntregaDocumentoService } from '../../application/services/entrega-documento.service';
import { EntregaService } from '../../application/services/entrega.service';
import {
  CreateEntregaDto,
  ConferirEntregaDto,
  AceitarEntregaDto,
  TransicaoEntregaDto,
  AnexoEntregaDto,
  EstornarEntregaDto,
} from '../dto/entrega.dto';

@ApiTags('Entregas e Recebimentos')
@ApiBearerAuth()
@Controller('entregas')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA')
export class EntregaController {
  constructor(private readonly service: EntregaService, private readonly documentos: EntregaDocumentoService) {}

  @Post(':id/documentos/termo')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  async gerarTermo(@Param('id') id: string, @Request() req: any) {
    return this.documentos.gerarTermo(id, req.user);
  }

  @Post(':id/documentos')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async anexar(@Param('id') id: string, @UploadedFile() arquivo: Express.Multer.File, @Body() dto: AnexoEntregaDto, @Request() req: any) {
    return this.documentos.anexar(id, arquivo, dto, req.user);
  }

  @Get(':id/documentos/:documentoId')
  async arquivo(@Param('id') id: string, @Param('documentoId') documentoId: string, @Request() req: any, @Res() res: Response) {
    const arquivo = await this.documentos.arquivo(id, documentoId, req.user);
    res.setHeader('Content-Type', arquivo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome}"`);
    res.sendFile(arquivo.caminho);
  }

  @Post()
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Registrar entrega/recebimento' })
  @ApiResponse({ status: 201, description: 'Entrega registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados invÃ¡lidos' })
  @ApiResponse({ status: 404, description: 'ProgramaÃ§Ã£o nÃ£o encontrada' })
  async create(@Body() dto: CreateEntregaDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar entregas' })
  @ApiQuery({ name: 'programacaoId', required: false })
  @ApiQuery({ name: 'fornecedorId', required: false })
  @ApiQuery({ name: 'unidadeEscolarId', required: false })
  @ApiQuery({ name: 'dreId', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dataInicio', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'dataFim', required: false, example: '2026-12-31' })
  @ApiResponse({ status: 200, description: 'Lista de entregas' })
  async findAll(
    @Query('programacaoId') programacaoId?: string,
    @Query('fornecedorId') fornecedorId?: string,
    @Query('unidadeEscolarId') unidadeEscolarId?: string,
    @Query('dreId') dreId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    return this.service.findAll({
      programacaoId,
      fornecedorId,
      unidadeEscolarId,
      dreId,
      municipioId,
      status,
      dataInicio,
      dataFim,
      page,
      limit,
    }, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar entrega por ID' })
  @ApiResponse({ status: 200, description: 'Entrega encontrada' })
  @ApiResponse({ status: 404, description: 'Entrega nÃ£o encontrada' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.service.findById(id, req.user);
  }

  @Post(':id/conferir')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conferir entrega' })
  @ApiResponse({ status: 200, description: 'Entrega conferida' })
  @ApiResponse({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' })
  async conferir(@Param('id') id: string, @Body() dto: ConferirEntregaDto, @Request() req: any) {
    return this.service.conferir(id, dto.idempotencyKey, req.user.sub, req.user.role);
  }

  @Post(':id/aceitar')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceitar entrega (atualiza saldos contratuais)' })
  @ApiResponse({ status: 200, description: 'Entrega aceita e saldos atualizados' })
  @ApiResponse({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' })
  async aceitar(@Param('id') id: string, @Body() dto: AceitarEntregaDto, @Request() req: any) {
    return this.service.aceitar(id, dto.idempotencyKey, req.user.sub, req.user.role);
  }

  @Post(':id/estornar')
  @Roles('ADMIN', 'DRE')
  async estornar(@Param('id') id: string, @Body() dto: EstornarEntregaDto, @Request() req: any) {
    return this.service.estornar(id, dto.motivo, req.user);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Transicionar status da entrega' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' })
  async transicionar(@Param('id') id: string, @Body() dto: TransicaoEntregaDto, @Request() req: any) {
    return this.service.transicionar(id, dto.para as any, dto.motivo, req.user.sub, req.user.role);
  }
}

