import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { podeTransicionarProgramacao, StatusProgramacao } from '../domain/entrega-estado';
import { reservarQuantidade } from '../domain/entrega-saldos';
import { CreateProgramacaoEntregaDto, UpdateProgramacaoEntregaDto } from '../../presentation/dto/entrega.dto';
import { quantidadeDecimal, textoDecimal } from '../../../contratos/application/domain/contrato-decimal';

@Injectable()
export class ProgramacaoEntregaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateProgramacaoEntregaDto, userId: string, userRole: string) {
    // Buscar contrato com validações
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: dto.contratoId },
      include: {
        produtor: true,
        escola: true,
        dre: true,
        itens: { include: { editalItem: true, propostaItem: true } },
      },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado.');
    }

    if (contrato.status !== 'VIGENTE') {
      throw new BadRequestException('Contrato não está vigente.');
    }

    // Verificar autorização institucional
    await this.validarAcessoInstitucional(userId, userRole, contrato.dreId, contrato.escolaId, contrato.produtorId);

    // Gerar número sequencial
    const numero = dto.numero || (await this.gerarNumeroSequencial());

    // Validar itens e reservar saldo
    const itensParaCriar: Prisma.ProgramacaoEntregaItemCreateManyProgramacaoInput[] = [];
    const atualizacoesContratoItem: Array<{ id: string; reserva: Prisma.Decimal }> = [];

    for (const itemDto of dto.itens) {
      const contratoItem = contrato.itens.find((ci) => ci.id === itemDto.contratoItemId);

      if (!contratoItem) {
        throw new BadRequestException(`Item de contrato ${itemDto.contratoItemId} não encontrado no contrato.`);
      }

      const quantidadeSolicitada = quantidadeDecimal(itemDto.quantidadeProgramada);

      // Calcular saldo disponível considerando reservas
      const reservaAtual = await this.calcularReservaAtual(contratoItem.id);
      const qtdDisponivel = quantidadeDecimal(contratoItem.quantidadeDisponivel).sub(reservaAtual);

      const resultadoReserva = reservarQuantidade(qtdDisponivel, quantidadeSolicitada);

      if (!resultadoReserva.ok) {
        throw new BadRequestException(`Item ${contratoItem.produto}: ${resultadoReserva.mensagem}`);
      }

      itensParaCriar.push({
        contratoItemId: contratoItem.id,
        produto: contratoItem.produto,
        unidadeMedida: contratoItem.unidade,
        quantidadeProgramada: quantidadeSolicitada,
        valorUnitarioContratual: contratoItem.valorUnitario,
        valorTotalPrevisto: quantidadeSolicitada.mul(contratoItem.valorUnitario),
        quantidadeReservada: quantidadeSolicitada,
        createdBy: userId,
      });

      atualizacoesContratoItem.push({
        id: contratoItem.id,
        reserva: quantidadeSolicitada,
      });
    }

    // Criar programação em transação
    const programacao = await this.prisma.$transaction(async (tx) => {
      const prog = await tx.programacaoEntrega.create({
        data: {
          numero,
          contratoId: contrato.id,
          fornecedorId: contrato.produtorId,
          unidadeEscolarId: contrato.escolaId!,
          dreId: contrato.dreId!,
          municipioId: contrato.municipioId,
          dataPrevista: new Date(dto.dataPrevista),
          periodoEntrega: dto.periodoEntrega,
          status: 'RASCUNHO',
          observacoes: dto.observacoes,
          createdBy: userId,
        },
      });

      if (itensParaCriar.length > 0) {
        await tx.programacaoEntregaItem.createMany({
          data: itensParaCriar.map((item) => ({
            ...item,
            programacaoId: prog.id,
          })),
        });
      }

      return prog;
    });

    await this.audit.log({
      userId,
      action: 'PROGRAMACAO_ENTREGA_CRIADA',
      entity: 'ProgramacaoEntrega',
      entityId: programacao.id,
      entityLabel: numero,
      newValues: JSON.stringify({ contratoId: contrato.id, itens: dto.itens.length }),
    });

    return this.findById(programacao.id);
  }

  async findById(id: string) {
    const prog = await this.prisma.programacaoEntrega.findUnique({
      where: { id },
      include: {
        contrato: { select: { numero: true, exercicio: true, objeto: true, status: true } },
        fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
        unidadeEscolar: { select: { id: true, nome: true, codigo: true } },
        dre: { select: { id: true, nome: true, codigo: true } },
        municipio: { select: { id: true, nome: true, uf: true } },
        itens: {
          include: {
            contratoItem: { select: { produto: true, unidade: true, valorUnitario: true } },
          },
        },
        entregas: { select: { id: true, numero: true, dataEntrega: true, status: true } },
      },
    });

    if (!prog) {
      throw new NotFoundException('Programação não encontrada.');
    }

    return prog;
  }

  async findAll(filters: {
    contratoId?: string;
    fornecedorId?: string;
    unidadeEscolarId?: string;
    dreId?: string;
    municipioId?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }) {
    const where: Prisma.ProgramacaoEntregaWhereInput = {};

    if (filters.contratoId) where.contratoId = filters.contratoId;
    if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;
    if (filters.unidadeEscolarId) where.unidadeEscolarId = filters.unidadeEscolarId;
    if (filters.dreId) where.dreId = filters.dreId;
    if (filters.municipioId) where.municipioId = filters.municipioId;
    if (filters.status) where.status = filters.status as any;

    if (filters.dataInicio || filters.dataFim) {
      where.dataPrevista = {};
      if (filters.dataInicio) where.dataPrevista.gte = new Date(filters.dataInicio);
      if (filters.dataFim) where.dataPrevista.lte = new Date(filters.dataFim);
    }

    return this.prisma.programacaoEntrega.findMany({
      where,
      include: {
        contrato: { select: { numero: true, exercicio: true } },
        fornecedor: { select: { nome: true } },
        unidadeEscolar: { select: { nome: true } },
        dre: { select: { nome: true } },
        itens: { select: { produto: true, quantidadeProgramada: true, unidadeMedida: true } },
      },
      orderBy: { dataPrevista: 'desc' },
    });
  }

  async update(id: string, dto: UpdateProgramacaoEntregaDto, userId: string, userRole: string) {
    const atual = await this.findById(id);

    if (atual.status !== 'RASCUNHO') {
      throw new BadRequestException('Somente programações em rascunho podem ser editadas.');
    }

    // Validar versão otimista
    if (dto.versao !== atual.versao) {
      throw new ConflictException('Versão desatualizada. Recarregue a programação.');
    }

    await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);

    const dataParaAtualizar: Prisma.ProgramacaoEntregaUpdateInput = {
      versao: { increment: 1 },
      updatedBy: userId,
    };

    if (dto.dataPrevista) dataParaAtualizar.dataPrevista = new Date(dto.dataPrevista);
    if (dto.periodoEntrega !== undefined) dataParaAtualizar.periodoEntrega = dto.periodoEntrega;
    if (dto.observacoes !== undefined) dataParaAtualizar.observacoes = dto.observacoes;

    // Se atualizar itens, liberar reservas antigas e criar novas
    if (dto.itens) {
      // Implementação simplificada: liberar todas, criar novas
      // Em produção, calcular diff para evitar operações desnecessárias
      await this.prisma.$transaction(async (tx) => {
        // Liberar reservas antigas
        const itensAntigos = await tx.programacaoEntregaItem.findMany({
          where: { programacaoId: id },
        });

        for (const itemAntigo of itensAntigos) {
          await tx.programacaoEntregaItem.update({
            where: { id: itemAntigo.id },
            data: { quantidadeReservada: 0 },
          });
        }

        // Deletar itens antigos
        await tx.programacaoEntregaItem.deleteMany({ where: { programacaoId: id } });

        // Criar novos itens com validação de saldo
        for (const itemDto of dto.itens) {
          const contratoItem = await tx.contratoItem.findUnique({
            where: { id: itemDto.contratoItemId },
          });

          if (!contratoItem) {
            throw new BadRequestException(`Item de contrato ${itemDto.contratoItemId} não encontrado.`);
          }

          const quantidadeSolicitada = quantidadeDecimal(itemDto.quantidadeProgramada);
          const reservaAtual = await this.calcularReservaAtual(contratoItem.id, tx);
          const qtdDisponivel = quantidadeDecimal(contratoItem.quantidadeDisponivel).sub(reservaAtual);

          const resultadoReserva = reservarQuantidade(qtdDisponivel, quantidadeSolicitada);

          if (!resultadoReserva.ok) {
            throw new BadRequestException(`Item ${contratoItem.produto}: ${resultadoReserva.mensagem}`);
          }

          await tx.programacaoEntregaItem.create({
            data: {
              programacaoId: id,
              contratoItemId: contratoItem.id,
              produto: contratoItem.produto,
              unidadeMedida: contratoItem.unidade,
              quantidadeProgramada: quantidadeSolicitada,
              valorUnitarioContratual: contratoItem.valorUnitario,
              valorTotalPrevisto: quantidadeSolicitada.mul(contratoItem.valorUnitario),
              quantidadeReservada: quantidadeSolicitada,
              createdBy: userId,
            },
          });
        }

        await tx.programacaoEntrega.update({
          where: { id },
          data: dataParaAtualizar,
        });
      });
    } else {
      await this.prisma.programacaoEntrega.update({
        where: { id },
        data: dataParaAtualizar,
      });
    }

    await this.audit.log({
      userId,
      action: 'PROGRAMACAO_ENTREGA_ATUALIZADA',
      entity: 'ProgramacaoEntrega',
      entityId: id,
      entityLabel: atual.numero,
      oldValues: JSON.stringify({ versao: dto.versao }),
      newValues: JSON.stringify(dto),
    });

    return this.findById(id);
  }

  async transicionar(id: string, para: StatusProgramacao, motivo: string | undefined, userId: string, userRole: string) {
    const atual = await this.findById(id);

    if (!podeTransicionarProgramacao(atual.status as any, para)) {
      throw new BadRequestException(`Transição inválida de ${atual.status} para ${para}.`);
    }

    await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);

    const dataParaAtualizar: Prisma.ProgramacaoEntregaUpdateInput = {
      status: para,
      updatedBy: userId,
    };

    if (para === 'CONFIRMADA') {
      dataParaAtualizar.confirmadaEm = new Date();
      dataParaAtualizar.confirmadaPor = userId;
    }

    if (para === 'CANCELADA') {
      dataParaAtualizar.canceladaEm = new Date();
      dataParaAtualizar.canceladaPor = userId;
      dataParaAtualizar.motivoCancelamento = motivo;

      // Liberar reservas
      await this.prisma.$transaction(async (tx) => {
        const itens = await tx.programacaoEntregaItem.findMany({
          where: { programacaoId: id },
        });

        for (const item of itens) {
          await tx.programacaoEntregaItem.update({
            where: { id: item.id },
            data: { quantidadeReservada: 0 },
          });
        }

        await tx.programacaoEntrega.update({
          where: { id },
          data: dataParaAtualizar,
        });
      });
    } else {
      await this.prisma.programacaoEntrega.update({
        where: { id },
        data: dataParaAtualizar,
      });
    }

    await this.audit.log({
      userId,
      action: 'PROGRAMACAO_ENTREGA_TRANSICIONADA',
      entity: 'ProgramacaoEntrega',
      entityId: id,
      entityLabel: atual.numero,
      oldValues: JSON.stringify({ status: atual.status }),
      newValues: JSON.stringify({ status: para, motivo }),
    });

    return this.findById(id);
  }

  async confirmar(id: string, idempotencyKey: string | undefined, userId: string, userRole: string) {
    // Idempotência
    if (idempotencyKey) {
      const existente = await this.prisma.idempotenciaOperacao.findUnique({
        where: { chave: idempotencyKey },
      });

      if (existente) {
        return JSON.parse(existente.resposta!);
      }
    }

    const resultado = await this.transicionar(id, 'CONFIRMADA', undefined, userId, userRole);

    if (idempotencyKey) {
      await this.prisma.idempotenciaOperacao.create({
        data: {
          chave: idempotencyKey,
          operacao: 'CONFIRMAR_PROGRAMACAO',
          recursoId: id,
          resposta: JSON.stringify(resultado),
        },
      });
    }

    return resultado;
  }

  async cancelar(id: string, motivo: string, userId: string, userRole: string) {
    return this.transicionar(id, 'CANCELADA', motivo, userId, userRole);
  }

  private async gerarNumeroSequencial(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `PROG-${ano}-`;

    const ultima = await this.prisma.programacaoEntrega.findFirst({
      where: { numero: { startsWith: prefixo } },
      orderBy: { numero: 'desc' },
    });

    if (!ultima) {
      return `${prefixo}0001`;
    }

    const ultimoNumero = parseInt(ultima.numero.replace(prefixo, ''), 10);
    const novoNumero = ultimoNumero + 1;
    return `${prefixo}${novoNumero.toString().padStart(4, '0')}`;
  }

  private async calcularReservaAtual(contratoItemId: string, tx?: Prisma.TransactionClient): Promise<Prisma.Decimal> {
    const client = tx || this.prisma;

    const resultado = await client.programacaoEntregaItem.aggregate({
      where: {
        contratoItemId,
        programacao: {
          status: { in: ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'] },
          deletedAt: null,
        },
      },
      _sum: { quantidadeReservada: true },
    });

    return resultado._sum.quantidadeReservada || new Prisma.Decimal(0);
  }

  private async validarAcessoInstitucional(
    userId: string,
    userRole: string,
    dreId: string | null,
    escolaId: string | null,
    fornecedorId: string | null,
  ): Promise<void> {
    if (userRole === 'ADMIN') {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vinculos: true },
    });

    if (!user) {
      throw new ForbiddenException('Usuário não encontrado.');
    }

    if (userRole === 'DRE' && dreId) {
      const vinculoDRE = user.vinculos.find((v) => v.dreId === dreId && v.ativo);
      if (!vinculoDRE) {
        throw new ForbiddenException('Sem permissão para acessar esta DRE.');
      }
      return;
    }

    if (userRole === 'ESCOLA' && escolaId) {
      const vinculoEscola = user.vinculos.find((v) => v.escolaId === escolaId && v.ativo);
      if (!vinculoEscola) {
        throw new ForbiddenException('Sem permissão para acessar esta escola.');
      }
      return;
    }

    if (userRole === 'PRODUTOR' && fornecedorId) {
      const vinculoFornecedor = user.vinculos.find((v) => v.produtorId === fornecedorId && v.ativo);
      if (!vinculoFornecedor) {
        throw new ForbiddenException('Sem permissão para acessar este fornecedor.');
      }
      return;
    }

    throw new ForbiddenException('Sem permissão para esta operação.');
  }
}
