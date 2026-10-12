import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ContratosService } from '../../application/services/contratos.service';
import { CreateContratoDto, UpdateContratoDto, TransicaoDto, EnviarAssinaturaDto, FormalizarDto, AnexoDocumentoDto, CreateAditivoDto } from '../dto/contrato.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { Request } from 'express';
import * as path from 'path';

const ORIGEM_VALIDA = { contratos: true };

@ApiTags('contratos')
@Controller({ path: 'contratos', version: '1' })
export class ContratosController {
  constructor(private readonly service: ContratosService) {}

  @Get()
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Listar contratos com paginação e filtros' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'numero', required: false })
  @ApiQuery({ name: 'exercicio', required: false })
  @ApiQuery({ name: 'editalId', required: false })
  @ApiQuery({ name: 'produtorId', required: false })
  @ApiQuery({ name: 'dreId', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vigenciaInicio', required: false })
  @ApiQuery({ name: 'vigenciaFim', required: false })
  @ApiQuery({ name: 'ordenar', required: false })
  @ApiQuery({ name: 'ordem', required: false })
  async findAll(@Query() query: Record<string, string | undefined>, @Req() req: Request) {
    return this.service.findAll(query, req.user as AuthenticatedUser);
  }

  @Get('origens/:editalId')
  @Roles('ADMIN', 'DRE', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Origens de contrato para um edital (propostas, itens, saldos)' })
  async origens(@Param('editalId') editalId: string, @Req() req: Request) {
    return this.service.origens(editalId, req.user as AuthenticatedUser);
  }

  @Get('indicadores')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Indicadores de contratos no escopo' })
  @ApiQuery({ name: 'dias', required: false })
  async indicadores(@Query() query: { dias?: string }, @Req() req: Request) {
    return this.service.indicadores(query, req.user as AuthenticatedUser);
  }

  @Get(':id')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Detalhar contrato com itens, documentos, aditivos e pendências' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findOne(id, req.user as AuthenticatedUser);
  }

  @Post()
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Criar rascunho de contrato a partir de proposta/edital' })
  async create(@Body() dto: CreateContratoDto, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.create(dto, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Patch(':id')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Atualizar rascunho (somente RASCUNHO)' })
  async update(@Param('id') id: string, @Body() dto: UpdateContratoDto, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.update(id, dto, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Post(':id/validar')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Validar dados do rascunho e listar pendências' })
  async validar(@Param('id') id: string, @Req() req: Request) {
    return this.service.validar(id, req.user as AuthenticatedUser);
  }

  @Post(':id/encaminhar-conferencia')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Mudar estado para EM_CONFERENCIA' })
  async encaminharConferencia(@Param('id') id: string, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.encaminharConferencia(id, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Post(':id/enviar-assinatura')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Registrar signatários e encaminhar para AGUARDANDO_ASSINATURA' })
  async enviarAssinatura(@Param('id') id: string, @Body() dto: EnviarAssinaturaDto, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.enviarAssinatura(id, dto, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Post(':id/formalizar')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Formalizar contrato (anexar instrumento assinado e transicionar para VIGENTE se vigência permite)' })
  async formalizar(@Param('id') id: string, @Body() dto: FormalizarDto, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.formalizar(id, dto, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Patch(':id/transicao')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Transição de estado controlada (SUSPENSO, ENCERRADO, RESCINDIDO, CANCELADO, VIGENTE, RASCUNHO)' })
  async transicionar(@Param('id') id: string, @Body() dto: TransicaoDto, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.transicionar(id, dto, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Post(':id/minuta')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Gerar minuta (PDF + DOCX) a partir de template do edital ou institucional' })
  async gerarMinuta(@Param('id') id: string, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.gerarMinuta(id, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Get(':id/documentos')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Listar documentos do contrato (sem expor caminhos absolutos)' })
  async listarDocumentos(@Param('id') id: string, @Req() req: Request) {
    return this.service.listarDocumentos(id, req.user as AuthenticatedUser);
  }

  @Post(':id/documentos')
  @Roles('ADMIN', 'DRE', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Anexar documento (contrato assinado, complementar ou aditivo)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo'))
  async anexar(
    @Param('id') id: string,
    @UploadedFile() arquivo: Express.Multer.File,
    @Body() dto: AnexoDocumentoDto,
    @Req() req: Request,
  ) {
    if (!arquivo) throw new BadRequestException('Arquivo é obrigatório.');
    return this.service.anexar(id, arquivo, dto, { user: req.user as AuthenticatedUser });
  }

  @Get(':id/documentos/:documentoId')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Baixar documento do contrato (confere integridade por hash)' })
  async download(@Param('id') id: string, @Param('documentoId') documentoId: string, @Req() req: Request, @Res() res: Response) {
    const { caminho, nome } = await this.service.arquivo(id, documentoId, req.user as AuthenticatedUser);
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.sendFile(caminho);
  }

  @Get(':id/historico')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Histórico de operações do contrato (auditoria simplificada)' })
  async historico(@Param('id') id: string, @Req() req: Request) {
    return this.service.historico(id, req.user as AuthenticatedUser);
  }

  @Get(':id/auditoria')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Auditoria completa (apenas ADMIN)' })
  async auditoria(@Param('id') id: string, @Req() req: Request) {
    return this.service.auditoria(id, req.user as AuthenticatedUser);
  }

  @Get(':id/aditivos')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Listar aditivos do contrato' })
  async listarAditivos(@Param('id') id: string, @Req() req: Request) {
    return this.service.listarAditivos(id, req.user as AuthenticatedUser);
  }

  @Post(':id/aditivos')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Criar rascunho de aditivo' })
  async criarAditivo(@Param('id') id: string, @Body() dto: CreateAditivoDto, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.criarAditivo(id, dto, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Post(':id/aditivos/:aditivoId/formalizar')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Formalizar aditivo (exige instrumento assinado anexado)' })
  async formalizarAditivo(@Param('id') id: string, @Param('aditivoId') aditivoId: string, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.formalizarAditivo(id, aditivoId, { user: req.user as AuthenticatedUser, idempotencyKey });
  }

  @Post(':id/aditivos/:aditivoId/minuta')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Gerar minuta do aditivo (PDF)' })
  async gerarMinutaAditivo(@Param('id') id: string, @Param('aditivoId') aditivoId: string, @Req() req: Request) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    return this.service.gerarMinutaAditivo(id, aditivoId, { user: req.user as AuthenticatedUser, idempotencyKey });
  }
}

import { BadRequestException } from '@nestjs/common';