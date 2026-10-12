import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/user-scope';
import { GestaoOperacionalService } from './gestao-operacional.service';
import { ConfiguracaoInstitucionalDto, ParametroOperacionalDto, NotificacaoDto, ChecklistDto, ChecklistItemDto, ChecklistStatusDto } from './gestao-operacional.dto';

@ApiTags('gestao-operacional')
@Controller({ path: 'gestao-operacional', version: '1' })
@Roles('ADMIN', 'DRE', 'ESCOLA')
export class GestaoOperacionalController {
  constructor(private readonly service: GestaoOperacionalService) {}
  private user(req: Request) { return req.user as AuthenticatedUser; }

  @Get()
  dashboardRaiz(@Req() req: Request) { return this.service.dashboard(this.user(req)); }
  @Get('dashboard') dashboard(@Req() req: Request) { return this.service.dashboard(this.user(req)); }
  @Get('pendencias') pendencias(@Req() req: Request) { return this.service.pendencias(this.user(req)); }
  @Get('configuracoes') configuracoes(@Req() req: Request) { return this.service.listConfiguracoes(this.user(req)); }
  @Get('configuracoes/resolver') resolver(@Query('chave') chave: string, @Query('dreId') dreId: string, @Query('escolaId') escolaId: string, @Query('municipioId') municipioId: string, @Req() req: Request) { return this.service.resolveConfiguracao(chave, this.user(req), { dreId, escolaId, municipioId }); }
  @Post('configuracoes') criarConfiguracao(@Body() dto: ConfiguracaoInstitucionalDto, @Req() req: Request) { return this.service.upsertConfiguracao(dto, this.user(req)); }
  @Patch('configuracoes') atualizarConfiguracao(@Body() dto: ConfiguracaoInstitucionalDto, @Req() req: Request) { return this.service.upsertConfiguracao(dto, this.user(req)); }

  @Get('parametros') parametros(@Req() req: Request) { return this.service.listParametros(this.user(req)); }
  @Post('parametros') criarParametro(@Body() dto: ParametroOperacionalDto, @Req() req: Request) { return this.service.createParametro(dto, this.user(req)); }
  @Post('parametros/:id/versoes') versionarParametro(@Param('id') id: string, @Body() dto: ParametroOperacionalDto, @Req() req: Request) { return this.service.addParametroVersao(id, dto, this.user(req)); }

  @Get('notificacoes') notificacoes(@Query('page') page: string, @Query('limit') limit: string, @Req() req: Request) { return this.service.listNotificacoes(this.user(req), Number(page || 1), Number(limit || 50)); }
  @Post('notificacoes') criarNotificacao(@Body() dto: NotificacaoDto, @Req() req: Request) { return this.service.createNotificacao(dto, this.user(req)); }
  @Patch('notificacoes/:id/lida') marcarLida(@Param('id') id: string, @Req() req: Request) { return this.service.marcarNotificacao(id, this.user(req)); }

  @Get('checklists') checklists(@Req() req: Request) { return this.service.listChecklists(this.user(req)); }
  @Post('checklists') criarChecklist(@Body() dto: ChecklistDto, @Req() req: Request) { return this.service.createChecklist(dto, this.user(req)); }
  @Patch('checklists/:id') atualizarChecklist(@Param('id') id: string, @Body() dto: ChecklistStatusDto, @Req() req: Request) { return this.service.updateChecklist(id, dto, this.user(req)); }
  @Post('checklists/:id/itens') itemChecklist(@Param('id') id: string, @Body() dto: ChecklistItemDto, @Req() req: Request) { return this.service.addChecklistItem(id, dto, this.user(req)); }
  @Get('checklists/:id/relatorio') relatorioChecklist(@Param('id') id: string, @Req() req: Request) { return this.service.readinessReport(id, this.user(req)); }
}

@ApiTags('monitoramento')
@Controller({ path: 'monitoramento', version: '1' })
@Roles('ADMIN')
export class MonitoramentoController {
  constructor(private readonly service: GestaoOperacionalService) {}
  @Get('diagnostico') diagnostico(@Req() req: Request) { return this.service.diagnostico(req.user as AuthenticatedUser); }
}
