import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { PrestacaoContasService, PrestacaoFiltros } from '../application/prestacao-contas.service';

const roles = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'] as const;

@ApiTags('prestacao-contas')
@Controller({ path: 'prestacoes-contas', version: '1' })
export class PrestacaoContasController {
  constructor(private readonly service: PrestacaoContasService) {}

  @Get('demonstrativo')
  @Roles(...roles)
  @ApiOperation({ summary: 'Demonstrativo consolidado com filtros e escopo institucional' })
  demonstrativo(@Query() query: any, @Req() req: Request) { return this.service.demonstrativo(this.filtros(query), req.user as AuthenticatedUser); }

  @Get('exportar/:formato')
  @Roles(...roles)
  async exportar(@Param('formato') formato: 'csv' | 'xlsx' | 'pdf', @Query() query: any, @Req() req: Request, @Res() res: Response) {
    if (!['csv', 'xlsx', 'pdf'].includes(formato)) return res.status(400).json({ message: 'Formato invalido.' });
    const arquivo = await this.service.exportar(this.filtros(query), formato, req.user as AuthenticatedUser);
    res.setHeader('Content-Type', arquivo.contentType); res.setHeader('Content-Disposition', `attachment; filename="prestacao-contas.${arquivo.extension}"`); return res.send(arquivo.body);
  }

  @Get()
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  listar(@Req() req: Request) { return this.service.listarPrestacoes(req.user as AuthenticatedUser); }

  @Post()
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  criar(@Body() body: any, @Req() req: Request) { return this.service.criarPrestacao(body, req.user as AuthenticatedUser); }

  @Patch(':id')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  atualizar(@Param('id') id: string, @Body() body: any, @Req() req: Request) { return this.service.atualizarPrestacao(id, body, req.user as AuthenticatedUser); }

  @Post(':id/transicoes/:status')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  transicionar(@Param('id') id: string, @Param('status') status: any, @Body('justificativa') justificativa: string, @Req() req: Request) { return this.service.transicionar(id, status, justificativa, req.user as AuthenticatedUser); }

  private filtros(query: any): PrestacaoFiltros {
    return { ...query, exercicio: query.exercicio ? Number(query.exercicio) : undefined };
  }
}

@ApiTags('transparencia')
@Controller({ path: 'transparencia', version: '1' })
export class TransparenciaController {
  constructor(private readonly service: PrestacaoContasService) {}

  @Get('contratos')
  @Public()
  @ApiOperation({ summary: 'Consulta publica de contratos e execucao agregada' })
  contratos(@Query() query: any) { return this.service.transparencia({ ...query, exercicio: query.exercicio ? Number(query.exercicio) : undefined }); }
}
