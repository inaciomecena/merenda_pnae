import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../common/auth/user-scope';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async findAll(query: { page?: number; limit?: number }) {
    const page = Number(query.page ?? 1); const limit = Number(query.limit ?? 20);
    const where = { deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true, role: true, active: true, escolaId: true, municipioId: true } }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(body: any) {
    this.validateScope(body);
    const passwordHash = await bcrypt.hash(body.password || 'Admin@123', 10);
    return this.prisma.user.create({ data: { name: body.name, email: body.email, role: body.role, passwordHash, escolaId: body.role === 'ESCOLA' ? body.escolaId : null, municipioId: body.role === 'EXTENSIONISTA' ? body.municipioId : null, createdBy: 'admin', updatedBy: 'admin' }, select: { id: true, name: true, email: true, role: true, active: true, escolaId: true, municipioId: true } });
  }

  async update(id: string, body: any, actor?: AuthenticatedUser) {
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Usuário não encontrado');
    this.validateScope(body);
    const data: any = { name: body.name, email: body.email, role: body.role, active: body.active, escolaId: body.role === 'ESCOLA' ? body.escolaId : null, municipioId: body.role === 'EXTENSIONISTA' ? body.municipioId : null, updatedBy: 'admin' };
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
    const updated = await this.prisma.$transaction(async tx => {
      const result = await tx.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, active: true, escolaId: true, municipioId: true } });
      if (existing.role !== result.role || !result.active) {
        await tx.vinculoUsuario.updateMany({ where: { userId: id, ativo: true }, data: { ativo: false, vigenciaFim: new Date(), updatedBy: actor?.sub } });
        await tx.representacaoFornecedor.updateMany({ where: { userId: id, ativo: true }, data: { ativo: false, revogadoEm: new Date(), revogadoPor: actor?.sub, motivoRevogacao: 'Perfil alterado ou usuário desativado', updatedBy: actor?.sub } });
      }
      return result;
    });
    if (existing.role !== updated.role || existing.active !== updated.active) await this.audit.log({ userId: actor?.sub, userRole: actor?.role, action: 'UPDATE', entity: 'User', entityId: id,
      oldValues: { role: existing.role, active: existing.active }, newValues: { role: updated.role, active: updated.active } });
    return updated;
  }

  async remove(id: string, actor?: AuthenticatedUser) { await this.update(id, { active: false }, actor); return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: actor?.sub || 'admin' } }); }

  private validateScope(body: any) {
    if (body.role === 'ESCOLA' && !body.escolaId) throw new BadRequestException('Usuário ESCOLA deve possuir uma escola vinculada');
    if (body.role === 'EXTENSIONISTA' && !body.municipioId) throw new BadRequestException('Usuário EXTENSIONISTA deve possuir um município vinculado');
  }
}
