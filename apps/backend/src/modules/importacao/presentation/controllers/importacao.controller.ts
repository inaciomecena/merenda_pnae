import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ImportacaoService } from '../../application/services/importacao.service';

@ApiTags('importacao')
@Controller({ path: 'importacao', version: '1' })
export class ImportacaoController {
  constructor(private readonly service: ImportacaoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs de importação' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar uma importação' })
  create(@Body() dto: { editalId?: string; arquivoNome: string; status: string; resumo?: string; createdBy?: string }) {
    return this.service.create(dto);
  }

  @Get('pdfs')
  @ApiOperation({ summary: 'Listar PDFs disponíveis para importação' })
  listarPdfs() {
    return this.service.listarArquivosPdf();
  }
}
