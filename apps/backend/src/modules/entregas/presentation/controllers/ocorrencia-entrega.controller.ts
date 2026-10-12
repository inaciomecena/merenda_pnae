import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { OcorrenciaEntregaService } from '../../application/services/ocorrencia-entrega.service';
import { OcorrenciaEntregaDto, TratarOcorrenciaDto, TransicaoOcorrenciaDto } from '../dto/entrega.dto';

@ApiTags('OcorrÃªncias de Entrega')
@ApiBearerAuth()
@Controller('entregas/:entregaId/ocorrencias')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA')
export class OcorrenciaEntregaController {
  constructor(private readonly service: OcorrenciaEntregaService) {}

  @Post()
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Registrar ocorrÃªncia na entrega' })
  @ApiResponse({ status: 201, description: 'OcorrÃªncia registrada' })
  @ApiResponse({ status: 404, description: 'Entrega nÃ£o encontrada' })
  async create(@Param('entregaId') entregaId: string, @Body() dto: OcorrenciaEntregaDto, @Request() req: any) {
    return this.service.create(entregaId, dto, req.user.sub, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ocorrÃªncias da entrega' })
  @ApiResponse({ status: 200, description: 'Lista de ocorrÃªncias' })
  async findAll(@Param('entregaId') entregaId: string, @Request() req: any) {
    return this.service.findAll({ entregaId }, req.user);
  }
}

@ApiTags('OcorrÃªncias de Entrega')
@ApiBearerAuth()
@Controller('ocorrencias-entrega')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA')
export class OcorrenciaEntregaGlobalController {
  constructor(private readonly service: OcorrenciaEntregaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as ocorrÃªncias (com filtros)' })
  @ApiQuery({ name: 'tipo', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Lista de ocorrÃªncias' })
  async findAll(@Query('tipo') tipo?: string, @Query('status') status?: string, @Request() req?: any) {
    return this.service.findAll({ tipo, status }, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar ocorrÃªncia por ID' })
  @ApiResponse({ status: 200, description: 'OcorrÃªncia encontrada' })
  @ApiResponse({ status: 404, description: 'OcorrÃªncia nÃ£o encontrada' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.service.findById(id, req.user);
  }

  @Post(':id/tratar')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tratar ocorrÃªncia' })
  @ApiResponse({ status: 200, description: 'OcorrÃªncia tratada' })
  @ApiResponse({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' })
  async tratar(@Param('id') id: string, @Body() dto: TratarOcorrenciaDto, @Request() req: any) {
    return this.service.tratar(id, dto, req.user.sub, req.user.role);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'DRE', 'ESCOLA')
  @ApiOperation({ summary: 'Transicionar status da ocorrÃªncia' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' })
  async transicionar(@Param('id') id: string, @Body() dto: TransicaoOcorrenciaDto, @Request() req: any) {
    return this.service.transicionar(id, dto.para as any, dto.tratativa, req.user.sub, req.user.role);
  }
}

