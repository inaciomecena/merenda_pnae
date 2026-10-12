import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { podeTransicionarProgramacao, statusValidoProgramacao, StatusProgramacao } from '../domain/entrega-estado';
import { reservarQuantidade } from '../domain/entrega-saldos';
import { CreateProgramacaoEntregaDto, UpdateProgramacaoEntregaDto } from '../../presentation/dto/entrega.dto';
import { quantidadeDecimal, textoDecimal } from '../../../contratos/application/domain/contrato-decimal';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { EntregaAcessoService } from './entrega-acesso.service';
import { randomUUID, createHash } from 'crypto';
import { calendarioArmazenado, dataInstitucional, hojeInstitucional } from '../../../contratos/application/domain/contrato-datas';

@Injectable()
export class ProgramacaoEntregaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: EntregaAcessoService,
  ) {}

  async create(dto: CreateProgramacaoEntregaDto, userId: string, userRole: string) {
    // Buscar contrato com validações
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: dto.contratoId },
      include: {
        produtor: true,
        escola: true,
        dre: true,
        itens: { where: { deletedAt: null }, include: { editalItem: true, propostaItem: true } },
        edital: { include: { escolasVinculadas: true } },
      },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado.');
    }

    if (contrato.status !== 'VIGENTE' || contrato.deletedAt || !contrato.vigenciaInicio || !contrato.vigenciaFim || calendarioArmazenado(contrato.vigenciaInicio) > hojeInstitucional() || calendarioArmazenado(contrato.vigenciaFim) < hojeInstitucional()) {
      throw new BadRequestException('Contrato não está vigente.');
    }

    // Verificar autorização institucional
    const escolaId = dto.unidadeEscolarId || contrato.escolaId;
    if (!escolaId || !contrato.dreId) throw new BadRequestException('Contrato sem escola ou DRE definida para entrega.');
    if (contrato.escolaId && contrato.escolaId !== escolaId) throw new BadRequestException('Escola fora do contrato.');
    if (!contrato.escolaId && contrato.edital.escolaId !== escolaId && !contrato.edital.escolasVinculadas.some(v => v.escolaId === escolaId)) throw new BadRequestException('Escola fora do escopo do edital.');
    const escola = await this.prisma.escola.findFirst({ where: { id: escolaId, active: true, deletedAt: null } });
    if (!escola) throw new BadRequestException('Escola inativa ou inexistente.');
    const vinculo = await this.prisma.vinculoEscolaDRE.findFirst({ where: { escolaId, dreId: contrato.dreId, ativo: true, vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }] } });
    if (!vinculo) throw new BadRequestException('Escola sem vínculo vigente com a DRE contratual.');
    const prevista = dataInstitucional(dto.dataPrevista);
    if (calendarioArmazenado(prevista) < calendarioArmazenado(contrato.vigenciaInicio) || calendarioArmazenado(prevista) > calendarioArmazenado(contrato.vigenciaFim)) throw new BadRequestException('Data fora da vigência contratual.');
    if (new Set(dto.itens.map(i => i.contratoItemId)).size !== dto.itens.length) throw new BadRequestException('Item contratual duplicado.');
    await this.validarAcessoInstitucional(userId, userRole, contrato.dreId, escolaId, contrato.produtorId);

    // Gerar número sequencial
    const numero = dto.numero || `PROG-${new Date().getFullYear()}-${randomUUID().slice(0, 8)}`;

    // Validar itens e reservar saldo
    const itensParaCriar: Prisma.ProgramacaoEntregaItemCreateManyProgramacaoInput[] = [];

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

    }

    // Criar programação em transação
    const programacao = await this.prisma.$transaction(async (tx) => {
      const ids = itensParaCriar.map(i => i.contratoItemId).sort();
      await tx.$queryRaw`SELECT id FROM pnae_contrato_itens WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
      for (const item of itensParaCriar) {
        const atual = await tx.contratoItem.findUniqueOrThrow({ where: { id: item.contratoItemId } });
        const reserva = await this.calcularReservaAtual(item.contratoItemId, tx);
        if (new Prisma.Decimal(String(item.quantidadeProgramada)).gt(atual.quantidadeDisponivel.sub(reserva))) throw new ConflictException('Saldo alterado por outra programação.');
      }
      const prog = await tx.programacaoEntrega.create({
        data: {
          numero,
          contratoId: contrato.id,
          fornecedorId: contrato.produtorId,
          unidadeEscolarId: escolaId,
          dreId: contrato.dreId!,
          municipioId: contrato.municipioId,
          dataPrevista: prevista,
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

  async findById(id: string, user?: AuthenticatedUser) {
    const prog = await this.prisma.programacaoEntrega.findUnique({
      where: { id },
      include: {
        contrato: { select: { numero: true, exercicio: true, objeto: true, status: true } },
        fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
        unidadeEscolar: { select: { id: true, nome: true, codigo: true } },
        dre: { select: { id: true, nome: true, codigo: true } },
        municipio: { select: { id: true, nome: true, uf: true } },
        itens: {
          where: { deletedAt: null },
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

    if (user) await this.acesso.exigir(user, prog, 'CONSULTAR');
    return prog;
  }

  async historico(id: string, user: AuthenticatedUser) {
    const programacao = await this.findById(id, user);
    await this.acesso.exigir(user, programacao, 'PROGRAMAR');
    return this.prisma.auditLog.findMany({ where: { entity: 'ProgramacaoEntrega', entityId: id }, select: { id: true, userId: true, action: true, oldValues: true, newValues: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  async calendario(mes: string, user: AuthenticatedUser) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new BadRequestException('Mês inválido. Use AAAA-MM.');
    const inicio = dataInstitucional(`${mes}-01`);
    const fim = new Date(inicio);
    fim.setUTCMonth(fim.getUTCMonth() + 1);
    const where: Prisma.ProgramacaoEntregaWhereInput = { deletedAt: null, AND: [await this.acesso.filtro(user)], dataPrevista: { gte: inicio, lt: fim } };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.programacaoEntrega.findMany({ where, orderBy: { dataPrevista: 'asc' }, take: 1000, select: { id: true, numero: true, dataPrevista: true, status: true, unidadeEscolar: { select: { nome: true } }, fornecedor: { select: { nome: true } } } }),
      this.prisma.programacaoEntrega.count({ where }),
    ]);
    return { items, total, truncado: total > items.length };
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
    produto?: string;
    page?: string;
    limit?: string;
  }, user?: AuthenticatedUser) {
    const where: Prisma.ProgramacaoEntregaWhereInput = user ? { deletedAt: null, AND: [await this.acesso.filtro(user)] } : { deletedAt: null };

    if (filters.contratoId) where.contratoId = filters.contratoId;
    if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;
    if (filters.unidadeEscolarId) where.unidadeEscolarId = filters.unidadeEscolarId;
    if (filters.dreId) where.dreId = filters.dreId;
    if (filters.municipioId) where.municipioId = filters.municipioId;
    if (filters.status) {
      if (!statusValidoProgramacao(filters.status)) throw new BadRequestException('Situação inválida.');
      where.status = filters.status;
    }
    if (filters.produto) where.itens = { some: { produto: { contains: filters.produto } } };

    if (filters.dataInicio || filters.dataFim) {
      where.dataPrevista = {};
      if (filters.dataInicio) where.dataPrevista.gte = new Date(filters.dataInicio);
      if (filters.dataFim) where.dataPrevista.lte = new Date(filters.dataFim);
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const [items, total] = await this.prisma.$transaction([this.prisma.programacaoEntrega.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contrato: { select: { numero: true, exercicio: true } },
        fornecedor: { select: { nome: true } },
        unidadeEscolar: { select: { nome: true } },
        dre: { select: { nome: true } },
        itens: { where: { deletedAt: null }, select: { produto: true, quantidadeProgramada: true, unidadeMedida: true } },
      },
      orderBy: { dataPrevista: 'desc' },
    }), this.prisma.programacaoEntrega.count({ where })]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, dto: UpdateProgramacaoEntregaDto, userId: string, userRole: string) {
    const atual = await this.findById(id);
    const contrato = await this.prisma.contrato.findUniqueOrThrow({ where: { id: atual.contratoId } });
    if (contrato.status !== 'VIGENTE' || contrato.deletedAt || !contrato.vigenciaInicio || !contrato.vigenciaFim) throw new BadRequestException('Contrato não está vigente.');

    const reprogramacao = atual.status !== 'RASCUNHO';
    if (!['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA'].includes(atual.status) || (reprogramacao && (atual.entregas.length > 0 || !dto.motivoReprogramacao?.trim()))) {
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
      ...(reprogramacao ? { status: 'PROGRAMADA', confirmadaEm: null, confirmadaPor: null } : {}),
    };

    if (dto.dataPrevista) {
      const data = dataInstitucional(dto.dataPrevista);
      if (calendarioArmazenado(data) < calendarioArmazenado(contrato.vigenciaInicio) || calendarioArmazenado(data) > calendarioArmazenado(contrato.vigenciaFim)) throw new BadRequestException('Data fora da vigência contratual.');
      dataParaAtualizar.dataPrevista = data;
    }
    if (dto.periodoEntrega !== undefined) dataParaAtualizar.periodoEntrega = dto.periodoEntrega;
    if (dto.observacoes !== undefined) dataParaAtualizar.observacoes = dto.observacoes;

    // Se atualizar itens, liberar reservas antigas e criar novas
    if (dto.itens) {
      if (new Set(dto.itens.map(i => i.contratoItemId)).size !== dto.itens.length) throw new BadRequestException('Item contratual duplicado.');
      // Implementação simplificada: liberar todas, criar novas
      // Em produção, calcular diff para evitar operações desnecessárias
      await this.prisma.$transaction(async (tx) => {
        const ids = [...new Set([...atual.itens.map(i => i.contratoItemId), ...dto.itens!.map(i => i.contratoItemId)])].sort();
        if (ids.length) await tx.$queryRaw`SELECT id FROM pnae_contrato_itens WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
        // Liberar reservas antigas
        const itensAntigos = await tx.programacaoEntregaItem.findMany({
          where: { programacaoId: id, deletedAt: null },
        });

        for (const itemAntigo of itensAntigos) {
          await tx.programacaoEntregaItem.update({
            where: { id: itemAntigo.id },
            data: { quantidadeReservada: 0 },
          });
        }

        // Deletar itens antigos
        await tx.programacaoEntregaItem.updateMany({ where: { programacaoId: id, deletedAt: null }, data: { deletedAt: new Date(), quantidadeReservada: 0, updatedBy: userId } });

        // Criar novos itens com validação de saldo
        for (const itemDto of dto.itens || []) {
          const contratoItem = await tx.contratoItem.findUnique({
            where: { id: itemDto.contratoItemId },
          });

          if (!contratoItem) {
            throw new BadRequestException(`Item de contrato ${itemDto.contratoItemId} não encontrado.`);
          }

          const quantidadeSolicitada = quantidadeDecimal(itemDto.quantidadeProgramada);
          if (contratoItem.contratoId !== atual.contratoId || contratoItem.deletedAt) throw new BadRequestException('Item fora do contrato.');
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

        const alterado = await tx.programacaoEntrega.updateMany({ where: { id, versao: dto.versao, status: atual.status }, data: dataParaAtualizar });
        if (alterado.count !== 1) throw new ConflictException('Programação alterada por outra operação.');
      });
    } else {
      const alterado = await this.prisma.programacaoEntrega.updateMany({ where: { id, versao: dto.versao, status: atual.status }, data: dataParaAtualizar });
      if (alterado.count !== 1) throw new ConflictException('Programação alterada por outra operação.');
    }

    await this.audit.log({
      userId,
      action: reprogramacao ? 'PROGRAMACAO_ENTREGA_REPROGRAMADA' : 'PROGRAMACAO_ENTREGA_ATUALIZADA',
      entity: 'ProgramacaoEntrega',
      entityId: id,
      entityLabel: atual.numero,
      oldValues: JSON.stringify({ versao: atual.versao, status: atual.status, dataPrevista: atual.dataPrevista, periodoEntrega: atual.periodoEntrega, observacoes: atual.observacoes, itens: atual.itens.map(i => ({ contratoItemId: i.contratoItemId, quantidadeProgramada: i.quantidadeProgramada.toString() })) }),
      newValues: JSON.stringify(dto),
    });

    return this.findById(id);
  }

  async transicionar(id: string, para: StatusProgramacao, motivo: string | undefined, userId: string, userRole: string) {
    const atual = await this.findById(id);
    if (!['PROGRAMADA', 'CONFIRMADA', 'CANCELADA'].includes(para)) throw new BadRequestException('Estado operacional é atualizado pelo recebimento.');
    if (para === 'CANCELADA' && !motivo?.trim()) throw new BadRequestException('Informe o motivo do cancelamento.');
    if (para !== 'CANCELADA') {
      const contrato = await this.prisma.contrato.findUniqueOrThrow({ where: { id: atual.contratoId } });
      if (contrato.status !== 'VIGENTE' || contrato.deletedAt || !contrato.vigenciaInicio || !contrato.vigenciaFim || calendarioArmazenado(contrato.vigenciaInicio) > hojeInstitucional() || calendarioArmazenado(contrato.vigenciaFim) < hojeInstitucional()) throw new BadRequestException('Contrato não está vigente.');
    }

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
        const ids = [...new Set(itens.map(i => i.contratoItemId))].sort();
        if (ids.length) await tx.$queryRaw`SELECT id FROM pnae_contrato_itens WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;

        for (const item of itens) {
          await tx.programacaoEntregaItem.update({
            where: { id: item.id },
            data: { quantidadeReservada: 0 },
          });
        }

        const alterado = await tx.programacaoEntrega.updateMany({ where: { id, status: atual.status }, data: dataParaAtualizar });
        if (alterado.count !== 1) throw new ConflictException('Programação alterada por outra operação.');
      });
    } else {
      const alterado = await this.prisma.programacaoEntrega.updateMany({ where: { id, status: atual.status }, data: dataParaAtualizar });
      if (alterado.count !== 1) throw new ConflictException('Programação alterada por outra operação.');
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
    const atual = await this.findById(id);
    await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);
    const chave = idempotencyKey ? createHash('sha256').update(`CONFIRMAR_PROGRAMACAO:${id}:${userId}:${idempotencyKey}`).digest('hex') : undefined;
    // Idempotência
    if (chave) {
      const existente = await this.prisma.idempotenciaOperacao.findUnique({
        where: { chave },
      });

      if (existente) {
        return JSON.parse(existente.resposta!);
      }
    }

    const resultado = await this.transicionar(id, 'CONFIRMADA', undefined, userId, userRole);

    if (chave) {
      await this.prisma.idempotenciaOperacao.create({
        data: {
          chave,
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
        deletedAt: null,
        programacao: {
          status: { in: ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'] },
          deletedAt: null,
        },
      },
      _sum: { quantidadeReservada: true },
    });

    return resultado._sum.quantidadeReservada || new Prisma.Decimal(0);
  }

  private async validarAcessoInstitucional(userId: string, userRole: string, dreId: string | null, escolaId: string | null, fornecedorId: string | null): Promise<void> {
    await this.acesso.exigir({ sub: userId, role: userRole as AuthenticatedUser['role'] }, { dreId: dreId || '', unidadeEscolarId: escolaId || '', fornecedorId: fornecedorId || '' }, 'PROGRAMAR');
  }
}

