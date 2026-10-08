import { ForbiddenException } from '@nestjs/common';

export type AuthenticatedUser = {
  sub: string;
  role: 'ADMIN' | 'ESCOLA' | 'EXTENSIONISTA';
  escolaId?: string | null;
  municipioId?: string | null;
};

export function requireScope(user: AuthenticatedUser, kind: 'escola' | 'municipio'): string | undefined {
  if (user.role === 'ADMIN') return undefined;
  const value = kind === 'escola' ? user.escolaId : user.municipioId;
  if (!value) throw new ForbiddenException(`Usuário ${user.role} sem escopo configurado`);
  return value;
}
