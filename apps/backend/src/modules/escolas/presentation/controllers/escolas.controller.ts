import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { EscolasService } from '../../application/services/escolas.service';
import { CreateEscolaDto, UpdateEscolaDto } from '../dto/escola.dto';

@ApiTags('escolas')
@Controller({ path: 'escolas', version: '1' })
export class EscolasController {
  constructor(private readonly service: EscolasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar escolas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar escola por id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'ESCOLA')
  @ApiOperation({ summary: 'Criar escola' })
  create(@Body() dto: CreateEscolaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ESCOLA')
  @ApiOperation({ summary: 'Atualizar escola' })
  update(@Param('id') id: string, @Body() dto: UpdateEscolaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir escola' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
