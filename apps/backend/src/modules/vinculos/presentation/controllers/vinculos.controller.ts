import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VinculosService } from '../../application/services/vinculos.service';
import { CreateVinculoDto, CreateRepresentacaoDto, RevokeRepresentacaoDto, UpdateRepresentacaoDto } from '../dto/vinculo.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Request } from 'express';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

@ApiTags('vinculos')
@Controller({ path: 'vinculos', version: '1' })
export class VinculosController {
  constructor(private readonly vinculosService: VinculosService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar novo vínculo para usuário' })
  createVinculo(@Body() dto: CreateVinculoDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.vinculosService.createVinculo(
      {
        ...dto,
        vigenciaInicio: new Date(dto.vigenciaInicio),
        vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined,
      },
      user,
    );
  }

  @Get('usuario/:userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar vínculos de um usuário' })
  getVinculosUsuario(@Param('userId') userId: string) {
    return this.vinculosService.getVinculosUsuario(userId);
  }

  @Delete(':vinculoId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Revogar vínculo' })
  revokeVinculo(@Param('vinculoId') vinculoId: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.vinculosService.revokeVinculo(vinculoId, user);
  }
}

@ApiTags('representacoes')
@Controller({ path: 'representacoes', version: '1' })
export class RepresentacoesController {
  constructor(private readonly vinculosService: VinculosService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar representação de fornecedor' })
  createRepresentacao(@Body() dto: CreateRepresentacaoDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.vinculosService.createRepresentacao(
      {
        ...dto,
        vigenciaInicio: new Date(dto.vigenciaInicio),
        vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined,
      },
      user,
    );
  }

  @Get('usuario/:userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar representações de um usuário' })
  getRepresentacoesUsuario(@Param('userId') userId: string) {
    return this.vinculosService.getRepresentacoesUsuario(userId);
  }

  @Put(':id/revogar')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Revogar representação' })
  revokeRepresentacao(
    @Param('id') id: string,
    @Body() dto: RevokeRepresentacaoDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.vinculosService.revokeRepresentacao(id, dto.motivo, user);
  }

  @Put(':id')
  @Roles('ADMIN')
  atualizarRepresentacao(@Param('id') id: string, @Body() dto: UpdateRepresentacaoDto, @Req() req: Request) {
    return this.vinculosService.updateRepresentacao(id, dto, req.user as AuthenticatedUser);
  }
}
