import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { podeTransicionarEntrega, StatusEntrega } from '../domain/entrega-estado';
import { processarAceite } from '../domain/entrega-saldos';
import { CreateEntregaDto } from '../../presentation/dto/entrega.dto';
import { quantidadeDecimal, textoDecimal } from '../../../contratos/application/domain/contrato-decimal';

@Injectable()
export class EntregaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateEntregaDto, userId: string, userRole: string) {
    // Buscar programação
    const programacao = await this.prisma.programacaoEntrega.findUnique({
      where: { id: dto.programacaoId },
      include: {
        contrato: true,
        itens: {
          include: {
            contratoItem: true,
          },
        },
        fornecedor: true,
        unidadeEscolar: true,
        dre: true,
      },
    });

    if (!programacao) {
      throw new NotFoundException('Programação não encontrada.');
    }

    if (!['CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'].includes(programacao.status)) {
      throw new BadRequestException('Programação não está confirmada ou em entrega.');
    }

    await this.validarAcessoInstitucional(
      userId,
      userRole,
      programacao.dreId,
      programacao.unidadeEscolarId,
      programacao.fornecedorId,
    );

    // Gerar número
    const numero = dto.numero || (await this.gerarNumeroSequencial());

    // Validar itens
    const itensParaCriar: Prisma.EntregaItemCreateManyEntregaInput[] = [];

    for (const itemDto of dto.itens) {
      const progItem = programacao.itens.find((pi) => pi.id === itemDto.programacaoItemId);

      if (!progItem) {
        throw new BadRequestException(`Item de programação ${itemDto.programacaoItemId} não encontrado.`);
      }

      const quantidadeInformada = quantidadeDecimal(itemDto.quantidadeInformada);
      const quantidadeAceita = quantidadeDecimal(itemDto.quantidadeAceita);
      const quantidadeRejeitada = quantidadeDecimal(itemDto.quantidadeRejeitada);

      // Validar soma
      const soma = quantidadeAceita.add(quantidadeRejeitada);
      if (!soma.equals(quantidadeInformada)) {
        throw new BadRequestException(
          `Item ${progItem.produto}: quantidadeAceita + quantidadeRejeitada deve ser igual a quantidadeInformada.`,
        );
      }

      // Validar não negativo
      if (quantidadeInformada.lt(0) || quantidadeAceita.lt(0) || quantidadeRejeitada.lt(0)) {
        throw new BadRequestException(`Item ${progItem.produto}: quantidades não podem ser negativas.`);
      }

      itensParaCriar.push({
        programacaoItemId: progItem.id,
        quantidadeInformada,
        quantidadeAceita,
        quantidadeRejeitada,
        motivoRejeicao: itemDto.motivoRejeicao,
        observacoes: itemDto.observacoes,
        createdBy: userId,
      });
    }

    // Criar entrega
    const entrega = await this.prisma.$transaction(async (tx) => {
      const ent = await tx.entrega.create({
        data: {
          numero,
          programacaoId: programacao.id,
          fornecedorId: programacao.fornecedorId,
          unidadeEscolarId: programacao.unidadeEscolarId,
          dreId: programacao.dreId,
          municipioId: programacao.municipioId,
          dataEntrega: new Date(dto.dataEntrega),
          numeroDocumento: dto.numeroDocumento,
          observacoes: dto.observacoes,
          status: 'REGISTRADA',
          createdBy: userId,
        },
      });

      if (itensParaCriar.length > 0) {
        await tx.entregaItem.createMany({
          data: itensParaCriar.map((item) => ({
            ...item,
            entregaId: ent.id,
          })),
        });
      }

      // Atualizar status da programação
      if (programacao.status === 'CONFIRMADA') {
        await tx.programacaoEntrega.update({
          where: { id: programacao.id },
          data: { status: 'EM_ENTREGA' },
        });
      }

      return ent;
    });

