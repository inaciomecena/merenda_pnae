import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProdutorPainelService } from './produtor-painel.service';

const extensionista = { sub: 'ext-1', role: 'EXTENSIONISTA', email: 'ext@example.test' } as any;
const produtor = { sub: 'user-1', role: 'PRODUTOR', email: 'user@example.test' } as any;

describe('ProdutorPainelService: isolamento e autorização', () => {
  const prisma: any = {
    vinculoAssistenciaTecnica: { findFirst: jest.fn(), create: jest.fn() },
    user: { findFirst: jest.fn() },
    safraProducao: { findFirst: jest.fn() },
    disponibilidadeProducao: { create: jest.fn() },
  };
  const policy: any = { requireProdutorAccess: jest.fn(), requireProdutorAction: jest.fn(), getAuthorizedProdutorIds: jest.fn() };
  const audit: any = { log: jest.fn() };
  const service = new ProdutorPainelService(prisma, policy, audit);

  beforeEach(() => { jest.clearAllMocks(); policy.getAuthorizedProdutorIds.mockResolvedValue(['producer-1']); });

  it('bloqueia extensionista que tenta criar o próprio vínculo', async () => {
    await expect(service.criarAssistencia({ produtorId: 'producer-1', extensionistaId: 'ext-1', vigenciaInicio: '2026-10-12' }, extensionista)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.vinculoAssistenciaTecnica.create).not.toHaveBeenCalled();
  });

  it('aceita assistência ativa somente para o produtor vinculado', async () => {
    prisma.vinculoAssistenciaTecnica.findFirst.mockResolvedValueOnce({ id: 'link-1' }).mockResolvedValueOnce(null);
    expect(await (service as any).hasAssistance(extensionista, 'producer-1')).toBe(true);
    expect(await (service as any).hasAssistance(extensionista, 'producer-2')).toBe(false);
    expect(prisma.vinculoAssistenciaTecnica.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ extensionistaId: 'ext-1', produtorId: 'producer-2', status: 'ATIVA' }) }));
  });

  it('não permite registrar reserva sem operação real', async () => {
    policy.requireProdutorAction.mockResolvedValue(undefined);
    prisma.safraProducao.findFirst.mockResolvedValue({ id: 'safra-1', produtorId: 'producer-1', produtoProdutorId: 'produto-1', unidade: 'KG', quantidadePrevista: 10 });
    await expect(service.criarDisponibilidade({ safraProducaoId: 'safra-1', produtoProdutorId: 'produto-1', quantidade: 2, unidade: 'KG', status: 'COMPROMETIDA', origem: 'manual' }, produtor, 'producer-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.disponibilidadeProducao.create).not.toHaveBeenCalled();
  });
});
