import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { NotaFiscalService } from '../../application/services/nota-fiscal.service';
import { FiscalDocumentoService } from '../../application/services/fiscal-documento.service';
import { ConferenciaFiscalService } from '../../application/services/conferencia-fiscal.service';
import { AtestoService } from '../../application/services/atesto.service';
import {
  AtualizarNotaFiscalDto,
  CriarAtestoDto,
  CriarNotaFiscalDto,
  FiltrosNotaFiscalDto,
  RegistrarConferenciaDto,
  UploadNotaFiscalDto,
  VincularRecebimentoDto,
} from '../dto/fiscal.dto';

const TODOS_OS_PERFIS = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'] as const;
const PERFIS_FINANCEIROS = ['ADMIN', 'DRE'] as const;

@ApiTags('notas-fiscais')
@Controller({ path: 'notas-fiscais', version: '1' })
export class NotaFiscalController {
  constructor(
    private readonly service: NotaFiscalService,
    private readonly documentoService: FiscalDocumentoService,
    private readonly conferenciaService: ConferenciaFiscalService,
    private readonly atestoService: AtestoService,
  ) {}

  @Get()
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Listar notas fiscais com filtros e escopo institucional' })
  async findAll(@Query() query: FiltrosNotaFiscalDto, @Req() req: Request) {
    return this.service.findAll(query, req.user as AuthenticatedUser);
  }

  @Post()
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Cadastro manual de nota fiscal (operação administrativa, sem integrações externas)' })
  async criar(@Body() dto: CriarNotaFiscalDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.service.create(dto, user.sub, user);
  }

  @Patch(':id')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Corrigir dados da nota fiscal e, opcionalmente, transicionar o status' })
  async atualizar(@Param('id') id: string, @Body() dto: AtualizarNotaFiscalDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as AuthenticatedUser);
  }

  @Get(':id/recebimentos/candidatos')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Recebimentos (entregas aceitas) disponíveis para vincular à nota fiscal' })
  async recebimentosCandidatos(@Param('id') id: string, @Req() req: Request) {
    return this.service.recebimentosCandidatos(id, req.user as AuthenticatedUser);
  }

  @Post(':id/recebimentos')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Vincular recebimento a um item da nota fiscal (associação manual)' })
  async vincularRecebimento(
    @Param('id') id: string,
    @Body() dto: VincularRecebimentoDto,
    @Req() req: Request,
  ) {
    return this.service.vincularRecebimento(id, dto, req.user as AuthenticatedUser);
  }

  @Delete(':id/recebimentos/:vinculoId')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Desvincular recebimento da nota fiscal (correção manual, bloqueada após atesto)' })
  async desvincularRecebimento(
    @Param('id') id: string,
    @Param('vinculoId') vinculoId: string,
    @Req() req: Request,
  ) {
    return this.service.desvincularRecebimento(id, vinculoId, req.user as AuthenticatedUser);
  }

  @Post('upload')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Enviar XML (cria a nota) ou PDF (anexa à nota existente)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() arquivo: Express.Multer.File,
    @Body() dto: UploadNotaFiscalDto,
    @Req() req: Request,
  ) {
    if (!arquivo) throw new BadRequestException('Arquivo é obrigatório.');
    return this.service.receberArquivo(dto, arquivo, req.user as AuthenticatedUser);
  }

  @Get(':id')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Detalhar nota fiscal (itens, documentos, conciliação, conferências e atestos)' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findById(id, req.user as AuthenticatedUser);
  }

  @Post(':id/conciliar')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Executar conciliação fiscal (contrato × recebimento × nota)' })
  async conciliar(@Param('id') id: string, @Req() req: Request) {
    return this.service.conciliar(id, req.user as AuthenticatedUser);
  }

  @Get(':id/documentos/:documentoId')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Baixar documento fiscal (valida integridade por hash)' })
  async download(
    @Param('id') id: string,
    @Param('documentoId') documentoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { caminho, nome, mimeType } = await this.documentoService.download(
      id,
      documentoId,
      req.user as AuthenticatedUser,
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(caminho);
  }

  @Get(':id/conferencia')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Última conferência fiscal da nota' })
  async obterConferencia(@Param('id') id: string, @Req() req: Request) {
    return this.conferenciaService.obter(id, req.user as AuthenticatedUser);
  }

  @Post(':id/conferencia')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Registrar conferência fiscal (aprovar ou rejeitar)' })
  async registrarConferencia(
    @Param('id') id: string,
    @Body() dto: RegistrarConferenciaDto,
    @Req() req: Request,
  ) {
    return this.conferenciaService.registrar(id, dto, req.user as AuthenticatedUser);
  }

  @Get(':id/atestos')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Listar atestos da nota fiscal' })
  async listarAtestos(@Param('id') id: string, @Req() req: Request) {
    return this.atestoService.listarPorNota(id, req.user as AuthenticatedUser);
  }

  @Post(':id/atestos')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Registrar atesto da nota fiscal (integral ou parcial)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('comprovante', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async criarAtesto(
    @Param('id') id: string,
    @UploadedFile() comprovante: Express.Multer.File | undefined,
    @Body() dto: CriarAtestoDto,
    @Req() req: Request,
  ) {
    return this.atestoService.criar(
      id,
      { ...dto, comprovante: comprovante ?? undefined },
      req.user as AuthenticatedUser,
    );
  }

  @Get(':id/atestos/:atestoId/comprovante')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Baixar comprovante do atesto (valida integridade por hash)' })
  async comprovanteAtesto(
    @Param('id') id: string,
    @Param('atestoId') atestoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { caminho, nome, mimeType } = await this.atestoService.obterComprovante(
      id,
      atestoId,
      req.user as AuthenticatedUser,
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(caminho);
  }
}
