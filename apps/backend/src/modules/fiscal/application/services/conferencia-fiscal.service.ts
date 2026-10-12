import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ResultadoConciliacaoFiscal, StatusConferenciaFiscal } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { StatusNotaFiscal } from '../domain/fiscal-estado';
import { FiscalAcessoService } from './fiscal-acesso.service';

export interface ItemChecklist {
  item: string;
  conforme: boolean;
  observacao?: string | null;
}

export interface RegistrarConferenciaDto {
  acao: 'APROVAR' | 'REJEITAR';
  checklist?: ItemChecklist[];
  justificativa?: string;
  ressalvas?: string;
}

export interface ConferenciaResponse {
  id: string;
  notaFiscalId: string;
  status: string;
  dataConferencia: string;
  conferente: string | null;
  justificativa: string | null;
  ressalvas: string | null;
  checklist: ItemChecklist[];
}

interface ConteudoConferencia {
  checklist: ItemChecklist[];
  justificativa: string | null;
  ressalvas: string | null;
}

@Injectable()
export class ConferenciaFiscalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: FiscalAcessoService,
  ) {}

  /**
   * Carrega a nota fiscal ativa (soft delete) para autorização e validações.
   */
  private async carregarNota(notaFiscalId: string) {
    const nota = await this.prisma.notaFiscal.findFirst({
      where: { id: notaFiscalId, deletedAt: null },
      select: {
        id: true,
        numero: true,
        contratoId: true,
        fornecedorId: true,
        status: true,
        resultadoConciliacao: true,
      },
    });
    if (!nota) throw new NotFoundException('Nota fiscal não encontrada.');
    return nota;
  }

  /**
   * Normaliza o payload gravado em `divergenciasJson`.
   * Registros antigos da conciliação guardam um array de divergências: nesse caso
   * o checklist é vazio e justificativa/ressalvas são nulos.
   */
  private lerConteudo(json: string | null): ConteudoConferencia {
    if (!json) return { checklist: [], justificativa: null, ressalvas: null };
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return { checklist: [], justificativa: null, ressalvas: null };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { checklist: [], justificativa: null, ressalvas: null };
    }
    const objeto = parsed as { checklist?: unknown; justificativa?: unknown; ressalvas?: unknown };
    return {
      checklist: this.lerChecklist(objeto.checklist),
      justificativa: typeof objeto.justificativa === 'string' ? objeto.justificativa : null,
      ressalvas: typeof objeto.ressalvas === 'string' ? objeto.ressalvas : null,
    };
  }

  private lerChecklist(valor: unknown): ItemChecklist[] {
    if (!Array.isArray(valor)) return [];
    const itens: ItemChecklist[] = [];
    for (const bruto of valor) {
      if (!bruto || typeof bruto !== 'object') continue;
      const item = bruto as { item?: unknown; conforme?: unknown; observacao?: unknown };
      if (typeof item.item !== 'string' || typeof item.conforme !== 'boolean') continue;
      itens.push({
        item: item.item,
        conforme: item.conforme,
        observacao: typeof item.observacao === 'string' ? item.observacao : null,
      });
    }
    return itens;
  }

  private responder(conferencia: {
    id: string;
    notaFiscalId: string;
    status: string;
    dataConferencia: Date;
    responsavelNome: string | null;
    divergenciasJson: string | null;
  }): ConferenciaResponse {
    const conteudo = this.lerConteudo(conferencia.divergenciasJson);
    return {
      id: conferencia.id,
      notaFiscalId: conferencia.notaFiscalId,
      status: conferencia.status,
      dataConferencia: conferencia.dataConferencia.toISOString(),
      conferente: conferencia.responsavelNome,
      justificativa: conteudo.justificativa,
      ressalvas: conteudo.ressalvas,
      checklist: conteudo.checklist,
    };
  }

  /**
   * Retorna a última conferência fiscal da nota (ou null se não houver).
   */
  async obter(notaFiscalId: string, user: AuthenticatedUser): Promise<ConferenciaResponse | null> {
    const nota = await this.carregarNota(notaFiscalId);
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONSULTAR');

    const conferencia = await this.prisma.conferenciaFiscal.findFirst({
      where: { notaFiscalId },
      orderBy: { dataConferencia: 'desc' },
    });
    if (!conferencia) return null;

    return this.responder(conferencia);
  }

  /**
   * Registra a conferência fiscal (aprovação ou rejeição) e transiciona a nota.
   */
  async registrar(
    notaFiscalId: string,
    dto: RegistrarConferenciaDto,
    user: AuthenticatedUser,
  ): Promise<ConferenciaResponse> {
    if (dto.acao !== 'APROVAR' && dto.acao !== 'REJEITAR') {
      throw new BadRequestException('Ação de conferência inválida (APROVAR ou REJEITAR).');
    }
    const acao = dto.acao;

    const nota = await this.carregarNota(notaFiscalId);
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONFERIR');

    if (nota.status !== StatusNotaFiscal.PENDENTE_CONFERENCIA && nota.status !== StatusNotaFiscal.EM_CONFERENCIA) {
      throw new BadRequestException(`Nota fiscal não está em conferência (status atual: ${nota.status}).`);
    }

    const checklist = dto.checklist ?? [];
    const justificativa = dto.justificativa?.trim() ?? '';
    const ressalvas = dto.ressalvas?.trim() ?? '';

    if (acao === 'APROVAR') {
      const resultado = nota.resultadoConciliacao;
      if (
        resultado !== ResultadoConciliacaoFiscal.CONCILIADA &&
        resultado !== ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS
      ) {
        throw new BadRequestException('Resolva as divergências da conciliação antes de aprovar.');
      }
      const impeditivas = await this.prisma.divergenciaFiscal.count({
        where: { notaFiscalId, severidade: 'IMPEDITIVA', status: 'ABERTA' },
      });
      if (impeditivas > 0) {
        throw new BadRequestException('Resolva as divergências impeditivas antes de aprovar a conferência.');
      }
    } else if (!justificativa) {
      throw new BadRequestException('Informe a justificativa para rejeitar a conferência.');
    }

    const divergenciasJson = JSON.stringify({
      checklist,
      justificativa: dto.justificativa ?? null,
      ressalvas: dto.ressalvas ?? null,
    });
    const observacoes =
      acao === 'APROVAR'
        ? `Conferência aprovada${ressalvas ? ` com ressalvas: ${ressalvas}` : ''} (${checklist.length} item(ns) no checklist).`
        : `Conferência rejeitada: ${justificativa}`;

    const statusConferencia =
      acao === 'APROVAR' ? StatusConferenciaFiscal.APROVADA : StatusConferenciaFiscal.REJEITADA;
    const statusNota = acao === 'APROVAR' ? StatusNotaFiscal.AGUARDANDO_ATESTO : StatusNotaFiscal.REJEITADA;

    const criada = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pnae_notas_fiscais WHERE id = ${notaFiscalId} FOR UPDATE`;

      const conferencia = await tx.conferenciaFiscal.create({
        data: {
          notaFiscalId,
          responsavelId: user.sub,
          responsavelNome: user.email ?? user.sub,
          status: statusConferencia,
          observacoes,
          divergenciasJson,
          createdBy: user.sub,
        },
      });

      const atualizada = await tx.notaFiscal.updateMany({
        where: {
          id: notaFiscalId,
          status: { in: [StatusNotaFiscal.PENDENTE_CONFERENCIA, StatusNotaFiscal.EM_CONFERENCIA] },
        },
        data: { status: statusNota, updatedBy: user.sub },
      });
      if (atualizada.count !== 1) {
        throw new ConflictException('Nota fiscal alterada por outra operação.');
      }

      return conferencia;
    });

    await this.audit.log({
      userId: user.sub,
      action: 'CONFERENCIA_FISCAL_REGISTRADA',
      entity: 'ConferenciaFiscal',
      entityId: criada.id,
      entityLabel: nota.numero,
      newValues: {
        notaFiscalId,
        acao,
        status: criada.status,
        statusNota: statusNota,
        checklist: checklist.length,
        justificativa: dto.justificativa ?? null,
        ressalvas: dto.ressalvas ?? null,
      },
    });

    return this.responder(criada);
  }
}