    await this.audit.log({
      userId,
      action: 'ENTREGA_CRIADA',
      entity: 'Entrega',
      entityId: entrega.id,
      entityLabel: numero,
      newValues: JSON.stringify({ programacaoId: programacao.id, itens: dto.itens.length }),
    });

    return this.findById(entrega.id);
  }

  async findById(id: string) {
    const entrega = await this.prisma.entrega.findUnique({
      where: { id },
      include: {
        programacao: {
          include: {
            contrato: { select: { numero: true, exercicio: true } },
          },
        },
        fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
        unidadeEscolar: { select: { id: true, nome: true, codigo: true } },
        dre: { select: { id: true, nome: true, codigo: true } },
        municipio: { select: { id: true, nome: true, uf: true } },
        itens: {
          include: {
            programacaoItem: {
              include: {
                contratoItem: { select: { produto: true, unidade: true, valorUnitario: true } },
              },
            },
          },
        },
        ocorrencias: { orderBy: { dataOcorrencia: 'desc' } },
        documentos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega não encontrada.');
    }

    return entrega;
  }

  async findAll(filters: {
    programacaoId?: string;
    fornecedorId?: string;
    unidadeEscolarId?: string;
    dreId?: string;
    municipioId?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }) {
    const where: Prisma.EntregaWhereInput = {};

    if (filters.programacaoId) where.programacaoId = filters.programacaoId;
    if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;
    if (filters.unidadeEscolarId) where.unidadeEscolarId = filters.unidadeEscolarId;
    if (filters.dreId) where.dreId = filters.dreId;
    if (filters.municipioId) where.municipioId = filters.municipioId;
    if (filters.status) where.status = filters.status as any;

    if (filters.dataInicio || filters.dataFim) {
      where.dataEntrega = {};
      if (filters.dataInicio) where.dataEntrega.gte = new Date(filters.dataInicio);
      if (filters.dataFim) where.dataEntrega.lte = new Date(filters.dataFim);
    }

    return this.prisma.entrega.findMany({
      where,
      include: {
        programacao: {
          select: {
            numero: true,
            contrato: { select: { numero: true, exercicio: true } },
          },
        },
        fornecedor: { select: { nome: true } },
        unidadeEscolar: { select: { nome: true } },
        dre: { select: { nome: true } },
        itens: { select: { quantidadeInformada: true, quantidadeAceita: true, quantidadeRejeitada: true } },
      },
      orderBy: { dataEntrega: 'desc' },
    });
  }

  async transicionar(id: string, para: StatusEntrega, motivo: string | undefined, userId: string, userRole: string) {
    const atual = await this.findById(id);

    if (!podeTransicionarEntrega(atual.status as any, para)) {
      throw new BadRequestException(`Transição inválida de ${atual.status} para ${para}.`);
    }

    await this.validarAcessoInstitucional(
      userId,
      userRole,
      atual.dreId,
      atual.unidadeEscolarId,
      atual.fornecedorId,
    );

    const dataParaAtualizar: Prisma.EntregaUpdateInput = {
      status: para,
      updatedBy: userId,
    };

    if (para === 'CONFERIDA') {
      dataParaAtualizar.conferidaEm = new Date();
      dataParaAtualizar.conferidaPor = userId;
    }

    if (para === 'ACEITA') {
      dataParaAtualizar.aceitaEm = new Date();
      dataParaAtualizar.aceitaPor = userId;

      // Atualizar saldos contratuais e reservas
      await this.prisma.$transaction(async (tx) => {
        for (const item of atual.itens) {
          const qtdAceita = item.quantidadeAceita;
          const qtdRejeitada = item.quantidadeRejeitada;
          const progItem = item.programacaoItem;

          // Reduzir reserva
          const novaReserva = progItem.quantidadeReservada.sub(qtdAceita).sub(qtdRejeitada);
          await tx.programacaoEntregaItem.update({
            where: { id: progItem.id },
            data: { quantidadeReservada: novaReserva },
          });

          // Atualizar saldo do contrato item
          const contratoItem = await tx.contratoItem.findUnique({
            where: { id: progItem.contratoItemId },
          });

          if (contratoItem) {
            const novaQtdDisponivel = contratoItem.quantidadeDisponivel.sub(qtdAceita);
            await tx.contratoItem.update({
              where: { id: contratoItem.id },
              data: { quantidadeDisponivel: novaQtdDisponivel },
            });
          }
        }

        await tx.entrega.update({
          where: { id },
          data: dataParaAtualizar,
        });

        // Atualizar status da programação
        const totalProgramado = await tx.programacaoEntregaItem.aggregate({
          where: { programacaoId: atual.programacaoId },
          _sum: { quantidadeProgramada: true },
        });

        const totalAceito = await tx.entregaItem.aggregate({
          where: {
            entrega: {
              programacaoId: atual.programacaoId,
              status: 'ACEITA',
            },
          },
          _sum: { quantidadeAceita: true },
        });

        const qtdProgramada = totalProgramado._sum.quantidadeProgramada || new Prisma.Decimal(0);
        const qtdAceitaTotal = totalAceito._sum.quantidadeAceita || new Prisma.Decimal(0);

        let novoStatusProgramacao: string | undefined;

        if (qtdAceitaTotal.gte(qtdProgramada)) {
          novoStatusProgramacao = 'RECEBIDA';
        } else if (qtdAceitaTotal.gt(0)) {
          novoStatusProgramacao = 'PARCIALMENTE_RECEBIDA';
        }

        if (novoStatusProgramacao) {
          await tx.programacaoEntrega.update({
            where: { id: atual.programacaoId },
            data: { status: novoStatusProgramacao as any },
          });
        }
      });
    } else {
      await this.prisma.entrega.update({
        where: { id },
        data: dataParaAtualizar,
      });
    }

    await this.audit.log({
      userId,
      action: 'ENTREGA_TRANSICIONADA',
      entity: 'Entrega',
      entityId: id,
      entityLabel: atual.numero,
      oldValues: JSON.stringify({ status: atual.status }),
      newValues: JSON.stringify({ status: para, motivo }),
    });

    return this.findById(id);
  }

  async conferir(id: string, idempotencyKey: string | undefined, userId: string, userRole: string) {
    if (idempotencyKey) {
      const existente = await this.prisma.idempotenciaOperacao.findUnique({
        where: { chave: idempotencyKey },
      });

      if (existente) {
        return JSON.parse(existente.resposta!);
      }
    }

    const resultado = await this.transicionar(id, 'CONFERIDA', undefined, userId, userRole);

    if (idempotencyKey) {
      await this.prisma.idempotenciaOperacao.create({
        data: {
          chave: idempotencyKey,
          operacao: 'CONFERIR_ENTREGA',
          recursoId: id,
          resposta: JSON.stringify(resultado),
        },
      });
    }

    return resultado;
  }

  async aceitar(id: string, idempotencyKey: string | undefined, userId: string, userRole: string) {
    if (idempotencyKey) {
      const existente = await this.prisma.idempotenciaOperacao.findUnique({
        where: { chave: idempotencyKey },
      });

      if (existente) {
        return JSON.parse(existente.resposta!);
      }
    }

    const resultado = await this.transicionar(id, 'ACEITA', undefined, userId, userRole);

    if (idempotencyKey) {
      await this.prisma.idempotenciaOperacao.create({
        data: {
          chave: idempotencyKey,
          operacao: 'ACEITAR_ENTREGA',
          recursoId: id,
          resposta: JSON.stringify(resultado),
        },
      });
    }

    return resultado;
  }

  private async gerarNumeroSequencial(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `ENT-${ano}-`;

    const ultima = await this.prisma.entrega.findFirst({
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
