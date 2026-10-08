import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { ImportadorEditaisService } from '../../application/services/importador-editais.service';
import { ConfirmarImportacaoDto } from '../dto/confirmar-importacao.dto';
import { CreateImportacaoPdfDto } from '../dto/create-importacao-pdf.dto';
import { ProcessarImportacaoDto } from '../dto/processar-importacao.dto';
import { UpdateImportacaoEditalDto } from '../dto/update-importacao-edital.dto';
import { ensurePdfFile } from '../validators/pdf-file.validator';
import { Roles } from '../../../../common/decorators/roles.decorator';

const uploadDir = path.resolve(process.cwd(), 'storage', 'importacoes');

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function sanitizeFileName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const base = path
    .basename(fileName, ext)
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `${Date.now()}-${base || 'edital'}${ext}`;
}

@ApiTags('importacoes')
@Controller({ path: 'importacoes', version: '1' })
export class ImportacoesController {
  constructor(private readonly service: ImportadorEditaisService) {}

  @Post('pdf')
  @Roles('ADMIN', 'ESCOLA')
  @ApiOperation({ summary: 'Fazer upload manual de um edital em PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Arquivo PDF do edital', type: CreateImportacaoPdfDto })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureUploadDir();
          callback(null, uploadDir);
        },
        filename: (_request, file, callback) => callback(null, sanitizeFileName(file.originalname)),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPdf(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateImportacaoPdfDto,
  ) {
    ensurePdfFile(file);
    return this.service.registrarUpload(file, dto);
  }

  @Get()
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Listar importações de editais' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query() query: { page?: number; limit?: number; status?: string }) {
    return this.service.listarImportacoes(query);
  }

  @Post('sincronizar-docs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Sincronizar PDFs da pasta docs' })
  sincronizarDocs(@Body() dto: { processarAutomaticamente?: boolean }) {
    return this.service.sincronizarDocs(dto?.processarAutomaticamente ?? false);
  }

  @Get(':id')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Detalhar uma importação' })
  findOne(@Param('id') id: string) {
    return this.service.buscarImportacao(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ESCOLA')
  @ApiOperation({ summary: 'Editar o edital vinculado à importação (bloqueado após confirmação)' })
  editarEdital(@Param('id') id: string, @Body() dto: UpdateImportacaoEditalDto) {
    return this.service.editarEdital(id, dto);
  }

  @Post(':id/processar')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Processar um PDF salvo' })
  processar(@Param('id') id: string, @Body() dto: ProcessarImportacaoDto) {
    return this.service.processarImportacao(id, dto.reprocessar ?? false);
  }

  @Post(':id/confirmar')
  @Roles('ADMIN', 'ESCOLA', 'EXTENSIONISTA')
  @ApiOperation({ summary: 'Confirmar os itens conferidos da importação' })
  confirmar(@Param('id') id: string, @Body() dto: ConfirmarImportacaoDto) {
    return this.service.confirmarImportacao(id, dto);
  }
}
