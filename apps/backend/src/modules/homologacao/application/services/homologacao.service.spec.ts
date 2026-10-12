import { ForbiddenException } from '@nestjs/common';
import { HomologacaoService } from './homologacao.service';

describe('HomologacaoService', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;
  const homologacaoOriginal = process.env.AMBIENTE_HOMOLOGACAO;

  afterEach(() => {
    if (nodeEnvOriginal === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnvOriginal;
    if (homologacaoOriginal === undefined) delete process.env.AMBIENTE_HOMOLOGACAO;
    else process.env.AMBIENTE_HOMOLOGACAO = homologacaoOriginal;
  });

  it('bloqueia o seed de teste em produção antes de acessar o banco', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AMBIENTE_HOMOLOGACAO;
    const service = new HomologacaoService({} as any);

    await expect(service.executarSeedTeste()).rejects.toBeInstanceOf(ForbiddenException);
  });
});
