import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Credenciais inválidas');

    const payload = { sub: user.id, email: user.email, role: user.role, escolaId: user.escolaId, municipioId: user.municipioId };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret', expiresIn: '7d' }),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, escolaId: user.escolaId, municipioId: user.municipioId },
    };
  }

  async refresh(token: string) {
    const payload = this.jwtService.verify(token, { secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret' });
    const user = await this.prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null, active: true } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado ou inativo');
    return { accessToken: this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, escolaId: user.escolaId, municipioId: user.municipioId }) };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    return { id: user.id, name: user.name, email: user.email, role: user.role, escolaId: user.escolaId, municipioId: user.municipioId };
  }
}
