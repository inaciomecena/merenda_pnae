import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { ChamadasPublicasService } from '../application/chamadas-publicas.service';
import { ClassificacaoDto, CreateChamadaDto, DecisaoRecursoDto, HabilitacaoDto, HomologacaoDto, InscricaoDto, ProjetoDto, RecursoDto, SelecaoDto, UpdateChamadaDto } from './chamadas-publicas.dto';

@Controller({ path: 'chamadas-publicas', version: '1' })
export class ChamadasPublicasController {
  constructor(private readonly service: ChamadasPublicasService) {}
  @Get() @Roles('ADMIN','DRE','ESCOLA') listar(@Query() q: any, @Req() req: Request) { return this.service.listar(q, req.user as AuthenticatedUser); }
  @Get(':id') @Roles('ADMIN','DRE','ESCOLA') obter(@Param('id') id: string, @Req() req: Request) { return this.service['obter'](id, req.user as AuthenticatedUser); }
  @Post() @Roles('ADMIN','DRE') criar(@Body() dto: CreateChamadaDto, @Req() req: Request) { return this.service.criar(dto, req.user as AuthenticatedUser); }
  @Patch(':id') @Roles('ADMIN','DRE') atualizar(@Param('id') id: string, @Body() dto: UpdateChamadaDto, @Req() req: Request) { return this.service.atualizar(id, dto, req.user as AuthenticatedUser); }
  @Post(':id/transicoes/:status') @Roles('ADMIN','DRE') transicionar(@Param('id') id: string, @Param('status') status: any, @Req() req: Request) { return this.service.transicionar(id, status, req.user as AuthenticatedUser); }
  @Get(':id/inscricoes') @Roles('ADMIN','DRE','ESCOLA') inscricoes(@Param('id') id: string, @Req() req: Request) { return this.service.listarInscricoes(id, req.user as AuthenticatedUser); }
  @Post(':id/inscricoes') @Roles('ADMIN','DRE','PRODUTOR','REPRESENTANTE','EXTENSIONISTA') inscrever(@Param('id') id: string, @Body() dto: InscricaoDto, @Req() req: Request) { return this.service.inscrever(id, dto, req.user as AuthenticatedUser); }
  @Post(':id/projetos') @Roles('ADMIN','DRE','PRODUTOR','REPRESENTANTE','EXTENSIONISTA') projeto(@Param('id') id: string, @Body() dto: ProjetoDto, @Req() req: Request) { return this.service.criarProjeto(id, dto, req.user as AuthenticatedUser); }
  @Post('projetos/:projetoId/enviar') @Roles('ADMIN','DRE','PRODUTOR','REPRESENTANTE','EXTENSIONISTA') enviar(@Param('projetoId') id: string, @Req() req: Request) { return this.service.enviarProjeto(id, req.user as AuthenticatedUser); }
  @Post('projetos/:projetoId/habilitacao') @Roles('ADMIN','DRE') habilitar(@Param('projetoId') id: string, @Body() dto: HabilitacaoDto, @Req() req: Request) { return this.service.habilitar(id, dto, req.user as AuthenticatedUser); }
  @Post(':id/classificacoes') @Roles('ADMIN','DRE') classificar(@Param('id') id: string, @Body() dto: ClassificacaoDto, @Req() req: Request) { return this.service.classificar(id, dto, req.user as AuthenticatedUser); }
  @Post('classificacoes/:classificacaoId/selecao') @Roles('ADMIN','DRE') selecionar(@Param('classificacaoId') id: string, @Body() dto: SelecaoDto, @Req() req: Request) { return this.service.selecionar(id, dto, req.user as AuthenticatedUser); }
  @Post(':id/recursos') @Roles('ADMIN','DRE','PRODUTOR','REPRESENTANTE','EXTENSIONISTA') recurso(@Param('id') id: string, @Body() dto: RecursoDto, @Req() req: Request) { return this.service.recurso(id, dto, req.user as AuthenticatedUser); }
  @Post('recursos/:recursoId/decisao') @Roles('ADMIN','DRE') decidir(@Param('recursoId') id: string, @Body() dto: DecisaoRecursoDto, @Req() req: Request) { return this.service.decidirRecurso(id, dto, req.user as AuthenticatedUser); }
  @Post(':id/homologacao') @Roles('ADMIN') homologar(@Param('id') id: string, @Body() dto: HomologacaoDto, @Req() req: Request) { return this.service.homologar(id, dto, req.user as AuthenticatedUser); }
  @Post('projetos/:projetoId/encaminhar-contrato') @Roles('ADMIN','DRE') encaminhar(@Param('projetoId') id: string, @Req() req: Request) { return this.service.encaminharContrato(id, req.user as AuthenticatedUser); }
}
