import { Controller, Get, Query, Param, Res, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { DashboardService } from '../../application/services/dashboard.service';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

@ApiTags('dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Dashboard principal com KPIs e graficos' })
  @ApiQuery({ name: 'ano', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  async getDashboard(
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
    @Req() req?: Request,
  ) {
    const user = req?.user as AuthenticatedUser;
    const filters = { ano: ano ? Number(ano) : undefined, municipioId, user };
    const [kpis, graficos] = await Promise.all([
      this.service.getKPIs(filters),
      this.service.getGraficos(filters),
    ]);
    return { kpis, graficos };
  }

  @Get('kpis')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Indicadores KPI do sistema' })
  @ApiQuery({ name: 'ano', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  getKPIs(
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
    @Req() req?: Request,
  ) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getKPIs({ ano: ano ? Number(ano) : undefined, municipioId, user });
  }

  @Get('graficos')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Dados para graficos do dashboard' })
  @ApiQuery({ name: 'ano', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  getGraficos(
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
    @Req() req?: Request,
  ) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getGraficos({ ano: ano ? Number(ano) : undefined, municipioId, user });
  }

  @Get('ranking/:tipo')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Rankings do sistema' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  getRanking(
    @Param('tipo') tipo: string,
    @Query('limit') limit?: number,
    @Query('municipioId') municipioId?: string,
    @Req() req?: Request,
  ) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getRanking(tipo, { limit: limit ? Number(limit) : 20, municipioId, user });
  }

  @Get('mapa')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Dados para mapa do Mato Grosso' })
  getMapaDados(@Req() req?: Request) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getMapaDados(user);
  }

  @Get('produtos')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Produtos mais solicitados' })
  @ApiQuery({ name: 'limit', required: false })
  getProdutos(@Query('limit') limit?: number, @Req() req?: Request) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getRanking('produtos-solicitados', { limit: limit ? Number(limit) : 15, user });
  }

  @Get('municipios')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Ranking de municipios' })
  @ApiQuery({ name: 'limit', required: false })
  getMunicipios(@Query('limit') limit?: number, @Req() req?: Request) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getRanking('municipios', { limit: limit ? Number(limit) : 10, user });
  }

  @Get('escolas')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Ranking de escolas' })
  @ApiQuery({ name: 'limit', required: false })
  getEscolas(@Query('limit') limit?: number, @Req() req?: Request) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getRanking('escolas', { limit: limit ? Number(limit) : 10, user });
  }

  @Get('produtores')
  @Roles('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Ranking de produtores' })
  @ApiQuery({ name: 'limit', required: false })
  getProdutores(@Query('limit') limit?: number, @Req() req?: Request) {
    const user = req?.user as AuthenticatedUser;
    return this.service.getRanking('produtores', { limit: limit ? Number(limit) : 10, user });
  }

  @Get('exportar/:tipo')
  @Roles('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR')
  @ApiOperation({ summary: 'Exportar dados do dashboard' })
  async exportar(
    @Param('tipo') tipo: string,
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
    @Res() res?: Response,
    @Req() req?: Request,
  ) {
    const user = req?.user as AuthenticatedUser;
    const data = await this.service.getExportData(tipo, { ano: ano ? Number(ano) : undefined, municipioId, user });
    if (res) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="dashboard-${tipo}.json"`);
      res.json(data);
    }
    return data;
  }
}

