import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ProdutosReferenciaService } from '../../application/services/produtos-referencia.service';
import { CreateProdutoReferenciaDto, UpdateProdutoReferenciaDto } from '../dto/produto-referencia.dto';

@ApiTags('produtos-referencia')
@Controller({ path: 'produtos-referencia', version: '1' })
export class ProdutosReferenciaController {
  constructor(private readonly service: ProdutosReferenciaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos de referência' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'ativo', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto de referência por id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar produto de referência' })
  create(@Body() dto: CreateProdutoReferenciaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar produto de referência' })
  update(@Param('id') id: string, @Body() dto: UpdateProdutoReferenciaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir produto de referência' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
