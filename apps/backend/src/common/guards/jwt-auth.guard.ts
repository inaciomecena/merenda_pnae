import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Sessão ausente. Entre no sistema para continuar.');

    const token = authHeader.split(' ')[1];
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'dev-secret' });
      if (typeof payload.sub !== 'string') throw new Error('Sessão sem usuário');
    } catch {
      throw new UnauthorizedException('Sua sessão expirou ou é inválida. Entre novamente no sistema.');
    }
    const user = await this.prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null, active: true } });
    if (!user) throw new UnauthorizedException('Sessão inválida. Entre novamente no sistema.');
    req.user = { sub: user.id, email: user.email, role: user.role, escolaId: user.escolaId, municipioId: user.municipioId,
      vinculoId: typeof req.headers['x-contexto-vinculo'] === 'string' ? req.headers['x-contexto-vinculo'] : undefined };
    return true;
  }
}
