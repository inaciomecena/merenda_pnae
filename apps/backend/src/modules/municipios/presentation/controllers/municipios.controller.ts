import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { MunicipiosService } from '../../application/services/municipios.service';
import { CreateMunicipioDto, UpdateMunicipioDto } from '../dto/municipio.dto';

@ApiTags('municipios')
@Controller({ path: 'municipios', version: '1' })
export class MunicipiosController {
  constructor(private readonly service: MunicipiosService) {}

  @Get()
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Listar municípios' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'uf', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Buscar município por id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar município' })
  create(@Body() dto: CreateMunicipioDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar município' })
  update(@Param('id') id: string, @Body() dto: UpdateMunicipioDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir município' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
