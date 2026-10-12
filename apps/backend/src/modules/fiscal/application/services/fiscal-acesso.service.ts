import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';

export type OperacaoFiscal = 'CONSULTAR' | 'PROCESSAR' | 'CONFERIR' | 'ATESTAR' | 'CANCELAR';

@Injectable()
export class FiscalAcessoService {
  constructor(private readonly policy: PolicyService) {}

  /**
   * Retorna filtro Prisma para notas fiscais conforme escopo do usuário.
   */
  async filtroNotaFiscal(user: AuthenticatedUser): Promise<Prisma.NotaFiscalWhereInput> {
    if (user.role === 'ADMIN') return {};
    if (user.role === 'DRE') {
      return { contrato: { dreId: { in: await this.policy.getAuthorizedDREIds(user) } } };
    }
    if (user.role === 'ESCOLA') {
      return { contrato: { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } } };
    }
    if (['PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'].includes(user.role)) {
      return { fornecedorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
    }
    return { id: { in: [] } };
  }

  /**
   * Retorna filtro Prisma para contratos conforme escopo do usuário.
   */
  async filtroContrato(user: AuthenticatedUser): Promise<Prisma.ContratoWhereInput> {
    if (user.role === 'ADMIN') return {};
    if (user.role === 'DRE') return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
    if (user.role === 'ESCOLA') return { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
    return { produtorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
  }

  /**
   * Verifica se o usuário tem permissão para a operação em uma nota fiscal.
   */
  async exigir(
    user: AuthenticatedUser,
    recurso: { contratoId: string; fornecedorId: string },
    operacao: OperacaoFiscal,
  ): Promise<void> {
    const allowed: Record<OperacaoFiscal, string[]> = {
      CONSULTAR: ['ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'],
      PROCESSAR: ['ADMIN', 'DRE', 'ESCOLA'],
      CONFERIR: ['ADMIN', 'DRE', 'ESCOLA'],
      ATESTAR: ['ADMIN', 'DRE', 'ESCOLA'],
      CANCELAR: ['ADMIN', 'DRE'],
    };

    if (!allowed[operacao].includes(user.role)) {
      throw new ForbiddenException('Operação não autorizada para este perfil.');
    }

    if (user.role === 'ADMIN') return;

    // Verificar isolamento institucional via contrato
    const contrato = await this.policy['prisma'].contrato.findUnique({
      where: { id: recurso.contratoId },
      select: { dreId: true, escolaId: true, produtorId: true },
    });

    if (!contrato) {
      throw new ForbiddenException('Contrato não encontrado ou fora do escopo.');
    }

    if (user.role === 'DRE') {
      const dreIds = await this.policy.getAuthorizedDREIds(user);
      if (!contrato.dreId || !dreIds.includes(contrato.dreId)) {
        throw new ForbiddenException('Recurso fora do escopo institucional.');
      }
      return;
    }

    if (user.role === 'ESCOLA') {
      const escolaIds = await this.policy.getAuthorizedEscolaIds(user);
      if (!contrato.escolaId || !escolaIds.includes(contrato.escolaId)) {
        throw new ForbiddenException('Recurso fora do escopo institucional.');
      }
      return;
    }

    // PRODUTOR, REPRESENTANTE, EXTENSIONISTA
    const produtorIds = await this.policy.getAuthorizedProdutorIds(user);
    if (!produtorIds.includes(recurso.fornecedorId)) {
      throw new ForbiddenException('Recurso fora do escopo institucional.');
    }
  }
}
