import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';

@Injectable()
export class EntregaAcessoService {
  constructor(private readonly policy: PolicyService) {}

  async filtro(user: AuthenticatedUser): Promise<Prisma.ProgramacaoEntregaWhereInput> {
    if (user.role === 'ADMIN') return {};
    if (user.role === 'DRE') return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
    if (user.role === 'ESCOLA') return { unidadeEscolarId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
    if (['PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'].includes(user.role)) {
      return { fornecedorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
    }
    return { id: { in: [] } };
  }

  async filtroEntrega(user: AuthenticatedUser): Promise<Prisma.EntregaWhereInput> {
    if (user.role === 'ADMIN') return {};
    if (user.role === 'DRE') return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
    if (user.role === 'ESCOLA') return { unidadeEscolarId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
    return { fornecedorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
  }

  async filtroContrato(user: AuthenticatedUser): Promise<Prisma.ContratoWhereInput> {
    if (user.role === 'ADMIN') return {};
    if (user.role === 'DRE') return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
    if (user.role === 'ESCOLA') return { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
    return { produtorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
  }

  async exigir(user: AuthenticatedUser, recurso: { dreId: string; unidadeEscolarId: string; fornecedorId: string }, operacao: 'CONSULTAR' | 'PROGRAMAR' | 'RECEBER' | 'TRATAR') {
    const allowed = operacao === 'PROGRAMAR' ? ['ADMIN', 'DRE']
      : operacao === 'RECEBER' ? ['ADMIN', 'DRE', 'ESCOLA']
      : operacao === 'TRATAR' ? ['ADMIN', 'DRE', 'ESCOLA']
      : ['ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'];
    if (!allowed.includes(user.role)) throw new ForbiddenException('Operação não autorizada para este perfil.');
    if (user.role === 'ADMIN') return;
    const filtro = await this.filtro(user);
    const ids = user.role === 'DRE' ? filtro.dreId : user.role === 'ESCOLA' ? filtro.unidadeEscolarId : filtro.fornecedorId;
    const id = user.role === 'DRE' ? recurso.dreId : user.role === 'ESCOLA' ? recurso.unidadeEscolarId : recurso.fornecedorId;
    if (!ids || typeof ids !== 'object' || !('in' in ids) || !(ids.in as string[]).includes(id)) {
      throw new ForbiddenException('Recurso fora do escopo institucional.');
    }
  }
}
