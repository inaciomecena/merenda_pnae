import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { calcularSaldoItem, consolidarSaldoContrato, SaldoContrato } from '../domain/entrega-saldos';
import { textoDecimal } from '../../../contratos/application/domain/contrato-decimal';

@Injectable()
export class SaldoContratoService {
  constructor(private readonly prisma: PrismaService) {}

  async consultarSaldoContrato(contratoId: string): Promise<SaldoContrato> {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        itens: {
          include: {
            programacaoItens: {
              where: {
                programacao: {
                  status: {
                    in: ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'],
                  },
                  deletedAt: null,
                },
              },
            },
            aditivoItens: {
              include: {
                aditivo: {
                  where: { status: 'FORMALIZADO' },
                },
              },
            },
          },
        },
      },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado.');
    }

    const itensSaldo = await Promise.all(
      contrato.itens.map(async (item) => {
        // Calcular quantidade aceita acumulada
        const aceitoAggregate = await this.prisma.entregaItem.aggregate({
          where: {
            programacaoItem: {
              contratoItemId: item.id,
            },
            entrega: {
              status: 'ACEITA',
            },
          },
          _sum: { quantidadeAceita: true },
        });

        const quantidadeAceita = aceitoAggregate._sum.quantidadeAceita || new Prisma.Decimal(0);

        // Calcular quantidade rejeitada acumulada
        const rejeitadoAggregate = await this.prisma.entregaItem.aggregate({
          where: {
            programacaoItem: {
              contratoItemId: item.id,
            },
            entrega: {
              status: 'ACEITA',
            },
          },
          _sum: { quantidadeRejeitada: true },
        });

        const quantidadeRejeitada = rejeitadoAggregate._sum.quantidadeRejeitada || new Prisma.Decimal(0);

        // Calcular quantidade reservada em programações ativas
        const reservadaAggregate = await this.prisma.programacaoEntregaItem.aggregate({
          where: {
            contratoItemId: item.id,
            programacao: {
              status: {
                in: ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'],
              },
              deletedAt: null,
            },
          },
          _sum: { quantidadeReservada: true },
        });

        const quantidadeReservada = reservadaAggregate._sum.quantidadeReservada || new Prisma.Decimal(0);

        const saldo = calcularSaldoItem(
          item.quantidadeContratada,
          item.quantidadeAditivada,
          quantidadeAceita,
          quantidadeReservada,
          quantidadeRejeitada,
          item.valorUnitario,
        );

        return {
          ...saldo,
          contratoItemId: item.id,
          produto: item.produto,
          unidade: item.unidade || '',
        };
      }),
    );

    return consolidarSaldoContrato(
      contrato.id,
      `${contrato.numero}/${contrato.exercicio}`,
      itensSaldo,
      contrato.valorInicial,
      contrato.valorAtualizado,
    );
  }

  async consultarSaldoContratoPorPeriodo(contratoId: string, dataInicio: Date, dataFim: Date) {
    const saldoGeral = await this.consultarSaldoContrato(contratoId);

    // Adicionar informações de entregas no período
    const entregasPeriodo = await this.prisma.entrega.findMany({
      where: {
        programacao: {
          contratoId,
        },
        dataEntrega: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: 'ACEITA',
      },
      include: {
        itens: {
          include: {
            programacaoItem: {
              include: {
                contratoItem: true,
              },
            },
          },
        },
      },
    });

    const resumoPorProduto = new Map<string, { quantidadeAceita: Prisma.Decimal; valorAceito: Prisma.Decimal }>();

    for (const entrega of entregasPeriodo) {
      for (const item of entrega.itens) {
        const produto = item.programacaoItem.contratoItem.produto;
        const valorUnitario = item.programacaoItem.contratoItem.valorUnitario;
        const valorAceito = item.quantidadeAceita.mul(valorUnitario);

        const resumoAtual = resumoPorProduto.get(produto) || {
          quantidadeAceita: new Prisma.Decimal(0),
          valorAceito: new Prisma.Decimal(0),
        };

        resumoPorProduto.set(produto, {
          quantidadeAceita: resumoAtual.quantidadeAceita.add(item.quantidadeAceita),
          valorAceito: resumoAtual.valorAceito.add(valorAceito),
        });
      }
    }

    const resumoPeriodo = Array.from(resumoPorProduto.entries()).map(([produto, resumo]) => ({
      produto,
      quantidadeAceita: textoDecimal(resumo.quantidadeAceita, 4),
      valorAceito: textoDecimal(resumo.valorAceito, 2),
    }));

    return {
      saldoAtual: saldoGeral,
      periodo: {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0],
      },
      resumoPeriodo,
      totalEntregas: entregasPeriodo.length,
    };
  }

  async consultarExecutorGeral(filters: {
    dreId?: string;
    municipioId?: string;
    fornecedorId?: string;
    escolaId?: string;
  }) {
    const where: Prisma.ContratoWhereInput = {
      status: 'VIGENTE',
    };

    if (filters.dreId) where.dreId = filters.dreId;
    if (filters.municipioId) where.municipioId = filters.municipioId;
    if (filters.fornecedorId) where.produtorId = filters.fornecedorId;
    if (filters.escolaId) where.escolaId = filters.escolaId;

    const contratos = await this.prisma.contrato.findMany({
      where,
      select: {
        id: true,
        numero: true,
        exercicio: true,
        valorInicial: true,
        valorAtualizado: true,
      },
    });

    const resultados = await Promise.all(
      contratos.map(async (contrato) => {
        try {
          const saldo = await this.consultarSaldoContrato(contrato.id);
          return {
            contratoNumero: `${contrato.numero}/${contrato.exercicio}`,
            valorContratadoAtualizado: saldo.valorContratadoAtualizado,
            valorAceitoAcumulado: saldo.valorAceitoAcumulado,
            percentualExecucaoFinanceira: saldo.percentualExecucaoFinanceira,
          };
        } catch {
          return null;
        }
      }),
    );

    const contratosValidos = resultados.filter((r) => r !== null);

    const valorTotalContratado = contratosValidos.reduce(
      (acc, r) => acc.add(new Prisma.Decimal(r!.valorContratadoAtualizado)),
      new Prisma.Decimal(0),
    );

    const valorTotalAceito = contratosValidos.reduce(
      (acc, r) => acc.add(new Prisma.Decimal(r!.valorAceitoAcumulado)),
      new Prisma.Decimal(0),
    );

    const percentualGeral = valorTotalContratado.eq(0)
      ? new Prisma.Decimal(0)
      : valorTotalAceito.div(valorTotalContratado).mul(100);

    return {
      totalContratos: contratosValidos.length,
      valorTotalContratado: textoDecimal(valorTotalContratado, 2),
      valorTotalAceito: textoDecimal(valorTotalAceito, 2),
      percentualExecucaoGeral: textoDecimal(percentualGeral, 2),
      contratos: contratosValidos,
    };
  }
}
