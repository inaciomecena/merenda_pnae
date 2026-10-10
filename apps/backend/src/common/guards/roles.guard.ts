import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) return false;
    const now = new Date();
    const binding = await this.prisma.vinculoUsuario.findFirst({
      where: {
        userId: user.sub, funcao: user.role, ativo: true,
        ...(user.vinculoId ? { id: user.vinculoId } : {}),
        vigenciaInicio: { lte: now },
        OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: now } }],
        ...(user.role === 'DRE' ? { dre: { ativo: true, deletedAt: null } } : {}),
        ...(user.role === 'ESCOLA' ? { escola: { active: true, deletedAt: null } } : {}),
        ...(user.role === 'PRODUTOR' ? { produtor: { active: true, deletedAt: null } } : {}),
        ...(user.role === 'EXTENSIONISTA' ? { municipioId: { not: null } } : {}),
      },
      select: { id: true },
    });
    return Boolean(binding);
  }
}
