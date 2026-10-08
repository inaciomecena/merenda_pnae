import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PropostasService } from '../../application/services/propostas.service';
import { CreatePropostaDto, UpdatePropostaDto, PreviewPropostaDto, GerarPropostaDto } from '../dto/proposta.dto';
import * as path from 'path';

@ApiTags('propostas')
@Controller({ path: 'propostas', version: '1' })
export class PropostasController {
  constructor(private readonly service: PropostasService) {}

  @Get()
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Listar propostas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'editalId', required: false })
  @ApiQuery({ name: 'produtorId', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Buscar proposta por id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('preview')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Pré-visualizar proposta antes de gerar' })
  preview(@Body() dto: PreviewPropostaDto) {
    return this.service.preview(dto);
  }

  @Post()
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Criar proposta' })
  create(@Body() dto: CreatePropostaDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Atualizar proposta' })
  update(@Param('id') id: string, @Body() dto: UpdatePropostaDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/itens')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Adicionar itens à proposta' })
  addItens(@Param('id') id: string, @Body() body: { itens: CreatePropostaDto['itens'] }) {
    return this.service.addItens(id, body.itens);
  }

  @Post(':id/gerar')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Gerar PDF e DOCX da proposta' })
  generate(@Param('id') id: string) {
    return this.service.generate(id);
  }

  @Get(':id/download/:tipo')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Baixar PDF ou DOCX da proposta' })
  async download(@Param('id') id: string, @Param('tipo') tipo: 'pdf' | 'docx', @Res() res: Response) {
    const { filePath, filename } = await this.service.download(id, tipo);
    const contentType = tipo === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(filePath));
  }

  @Put(':id/finalizar')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Finalizar proposta' })
  finalizar(@Param('id') id: string) {
    return this.service.finalizar(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cancelar/remover proposta' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('produtores/:editalId')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Listar produtores com matches aprovados para um edital' })
  getProducers(@Param('editalId') editalId: string) {
    return this.service.getProducersWithApprovedMatches(editalId);
  }
}
