import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PropostaDocumentosService } from '../../application/services/proposta-documentos.service';
import { DocumentoPropostaDto } from '../dto/documento-proposta.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PropostasService } from '../../application/services/propostas.service';
import { CreatePropostaDto, UpdatePropostaDto, PreviewPropostaDto, GerarPropostaDto } from '../dto/proposta.dto';
import * as path from 'path';

@ApiTags('propostas')
@Controller({ path: 'propostas', version: '1' })
export class PropostasController {
  constructor(private readonly service: PropostasService, private readonly documentos: PropostaDocumentosService) {}

  @Get(':id/documentos')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  documentosDisponiveis(@Param('id') id: string, @Req() req: Request) {
    return this.documentos.preparar(id, req.user as AuthenticatedUser);
  }

  @Put(':id/documentos')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  salvarDocumentos(@Param('id') id: string, @Body() dto: DocumentoPropostaDto, @Req() req: Request) {
    return this.documentos.salvar(id, dto, req.user as AuthenticatedUser);
  }

  @Get(':id/documentos/previa')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  previaDocumentos(@Param('id') id: string, @Req() req: Request) {
    return this.documentos.previa(id, req.user as AuthenticatedUser);
  }

  @Get()
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Listar propostas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'editalId', required: false })
  @ApiQuery({ name: 'produtorId', required: false })
  findAll(@Query() query: any, @Req() req: Request) {
    return this.service.findAll(query, req.user as AuthenticatedUser);
  }

  @Get(':id')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Buscar proposta por id' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findOne(id, req.user as AuthenticatedUser);
  }

  @Post('preview')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Pré-visualizar proposta antes de gerar' })
  preview(@Body() dto: PreviewPropostaDto, @Req() req: Request) {
    return this.service.preview(dto, req.user as AuthenticatedUser);
  }

  @Post()
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Criar proposta' })
  create(@Body() dto: CreatePropostaDto, @Req() req: Request) {
    return this.service.create(dto, req.user as AuthenticatedUser);
  }

  @Put(':id')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Atualizar proposta' })
  update(@Param('id') id: string, @Body() dto: UpdatePropostaDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as AuthenticatedUser);
  }

  @Post(':id/itens')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Adicionar itens à proposta' })
  addItens(@Param('id') id: string, @Body() body: { itens: CreatePropostaDto['itens'] }, @Req() req: Request) {
    return this.service.addItens(id, body.itens, req.user as AuthenticatedUser);
  }

  @Post(':id/gerar')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Gerar PDF e DOCX da proposta' })
  generate(@Param('id') id: string, @Req() req: Request) {
    return this.service.generate(id, req.user as AuthenticatedUser);
  }

  @Get(':id/download/:tipo')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Baixar PDF ou DOCX da proposta' })
  async download(@Param('id') id: string, @Param('tipo') tipo: 'pdf' | 'docx', @Req() req: Request, @Res() res: Response) {
    const { filePath, filename } = await this.service.download(id, tipo, req.user as AuthenticatedUser);
    const contentType = tipo === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(filePath));
  }

  @Put(':id/finalizar')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Finalizar proposta' })
  finalizar(@Param('id') id: string, @Req() req: Request) {
    return this.service.finalizar(id, req.user as AuthenticatedUser);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cancelar/remover proposta' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('produtores/:editalId')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Listar produtores com matches aprovados para um edital' })
  getProducers(@Param('editalId') editalId: string, @Req() req: Request) {
    return this.service.getProducersWithApprovedMatches(editalId, req.user as AuthenticatedUser);
  }
}
