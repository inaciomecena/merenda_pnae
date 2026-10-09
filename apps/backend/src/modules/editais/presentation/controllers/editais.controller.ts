import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { EditaisService } from '../../application/services/editais.service';
import { CreateEditalDto, UpdateEditalDto } from '../dto/edital.dto';

@ApiTags('editais')
@Controller({ path: 'editais', version: '1' })
export class EditaisController {
  constructor(private readonly service: EditaisService) {}

  @Get()
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Listar editais' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'ano', required: false })
  findAll(@Query() query: any, @Req() req: Request) {
    return this.service.findAll(query, req.user as any);
  }

  @Get(':id')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Buscar edital por id' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findOne(id, req.user as any);
  }

  @Get(':id/itens')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Listar itens de um edital' })
  findItens(@Param('id') id: string, @Req() req: Request) {
    return this.service.findItens(id, req.user as any);
  }

  @Post()
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Criar edital' })
  create(@Body() dto: CreateEditalDto, @Req() req: Request) {
    return this.service.create(dto, req.user as any);
  }

  @Patch(':id')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Atualizar edital' })
  update(@Param('id') id: string, @Body() dto: UpdateEditalDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir edital' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
