import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async update(id: string, body: any) {
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Usuário não encontrado');
    this.validateScope(body);
    const data: any = { name: body.name, email: body.email, role: body.role, active: body.active, escolaId: body.role === 'ESCOLA' ? body.escolaId : null, municipioId: body.role === 'EXTENSIONISTA' ? body.municipioId : null, updatedBy: 'admin' };
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
    return this.prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, active: true, escolaId: true, municipioId: true } });
  }

  async remove(id: string) { await this.update(id, { active: false }); return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'admin' } }); }

  private validateScope(body: any) {
    if (body.role === 'ESCOLA' && !body.escolaId) throw new BadRequestException('Usuário ESCOLA deve possuir uma escola vinculada');
    if (body.role === 'EXTENSIONISTA' && !body.municipioId) throw new BadRequestException('Usuário EXTENSIONISTA deve possuir um município vinculado');
  }
}
