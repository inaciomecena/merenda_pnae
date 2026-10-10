import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { PolicyService } from '../../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

interface CreateDREDto {
  nome: string;
  codigo?: string;
  entidadeExecutoraId: string;
  municipioSede?: string;
}

interface UpdateDREDto {
  nome?: string;
  codigo?: string;
  municipioSede?: string;
  ativo?: boolean;
}

@Injectable()
export class DREService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly policyService: PolicyService,
  ) {}

  async listarEntidades() {
    return this.prisma.entidadeExecutora.findMany({ where: { deletedAt: null }, orderBy: { nome: 'asc' } });
  }

  async criarEntidade(data: { nome: string; uf: string; tipo?: string; municipioId?: string; cnpj?: string }, user: AuthenticatedUser) {
    const entidade = await this.prisma.entidadeExecutora.create({ data: { ...data, createdBy: user.sub } });
    await this.auditService.log({ userId: user.sub, userName: user.email, userRole: user.role,
      action: 'CREATE', entity: 'EntidadeExecutora', entityId: entidade.id, entityLabel: entidade.nome });
    return entidade;
  }

  async atualizarEntidade(id: string, data: { nome?: string; uf?: string; tipo?: string; municipioId?: string; cnpj?: string; ativo?: boolean }, user: AuthenticatedUser) {
    const old = await this.prisma.entidadeExecutora.findFirst({ where: { id, deletedAt: null } });
    if (!old) throw new NotFoundException('Entidade executora não encontrada');
    const entidade = await this.prisma.entidadeExecutora.update({ where: { id }, data: { ...data, updatedBy: user.sub } });
    await this.auditService.log({ userId: user.sub, userName: user.email, userRole: user.role,
      action: 'UPDATE', entity: 'EntidadeExecutora', entityId: id, entityLabel: entidade.nome,
      oldValues: JSON.stringify({ nome: old.nome, ativo: old.ativo }), newValues: JSON.stringify({ nome: entidade.nome, ativo: entidade.ativo }) });
    return entidade;
  }

  async create(data: CreateDREDto, user: AuthenticatedUser) {
    const entidade = await this.prisma.entidadeExecutora.findFirst({ where: { id: data.entidadeExecutoraId, ativo: true, deletedAt: null } });
    if (!entidade) throw new NotFoundException('Entidade executora ativa não encontrada');
    const dre = await this.prisma.dRE.create({
      data: {
        nome: data.nome,
        codigo: data.codigo,
        entidadeExecutoraId: data.entidadeExecutoraId,
        municipioSede: data.municipioSede,
        createdBy: user.sub,
      },
      include: {
        entidadeExecutora: { select: { id: true, nome: true } },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userName: user.email,
      userRole: user.role,
      action: 'CREATE',
      entity: 'DRE',
      entityId: dre.id,
      entityLabel: dre.nome,
      newValues: JSON.stringify(data),
      metadata: JSON.stringify({ dreId: dre.id }),
    });

    return dre;
  }

  async findAll(user: AuthenticatedUser) {
    const authorizedIds = await this.policyService.getAuthorizedDREIds(user);

    if (user.role === 'ADMIN') {
      // Admin vê todas
      return this.prisma.dRE.findMany({
        where: { deletedAt: null },
        include: {
          entidadeExecutora: { select: { id: true, nome: true } },
        },
        orderBy: { nome: 'asc' },
      });
    }

    // DRE vê apenas as autorizadas
    return this.prisma.dRE.findMany({
      where: { id: { in: authorizedIds }, deletedAt: null },
      include: {
        entidadeExecutora: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    await this.policyService.requireDREAccess(user, id);

    const dre = await this.prisma.dRE.findFirst({
      where: { id, deletedAt: null },
      include: {
        entidadeExecutora: { select: { id: true, nome: true, cnpj: true } },
        vinculosEscolas: {
          where: {
            ativo: true,
            vigenciaInicio: { lte: new Date() },
            OR: [
              { vigenciaFim: null },
              { vigenciaFim: { gte: new Date() } },
            ],
          },
          include: {
            escola: { select: { id: true, nome: true, codigo: true } },
          },
        },
      },
    });

    if (!dre) throw new NotFoundException('DRE não encontrada');

    return dre;
  }

  async update(id: string, data: UpdateDREDto, user: AuthenticatedUser) {
    await this.policyService.requireDREAccess(user, id);

    const dre = await this.prisma.dRE.update({
      where: { id },
      data: {
        ...data,
        updatedBy: user.sub,
      },
      include: {
        entidadeExecutora: { select: { id: true, nome: true } },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userName: user.email,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'DRE',
      entityId: dre.id,
      entityLabel: dre.nome,
      newValues: JSON.stringify(data),
    });

    return dre;
  }

  async delete(id: string, user: AuthenticatedUser) {
    await this.policyService.requireDREAccess(user, id);

    const dre = await this.prisma.dRE.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        ativo: false,
        updatedBy: user.sub,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userName: user.email,
      userRole: user.role,
      action: 'DELETE',
      entity: 'DRE',
      entityId: dre.id,
      entityLabel: dre.nome,
    });

    return { message: 'DRE excluída com sucesso' };
  }

  async vincularEscola(
    escolaId: string,
    dreId: string,
    vigenciaInicio: Date,
    vigenciaFim: Date | null,
    user: AuthenticatedUser,
  ) {
    await this.policyService.requireDREAccess(user, dreId);
    await this.policyService.requireEscolaAccess(user, escolaId);
    const inicio = new Date(vigenciaInicio);
    const fim = vigenciaFim ? new Date(vigenciaFim) : null;
    if (Number.isNaN(inicio.getTime()) || (fim && (Number.isNaN(fim.getTime()) || fim < inicio))) throw new BadRequestException('Vigência inválida');
    const conflito = await this.prisma.vinculoEscolaDRE.findFirst({ where: {
      escolaId, ativo: true,
      OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: inicio } }],
      ...(fim ? { vigenciaInicio: { lte: fim } } : {}),
    } });
    if (conflito) throw new ConflictException('Escola já possui vínculo DRE sobreposto');

    const vinculo = await this.prisma.vinculoEscolaDRE.create({
      data: {
        escolaId,
        dreId,
        vigenciaInicio: inicio,
        vigenciaFim: fim,
        createdBy: user.sub,
      },
      include: {
        escola: { select: { id: true, nome: true } },
        dre: { select: { id: true, nome: true } },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userName: user.email,
      userRole: user.role,
      action: 'CREATE',
      entity: 'VinculoEscolaDRE',
      entityId: vinculo.id,
      entityLabel: `${vinculo.escola.nome} → ${vinculo.dre.nome}`,
      newValues: JSON.stringify({ escolaId, dreId, vigenciaInicio, vigenciaFim }),
    });

    return vinculo;
  }

  async desvincularEscola(vinculoId: string, user: AuthenticatedUser) {
    const vinculo = await this.prisma.vinculoEscolaDRE.findUnique({
      where: { id: vinculoId },
      include: {
        escola: { select: { nome: true } },
        dre: { select: { nome: true } },
      },
    });

    if (!vinculo) throw new NotFoundException('Vínculo não encontrado');

    await this.policyService.requireDREAccess(user, vinculo.dreId);

    await this.prisma.vinculoEscolaDRE.update({
      where: { id: vinculoId },
      data: {
        ativo: false,
        vigenciaFim: new Date(),
        updatedBy: user.sub,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userName: user.email,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'VinculoEscolaDRE',
      entityId: vinculoId,
      entityLabel: `${vinculo.escola.nome} → ${vinculo.dre.nome}`,
      newValues: JSON.stringify({ ativo: false }),
    });

    return { message: 'Vínculo desativado com sucesso' };
  }
}
