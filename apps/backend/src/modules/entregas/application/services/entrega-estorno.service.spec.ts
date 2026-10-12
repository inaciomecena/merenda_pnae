import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EntregaService } from './entrega.service';

const d = (v: string) => new Prisma.Decimal(v);
const user = { sub: 'gestor', role: 'DRE' as const };
const entrega = {
  id: 'e1', numero: 'ENT-1', status: 'ACEITA', programacaoId: 'p1',
  dreId: 'd1', unidadeEscolarId: 's1', fornecedorId: 'f1',
  programacao: { status: 'RECEBIDA', contratoId: 'c1' },
  itens: [{ id: 'i1', programacaoItemId: 'pi1', quantidadeAceita: d('100'), quantidadeRejeitada: d('20'),
    programacaoItem: { contratoItemId: 'ci1', quantidadeProgramada: d('200') } }],
};

describe('SDD-004: estorno auditável', () => {
  function cenario(count: number) {
    const tx = {
      $queryRaw: jest.fn(),
      entrega: { updateMany: jest.fn().mockResolvedValue({ count }) },
      entregaEstorno: { create: jest.fn() },
      contratoItem: { update: jest.fn() },
      entregaItem: { aggregate: jest.fn().mockResolvedValue({ _sum: { quantidadeAceita: d('0') } }) },
      programacaoEntregaItem: { update: jest.fn() },
      programacaoEntrega: { update: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)) };
    const audit = { log: jest.fn() };
    const acesso = { exigir: jest.fn() };
    const service = new EntregaService(prisma as any, audit as any, acesso as any);
    jest.spyOn(service, 'findById').mockResolvedValue(entrega as any);
    return { service, tx, audit };
  }

  it('guarda motivo e quantidade histórica e repõe reserva após estorno', async () => {
    const { service, tx, audit } = cenario(1);
    await service.estornar('e1', 'Produto divergente', user);
    expect(tx.entregaEstorno.create).toHaveBeenCalledWith({ data: expect.objectContaining({ entregaId: 'e1', motivo: 'Produto divergente', efetuadoPor: 'gestor' }) });
    expect(tx.contratoItem.update).toHaveBeenCalledWith({ where: { id: 'ci1' }, data: { quantidadeDisponivel: { increment: d('100') } } });
    expect(tx.programacaoEntregaItem.update).toHaveBeenCalledWith({ where: { id: 'pi1' }, data: expect.objectContaining({ quantidadeReservada: d('200') }) });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'RECEBIMENTO_ESTORNADO' }));
  });

  it('impede estorno concorrente de uma entrega já alterada', async () => {
    const { service, tx } = cenario(0);
    await expect(service.estornar('e1', 'Correção', user)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.contratoItem.update).not.toHaveBeenCalled();
    expect(tx.entregaEstorno.create).not.toHaveBeenCalled();
  });
});
