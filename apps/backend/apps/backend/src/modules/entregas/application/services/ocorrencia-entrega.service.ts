import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { podeTransicionarOcorrencia, StatusOcorrencia } from '../domain/entrega-estado';
import { OcorrenciaEntregaDto, TratarOcorrenciaDto } from '../../presentation/dto/entrega.dto';

@Injectable()
export class OcorrenciaEntregaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(entregaId: string, dto: OcorrenciaEntregaDto, userId: string, userRole: string) {
    // Buscar entrega
    const entrega = await this.prisma.entrega.findUnique({
      where: { id: entregaId },
      include: {
        unidadeEscolar: true,
        fornecedor: true,
        dre: true,
      },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega não encontrada.');
    }

    await this.validarAcessoInstitucional(
      userId,
      userRole,
      entrega.dreId,
      entrega.unidadeEscolarId,
      entrega.fornecedorId,
    );

    // Validar item se fornecido
    if (dto.entregaItemId) {
      const item = await this.prisma.entregaItem.findFirst({
        where: { id: dto.entregaItemId, entregaId },
      });

      if (!item) {
        throw new BadRequestException('Item de entrega não encontrado.');
      }
    }

    const ocorrencia = await this.prisma.ocorrenciaEntrega.create({
      data: {
        entregaId,
        entregaItemId: dto.entregaItemId,
        tipo: dto.tipo,
        descricao: dto.descricao,
        responsavelId: userId,
        evidencias: dto.evidencias,
        status: 'ABERTA',
        createdBy: userId,
      },
    });

    // Atualizar status da entrega se necessário
    if (entrega.status === 'ACEITA') {
      await this.prisma.entrega.update({
        where: { id: entregaId },
        data: { status: 'COM_DIVERGENCIA' },
      });
    }

    await this.audit.log({
      userId,
      action: 'OCORRENCIA_ENTREGA_CRIADA',
      entity: 'OcorrenciaEntrega',
      entityId: ocorrencia.id,
      entityLabel: dto.tipo,
      newValues: JSON.stringify({ entregaId, tipo: dto.tipo }),
    });

    return this.findById(ocorrencia.id);
  }

  async findById(id: string) {
    const ocorrencia = await this.prisma.ocorrenciaEntrega.findUnique({
      where: { id },
      include: {
        entrega: {
          include: {
            unidadeEscolar: { select: { nome: true } },
            fornecedor: { select: { nome: true } },
          },
        },
        entregaItem: {
          include: {
            programacaoItem: {
              include: {
                contratoItem: { select: { produto: true } },
              },
            },
          },
        },
      },
    });

    if (!ocorrencia) {
      throw new NotFoundException('Ocorrência não encontrada.');
    }

    return ocorrencia;
  }

  async findAll(filters: {
    entregaId?: string;
    tipo?: string;
    status?: string;
  }) {
    const where: Prisma.OcorrenciaEntregaWhereInput = {};

    if (filters.entregaId) where.entregaId = filters.entregaId;
    if (filters.tipo) where.tipo = filters.tipo as any;
    if (filters.status) where.status = filters.status as any;

    return this.prisma.ocorrenciaEntrega.findMany({
      where,
      include: {
        entrega: {
          select: {
            numero: true,
            dataEntrega: true,
            unidadeEscolar: { select: { nome: true } },
            fornecedor: { select: { nome: true } },
          },
        },
        entregaItem: {
          include: {
            programacaoItem: {
              include: {
                contratoItem: { select: { produto: true } },
              },
            },
          },
        },
      },
      orderBy: { dataOcorrencia: 'desc' },
    });
  }

  async tratar(id: string, dto: TratarOcorrenciaDto, userId: string, userRole: string) {
    const ocorrencia = await this.findById(id);

    if (!podeTransicionarOcorrencia(ocorrencia.status as any, dto.status as any)) {
      throw new BadRequestException(`Transição inválida de ${ocorrencia.status} para ${dto.status}.`);
    }

    await this.validarAcessoInstitucional(
      userId,
      userRole,
      ocorrencia.entrega.dreId,
      ocorrencia.entrega.unidadeEscolarId,
      ocorrencia.entrega.fornecedorId,
    );

    await this.prisma.ocorrenciaEntrega.update({
      where: { id },
      data: {
        status: dto.status,
        tratativa: dto.tratativa,
        dataResolucao: new Date(),
        resolvidaPor: userId,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'OCORRENCIA_ENTREGA_TRATADA',
      entity: 'OcorrenciaEntrega',
      entityId: id,
      entityLabel: ocorrencia.tipo,
      oldValues: JSON.stringify({ status: ocorrencia.status }),
      newValues: JSON.stringify({ status: dto.status, tratativa: dto.tratativa }),
    });

    return this.findById(id);
  }

  async transicionar(id: string, para: StatusOcorrencia, tratativa: string | undefined, userId: string, userRole: string) {
    const ocorrencia = await this.findById(id);

    if (!podeTransicionarOcorrencia(ocorrencia.status as any, para)) {
      throw new BadRequestException(`Transição inválida de ${ocorrencia.status} para ${para}.`);
    }

    await this.validarAcessoInstitucional(
      userId,
      userRole,
      ocorrencia.entrega.dreId,
      ocorrencia.entrega.unidadeEscolarId,
      ocorrencia.entrega.fornecedorId,
    );

    const dataParaAtualizar: Prisma.OcorrenciaEntregaUpdateInput = {
      status: para,
      updatedBy: userId,
    };

    if (['RESOLVIDA', 'NAO_APLICAVEL'].includes(para)) {
      dataParaAtualizar.dataResolucao = new Date();
      dataParaAtualizar.resolvidaPor = userId;
    }

    if (tratativa) {
      dataParaAtualizar.tratativa = tratativa;
    }

    await this.prisma.ocorrenciaEntrega.update({
      where: { id },
      data: dataParaAtualizar,
    });

    await this.audit.log({
      userId,
      action: 'OCORRENCIA_ENTREGA_TRANSICIONADA',
      entity: 'OcorrenciaEntrega',
      entityId: id,
      entityLabel: ocorrencia.tipo,
      oldValues: JSON.stringify({ status: ocorrencia.status }),
      newValues: JSON.stringify({ status: para, tratativa }),
    });

    return this.findById(id);
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
