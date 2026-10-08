import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { EscolasService } from '../../application/services/escolas.service';
import { CreateEscolaDto, UpdateEscolaDto } from '../dto/escola.dto';

@ApiTags('escolas')
@Controller({ path: 'escolas', version: '1' })
export class EscolasController {
  constructor(private readonly service: EscolasService) {}

  @Post('importar-csv')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: 10 * 1024 * 1024 } }))
  importarCsv(@UploadedFile() file: Express.Multer.File) {
    return this.service.importarCsv(file);
  }

  @Get()
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Listar escolas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  @ApiQuery({ name: 'codigo', required: false })
  @ApiQuery({ name: 'localizacao', required: false })
  @ApiQuery({ name: 'categoriaAdministrativa', required: false })
  @ApiQuery({ name: 'dependenciaAdministrativa', required: false })
  @ApiQuery({ name: 'restricaoAtendimento', required: false })
  @ApiQuery({ name: 'active', required: false })
  findAll(@Query() query: any, @Req() req: Request) {
    return this.service.findAll(query, req.user as any);
  }

  @Get(':id')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Buscar escola por id' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findOne(id, req.user as any);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar escola' })
  create(@Body() dto: CreateEscolaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ESCOLA')
  @ApiOperation({ summary: 'Atualizar escola' })
  update(@Param('id') id: string, @Body() dto: UpdateEscolaDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir escola' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
