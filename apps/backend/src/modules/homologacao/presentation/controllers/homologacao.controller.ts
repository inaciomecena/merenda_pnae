import { Controller, Get, Post, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { HomologacaoService } from '../../application/services/homologacao.service';

@ApiTags('homologacao')
@Controller({ path: 'homologacao', version: '1' })
export class HomologacaoController {
  constructor(private readonly service: HomologacaoService) {}

  @Get('status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Status do sistema para homologacao' })
  getStatus() {
    return this.service.getStatus();
  }

  @Get('relatorio')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Relatorio de homologacao' })
  @ApiQuery({ name: 'usuario', required: false })
  getRelatorio(@Query('usuario') usuario?: string) {
    return this.service.getRelatorio(usuario);
  }

  @Get('exportar/:tipo')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Exportar dados em CSV' })
  @ApiQuery({ name: 'editalId', required: false })
  async exportar(
    @Param('tipo') tipo: string,
    @Query('editalId') editalId: string,
    @Res() res: Response,
  ) {
    const result = await this.service.exportarCSV(tipo, editalId);
    if ('erro' in result) {
      return res.status(400).json(result);
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send('\uFEFF' + result.data);
  }

  @Post('seed-teste')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Executar seed de teste' })
  async seedTeste() {
    return this.service.executarSeedTeste();
  }
}
