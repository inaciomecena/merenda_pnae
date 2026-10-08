import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { EditaisService } from '../../application/services/editais.service';
import { CreateEditalDto, UpdateEditalDto } from '../dto/edital.dto';

@ApiTags('editais')
@Controller({ path: 'editais', version: '1' })
export class EditaisController {
  constructor(private readonly service: EditaisService) {}

  @Get()
  @ApiOperation({ summary: 'Listar editais' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'ano', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar edital por id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/itens')
  @ApiOperation({ summary: 'Listar itens de um edital' })
  findItens(@Param('id') id: string) {
    return this.service.findItens(id);
  }

  @Post()
  @Roles('ADMIN', 'ESCOLA')
  @ApiOperation({ summary: 'Criar edital' })
  create(@Body() dto: CreateEditalDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ESCOLA')
  @ApiOperation({ summary: 'Atualizar edital' })
  update(@Param('id') id: string, @Body() dto: UpdateEditalDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir edital' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
