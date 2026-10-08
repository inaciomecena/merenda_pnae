import { Controller, Get, Query, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DashboardService } from '../../application/services/dashboard.service';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Dashboard principal com KPIs e graficos' })
  @ApiQuery({ name: 'ano', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  async getDashboard(
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
  ) {
    const filters = { ano: ano ? Number(ano) : undefined, municipioId };
    const [kpis, graficos] = await Promise.all([
      this.service.getKPIs(filters),
      this.service.getGraficos(filters),
    ]);
    return { kpis, graficos };
  }

  @Get('kpis')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Indicadores KPI do sistema' })
  @ApiQuery({ name: 'ano', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  getKPIs(
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
  ) {
    return this.service.getKPIs({ ano: ano ? Number(ano) : undefined, municipioId });
  }

  @Get('graficos')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Dados para graficos do dashboard' })
  @ApiQuery({ name: 'ano', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  getGraficos(
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
  ) {
    return this.service.getGraficos({ ano: ano ? Number(ano) : undefined, municipioId });
  }

  @Get('ranking/:tipo')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Rankings do sistema' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  getRanking(
    @Param('tipo') tipo: string,
    @Query('limit') limit?: number,
    @Query('municipioId') municipioId?: string,
  ) {
    return this.service.getRanking(tipo, { limit: limit ? Number(limit) : 20, municipioId });
  }

  @Get('mapa')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Dados para mapa do Mato Grosso' })
  getMapaDados() {
    return this.service.getMapaDados();
  }

  @Get('produtos')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Produtos mais solicitados' })
  @ApiQuery({ name: 'limit', required: false })
  getProdutos(@Query('limit') limit?: number) {
    return this.service.getRanking('produtos-solicitados', { limit: limit ? Number(limit) : 15 });
  }

  @Get('municipios')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Ranking de municipios' })
  @ApiQuery({ name: 'limit', required: false })
  getMunicipios(@Query('limit') limit?: number) {
    return this.service.getRanking('municipios', { limit: limit ? Number(limit) : 10 });
  }

  @Get('escolas')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Ranking de escolas' })
  @ApiQuery({ name: 'limit', required: false })
  getEscolas(@Query('limit') limit?: number) {
    return this.service.getRanking('escolas', { limit: limit ? Number(limit) : 10 });
  }

  @Get('produtores')
  @Roles('ADMIN', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Ranking de produtores' })
  @ApiQuery({ name: 'limit', required: false })
  getProdutores(@Query('limit') limit?: number) {
    return this.service.getRanking('produtores', { limit: limit ? Number(limit) : 10 });
  }

  @Get('exportar/:tipo')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Exportar dados do dashboard' })
  async exportar(
    @Param('tipo') tipo: string,
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
    @Res() res?: Response,
  ) {
    const data = await this.service.getExportData(tipo, { ano: ano ? Number(ano) : undefined, municipioId });
    if (res) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="dashboard-${tipo}.json"`);
      res.json(data);
    }
    return data;
  }
}
