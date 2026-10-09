import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ComposicaoEditalService } from '../../application/services/composicao-edital.service';
import { GeracaoEditalService } from '../../application/services/geracao-edital.service';
import {
  CreateComposicaoDto,
  SalvarAnexosDto,
  SalvarItensDto,
  SalvarVariaveisDto,
  UpdateComposicaoDto,
} from '../dto/composicao.dto';


@ApiTags('composicao-editais')
@Controller({ path: 'editais', version: '1' })
export class ComposicaoEditalController {
  constructor(
    private readonly composicao: ComposicaoEditalService,
    private readonly geracao: GeracaoEditalService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('composicao')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Criar edital do zero com composição documental' })
  criar(@Body() dto: CreateComposicaoDto, @Req() req: Request) {
    return this.composicao.criar(dto, this.usuarioId(req));
  }

  @Get(':id/composicao')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Obter composição, anexos, variáveis, versões e última geração' })
  obter(@Param('id') id: string) {
    return this.composicao.obter(id);
  }

  @Patch(':id/composicao')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Editar estrutura do edital' })
  atualizar(@Param('id') id: string, @Body() dto: UpdateComposicaoDto, @Req() req: Request) {
    return this.composicao.atualizar(id, dto, this.usuarioId(req));
  }

  @Post(':id/composicao/itens')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Substituir itens do edital em composição' })
  itens(@Param('id') id: string, @Body() dto: SalvarItensDto, @Req() req: Request) {
    return this.composicao.salvarItens(id, dto.itens, this.usuarioId(req));
  }

  @Post(':id/composicao/anexos')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Selecionar, ordenar e versionar anexos' })
  anexos(@Param('id') id: string, @Body() dto: SalvarAnexosDto, @Req() req: Request) {
    return this.composicao.salvarAnexos(id, dto.anexos, this.usuarioId(req));
  }

  @Post(':id/composicao/variaveis')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Salvar variáveis e marcar revisão' })
  variaveis(@Param('id') id: string, @Body() dto: SalvarVariaveisDto, @Req() req: Request) {
    return this.composicao.salvarVariaveis(id, dto.variaveis, this.usuarioId(req));
  }

  @Post(':id/composicao/duplicar')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Duplicar edital sem copiar dados sensíveis' })
  duplicar(@Param('id') id: string, @Req() req: Request) {
    return this.composicao.duplicar(id, this.usuarioId(req));
  }

  @Post(':id/composicao/nova-versao')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Abrir nova versão sem alterar a publicação anterior' })
  novaVersao(@Param('id') id: string, @Req() req: Request) {
    return this.composicao.novaVersao(id, this.usuarioId(req));
  }

  @Post(':id/composicao/publicar')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Publicar edital gerado' })
  publicar(@Param('id') id: string, @Req() req: Request) {
    return this.composicao.publicar(id, this.usuarioId(req));
  }

  @Post(':id/composicao/cancelar')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Cancelar edital ainda não publicado' })
  cancelar(@Param('id') id: string, @Req() req: Request) {
    return this.composicao.cancelar(id, this.usuarioId(req));
  }

  @Get(':id/composicao/previa')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Prévia textual e validação antes da geração' })
  previa(@Param('id') id: string) {
    return this.geracao.previa(id);
  }

  @Post(':id/composicao/gerar')
  @Roles('ADMIN', 'DRE')
  @ApiOperation({ summary: 'Gerar PDF e DOCX do edital e anexos' })
  async gerar(@Param('id') id: string, @Req() req: Request) {
    const usuario = await this.usuario(req);
    return this.geracao.gerar(id, usuario);
  }

  @Get(':id/composicao/download')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Baixar PDF ou DOCX gerado' })
  async download(@Param('id') id: string, @Query('formato') formato = 'pdf', @Res() res: Response) {
    const arquivo = await this.geracao.arquivo(id, formato);
    const contentType = arquivo.formato === 'DOCX'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome}"`);
    fs.createReadStream(arquivo.caminho).pipe(res);
  }

  private usuarioId(req: Request) {
    return (req.user as { sub?: string } | undefined)?.sub || 'system';
  }

  private async usuario(req: Request) {
    const id = this.usuarioId(req);
    const user = id === 'system' ? null : await this.prisma.user.findUnique({ where: { id } });
    const forwarded = req.headers['x-forwarded-for'];
    return {
      id,
      nome: user?.name || (req.user as { email?: string } | undefined)?.email || 'sistema',
      ip: typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress,
    };
  }
}
