import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { OportunidadesPnaeService } from '../application/oportunidades-pnae.service';
import { InteresseOportunidadeDto, OportunidadesQueryDto } from './oportunidades-pnae.dto';

@Controller({ path: 'produtor', version: '1' })
export class OportunidadesPnaeController {
  constructor(private readonly service: OportunidadesPnaeService) {}
  private u(req: Request) { return req.user as AuthenticatedUser; }
  @Get('minhas-oportunidades') @Roles('ADMIN','EXTENSIONISTA','REPRESENTANTE','PRODUTOR') listar(@Query() q: OportunidadesQueryDto, @Query('produtorId') id: string, @Req() req: Request) { return this.service.listar(q, this.u(req), id); }
  @Get('minhas-oportunidades/resumo') @Roles('ADMIN','EXTENSIONISTA','REPRESENTANTE','PRODUTOR') resumo(@Query('produtorId') id: string, @Req() req: Request) { return this.service.resumo(this.u(req), id); }
  @Get('minhas-oportunidades/:id') @Roles('ADMIN','EXTENSIONISTA','REPRESENTANTE','PRODUTOR') obter(@Param('id') id: string, @Req() req: Request) { return this.service.obter(id, this.u(req)); }
  @Post('minhas-oportunidades/:id/interesse') @Roles('ADMIN','EXTENSIONISTA','REPRESENTANTE','PRODUTOR') interesse(@Param('id') id: string, @Body() dto: InteresseOportunidadeDto, @Req() req: Request) { return this.service.criarInteresse(id, dto, this.u(req), (req.query.produtorId as string) || undefined); }
  @Patch('minhas-oportunidades/interesse/:id') @Roles('ADMIN','EXTENSIONISTA','REPRESENTANTE','PRODUTOR') atualizar(@Param('id') id: string, @Body() dto: InteresseOportunidadeDto & { status?: string }, @Req() req: Request) { return this.service.atualizarInteresse(id, dto, this.u(req)); }
  @Get('meus-interesses') @Roles('ADMIN','EXTENSIONISTA','REPRESENTANTE','PRODUTOR') interesses(@Query('produtorId') id: string, @Req() req: Request) { return this.service.interesses(this.u(req), id); }
}
