import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DREService } from '../../application/services/dre.service';
import { CreateDREDto, UpdateDREDto, VincularEscolaDto, CreateEntidadeDto, UpdateEntidadeDto } from '../dto/create-dre.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Request } from 'express';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

@ApiTags('dre')
@Controller({ path: 'dres', version: '1' })
export class DREController {
  constructor(private readonly dreService: DREService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar nova DRE (apenas ADMIN)' })
  create(@Body() dto: CreateDREDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.dreService.create(dto, user);
  }

  @Get()
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Listar DREs autorizadas' })
  findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.dreService.findAll(user);
  }

  @Get(':id')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Buscar DRE por ID' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.dreService.findOne(id, user);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar DRE' })
  update(@Param('id') id: string, @Body() dto: UpdateDREDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.dreService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir DRE' })
  delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.dreService.delete(id, user);
  }
}

@ApiTags('escolas')
@Controller({ path: 'escolas', version: '1' })
export class EscolaVinculoDREController {
  constructor(private readonly dreService: DREService) {}

  @Post(':id/vincular-dre')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Vincular escola a uma DRE' })
  vincularDRE(
    @Param('id') escolaId: string,
    @Body() dto: VincularEscolaDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.dreService.vincularEscola(
      escolaId,
      dto.dreId,
      dto.vigenciaInicio,
      dto.vigenciaFim || null,
      user,
    );
  }

  @Delete('vinculos/:vinculoId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desvincular escola de DRE' })
  desvincularDRE(@Param('vinculoId') vinculoId: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.dreService.desvincularEscola(vinculoId, user);
  }
}

@ApiTags('entidades-executoras')
@Controller({ path: 'entidades-executoras', version: '1' })
export class EntidadesExecutorasController {
  constructor(private readonly service: DREService) {}

  @Get() @Roles('ADMIN')
  listar() { return this.service.listarEntidades(); }

  @Post() @Roles('ADMIN')
  criar(@Body() dto: CreateEntidadeDto, @Req() req: Request) {
    return this.service.criarEntidade(dto, req.user as AuthenticatedUser);
  }

  @Put(':id') @Roles('ADMIN')
  atualizar(@Param('id') id: string, @Body() dto: UpdateEntidadeDto, @Req() req: Request) {
    return this.service.atualizarEntidade(id, dto, req.user as AuthenticatedUser);
  }
}
