import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from './user-scope';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna os IDs de DREs que o usuário pode acessar
   */
  async getAuthorizedDREIds(user: AuthenticatedUser): Promise<string[]> {
    if (user.role === 'ADMIN') {
      // Admin acessa todas as DREs
      const dres = await this.prisma.dRE.findMany({
        where: { deletedAt: null, ativo: true },
        select: { id: true },
      });
      return dres.map(d => d.id);
    }

    if (user.role === 'DRE') {
      // Usuário DRE acessa apenas suas DREs vinculadas
      const vinculos = await this.prisma.vinculoUsuario.findMany({
        where: {
          userId: user.sub,
          funcao: 'DRE',
          ...(user.vinculoId ? { id: user.vinculoId } : {}),
          ativo: true,
          dreId: { not: null },
          dre: { ativo: true, deletedAt: null },
          vigenciaInicio: { lte: new Date() },
          OR: [
            { vigenciaFim: null },
            { vigenciaFim: { gte: new Date() } },
          ],
        },
        select: { dreId: true },
      });
      return vinculos.map(v => v.dreId).filter((id): id is string => id !== null);
    }

    // ESCOLA e EXTENSIONISTA não têm acesso direto a DRE
    return [];
  }

  /**
   * Retorna os IDs de escolas que o usuário pode acessar
   */
  async getAuthorizedEscolaIds(user: AuthenticatedUser): Promise<string[]> {
    if (user.role === 'ADMIN') {
      // Admin acessa todas as escolas
      const escolas = await this.prisma.escola.findMany({
        where: { deletedAt: null, active: true },
        select: { id: true },
      });
      return escolas.map(e => e.id);
    }

    if (user.role === 'DRE') {
      // DRE acessa escolas vinculadas às suas regionais
      const dreIds = await this.getAuthorizedDREIds(user);
      if (dreIds.length === 0) return [];

      const vinculos = await this.prisma.vinculoEscolaDRE.findMany({
        where: {
          dreId: { in: dreIds },
          dre: { ativo: true, deletedAt: null },
          escola: { active: true, deletedAt: null },
          ativo: true,
          vigenciaInicio: { lte: new Date() },
          OR: [
            { vigenciaFim: null },
            { vigenciaFim: { gte: new Date() } },
          ],
        },
        select: { escolaId: true },
      });
      return [...new Set(vinculos.map(v => v.escolaId))];
    }

    if (user.role === 'ESCOLA') {
      // Escola acessa apenas ela mesma
      const vinculos = await this.prisma.vinculoUsuario.findMany({
        where: {
          userId: user.sub,
          funcao: 'ESCOLA',
          ...(user.vinculoId ? { id: user.vinculoId } : {}),
          ativo: true,
          escolaId: { not: null },
          escola: { active: true, deletedAt: null },
          vigenciaInicio: { lte: new Date() },
          OR: [
            { vigenciaFim: null },
            { vigenciaFim: { gte: new Date() } },
          ],
        },
        select: { escolaId: true },
      });
      const ids = vinculos.map(v => v.escolaId).filter((id): id is string => id !== null);

      return ids;
    }

    return [];
  }

  /**
   * Retorna os IDs de produtores que o usuário pode acessar
   */
  async getAuthorizedProdutorIds(user: AuthenticatedUser): Promise<string[]> {
    if (user.role === 'ADMIN') {
      // Admin acessa todos os produtores
      const produtores = await this.prisma.produtor.findMany({
        where: { deletedAt: null, active: true },
        select: { id: true },
      });
      return produtores.map(p => p.id);
    }

    if (user.role === 'PRODUTOR') {
      const vinculos = await this.prisma.vinculoUsuario.findMany({
        where: { userId: user.sub, funcao: 'PRODUTOR', ativo: true,
          ...(user.vinculoId ? { id: user.vinculoId } : {}),
          vigenciaInicio: { lte: new Date() },
          OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }],
          produtor: { active: true, deletedAt: null },
        },
        select: { produtorId: true },
      });
      return vinculos.map(v => v.produtorId).filter((id): id is string => Boolean(id));
    }

    if (user.role === 'EXTENSIONISTA' || user.role === 'REPRESENTANTE') {
      // Apenas representações expressas e vigentes dão acesso ao fornecedor.
      const representacoes = await this.prisma.representacaoFornecedor.findMany({
        where: {
          userId: user.sub,
          ativo: true,
          vigenciaInicio: { lte: new Date() },
          OR: [
            { vigenciaFim: null },
            { vigenciaFim: { gte: new Date() } },
          ],
          revogadoEm: null,
          produtor: { active: true, deletedAt: null },
        },
        select: { produtorId: true },
      });

      const representadoIds = representacoes.map(r => r.produtorId);

      return representadoIds;
    }

    // DRE e ESCOLA não têm acesso direto a produtores
    return [];
  }

  /**
   * Verifica se o usuário pode acessar uma DRE específica
   */
  async canAccessDRE(user: AuthenticatedUser, dreId: string): Promise<boolean> {
    const authorizedIds = await this.getAuthorizedDREIds(user);
    return authorizedIds.includes(dreId);
  }

  /**
   * Verifica se o usuário pode acessar uma escola específica
   */
  async canAccessEscola(user: AuthenticatedUser, escolaId: string): Promise<boolean> {
    const authorizedIds = await this.getAuthorizedEscolaIds(user);
    return authorizedIds.includes(escolaId);
  }

  /**
   * Verifica se o usuário pode acessar um produtor específico
   */
  async canAccessProdutor(user: AuthenticatedUser, produtorId: string): Promise<boolean> {
    const authorizedIds = await this.getAuthorizedProdutorIds(user);
    return authorizedIds.includes(produtorId);
  }

  /**
   * Lança exceção se o usuário não puder acessar a DRE
   */
  async requireDREAccess(user: AuthenticatedUser, dreId: string): Promise<void> {
    const canAccess = await this.canAccessDRE(user, dreId);
    if (!canAccess) {
      throw new ForbiddenException('Você não tem permissão para acessar esta DRE');
    }
  }

  /**
   * Lança exceção se o usuário não puder acessar a escola
   */
  async requireEscolaAccess(user: AuthenticatedUser, escolaId: string): Promise<void> {
    const canAccess = await this.canAccessEscola(user, escolaId);
    if (!canAccess) {
      throw new ForbiddenException('Você não tem permissão para acessar esta escola');
    }
  }

  /**
   * Lança exceção se o usuário não puder acessar o produtor
   */
  async requireProdutorAccess(user: AuthenticatedUser, produtorId: string): Promise<void> {
    const canAccess = await this.canAccessProdutor(user, produtorId);
    if (!canAccess) {
      throw new ForbiddenException('Você não tem permissão para acessar este produtor');
    }
  }

  async requireProdutorAction(user: AuthenticatedUser, produtorId: string, action: 'CONSULTAR' | 'EDITAR_PRODUTOR' | 'EDITAR_PROPOSTA') {
    if (user.role === 'ADMIN' || user.role === 'PRODUTOR') {
      await this.requireProdutorAccess(user, produtorId);
      return;
    }
    if (user.role !== 'EXTENSIONISTA' && user.role !== 'REPRESENTANTE') throw new ForbiddenException('Ação não autorizada');
    const now = new Date();
    const rows = await this.prisma.representacaoFornecedor.findMany({ where: {
      userId: user.sub, produtorId, ativo: true, revogadoEm: null,
      vigenciaInicio: { lte: now }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: now } }],
      produtor: { active: true, deletedAt: null },
    }, select: { permissoes: true } });
    if (!rows.some(r => r.permissoes.split(',').map(p => p.trim()).includes(action))) {
      throw new ForbiddenException('Representação sem permissão para esta ação');
    }
  }

  async getAuthorizedProdutorIdsForAction(user: AuthenticatedUser, action: 'EDITAR_PRODUTOR' | 'EDITAR_PROPOSTA') {
    const ids = await this.getAuthorizedProdutorIds(user);
    if (user.role !== 'EXTENSIONISTA' && user.role !== 'REPRESENTANTE') return ids;
    const allowed: string[] = [];
    for (const id of ids) {
      try { await this.requireProdutorAction(user, id, action); allowed.push(id); } catch { /* Representação apenas de consulta. */ }
    }
    return allowed;
  }

  /**
   * Retorna o contexto completo do usuário (vínculos ativos e representações)
   */
  async getUserContext(user: AuthenticatedUser) {
    const [vinculos, representacoes] = await Promise.all([
      this.prisma.vinculoUsuario.findMany({
        where: {
          userId: user.sub,
          ativo: true,
          vigenciaInicio: { lte: new Date() },
          OR: [
            { vigenciaFim: null },
            { vigenciaFim: { gte: new Date() } },
          ],
        },
        include: {
          dre: { select: { id: true, nome: true, codigo: true } },
          escola: { select: { id: true, nome: true, codigo: true } },
          municipio: { select: { id: true, nome: true } },
          produtor: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.representacaoFornecedor.findMany({
        where: {
          userId: user.sub,
          ativo: true,
          vigenciaInicio: { lte: new Date() },
          OR: [
            { vigenciaFim: null },
            { vigenciaFim: { gte: new Date() } },
          ],
          revogadoEm: null,
        },
        include: {
          produtor: { select: { id: true, nome: true } },
        },
      }),
    ]);

    return {
      user: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
      pendencias: vinculos.some(v => v.funcao === user.role) ? [] : ['Vínculo de função e escopo pendente de autorização'],
      vinculos: vinculos.map(v => ({
        id: v.id,
        funcao: v.funcao,
        dre: v.dre,
        escola: v.escola,
        municipio: v.municipio,
        produtor: v.produtor,
        vigenciaInicio: v.vigenciaInicio,
        vigenciaFim: v.vigenciaFim,
      })),
      representacoes: representacoes.map(r => ({
        id: r.id,
        produtor: r.produtor,
        tipoRepresentacao: r.tipoRepresentacao,
        permissoes: r.permissoes,
        vigenciaInicio: r.vigenciaInicio,
        vigenciaFim: r.vigenciaFim,
      })),
    };
  }
}
