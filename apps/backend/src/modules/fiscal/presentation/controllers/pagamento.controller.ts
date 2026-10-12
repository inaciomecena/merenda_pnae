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
import { PagamentoService } from '../../application/services/pagamento.service';
import { CriarPagamentoDto, EstornarPagamentoDto, FiltrosPagamentoDto } from '../dto/fiscal.dto';

const TODOS_OS_PERFIS = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'] as const;
const PERFIS_FINANCEIROS = ['ADMIN', 'DRE'] as const;

@ApiTags('pagamentos')
@Controller({ path: 'pagamentos', version: '1' })
export class PagamentoController {
  constructor(private readonly service: PagamentoService) {}

  @Get()
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Listar pagamentos com filtros e escopo institucional' })
  async findAll(@Query() query: FiltrosPagamentoDto, @Req() req: Request) {
    return this.service.listar(query, req.user as AuthenticatedUser);
  }

  @Post()
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Registrar pagamento de liquidação' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('comprovante', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async criar(
    @UploadedFile() comprovante: Express.Multer.File | undefined,
    @Body() dto: CriarPagamentoDto,
    @Req() req: Request,
  ) {
    return this.service.criar({ ...dto, comprovante: comprovante ?? undefined }, req.user as AuthenticatedUser);
  }

  @Post(':id/estornar')
  @Roles(...PERFIS_FINANCEIROS)
  @ApiOperation({ summary: 'Estornar pagamento (sem exclusão física, com trilha de auditoria)' })
  async estornar(@Param('id') id: string, @Body() dto: EstornarPagamentoDto, @Req() req: Request) {
    return this.service.estornar(id, dto.motivo, req.user as AuthenticatedUser);
  }

  @Get(':id/comprovante')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Baixar comprovante do pagamento (valida integridade por hash)' })
  async comprovante(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const { caminho, nome, mimeType } = await this.service.comprovante(id, req.user as AuthenticatedUser);
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(caminho);
  }
}
