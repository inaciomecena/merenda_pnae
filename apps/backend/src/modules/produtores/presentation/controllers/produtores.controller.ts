import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ProdutoresService } from '../../application/services/produtores.service';
import { CreateProdutorDto, CreateProdutorProdutoDto, UpdateProdutorDto, UpdateProdutorProdutoDto } from '../dto/produtor.dto';

@ApiTags('produtores')
@Controller({ path: 'produtores', version: '1' })
export class ProdutoresController {
  constructor(private readonly service: ProdutoresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtores' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produtor por id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/produtos')
  @ApiOperation({ summary: 'Listar produtos cadastrados por produtor' })
  findProdutos(@Param('id') id: string) {
    return this.service.findProdutos(id);
  }

  @Post(':id/produtos')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Cadastrar produto produzido pelo produtor' })
  createProduto(@Param('id') id: string, @Body() dto: CreateProdutorProdutoDto) {
    return this.service.createProduto(id, dto);
  }

  @Patch(':id/produtos/:produtoId')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Atualizar produto produzido pelo produtor' })
  updateProduto(
    @Param('id') id: string,
    @Param('produtoId') produtoId: string,
    @Body() dto: UpdateProdutorProdutoDto,
  ) {
    return this.service.updateProduto(id, produtoId, dto);
  }

  @Delete(':id/produtos/:produtoId')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Remover produto produzido pelo produtor' })
  removeProduto(@Param('id') id: string, @Param('produtoId') produtoId: string) {
    return this.service.removeProduto(id, produtoId);
  }

  @Post()
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Criar produtor' })
  create(@Body() dto: CreateProdutorDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Atualizar produtor' })
  update(@Param('id') id: string, @Body() dto: UpdateProdutorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir produtor' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
