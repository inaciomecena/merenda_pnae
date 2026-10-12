import { ForbiddenException } from '@nestjs/common';
import { EntregaAcessoService } from './entrega-acesso.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

const usuario = (role: AuthenticatedUser['role']): AuthenticatedUser => ({ sub: 'u1', role });
const recurso = { dreId: 'dre-1', unidadeEscolarId: 'escola-1', fornecedorId: 'fornecedor-1' };

describe('SDD-004: isolamento institucional', () => {
  const policy = {
    getAuthorizedDREIds: jest.fn(async () => ['dre-1']),
    getAuthorizedEscolaIds: jest.fn(async () => ['escola-1']),
    getAuthorizedProdutorIds: jest.fn(async () => ['fornecedor-1']),
  };
  const acesso = new EntregaAcessoService(policy as any);

  it('filtra consultas da DRE, escola e fornecedor no backend', async () => {
    expect(await acesso.filtro(usuario('DRE'))).toEqual({ dreId: { in: ['dre-1'] } });
    expect(await acesso.filtroEntrega(usuario('ESCOLA'))).toEqual({ unidadeEscolarId: { in: ['escola-1'] } });
    expect(await acesso.filtroContrato(usuario('PRODUTOR'))).toEqual({ produtorId: { in: ['fornecedor-1'] } });
  });

  it('impede acesso por ID a outro fornecedor', async () => {
    await expect(acesso.exigir(usuario('PRODUTOR'), { ...recurso, fornecedorId: 'fornecedor-2' }, 'CONSULTAR')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('impede fornecedor de registrar aceite e escola de programar', async () => {
    await expect(acesso.exigir(usuario('PRODUTOR'), recurso, 'RECEBER')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(acesso.exigir(usuario('ESCOLA'), recurso, 'PROGRAMAR')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(acesso.exigir(usuario('ESCOLA'), recurso, 'RECEBER')).resolves.toBeUndefined();
  });
});
