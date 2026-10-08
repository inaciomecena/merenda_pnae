import { Controller, Get, Query, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from '../../application/services/reports.service';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('reports')
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get(':tipo')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Gerar relatorio por tipo' })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'nome', required: false })
  @ApiQuery({ name: 'ano', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getRelatorio(
    @Param('tipo') tipo: string,
    @Query('id') id?: string,
    @Query('nome') nome?: string,
    @Query('ano') ano?: number,
    @Query('municipioId') municipioId?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const data = await this.service.getExportData(tipo, { id, nome, ano: ano ? Number(ano) : undefined, municipioId, status });
    if (res) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-${tipo}.json"`);
      res.json(data);
    }
    return data;
  }

  @Get('exportar/:tipo')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Exportar relatorio em CSV' })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'nome', required: false })
  async exportarCSV(
    @Param('tipo') tipo: string,
    @Query('id') id?: string,
    @Query('nome') nome?: string,
    @Res() res?: Response,
  ) {
    const data = await this.service.getExportData(tipo, { id, nome });
    if ('erro' in data) {
      return res?.status(400).json(data);
    }

    const csv = this.convertToCSV(data, tipo);
    if (res) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-${tipo}.csv"`);
      res.send('\uFEFF' + csv);
    }
    return csv;
  }

  private convertToCSV(data: any, tipo: string): string {
    if (!data || typeof data !== 'object') return '';

    const flatten = (obj: any, prefix = ''): Record<string, any> => {
      const result: Record<string, any> = {};
      for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, flatten(obj[key], newKey));
        } else {
          result[newKey] = obj[key];
        }
      }
      return result;
    };

    const flat = flatten(data);
    const headers = Object.keys(flat).join(';');
    const values = Object.values(flat).map(v => String(v).replace(/;/g, ',')).join(';');
    return `${headers}\n${values}`;
  }
}
