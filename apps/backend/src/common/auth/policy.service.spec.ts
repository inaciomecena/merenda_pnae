import { PolicyService } from './policy.service';
import { RolesGuard } from '../guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('SDD-002 autorização dinâmica', () => {
  const user = (role: 'DRE' | 'ESCOLA' | 'EXTENSIONISTA' | 'PRODUTOR') => ({ sub: 'u-a', role });

  it('DRE A não recebe escolas da DRE B e não aceita ID indireto', async () => {
    const prisma: any = {
      vinculoUsuario: { findMany: jest.fn().mockResolvedValue([{ dreId: 'dre-a' }]) },
      vinculoEscolaDRE: { findMany: jest.fn().mockResolvedValue([{ escolaId: 'escola-a' }]) },
    };
    const policy = new PolicyService(prisma);
    expect(await policy.getAuthorizedEscolaIds(user('DRE'))).toEqual(['escola-a']);
    await expect(policy.requireEscolaAccess(user('DRE'), 'escola-b')).rejects.toThrow();
    expect(prisma.vinculoEscolaDRE.findMany.mock.calls[0][0].where.dreId).toEqual({ in: ['dre-a'] });
  });

  it('escola sem vínculo não herda escolaId legado do token', async () => {
    const prisma: any = { vinculoUsuario: { findMany: jest.fn().mockResolvedValue([]) } };
    const policy = new PolicyService(prisma);
    expect(await policy.getAuthorizedEscolaIds({ ...user('ESCOLA'), escolaId: 'legado' })).toEqual([]);
  });

  it('extensionista não herda produtores do município e representação revogada não aparece', async () => {
    const prisma: any = { representacaoFornecedor: { findMany: jest.fn().mockResolvedValue([]) } };
    const policy = new PolicyService(prisma);
    expect(await policy.getAuthorizedProdutorIds({ ...user('EXTENSIONISTA'), municipioId: 'm-a' })).toEqual([]);
    expect(prisma.representacaoFornecedor.findMany.mock.calls[0][0].where.revogadoEm).toBeNull();
  });

  it('representação de consulta não permite editar proposta', async () => {
    const prisma: any = { representacaoFornecedor: { findMany: jest.fn().mockResolvedValue([{ permissoes: 'CONSULTAR' }]) } };
    const policy = new PolicyService(prisma);
    await expect(policy.requireProdutorAction(user('EXTENSIONISTA'), 'p-a', 'EDITAR_PROPOSTA')).rejects.toThrow();
  });

  it('produtor só recebe os cadastros do vínculo vigente, sem confiar no token', async () => {
    const prisma: any = { vinculoUsuario: { findMany: jest.fn().mockResolvedValue([{ produtorId: 'produtor-a' }]) } };
    const policy = new PolicyService(prisma);
    expect(await policy.getAuthorizedProdutorIds(user('PRODUTOR'))).toEqual(['produtor-a']);
    await expect(policy.requireProdutorAccess(user('PRODUTOR'), 'produtor-b')).rejects.toThrow();
    expect(prisma.vinculoUsuario.findMany.mock.calls[0][0].where).toMatchObject({
      userId: 'u-a', funcao: 'PRODUTOR', ativo: true,
    });
  });

  it('consulta apenas representações vigentes e não revogadas', async () => {
    const prisma: any = { representacaoFornecedor: { findMany: jest.fn().mockResolvedValue([]) } };
    await new PolicyService(prisma).getAuthorizedProdutorIds(user('EXTENSIONISTA'));
    const where = prisma.representacaoFornecedor.findMany.mock.calls[0][0].where;
    expect(where.revogadoEm).toBeNull();
    expect(where.ativo).toBe(true);
    expect(where.vigenciaInicio.lte).toBeInstanceOf(Date);
    expect(where.OR).toEqual([{ vigenciaFim: null }, { vigenciaFim: { gte: expect.any(Date) } }]);
  });

  it('revalida vínculo em toda requisição, inclusive com token antigo', async () => {
    const prisma: any = { vinculoUsuario: { findFirst: jest.fn().mockResolvedValueOnce({ id: 'v-a' }).mockResolvedValueOnce(null) } };
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['DRE']) } as unknown as Reflector;
    const guard = new RolesGuard(reflector, prisma);
    const context: any = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => ({ user: user('DRE') }) }) };
    expect(await guard.canActivate(context)).toBe(true);
    expect(await guard.canActivate(context)).toBe(false);
  });
});
