import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

interface CreateVinculoDto {
  userId: string;
  funcao: 'ADMIN' | 'DRE' | 'ESCOLA' | 'EXTENSIONISTA' | 'PRODUTOR' | 'REPRESENTANTE';
  dreId?: string;
  escolaId?: string;
  municipioId?: string;
  produtorId?: string;
  vigenciaInicio: Date;
  vigenciaFim?: Date;
}

interface CreateRepresentacaoDto {
  userId: string;
  produtorId: string;
  tipoRepresentacao?: string;
  permissoes?: string;
  autorizacaoDocumento?: string;
  vigenciaInicio: Date;
  vigenciaFim?: Date;
}

@Injectable()
export class VinculosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createVinculo(data: CreateVinculoDto, actor: AuthenticatedUser) {
    const target = await this.prisma.user.findFirst({ where: { id: data.userId, active: true, deletedAt: null } });
    if (!target) throw new NotFoundException('Usuário ativo não encontrado');
    if (target.role !== data.funcao) throw new BadRequestException('Função deve corresponder ao perfil principal do usuário');
    // Validar que o escopo corresponde à função
    if (data.funcao === 'DRE' && !data.dreId) {
      throw new BadRequestException('Função DRE requer dreId');
    }
    if (data.funcao === 'ESCOLA' && !data.escolaId) {
      throw new BadRequestException('Função ESCOLA requer escolaId');
    }
    if (data.funcao === 'PRODUTOR' && !data.produtorId) throw new BadRequestException('Função PRODUTOR requer produtorId');
    if (data.funcao === 'ADMIN' && (data.dreId || data.escolaId || data.produtorId || data.municipioId)) throw new BadRequestException('ADMIN deve ter escopo global explícito');
    if (new Date(data.vigenciaInicio).getTime() > new Date(data.vigenciaFim ?? '9999-12-31').getTime()) throw new BadRequestException('Fim da vigência anterior ao início');
    const duplicate = await this.prisma.vinculoUsuario.findFirst({ where: {
      userId: data.userId, funcao: data.funcao, dreId: data.dreId ?? null,
      escolaId: data.escolaId ?? null, produtorId: data.produtorId ?? null,
      municipioId: data.municipioId ?? null, ativo: true,
      OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: data.vigenciaInicio } }],
    } });
    if (duplicate) throw new BadRequestException('Vínculo ativo sobreposto');

    const vinculo = await this.prisma.vinculoUsuario.create({
      data: {
        userId: data.userId,
        funcao: data.funcao,
        dreId: data.dreId,
        escolaId: data.escolaId,
        municipioId: data.municipioId,
        produtorId: data.produtorId,
        vigenciaInicio: data.vigenciaInicio,
        vigenciaFim: data.vigenciaFim,
        createdBy: actor.sub,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        dre: { select: { id: true, nome: true } },
        escola: { select: { id: true, nome: true } },
        municipio: { select: { id: true, nome: true } },
      },
    });

    await this.auditService.log({
      userId: actor.sub,
      userName: actor.email,
      userRole: actor.role,
      action: 'CREATE',
      entity: 'VinculoUsuario',
      entityId: vinculo.id,
      entityLabel: `${vinculo.user.name} - ${vinculo.funcao}`,
      newValues: JSON.stringify({ funcao: data.funcao, dreId: data.dreId, escolaId: data.escolaId, produtorId: data.produtorId, vigenciaInicio: data.vigenciaInicio, vigenciaFim: data.vigenciaFim }),
    });

    return vinculo;
  }

  async getVinculosUsuario(userId: string) {
    return this.prisma.vinculoUsuario.findMany({
      where: { userId },
      include: {
        dre: { select: { id: true, nome: true, codigo: true } },
        escola: { select: { id: true, nome: true, codigo: true } },
        municipio: { select: { id: true, nome: true } },
      },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  async revokeVinculo(vinculoId: string, actor: AuthenticatedUser) {
    const vinculo = await this.prisma.vinculoUsuario.findUnique({
      where: { id: vinculoId },
      include: { user: { select: { name: true } } },
    });

    if (!vinculo) throw new NotFoundException('Vínculo não encontrado');

    await this.prisma.vinculoUsuario.update({
      where: { id: vinculoId },
      data: {
        ativo: false,
        vigenciaFim: new Date(),
        updatedBy: actor.sub,
      },
    });

    await this.auditService.log({
      userId: actor.sub,
      userName: actor.email,
      userRole: actor.role,
      action: 'UPDATE',
      entity: 'VinculoUsuario',
      entityId: vinculoId,
      entityLabel: `${vinculo.user.name} - ${vinculo.funcao}`,
      newValues: JSON.stringify({ ativo: false }),
    });

    return { message: 'Vínculo revogado com sucesso' };
  }

  async createRepresentacao(data: CreateRepresentacaoDto, actor: AuthenticatedUser) {
    const target = await this.prisma.user.findFirst({ where: { id: data.userId, role: { in: ['EXTENSIONISTA', 'REPRESENTANTE'] }, active: true, deletedAt: null } });
    if (!target) throw new BadRequestException('Representante deve ser usuário extensionista ou representante ativo');
    const produtor = await this.prisma.produtor.findFirst({ where: { id: data.produtorId, active: true, deletedAt: null } });
    if (!produtor) throw new NotFoundException('Produtor ativo não encontrado');
    const permissoes = data.permissoes ?? 'CONSULTAR';
    const allowed = new Set(['CONSULTAR', 'EDITAR_PRODUTOR', 'EDITAR_PROPOSTA']);
    if (!permissoes.split(',').every(p => allowed.has(p.trim()))) throw new BadRequestException('Permissões de representação inválidas');
    if (!data.autorizacaoDocumento) throw new BadRequestException('Documento de autorização obrigatório');
    if (new Date(data.vigenciaInicio).getTime() > new Date(data.vigenciaFim ?? '9999-12-31').getTime()) throw new BadRequestException('Fim da vigência anterior ao início');
    const representacao = await this.prisma.representacaoFornecedor.create({
      data: {
        userId: data.userId,
        produtorId: data.produtorId,
        tipoRepresentacao: data.tipoRepresentacao || 'REPRESENTANTE',
        permissoes,
        autorizacaoDocumento: data.autorizacaoDocumento,
        vigenciaInicio: data.vigenciaInicio,
        vigenciaFim: data.vigenciaFim,
        createdBy: actor.sub,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        produtor: { select: { id: true, nome: true, cpfCnpj: true } },
      },
    });

    await this.auditService.log({
      userId: actor.sub,
      userName: actor.email,
      userRole: actor.role,
      action: 'CREATE',
      entity: 'RepresentacaoFornecedor',
      entityId: representacao.id,
      entityLabel: `${representacao.user.name} → ${representacao.produtor.nome}`,
      newValues: JSON.stringify({ userId: data.userId, produtorId: data.produtorId, permissoes, vigenciaInicio: data.vigenciaInicio, vigenciaFim: data.vigenciaFim }),
    });

    return representacao;
  }

  async getRepresentacoesUsuario(userId: string) {
    return this.prisma.representacaoFornecedor.findMany({
      where: { userId },
      include: {
        produtor: { select: { id: true, nome: true, cpfCnpj: true } },
      },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  async revokeRepresentacao(
    representacaoId: string,
    motivo: string,
    actor: AuthenticatedUser,
  ) {
    const representacao = await this.prisma.representacaoFornecedor.findUnique({
      where: { id: representacaoId },
      include: {
        user: { select: { name: true } },
        produtor: { select: { nome: true } },
      },
    });

    if (!representacao) throw new NotFoundException('Representação não encontrada');

    await this.prisma.representacaoFornecedor.update({
      where: { id: representacaoId },
      data: {
        ativo: false,
        revogadoEm: new Date(),
        revogadoPor: actor.sub,
        motivoRevogacao: motivo,
        updatedBy: actor.sub,
      },
    });

    await this.auditService.log({
      userId: actor.sub,
      userName: actor.email,
      userRole: actor.role,
      action: 'UPDATE',
      entity: 'RepresentacaoFornecedor',
      entityId: representacaoId,
      entityLabel: `${representacao.user.name} → ${representacao.produtor.nome}`,
      newValues: JSON.stringify({ revogada: true, motivo }),
    });

    return { message: 'Representação revogada com sucesso' };
  }

  async updateRepresentacao(id: string, data: { permissoes?: string; vigenciaFim?: string; autorizacaoDocumento?: string; justificativa: string }, actor: AuthenticatedUser) {
    const existing = await this.prisma.representacaoFornecedor.findFirst({ where: { id, ativo: true, revogadoEm: null } });
    if (!existing) throw new NotFoundException('Representação ativa não encontrada');
    if (data.permissoes) {
      const allowed = new Set(['CONSULTAR', 'EDITAR_PRODUTOR', 'EDITAR_PROPOSTA']);
      if (!data.permissoes.split(',').every(p => allowed.has(p.trim()))) throw new BadRequestException('Permissões inválidas');
    }
    if (data.vigenciaFim && new Date(data.vigenciaFim).getTime() < existing.vigenciaInicio.getTime()) throw new BadRequestException('Fim anterior ao início');
    const updated = await this.prisma.representacaoFornecedor.update({ where: { id }, data: {
      ...(data.permissoes ? { permissoes: data.permissoes } : {}),
      ...(data.vigenciaFim ? { vigenciaFim: new Date(data.vigenciaFim) } : {}),
      ...(data.autorizacaoDocumento ? { autorizacaoDocumento: data.autorizacaoDocumento } : {}),
      updatedBy: actor.sub,
    } });
    await this.auditService.log({ userId: actor.sub, userRole: actor.role, action: 'UPDATE', entity: 'RepresentacaoFornecedor', entityId: id,
      oldValues: { permissoes: existing.permissoes, vigenciaFim: existing.vigenciaFim },
      newValues: { permissoes: updated.permissoes, vigenciaFim: updated.vigenciaFim }, metadata: { justificativa: data.justificativa } });
    return updated;
  }
}
