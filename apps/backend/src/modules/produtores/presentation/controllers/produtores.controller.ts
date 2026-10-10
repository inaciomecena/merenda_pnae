import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ProdutoresService } from '../../application/services/produtores.service';
import { CreateProdutorDto, CreateProdutorProdutoDto, UpdateProdutorDto, UpdateProdutorProdutoDto } from '../dto/produtor.dto';

@ApiTags('produtores')
@Controller({ path: 'produtores', version: '1' })
export class ProdutoresController {
  constructor(private readonly service: ProdutoresService) {}

  @Get('campos-documentais')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  camposDocumentais() { return this.service.camposDocumentais(); }

  @Get()
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Listar produtores' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  findAll(@Query() query: any, @Req() req: Request) {
    return this.service.findAll(query, req.user as any);
  }

  @Get(':id')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Buscar produtor por id' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findOne(id, req.user as any);
  }

  @Get(':id/produtos')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Listar produtos cadastrados por produtor' })
  findProdutos(@Param('id') id: string, @Req() req: Request) {
    return this.service.findProdutos(id, req.user as any);
  }

  @Post(':id/produtos')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Cadastrar produto produzido pelo produtor' })
  createProduto(@Param('id') id: string, @Body() dto: CreateProdutorProdutoDto, @Req() req: Request) {
    return this.service.createProduto(id, dto, req.user as any);
  }

  @Patch(':id/produtos/:produtoId')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Atualizar produto produzido pelo produtor' })
  updateProduto(
    @Param('id') id: string,
    @Param('produtoId') produtoId: string,
    @Body() dto: UpdateProdutorProdutoDto,
    @Req() req: Request,
  ) {
    return this.service.updateProduto(id, produtoId, dto, req.user as any);
  }

  @Delete(':id/produtos/:produtoId')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Remover produto produzido pelo produtor' })
  removeProduto(@Param('id') id: string, @Param('produtoId') produtoId: string, @Req() req: Request) {
    return this.service.removeProduto(id, produtoId, req.user as any);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar produtor' })
  create(@Body() dto: CreateProdutorDto, @Req() req: Request) {
    return this.service.create(dto, req.user as any);
  }

  @Patch(':id')
  @Roles('ADMIN', 'EXTENSIONISTA', 'PRODUTOR')
  @ApiOperation({ summary: 'Atualizar produtor' })
  update(@Param('id') id: string, @Body() dto: UpdateProdutorDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir produtor' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
