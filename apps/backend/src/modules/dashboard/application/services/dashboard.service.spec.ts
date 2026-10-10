import { DashboardService } from './dashboard.service';

describe('SDD-002 dashboard e exportação', () => {
  it('não usa filtro do cliente para ampliar DRE e aplica o mesmo escopo à exportação', async () => {
    const prisma: any = {
      edital: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      escola: { count: jest.fn().mockResolvedValue(0) },
      produtor: { count: jest.fn().mockResolvedValue(0) },
      proposta: { count: jest.fn().mockResolvedValue(0), aggregate: jest.fn().mockResolvedValue({ _sum: { valorTotal: null } }) },
      editalItem: { count: jest.fn().mockResolvedValue(0), groupBy: jest.fn().mockResolvedValue([]) },
      match: { count: jest.fn().mockResolvedValue(0) },
    };
    const policy: any = {
      getAuthorizedEscolaIds: jest.fn().mockResolvedValue(['escola-a']),
      getAuthorizedProdutorIds: jest.fn().mockResolvedValue([]),
    };
    const service = new DashboardService(prisma, policy);
    const filters = { user: { sub: 'u-a', role: 'DRE' as const }, municipioId: 'municipio-b' };
    await service.getKPIs(filters);
    expect(prisma.edital.count.mock.calls[0][0].where).toMatchObject({
      municipioId: 'municipio-b', OR: [
        { escolaId: { in: ['escola-a'] } },
        { escolasVinculadas: { some: { escolaId: { in: ['escola-a'] } } } },
      ],
    });
    await service.getExportData('graficos', filters);
    expect(prisma.edital.findMany.mock.calls[0][0].where.OR[0].escolaId.in).toEqual(['escola-a']);
  });
});
