import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { DashboardFinanceiroService } from '../../application/services/dashboard-financeiro.service';

const TODOS_OS_PERFIS = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'] as const;

@ApiTags('dashboard-financeiro')
@Controller({ path: 'dashboard-financeiro', version: '1' })
export class DashboardFinanceiroController {
  constructor(private readonly service: DashboardFinanceiroService) {}

  @Get('indicadores')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Indicadores financeiros do escopo do usuário' })
  async indicadores(@Req() req: Request) {
    return this.service.indicadores(req.user as AuthenticatedUser);
  }

  @Get('saldos')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Saldos a liquidar e a pagar' })
  async saldos(@Req() req: Request) {
    return this.service.saldos(req.user as AuthenticatedUser);
  }

  @Get('pendencias')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Pendências fiscais e financeiras do escopo' })
  async pendencias(@Req() req: Request) {
    return this.service.pendencias(req.user as AuthenticatedUser);
  }

  @Get('divergencias')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Divergências fiscais abertas em análise' })
  async divergencias(@Req() req: Request) {
    return this.service.divergencias(req.user as AuthenticatedUser);
  }

  @Get('grafico')
  @Roles(...TODOS_OS_PERFIS)
  @ApiOperation({ summary: 'Série percentual contratado → pago' })
  async grafico(@Req() req: Request) {
    return this.service.grafico(req.user as AuthenticatedUser);
  }
}
