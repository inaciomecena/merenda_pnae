import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { ProdutorPainelService } from '../application/produtor-painel.service';
import { AssistenciaTecnicaDto, CatalogoQueryDto, CatalogoRevisaoDto, CatalogoSolicitacaoDto, DisponibilidadeDto, ListagemProdutorQueryDto, LogisticaDto, MapeamentoProdutoEditalDto, ProdutoProdutorPainelDto, SafraProducaoDto, SazonalidadeDto, UnidadeProdutivaDto } from './produtor-painel.dto';

const PRODUCER_ROLES = ['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'] as const;
@Controller({ path: 'produtor', version: '1' })
export class ProdutorPainelController {
  constructor(private readonly service: ProdutorPainelService) {}
  private u(req: Request) { return req.user as AuthenticatedUser; }
  @Get('meus-vinculos') @Roles(...PRODUCER_ROLES) vinculos(@Req() req: Request) { return this.service.meusProdutores(this.u(req)); }
  @Get('meu-painel') @Roles(...PRODUCER_ROLES) painel(@Query('produtorId') id: string, @Req() req: Request) { return this.service.painel(this.u(req), id); }
  @Get('minhas-unidades') @Roles(...PRODUCER_ROLES) unidades(@Query('produtorId') id: string, @Req() req: Request) { return this.service.unidades(this.u(req), id); }
  @Post('minhas-unidades') @Roles(...PRODUCER_ROLES) criarUnidade(@Body() dto: UnidadeProdutivaDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.criarUnidade(dto, this.u(req), id); }
  @Patch('minhas-unidades/:id') @Roles(...PRODUCER_ROLES) atualizarUnidade(@Param('id') id: string, @Body() dto: UnidadeProdutivaDto, @Req() req: Request) { return this.service.atualizarUnidade(id, dto, this.u(req)); }
  @Get('meus-produtos') @Roles(...PRODUCER_ROLES) produtos(@Query('produtorId') id: string, @Query() query: ListagemProdutorQueryDto, @Req() req: Request) { return this.service.produtos(this.u(req), id, query); }
  @Post('meus-produtos') @Roles(...PRODUCER_ROLES) criarProduto(@Body() dto: ProdutoProdutorPainelDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.criarProduto(dto, this.u(req), id); }
  @Patch('meus-produtos/:id') @Roles(...PRODUCER_ROLES) atualizarProduto(@Param('id') id: string, @Body() dto: ProdutoProdutorPainelDto, @Req() req: Request) { return this.service.atualizarProduto(id, dto, this.u(req)); }
  @Get('minhas-safras') @Roles(...PRODUCER_ROLES) safras(@Query('produtorId') id: string, @Query() query: ListagemProdutorQueryDto, @Req() req: Request) { return this.service.safras(this.u(req), id, query); }
  @Post('minhas-safras') @Roles(...PRODUCER_ROLES) criarSafra(@Body() dto: SafraProducaoDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.criarSafra(dto, this.u(req), id); }
  @Patch('minhas-safras/:id') @Roles(...PRODUCER_ROLES) atualizarSafra(@Param('id') id: string, @Body() dto: SafraProducaoDto, @Req() req: Request) { return this.service.atualizarSafra(id, dto, this.u(req)); }
  @Get('minha-sazonalidade') @Roles(...PRODUCER_ROLES) sazonalidade(@Query('produtorId') id: string, @Query() query: ListagemProdutorQueryDto, @Req() req: Request) { return this.service.sazonalidade(this.u(req), id, query); }
  @Post('minha-sazonalidade') @Roles(...PRODUCER_ROLES) criarSazonalidade(@Body() dto: SazonalidadeDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.criarSazonalidade(dto, this.u(req), id); }
  @Get('minha-disponibilidade') @Roles(...PRODUCER_ROLES) disponibilidade(@Query('produtorId') id: string, @Req() req: Request) { return this.service.disponibilidade(this.u(req), id); }
  @Post('minha-disponibilidade') @Roles(...PRODUCER_ROLES) criarDisponibilidade(@Body() dto: DisponibilidadeDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.criarDisponibilidade(dto, this.u(req), id); }
  @Get('minha-logistica') @Roles(...PRODUCER_ROLES) logistica(@Query('produtorId') id: string, @Req() req: Request) { return this.service.logistica(this.u(req), id); }
  @Post('minha-logistica') @Roles(...PRODUCER_ROLES) criarLogistica(@Body() dto: LogisticaDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.criarLogistica(dto, this.u(req), id); }
  @Patch('minha-logistica/:id') @Roles(...PRODUCER_ROLES) atualizarLogistica(@Param('id') id: string, @Body() dto: LogisticaDto, @Req() req: Request) { return this.service.atualizarLogistica(id, dto, this.u(req)); }
  @Get('assistencia-tecnica') @Roles(...PRODUCER_ROLES) assistencias(@Query('produtorId') id: string, @Req() req: Request) { return this.service.assistencias(this.u(req), id); }
  @Post('assistencia-tecnica') @Roles('ADMIN') criarAssistencia(@Body() dto: AssistenciaTecnicaDto, @Req() req: Request) { return this.service.criarAssistencia(dto, this.u(req)); }
  @Patch('assistencia-tecnica/:id') @Roles('ADMIN') atualizarAssistencia(@Param('id') id: string, @Body() dto: Partial<AssistenciaTecnicaDto>, @Req() req: Request) { return this.service.atualizarAssistencia(id, dto, this.u(req)); }
  @Post('mapeamentos-edital') @Roles(...PRODUCER_ROLES) mapear(@Body() dto: MapeamentoProdutoEditalDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.criarMapeamento(dto, this.u(req), id); }
  @Patch('mapeamentos-edital/:id') @Roles('ADMIN', 'DRE') revisar(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) { return this.service.revisarMapeamento(id, status, this.u(req)); }
}

@Controller({ path: 'catalogo-produtos', version: '1' })
export class CatalogoProdutosController {
  constructor(private readonly service: ProdutorPainelService) {}
  @Get() @Roles('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR', 'DRE', 'ESCOLA') listar(@Query() query: CatalogoQueryDto) { return this.service.catalogo(query); }
  @Get('solicitacoes') @Roles('ADMIN') solicitacoes(@Req() req: Request) { return this.service.solicitacoesCatalogo(req.user as AuthenticatedUser); }
  @Patch('solicitacoes/:id') @Roles('ADMIN') revisarSolicitacao(@Param('id') id: string, @Body() dto: CatalogoRevisaoDto, @Req() req: Request) { return this.service.revisarSolicitacaoCatalogo(id, dto, req.user as AuthenticatedUser); }
  @Get(':id/nutricao') @Roles('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR', 'DRE', 'ESCOLA') nutricao(@Param('id') id: string) { return this.service.nutricao(id); }
  @Get(':id') @Roles('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR', 'DRE', 'ESCOLA') obter(@Param('id') id: string) { return this.service.catalogoItem(id); }
  @Post('solicitacoes') @Roles('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR') solicitar(@Body() dto: CatalogoSolicitacaoDto, @Req() req: Request) { return this.service.solicitarCatalogo(dto, req.user as AuthenticatedUser); }
}
