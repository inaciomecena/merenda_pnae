import { DREService } from './dre.service';

describe('SDD-002 DRE por recurso', () => {
  it('recusa alterar DRE B mesmo com ID válido', async () => {
    const prisma: any = { dRE: { update: jest.fn() } };
    const policy: any = { requireDREAccess: jest.fn().mockRejectedValue(new Error('fora do escopo')) };
    const service = new DREService(prisma, { log: jest.fn() } as any, policy);
    await expect(service.update('dre-b', { nome: 'Outro' }, { sub: 'u-a', role: 'DRE' })).rejects.toThrow('fora do escopo');
    expect(prisma.dRE.update).not.toHaveBeenCalled();
  });
});
