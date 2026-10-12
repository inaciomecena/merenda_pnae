import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Roles } from '../decorators/roles.decorator';

/**
 * SDD-005 — Regras do RolesGuard (segregação de funções).
 *
 * Cenários exigidos no diagnóstico institucional:
 *  1. ADMIN global sem vínculo institucional;
 *  2. usuário de escopo com vínculo ativo;
 *  3. usuário de escopo com vínculo inativo/expirado;
 *  4. usuário sem permissão (papel divergente ou ausente).
 */
class TestController {
  @Roles('ADMIN') somenteAdmin() {}
  @Roles('ADMIN', 'DRE') adminOuDre() {}
  semPapeis() {}
}

const prismaMock = () => ({ vinculoUsuario: { findFirst: jest.fn() } });

function contexto(handler: () => void, user?: { sub: string; role: string; vinculoId?: string }) {
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('SDD-005: segregação de funções no RolesGuard', () => {
  const alvo = new TestController();
  const prisma = prismaMock();
  const guard = new RolesGuard(new Reflector(), prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('lê os papéis exigidos pelo decorador @Roles', () => {
    const reflector = new Reflector();
    expect(reflector.getAllAndOverride('roles', [alvo.somenteAdmin, TestController])).toEqual(['ADMIN']);
    expect(reflector.getAllAndOverride('roles', [alvo.semPapeis, TestController])).toBeUndefined();
  });

  it('1) ADMIN global é autorizado sem consultar vínculo institucional', async () => {
    const permitido = await guard.canActivate(contexto(alvo.somenteAdmin, { sub: 'u-admin', role: 'ADMIN' }));

    expect(permitido).toBe(true);
    expect(prisma.vinculoUsuario.findFirst).not.toHaveBeenCalled();
  });

  it('2) DRE com vínculo ativo é autorizado', async () => {
    prisma.vinculoUsuario.findFirst.mockResolvedValue({ id: 'vinc-1' });

    const permitido = await guard.canActivate(contexto(alvo.adminOuDre, { sub: 'u-dre', role: 'DRE' }));

    expect(permitido).toBe(true);
    const consulta = prisma.vinculoUsuario.findFirst.mock.calls[0][0].where;
    expect(consulta).toMatchObject({ userId: 'u-dre', funcao: 'DRE', ativo: true });
    expect(consulta.vigenciaInicio).toHaveProperty('lte');
    expect(consulta.OR).toEqual([{ vigenciaFim: null }, { vigenciaFim: { gte: expect.any(Date) } }]);
  });

  it('3) vínculo DRE inativo ou fora da vigência não autoriza', async () => {
    // O filtro `ativo` e a vigência são aplicados na consulta; banco devolve
    // nenhum registro para vínculo revogado/expirado.
    prisma.vinculoUsuario.findFirst.mockResolvedValue(null);

    const revogado = await guard.canActivate(
      contexto(alvo.adminOuDre, { sub: 'u-dre', role: 'DRE', vinculoId: 'vinc-revogado' }),
    );

    expect(revogado).toBe(false);
    expect(prisma.vinculoUsuario.findFirst.mock.calls[0][0].where).toMatchObject({
      id: 'vinc-revogado',
      ativo: true,
    });
  });

  it('4) usuário com papel divergente é bloqueado sem consultar o banco', async () => {
    const permitido = await guard.canActivate(contexto(alvo.somenteAdmin, { sub: 'u-escola', role: 'ESCOLA' }));

    expect(permitido).toBe(false);
    expect(prisma.vinculoUsuario.findFirst).not.toHaveBeenCalled();
  });

  it('4b) requisição sem usuário autenticado é bloqueada', async () => {
    const permitido = await guard.canActivate(contexto(alvo.somenteAdmin, undefined));

    expect(permitido).toBe(false);
    expect(prisma.vinculoUsuario.findFirst).not.toHaveBeenCalled();
  });

  it('aceita qualquer papel listado no decorador', async () => {
    prisma.vinculoUsuario.findFirst.mockResolvedValue({ id: 'vinc-2' });

    const dre = await guard.canActivate(contexto(alvo.adminOuDre, { sub: 'u-dre', role: 'DRE' }));
    const admin = await guard.canActivate(contexto(alvo.adminOuDre, { sub: 'u-admin', role: 'ADMIN' }));
    const escola = await guard.canActivate(contexto(alvo.adminOuDre, { sub: 'u-escola', role: 'ESCOLA' }));

    expect(dre).toBe(true);
    expect(admin).toBe(true);
    expect(escola).toBe(false);
    expect(prisma.vinculoUsuario.findFirst).toHaveBeenCalledTimes(1);
  });

  it('libera rotas sem papéis exigidos', async () => {
    const permitido = await guard.canActivate(contexto(alvo.semPapeis, { sub: 'u1', role: 'PRODUTOR' }));

    expect(permitido).toBe(true);
    expect(prisma.vinculoUsuario.findFirst).not.toHaveBeenCalled();
  });
});
