import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto, RefreshDto } from '../dto/login.dto';
import { Request } from 'express';
import { PolicyService } from '../../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly policyService: PolicyService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Realiza login do usuário' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Renova o access token a partir do refresh token' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  getProfile(@Req() req: Request) {
    const user = req.user as any;
    return this.authService.getProfile(user.sub);
  }

  @Get('me/contexto')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna contexto completo do usuário (vínculos e representações)' })
  async getContexto(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.policyService.getUserContext(user);
  }
}
