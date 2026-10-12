import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { podeTransicionarEntrega, statusValidoEntrega, StatusEntrega } from '../domain/entrega-estado';
import { processarAceite } from '../domain/entrega-saldos';
import { CreateEntregaDto } from '../../presentation/dto/entrega.dto';
import { quantidadeDecimal, textoDecimal } from '../../../contratos/application/domain/contrato-decimal';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { EntregaAcessoService } from './entrega-acesso.service';
import { randomUUID, createHash } from 'crypto';
import { calendarioArmazenado, dataInstitucional, hojeInstitucional } from '../../../contratos/application/domain/contrato-datas';

@Injectable()
export class EntregaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: EntregaAcessoService,
  ) {}

  async create(dto: CreateEntregaDto, userId: string, userRole: string) {
    // Buscar programação
    const programacao = await this.prisma.programacaoEntrega.findUnique({
      where: { id: dto.programacaoId },
      include: {
        contrato: true,
        itens: {
          where: { deletedAt: null },
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

    if (programacao.contrato.status !== 'VIGENTE' || programacao.contrato.deletedAt || !programacao.contrato.vigenciaInicio || !programacao.contrato.vigenciaFim || calendarioArmazenado(programacao.contrato.vigenciaInicio) > hojeInstitucional() || calendarioArmazenado(programacao.contrato.vigenciaFim) < hojeInstitucional()) {
      throw new BadRequestException('Contrato não está vigente.');
    }
    if (new Set(dto.itens.map(i => i.programacaoItemId)).size !== dto.itens.length) throw new BadRequestException('Item de programação duplicado.');

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
    const numero = dto.numero || `ENT-${new Date().getFullYear()}-${randomUUID().slice(0, 8)}`;

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
          dataEntrega: dataInstitucional(dto.dataEntrega),
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

  async findById(id: string, user?: AuthenticatedUser) {
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

    if (user) await this.acesso.exigir(user, entrega, 'CONSULTAR');
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
    page?: string;
    limit?: string;
  }, user?: AuthenticatedUser) {
    const where: Prisma.EntregaWhereInput = user ? { deletedAt: null, AND: [await this.acesso.filtroEntrega(user)] } : { deletedAt: null };

    if (filters.programacaoId) where.programacaoId = filters.programacaoId;
    if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;
    if (filters.unidadeEscolarId) where.unidadeEscolarId = filters.unidadeEscolarId;
    if (filters.dreId) where.dreId = filters.dreId;
    if (filters.municipioId) where.municipioId = filters.municipioId;
    if (filters.status) {
      if (!statusValidoEntrega(filters.status)) throw new BadRequestException('Situação inválida.');
      where.status = filters.status;
    }

    if (filters.dataInicio || filters.dataFim) {
      where.dataEntrega = {};
      if (filters.dataInicio) where.dataEntrega.gte = new Date(filters.dataInicio);
      if (filters.dataFim) where.dataEntrega.lte = new Date(filters.dataFim);
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const [items, total] = await this.prisma.$transaction([this.prisma.entrega.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
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
        itens: { select: { id: true, quantidadeInformada: true, quantidadeAceita: true, quantidadeRejeitada: true, programacaoItem: { select: { produto: true } } } },
        ocorrencias: { select: { id: true, tipo: true, descricao: true, status: true } },
        documentos: { select: { id: true, tipo: true, titulo: true, versao: true, assinaturaDigital: true } },
      },
      orderBy: { dataEntrega: 'desc' },
    }), this.prisma.entrega.count({ where })]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
        const ids = [...new Set(atual.itens.map(i => i.programacaoItem.contratoItemId))].sort();
        await tx.$queryRaw`SELECT id FROM pnae_contrato_itens WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
        const marcado = await tx.entrega.updateMany({ where: { id, status: atual.status }, data: dataParaAtualizar });
        if (marcado.count !== 1) throw new ConflictException('Entrega já processada por outra operação.');
        const contrato = await tx.contrato.findUniqueOrThrow({ where: { id: atual.programacao.contratoId } });
        if (contrato.status !== 'VIGENTE' || contrato.deletedAt) throw new BadRequestException('Contrato não está vigente.');
        for (const item of atual.itens) {
          const qtdAceita = item.quantidadeAceita;
          const progItem = item.programacaoItem;
          const jaAceita = await tx.entregaItem.aggregate({ where: { programacaoItemId: progItem.id, entrega: { status: 'ACEITA', id: { not: id } } }, _sum: { quantidadeAceita: true } });
          const acumulada = (jaAceita._sum.quantidadeAceita || new Prisma.Decimal(0)).add(qtdAceita);
          if (acumulada.gt(progItem.quantidadeProgramada)) throw new BadRequestException('Aceite excede a quantidade programada.');

          // Reduzir reserva
          const novaReserva = progItem.quantidadeProgramada.sub(acumulada);
          await tx.programacaoEntregaItem.update({
            where: { id: progItem.id },
            data: { quantidadeReservada: novaReserva },
          });

          // Atualizar saldo do contrato item
          const contratoItem = await tx.contratoItem.findUnique({
            where: { id: progItem.contratoItemId },
          });

          if (contratoItem) {
            if (contratoItem.quantidadeDisponivel.lt(qtdAceita)) throw new BadRequestException('Aceite excede o saldo contratual.');
            const novaQtdDisponivel = contratoItem.quantidadeDisponivel.sub(qtdAceita);
            await tx.contratoItem.update({
              where: { id: contratoItem.id },
              data: { quantidadeDisponivel: novaQtdDisponivel },
            });
          }
        }

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
      const alterado = await this.prisma.entrega.updateMany({ where: { id, status: atual.status }, data: dataParaAtualizar });
      if (alterado.count !== 1) throw new ConflictException('Entrega alterada por outra operação.');
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
    const atual = await this.findById(id);
    await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);
    const chave = idempotencyKey ? createHash('sha256').update(`CONFERIR_ENTREGA:${id}:${userId}:${idempotencyKey}`).digest('hex') : undefined;
    if (chave) {
      const existente = await this.prisma.idempotenciaOperacao.findUnique({
        where: { chave },
      });

      if (existente) {
        return JSON.parse(existente.resposta!);
      }
    }

    const resultado = await this.transicionar(id, 'CONFERIDA', undefined, userId, userRole);

    if (chave) {
      await this.prisma.idempotenciaOperacao.create({
        data: {
          chave,
          operacao: 'CONFERIR_ENTREGA',
          recursoId: id,
          resposta: JSON.stringify(resultado),
        },
      });
    }

    return resultado;
  }

  async aceitar(id: string, idempotencyKey: string | undefined, userId: string, userRole: string) {
    const atual = await this.findById(id);
    await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);
    const chave = idempotencyKey ? createHash('sha256').update(`ACEITAR_ENTREGA:${id}:${userId}:${idempotencyKey}`).digest('hex') : undefined;
    if (chave) {
      const existente = await this.prisma.idempotenciaOperacao.findUnique({
        where: { chave },
      });

      if (existente) {
        return JSON.parse(existente.resposta!);
      }
    }

    const resultado = await this.transicionar(id, 'ACEITA', undefined, userId, userRole);

    if (chave) {
      await this.prisma.idempotenciaOperacao.create({
        data: {
          chave,
          operacao: 'ACEITAR_ENTREGA',
          recursoId: id,
          resposta: JSON.stringify(resultado),
        },
      });
    }

    return resultado;
  }

  async estornar(id: string, motivo: string, user: AuthenticatedUser) {
    if (!motivo?.trim()) throw new BadRequestException('Informe o motivo do estorno.');
    const atual = await this.findById(id, user);
    await this.acesso.exigir(user, atual, 'PROGRAMAR');
    if (atual.status !== 'ACEITA') throw new BadRequestException('Somente recebimento confirmado pode ser estornado.');
    await this.prisma.$transaction(async tx => {
      const ids = [...new Set(atual.itens.map(i => i.programacaoItem.contratoItemId))].sort();
      await tx.$queryRaw`SELECT id FROM pnae_contrato_itens WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
      const alterado = await tx.entrega.updateMany({ where: { id, status: 'ACEITA' }, data: { status: 'CANCELADA', updatedBy: user.sub } });
      if (alterado.count !== 1) throw new ConflictException('Recebimento alterado por outra operação.');
      await tx.entregaEstorno.create({ data: {
        entregaId: id, motivo: motivo.trim(), efetuadoPor: user.sub,
        itensJson: JSON.stringify(atual.itens.map(item => ({ id: item.id, programacaoItemId: item.programacaoItemId, aceita: item.quantidadeAceita.toString(), rejeitada: item.quantidadeRejeitada.toString() }))),
      } });
      for (const item of atual.itens) {
        await tx.contratoItem.update({ where: { id: item.programacaoItem.contratoItemId }, data: { quantidadeDisponivel: { increment: item.quantidadeAceita } } });
        const soma = await tx.entregaItem.aggregate({ where: { programacaoItemId: item.programacaoItemId, entrega: { status: 'ACEITA' } }, _sum: { quantidadeAceita: true } });
        const restante = item.programacaoItem.quantidadeProgramada.sub(soma._sum.quantidadeAceita || new Prisma.Decimal(0));
        await tx.programacaoEntregaItem.update({ where: { id: item.programacaoItemId }, data: { quantidadeReservada: atual.programacao.status === 'CANCELADA' ? new Prisma.Decimal(0) : restante, updatedBy: user.sub } });
      }
      const pendente = await tx.entregaItem.aggregate({ where: { entrega: { programacaoId: atual.programacaoId, status: 'ACEITA' } }, _sum: { quantidadeAceita: true } });
      if (atual.programacao.status !== 'CANCELADA') await tx.programacaoEntrega.update({ where: { id: atual.programacaoId }, data: { status: (pendente._sum.quantidadeAceita || new Prisma.Decimal(0)).gt(0) ? 'PARCIALMENTE_RECEBIDA' : 'EM_ENTREGA', updatedBy: user.sub } });
    });
    await this.audit.log({ userId: user.sub, action: 'RECEBIMENTO_ESTORNADO', entity: 'Entrega', entityId: id, entityLabel: atual.numero, oldValues: JSON.stringify({ status: 'ACEITA' }), newValues: JSON.stringify({ status: 'CANCELADA', motivo }) });
    return this.findById(id, user);
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

  private async validarAcessoInstitucional(userId: string, userRole: string, dreId: string | null, escolaId: string | null, fornecedorId: string | null): Promise<void> {
    await this.acesso.exigir({ sub: userId, role: userRole as AuthenticatedUser['role'] }, { dreId: dreId || '', unidadeEscolarId: escolaId || '', fornecedorId: fornecedorId || '' }, 'RECEBER');
  }
}

