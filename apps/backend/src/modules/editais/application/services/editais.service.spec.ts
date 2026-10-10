import { EditaisService } from './editais.service';

describe('SDD-002 edital consolidado', () => {
  it('inclui EditalEscola e escolaId legado no filtro, sem ampliar escopo por ID', async () => {
    const prisma: any = {
      $transaction: jest.fn().mockResolvedValue([[], 0]),
      edital: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn().mockResolvedValue(null) },
    };
    const policy: any = { getAuthorizedEscolaIds: jest.fn().mockResolvedValue(['escola-a']) };
    const service = new EditaisService(prisma, policy);
    await service.findAll({}, { sub: 'u-a', role: 'ESCOLA' });
    const where = prisma.edital.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { escolaId: { in: ['escola-a'] } },
      { escolasVinculadas: { some: { escolaId: { in: ['escola-a'] } } } },
    ]);
    await expect(service.findOne('edital-b', { sub: 'u-a', role: 'ESCOLA' })).rejects.toThrow();
    expect(prisma.edital.findFirst.mock.calls[0][0].where).toMatchObject({ id: 'edital-b', OR: where.OR });
  });
});
