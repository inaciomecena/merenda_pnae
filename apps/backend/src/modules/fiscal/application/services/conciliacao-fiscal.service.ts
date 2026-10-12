import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma, ResultadoConciliacaoFiscal, SeveridadeDivergencia, TipoDivergenciaFiscal } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalAcessoService } from './fiscal-acesso.service';
import { dentroTolerancia, quantidadeFiscal } from './fiscal-validacao';

interface DivergenciaDetectada {
  tipo: TipoDivergenciaFiscal;
  severidade: SeveridadeDivergencia;
  descricao: string;
  valorEsperado?: string;
  valorEncontrado?: string;
  notaFiscalItemId?: string;
}

@Injectable()
export class ConciliacaoFiscalService {
  private readonly TOLERANCIA_VALOR_PERCENTUAL = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: FiscalAcessoService,
  ) {}

  /**
   * Executa a conciliação fiscal completa de uma nota fiscal.
   * Compara contrato × recebimento × nota fiscal.
   */
  async conciliar(notaFiscalId: string, user: AuthenticatedUser) {
    const notaFiscal = await this.prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      include: {
        fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
        contrato: { select: { id: true, numero: true, exercicio: true, dreId: true, escolaId: true, produtorId: true, status: true } },
        itens: { include: { contratoItem: true, vinculosRecebimento: true } },
        vinculosRecebimento: { include: { entrega: true, entregaItem: true } },
      },
    });

    if (!notaFiscal) {
      throw new BadRequestException('Nota fiscal não encontrada.');
    }

    await this.acesso.exigir(user, { contratoId: notaFiscal.contratoId, fornecedorId: notaFiscal.fornecedorId }, 'CONFERIR');

    // Impedir faturamento duplicado
    await this.verificarFaturamentoDuplicado(notaFiscal);

    // Coletar divergências
    const divergencias: DivergenciaDetectada[] = [];

    // 1. Verificar fornecedor
    this.verificarFornecedor(notaFiscal, divergencias);

    // 2. Verificar contrato
    this.verificarContrato(notaFiscal, divergencias);

    // 3. Verificar itens
    for (const item of notaFiscal.itens) {
      this.verificarItem(item, divergencias);
    }

    // 4. Verificar recebimento
    this.verificarRecebimento(notaFiscal, divergencias);

    // Classificar resultado
    const resultado = this.classificarResultado(divergencias, notaFiscal);

    // Persistir em transação
    const atualizado = await this.prisma.$transaction(async (tx) => {
      // Reexecução da conciliação: encerra divergências abertas anteriores (evita duplicidade)
      await tx.divergenciaFiscal.updateMany({
        where: { notaFiscalId, status: { in: ['ABERTA', 'EM_ANALISE'] } },
        data: { status: 'ENCERRADA', updatedBy: user.sub, dataResolucao: new Date() },
      });

      // Registrar divergências
      for (const div of divergencias) {
        await tx.divergenciaFiscal.create({
          data: {
            notaFiscalId,
            notaFiscalItemId: div.notaFiscalItemId,
            tipo: div.tipo,
            severidade: div.severidade,
            descricao: div.descricao,
            valorEsperado: div.valorEsperado,
            valorEncontrado: div.valorEncontrado,
          },
        });
      }

      // Atualizar status e resultado (conferência humana é etapa seguinte)
      const statusAtualizado = await tx.notaFiscal.updateMany({
        where: {
          id: notaFiscalId,
          status: { in: ['PROCESSADA', 'PENDENTE_CONFERENCIA', 'EM_CONFERENCIA'] },
        },
        data: {
          resultadoConciliacao: resultado,
          status: 'PENDENTE_CONFERENCIA',
          updatedBy: user.sub,
        },
      });
      if (statusAtualizado.count !== 1) {
        throw new ConflictException('Nota fiscal alterada por outra operação.');
      }

      return await tx.notaFiscal.findUniqueOrThrow({ where: { id: notaFiscalId } });
    });

    await this.audit.log({
      userId: user.sub,
      action: 'CONCILIACAO_FISCAL_EXECUTADA',
      entity: 'NotaFiscal',
      entityId: notaFiscalId,
      entityLabel: notaFiscal.numero,
      newValues: JSON.stringify({ resultado, divergencias: divergencias.length }),
    });

    return atualizado;
  }

  /**
   * Verifica se já existe faturamento para a mesma nota fiscal (chave de acesso).
   */
  private async verificarFaturamentoDuplicado(notaFiscal: { chaveAcesso: string | null; numero: string; serie: string | null; id: string }): Promise<void> {
    if (notaFiscal.chaveAcesso) {
      const existente = await this.prisma.notaFiscal.findFirst({
        where: {
          chaveAcesso: notaFiscal.chaveAcesso,
          id: { not: notaFiscal.id },
          status: { not: 'CANCELADA' },
          deletedAt: null,
        },
      });
      if (existente) {
        throw new ConflictException(`Nota fiscal já faturada: ${existente.numero} (${existente.id}).`);
      }
    }
  }

  /**
   * Verifica compatibilidade do fornecedor.
   */
  private verificarFornecedor(
    notaFiscal: { fornecedor: { cpfCnpj: string | null }; cnpjEmitente: string | null; cpfEmitente: string | null },
    divergencias: DivergenciaDetectada[],
  ): void {
    const docFornecedor = notaFiscal.fornecedor.cpfCnpj?.replace(/\D/g, '');
    const docEmitente = (notaFiscal.cnpjEmitente || notaFiscal.cpfEmitente)?.replace(/\D/g, '');

    if (docFornecedor && docEmitente && docFornecedor !== docEmitente) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.CPF_CNPJ_INCOMPATIVEL,
        severidade: SeveridadeDivergencia.ALTA,
        descricao: `Documento do emitente (${docEmitente}) diverge do fornecedor (${docFornecedor}).`,
        valorEsperado: docFornecedor,
        valorEncontrado: docEmitente,
      });
    }
  }

  /**
   * Verifica compatibilidade do contrato.
   */
  private verificarContrato(
    notaFiscal: { contrato: { id: string; produtorId: string; status: string }; fornecedorId: string },
    divergencias: DivergenciaDetectada[],
  ): void {
    if (notaFiscal.contrato.status !== 'VIGENTE') {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.CONTRATO_INCOMPATIVEL,
        severidade: SeveridadeDivergencia.IMPEDITIVA,
        descricao: `Contrato não está vigente (status: ${notaFiscal.contrato.status}).`,
      });
    }
    if (notaFiscal.contrato.produtorId !== notaFiscal.fornecedorId) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.CONTRATO_INCOMPATIVEL,
        severidade: SeveridadeDivergencia.IMPEDITIVA,
        descricao: 'Fornecedor da nota fiscal diverge do contrato.',
      });
    }
  }

  /**
   * Verifica cada item da nota fiscal contra o contrato.
   */
  private verificarItem(
    item: {
      id: string;
      descricao: string;
      unidadeComercial: string | null;
      quantidade: Prisma.Decimal;
      valorUnitario: Prisma.Decimal;
      contratoItem: { id: string; produto: string; unidade: string | null; valorUnitario: Prisma.Decimal; quantidadeDisponivel: Prisma.Decimal } | null;
    },
    divergencias: DivergenciaDetectada[],
  ): void {
    if (!item.contratoItem) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.PRODUTO_DIVERGENTE,
        severidade: SeveridadeDivergencia.MEDIA,
        descricao: `Item "${item.descricao}" não vinculado a item de contrato.`,
        notaFiscalItemId: item.id,
      });
      return;
    }

    // Verificar produto
    if (item.contratoItem.produto !== item.descricao) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.PRODUTO_DIVERGENTE,
        severidade: SeveridadeDivergencia.MEDIA,
        descricao: `Produto divergente: contrato="${item.contratoItem.produto}", NF="${item.descricao}".`,
        valorEsperado: item.contratoItem.produto,
        valorEncontrado: item.descricao,
        notaFiscalItemId: item.id,
      });
    }

    // Verificar unidade
    if (item.contratoItem.unidade && item.unidadeComercial && item.contratoItem.unidade !== item.unidadeComercial) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.UNIDADE_MEDIDA_INCOMPATIVEL,
        severidade: SeveridadeDivergencia.BAIXA,
        descricao: `Unidade divergente: contrato="${item.contratoItem.unidade}", NF="${item.unidadeComercial}".`,
        valorEsperado: item.contratoItem.unidade,
        valorEncontrado: item.unidadeComercial,
        notaFiscalItemId: item.id,
      });
    }

    // Verificar valor unitário
    if (!dentroTolerancia(item.valorUnitario, item.contratoItem.valorUnitario, this.TOLERANCIA_VALOR_PERCENTUAL)) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.VALOR_UNITARIO_DIVERGENTE,
        severidade: SeveridadeDivergencia.MEDIA,
        descricao: `Valor unitário divergente para "${item.descricao}".`,
        valorEsperado: item.contratoItem.valorUnitario.toString(),
        valorEncontrado: item.valorUnitario.toString(),
        notaFiscalItemId: item.id,
      });
    }

    // Verificar quantidade disponível
    if (item.quantidade.gt(item.contratoItem.quantidadeDisponivel)) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.QUANTIDADE_ACIMA_ACEITA,
        severidade: SeveridadeDivergencia.ALTA,
        descricao: `Quantidade acima do disponível para "${item.descricao}".`,
        valorEsperado: item.contratoItem.quantidadeDisponivel.toString(),
        valorEncontrado: item.quantidade.toString(),
        notaFiscalItemId: item.id,
      });
    }
  }

  /**
   * Verifica vínculo com recebimento e compara quantidades recebidas e
   * aceitas × quantidades faturadas por item.
   */
  private verificarRecebimento(
    notaFiscal: {
      id: string;
      itens: Array<{ id: string; descricao: string; quantidade: Prisma.Decimal }>;
      vinculosRecebimento: Array<{
        id: string;
        notaFiscalItemId?: string | null;
        quantidadeVinculada: Prisma.Decimal;
        entrega: { id: string; status: string } | null;
      }>;
    },
    divergencias: DivergenciaDetectada[],
  ): void {
    if (notaFiscal.vinculosRecebimento.length === 0) {
      divergencias.push({
        tipo: TipoDivergenciaFiscal.RECEBIMENTO_NAO_CONFIRMADO,
        severidade: SeveridadeDivergencia.MEDIA,
        descricao: 'Nota fiscal sem vínculo com recebimento confirmado.',
      });
      return;
    }

    for (const vinculo of notaFiscal.vinculosRecebimento) {
      if (vinculo.entrega && vinculo.entrega.status !== 'ACEITA') {
        divergencias.push({
          tipo: TipoDivergenciaFiscal.RECEBIMENTO_NAO_CONFIRMADO,
          severidade: SeveridadeDivergencia.MEDIA,
          descricao: `Recebimento vinculado não está confirmado (status: ${vinculo.entrega.status}).`,
        });
      }
    }

    // Comparação quantitativa (só é possível com vínculos granulares por item).
    const vinculosPorItem = notaFiscal.vinculosRecebimento.filter((v) => v.notaFiscalItemId);
    if (vinculosPorItem.length === 0) return;

    for (const item of notaFiscal.itens) {
      const recebido = vinculosPorItem
        .filter((vinculo) => vinculo.notaFiscalItemId === item.id)
        .reduce((acc, vinculo) => acc.add(vinculo.quantidadeVinculada), new Prisma.Decimal(0));

      if (item.quantidade.gt(recebido)) {
        divergencias.push({
          tipo: TipoDivergenciaFiscal.QUANTIDADE_ACIMA_ACEITA,
          severidade: SeveridadeDivergencia.ALTA,
          descricao: `Quantidade faturada (${item.quantidade.toString()}) acima da quantidade recebida e aceita (${recebido.toString()}) para "${item.descricao}".`,
          valorEsperado: recebido.toString(),
          valorEncontrado: item.quantidade.toString(),
          notaFiscalItemId: item.id,
        });
      } else if (recebido.gt(item.quantidade)) {
        divergencias.push({
          tipo: TipoDivergenciaFiscal.OUTRA,
          severidade: SeveridadeDivergencia.MEDIA,
          descricao: `Quantidade recebida vinculada (${recebido.toString()}) acima da quantidade faturada (${item.quantidade.toString()}) para "${item.descricao}".`,
          valorEsperado: item.quantidade.toString(),
          valorEncontrado: recebido.toString(),
          notaFiscalItemId: item.id,
        });
      }
    }
  }

  /**
   * Classifica o resultado da conciliação baseado nas divergências.
   */
  private classificarResultado(
    divergencias: DivergenciaDetectada[],
    _notaFiscal: { itens: unknown[] },
  ): ResultadoConciliacaoFiscal {
    if (divergencias.length === 0) {
      return ResultadoConciliacaoFiscal.CONCILIADA;
    }

    const temImpeditiva = divergencias.some((d) => d.severidade === SeveridadeDivergencia.IMPEDITIVA);
    const temAlta = divergencias.some((d) => d.severidade === SeveridadeDivergencia.ALTA);

    if (temImpeditiva || temAlta) {
      return ResultadoConciliacaoFiscal.DIVERGENTE;
    }

    const temMedia = divergencias.some((d) => d.severidade === SeveridadeDivergencia.MEDIA);
    if (temMedia) {
      return ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS;
    }

    return ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS;
  }
}
