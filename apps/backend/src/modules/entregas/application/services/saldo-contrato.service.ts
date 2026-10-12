import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { calcularSaldoItem, consolidarSaldoContrato, SaldoContrato } from '../domain/entrega-saldos';
import { textoDecimal, multiplicar } from '../../../contratos/application/domain/contrato-decimal';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { EntregaAcessoService } from './entrega-acesso.service';
import { dataInstitucional, hojeInstitucional } from '../../../contratos/application/domain/contrato-datas';

@Injectable()
export class SaldoContratoService {
  constructor(private readonly prisma: PrismaService, private readonly acesso: EntregaAcessoService) {}

  async consultarSaldoContrato(contratoId: string, user?: AuthenticatedUser): Promise<SaldoContrato> {
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
          },
        },
      },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado.');
    }

    if (user) await this.acesso.exigir(user, { dreId: contrato.dreId || '', unidadeEscolarId: contrato.escolaId || '', fornecedorId: contrato.produtorId }, 'CONSULTAR');
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
            deletedAt: null,
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
        const aceites = await this.prisma.entregaItem.findMany({
          where: { programacaoItem: { contratoItemId: item.id }, entrega: { status: 'ACEITA' } },
          select: { quantidadeAceita: true, programacaoItem: { select: { valorUnitarioContratual: true } } },
        });
        const valorAceitoHistorico = aceites.reduce((acc, aceite) => acc.add(multiplicar(aceite.quantidadeAceita, aceite.programacaoItem.valorUnitarioContratual)), new Prisma.Decimal(0));

        const saldo = calcularSaldoItem(
          item.quantidadeContratada,
          item.quantidadeAditivada,
          quantidadeAceita,
          quantidadeReservada,
          quantidadeRejeitada,
          item.valorUnitario,
          valorAceitoHistorico,
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

  async consultarSaldoContratoPorPeriodo(contratoId: string, dataInicio: Date, dataFim: Date, user?: AuthenticatedUser) {
    const saldoGeral = await this.consultarSaldoContrato(contratoId, user);

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
        const valorUnitario = item.programacaoItem.valorUnitarioContratual;
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
  }, user?: AuthenticatedUser) {
    const where: Prisma.ContratoWhereInput = {
      status: 'VIGENTE',
    };
    if (user) {
      where.AND = [await this.acesso.filtroContrato(user)];
    }

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

    const aceites = contratos.length ? await this.prisma.$queryRaw<Array<{ contratoId: string; valorAceito: Prisma.Decimal }>>`
      SELECT p.contratoId, SUM(ei.quantidadeAceita * pi.valorUnitarioContratual) AS valorAceito
      FROM pnae_entrega_itens ei
      JOIN pnae_entregas e ON e.id = ei.entregaId
      JOIN pnae_programacao_entrega_itens pi ON pi.id = ei.programacaoItemId
      JOIN pnae_programacoes_entrega p ON p.id = pi.programacaoId
      WHERE e.status = 'ACEITA' AND p.contratoId IN (${Prisma.join(contratos.map(c => c.id))})
      GROUP BY p.contratoId
    ` : [];
    const porContrato = new Map(aceites.map(a => [a.contratoId, new Prisma.Decimal(a.valorAceito)]));
    const contratosValidos = contratos.map(contrato => {
      const valorAceito = porContrato.get(contrato.id) || new Prisma.Decimal(0);
      const percentual = contrato.valorAtualizado.eq(0) ? new Prisma.Decimal(0) : valorAceito.div(contrato.valorAtualizado).mul(100);
      return {
        contratoNumero: `${contrato.numero}/${contrato.exercicio}`,
        valorContratadoAtualizado: textoDecimal(contrato.valorAtualizado, 2),
        valorAceitoAcumulado: textoDecimal(valorAceito, 2),
        percentualExecucaoFinanceira: textoDecimal(percentual, 2),
      };
    });

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

    const ids = contratos.map(c => c.id);
    const hoje = dataInstitucional(hojeInstitucional());
    const fimMes = new Date(hoje);
    fimMes.setUTCMonth(fimMes.getUTCMonth() + 1, 1);
    const inicioMes = dataInstitucional(`${hojeInstitucional().slice(0, 7)}-01`);
    const [programacoes, entregas, atrasadas, previstasPeriodo, divergencias, quantidade, programado] = ids.length ? await Promise.all([
      this.prisma.programacaoEntrega.groupBy({ by: ['status'], where: { contratoId: { in: ids }, deletedAt: null }, _count: { id: true } }),
      this.prisma.entrega.groupBy({ by: ['status'], where: { programacao: { contratoId: { in: ids } }, deletedAt: null }, _count: { id: true } }),
      this.prisma.programacaoEntrega.count({ where: { contratoId: { in: ids }, deletedAt: null, dataPrevista: { lt: hoje }, status: { notIn: ['RECEBIDA', 'CANCELADA'] } } }),
      this.prisma.programacaoEntrega.count({ where: { contratoId: { in: ids }, deletedAt: null, dataPrevista: { gte: inicioMes, lt: fimMes }, status: { not: 'CANCELADA' } } }),
      this.prisma.ocorrenciaEntrega.count({ where: { deletedAt: null, entrega: { programacao: { contratoId: { in: ids } } } } }),
      this.prisma.entregaItem.aggregate({ where: { entrega: { status: 'ACEITA', programacao: { contratoId: { in: ids } } } }, _sum: { quantidadeAceita: true } }),
      this.prisma.programacaoEntregaItem.aggregate({ where: { deletedAt: null, programacao: { contratoId: { in: ids }, deletedAt: null, status: { not: 'CANCELADA' } } }, _sum: { valorTotalPrevisto: true } }),
    ]) : [[], [], 0, 0, 0, { _sum: { quantidadeAceita: new Prisma.Decimal(0) } }, { _sum: { valorTotalPrevisto: new Prisma.Decimal(0) } }];
    const porStatusProgramacao = Object.fromEntries(programacoes.map(x => [x.status, x._count.id]));
    const porStatusEntrega = Object.fromEntries(entregas.map(x => [x.status, x._count.id]));
    type LinhaVisao = { dreId: string; dreNome: string; municipioId: string | null; municipioNome: string | null; escolaId: string; escolaNome: string; fornecedorId: string; fornecedorNome: string; contratoId: string; contratoNumero: string; produto: string; mes: string; quantidadeAceita: Prisma.Decimal; valorAceito: Prisma.Decimal };
    const linhas: LinhaVisao[] = ids.length ? await this.prisma.$queryRaw<LinhaVisao[]>`
      SELECT p.dreId, d.nome AS dreNome, p.municipioId, m.nome AS municipioNome,
        p.unidadeEscolarId AS escolaId, s.nome AS escolaNome,
        p.fornecedorId, f.nome AS fornecedorNome, p.contratoId,
        c.numero AS contratoNumero, pi.produto, DATE_FORMAT(e.dataEntrega, '%Y-%m') AS mes,
        SUM(ei.quantidadeAceita) AS quantidadeAceita,
        SUM(ei.quantidadeAceita * pi.valorUnitarioContratual) AS valorAceito
      FROM pnae_entrega_itens ei
      JOIN pnae_entregas e ON e.id = ei.entregaId
      JOIN pnae_programacao_entrega_itens pi ON pi.id = ei.programacaoItemId
      JOIN pnae_programacoes_entrega p ON p.id = pi.programacaoId
      JOIN pnae_contratos c ON c.id = p.contratoId
      JOIN dres d ON d.id = p.dreId
      LEFT JOIN municipios m ON m.id = p.municipioId
      JOIN escolas s ON s.id = p.unidadeEscolarId
      JOIN produtores f ON f.id = p.fornecedorId
      WHERE e.status = 'ACEITA' AND p.contratoId IN (${Prisma.join(ids)})
      GROUP BY p.dreId, d.nome, p.municipioId, m.nome, p.unidadeEscolarId, s.nome,
        p.fornecedorId, f.nome, p.contratoId, c.numero, pi.produto, mes
    ` : [];
    const agrupar = (chave: (linha: LinhaVisao) => string, nome: (linha: LinhaVisao) => string) => {
      const mapa = new Map<string, { id: string; nome: string; quantidadeAceita: Prisma.Decimal; valorAceito: Prisma.Decimal }>();
      for (const linha of linhas) {
        const id = chave(linha);
        const atual = mapa.get(id) || { id, nome: nome(linha), quantidadeAceita: new Prisma.Decimal(0), valorAceito: new Prisma.Decimal(0) };
        atual.quantidadeAceita = atual.quantidadeAceita.add(linha.quantidadeAceita);
        atual.valorAceito = atual.valorAceito.add(linha.valorAceito);
        mapa.set(id, atual);
      }
      return [...mapa.values()].map(x => ({ id: x.id, nome: x.nome, quantidadeAceita: textoDecimal(x.quantidadeAceita, 4), valorAceito: textoDecimal(x.valorAceito, 2) })).sort((a, b) => Number(b.valorAceito) - Number(a.valorAceito));
    };

    return {
      totalContratos: contratosValidos.length,
      valorTotalContratado: textoDecimal(valorTotalContratado, 2),
      valorTotalAceito: textoDecimal(valorTotalAceito, 2),
      percentualExecucaoGeral: textoDecimal(percentualGeral, 2),
      contratos: contratosValidos,
      indicadores: {
        programacoes: programacoes.reduce((n, x) => n + x._count.id, 0),
        previstasPeriodo,
        realizadas: (porStatusEntrega.ACEITA || 0),
        atrasadas,
        parcialmenteRecebidas: porStatusProgramacao.PARCIALMENTE_RECEBIDA || 0,
        comDivergencias: divergencias,
        quantidadeAceita: textoDecimal(quantidade._sum.quantidadeAceita || new Prisma.Decimal(0), 4),
        valorProgramado: textoDecimal(programado._sum.valorTotalPrevisto || new Prisma.Decimal(0), 2),
        porStatusProgramacao,
        porStatusEntrega,
      },
      visoes: {
        dre: agrupar(x => x.dreId, x => x.dreNome),
        municipio: agrupar(x => x.municipioId || 'sem-municipio', x => x.municipioNome || 'Sem município'),
        escola: agrupar(x => x.escolaId, x => x.escolaNome),
        fornecedor: agrupar(x => x.fornecedorId, x => x.fornecedorNome),
        contrato: agrupar(x => x.contratoId, x => x.contratoNumero),
        produto: agrupar(x => x.produto, x => x.produto),
        mes: agrupar(x => x.mes, x => x.mes),
      },
    };
  }
}
