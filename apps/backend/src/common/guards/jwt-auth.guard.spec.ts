import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

describe('autenticação e permissões', () => {
  const jwt = new JwtService({ secret: process.env.JWT_SECRET || 'dev-secret' });
  const usuario = { id: 'usuario', email: 'usuario@example.test', role: 'ADMIN' };
  let findFirst: jest.Mock;
  let guard: JwtAuthGuard;
  const contexto = (token?: string) => {
    const request: any = { headers: token ? { authorization: `Bearer ${token}` } : {} };
    return { request, context: { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext };
  };
  beforeEach(() => {
    findFirst = jest.fn().mockResolvedValue(usuario);
    guard = new JwtAuthGuard(jwt, { getAllAndOverride: () => false } as unknown as Reflector, { user: { findFirst } } as unknown as PrismaService);
  });
  it('retorna 401 para sessão expirada, permitindo a renovação no navegador', async () => {
    const { context } = contexto(jwt.sign({ sub: usuario.id }, { expiresIn: -1 }));
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findFirst).not.toHaveBeenCalled();
  });
  it('retorna 401 quando não há sessão ou o usuário foi desativado', async () => {
    await expect(guard.canActivate(contexto().context)).rejects.toBeInstanceOf(UnauthorizedException);
    findFirst.mockResolvedValue(null);
    await expect(guard.canActivate(contexto(jwt.sign({ sub: usuario.id })).context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('mantém as permissões do perfil consultado no banco', async () => {
    findFirst.mockResolvedValue({ ...usuario, role: 'ESCOLA' });
    const { context, request } = contexto(jwt.sign({ sub: usuario.id, role: 'ADMIN' }));
    await guard.canActivate(context);
    expect(request.user.role).toBe('ESCOLA');
    const roles = new RolesGuard({ getAllAndOverride: () => ['ADMIN', 'DRE'] } as unknown as Reflector);
    expect(roles.canActivate(context)).toBe(false);
  });
  it('autoriza ADMIN autenticado a acessar as rotas de composição', async () => {
    const { context } = contexto(jwt.sign({ sub: usuario.id }));
    await expect(guard.canActivate(context)).resolves.toBe(true);
    const roles = new RolesGuard({ getAllAndOverride: () => ['ADMIN', 'DRE'] } as unknown as Reflector);
    expect(roles.canActivate(context)).toBe(true);
  });
  it('não confunde falha do banco com sessão expirada', async () => {
    const falha = new Error('Banco indisponível');
    findFirst.mockRejectedValue(falha);
    await expect(guard.canActivate(contexto(jwt.sign({ sub: usuario.id })).context)).rejects.toBe(falha);
  });
});
