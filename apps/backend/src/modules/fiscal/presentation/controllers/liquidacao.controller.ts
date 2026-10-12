import {
  Body,
  Controller,
  Get,
  Param,
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
import { LiquidacaoService } from '../../application/services/liquidacao.service';
import { CriarLiquidacaoDto, FiltrosLiquidacaoDto } from '../dto/fiscal.dto';

const TODOS_OS_PERFIS = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'] as const;
const PERFIS_FINANCEIROS = ['ADMIN', 'DRE'] as const;

@ApiTags('liquidacoes')
@Controller({ path: 'liquidacoes', version: '1' })
export class LiquidacaoController {
  constructor(private readonly service: LiquidacaoService) {}

  @Get()
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Listar liquidações com filtros e escopo institucional' })
  async findAll(@Query() query: FiltrosLiquidacaoDto, @Req() req: Request) {
    return this.service.listar(query, req.user as AuthenticatedUser);
  }

  @Post()
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Registrar liquidação de nota fiscal atestada' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('comprovante', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async criar(
    @UploadedFile() comprovante: Express.Multer.File | undefined,
    @Body() dto: CriarLiquidacaoDto,
    @Req() req: Request,
  ) {
    return this.service.criar({ ...dto, comprovante: comprovante ?? undefined }, req.user as AuthenticatedUser);
  }

  @Get(':id/comprovante')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Baixar comprovante da liquidação (valida integridade por hash)' })
  async comprovante(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const { caminho, nome, mimeType } = await this.service.comprovante(id, req.user as AuthenticatedUser);
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(caminho);
  }
}
