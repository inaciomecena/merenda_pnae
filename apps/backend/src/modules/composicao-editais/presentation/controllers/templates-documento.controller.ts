import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { TemplatesDocumentoService } from '../../application/services/templates-documento.service';
import { CreateTemplateDocumentoDto, StatusTemplateDto, UpdateTemplateDocumentoDto } from '../dto/composicao.dto';

const uploadDir = path.resolve(process.cwd(), 'storage', 'templates');

@ApiTags('templates-documento')
@Controller({ path: 'templates-documento', version: '1' })
@Roles('ADMIN')
export class TemplatesDocumentoController {
  constructor(private readonly service: TemplatesDocumentoService) {}

  @Get('variaveis')
  @ApiOperation({ summary: 'Listar variáveis disponíveis nos templates' })
  variaveis() {
    return this.service.listarVariaveis();
  }

  @Get()
  @ApiOperation({ summary: 'Listar templates de anexos e edital principal' })
  listar(@Query() query: { search?: string; tipo?: string; ativo?: string }) {
    return this.service.listar(query);
  }

  @Get('anexos-padrao')
  @ApiOperation({ summary: 'Listar anexos e declarações a vincular em um novo edital' })
  anexosPadrao() {
    return this.service.anexosPadrao();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar template e versões' })
  buscar(@Param('id') id: string) {
    return this.service.buscar(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar template' })
  criar(@Body() dto: CreateTemplateDocumentoDto, @Req() req: Request) {
    return this.service.criar(dto, this.usuario(req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar template e gerar nova versão quando o conteúdo mudar' })
  atualizar(@Param('id') id: string, @Body() dto: UpdateTemplateDocumentoDto, @Req() req: Request) {
    return this.service.atualizar(id, dto, this.usuario(req));
  }

  @Post(':id/duplicar')
  @ApiOperation({ summary: 'Duplicar template' })
  duplicar(@Param('id') id: string, @Req() req: Request) {
    return this.service.duplicar(id, this.usuario(req));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ativar ou inativar template' })
  status(@Param('id') id: string, @Body() dto: StatusTemplateDto, @Req() req: Request) {
    return this.service.alterarStatus(id, dto.ativo, this.usuario(req));
  }

  @Post(':id/arquivo')
  @ApiOperation({ summary: 'Enviar arquivo-base HTML, TXT, DOCX ou PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[<>:"/\\|?*]+/g, '')}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  arquivo(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ fileIsRequired: true })) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.service.enviarArquivo(id, file, this.usuario(req));
  }

  @Get(':id/arquivo')
  @ApiOperation({ summary: 'Baixar ou visualizar o arquivo-base' })
  async baixar(@Param('id') id: string, @Res() res: Response) {
    const arquivo = await this.service.caminhoArquivo(id);
    res.setHeader('Content-Disposition', `inline; filename="${arquivo.nome}"`);
    res.sendFile(arquivo.caminho);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir template ainda não usado em edital gerado' })
  remover(@Param('id') id: string, @Req() req: Request) {
    return this.service.remover(id, this.usuario(req));
  }

  private usuario(req: Request) {
    const user = req.user as { sub?: string } | undefined;
    return user?.sub || 'system';
  }
}
