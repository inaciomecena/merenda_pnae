import { StatusMatch } from '@prisma/client';
import { MatchEngineService } from './match-engine.service';
import { TextNormalizerService } from './text-normalizer.service';

describe('MatchEngineService', () => {
  const normalizer = new TextNormalizerService();
  const engine = new MatchEngineService(normalizer);

  it('normaliza texto removendo acentos, pontuação e plural simples', () => {
    expect(normalizer.normalize('  ABACAXIS PÉROLA!!! ')).toBe('abacaxis perola');
    expect(normalizer.tokenize('BANANAS, PRATAS')).toEqual(['banana', 'prata']);
  });

  it('compara tokens e gera score alto para ABACAXI PEROLA', () => {
    const result = engine.calculate({
      item: { produtoOriginal: 'ABACAXI PÉROLA', unidade: 'KG', quantidade: 475 },
      produtoReferencia: { nome: 'abacaxi', unidadePadrao: 'KG', ativo: true },
      produtorProduto: { produto: 'abacaxi pérola', unidade: 'KG', capacidade: '500', produtorAtivo: true, mesmoMunicipio: true },
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.status).toBe(StatusMatch.MATCH_AUTOMATICO);
  });

  it('usa sinônimos para mandioca, aipim e macaxeira', () => {
    const result = engine.calculate({
      item: { produtoOriginal: 'MANDIOCA DESCASCADA', unidade: 'KG', quantidade: 100 },
      produtoReferencia: { nome: 'aipim', sinonimos: 'macaxeira, mandioca', ativo: true },
      produtorProduto: { produto: 'macaxeira', unidade: 'KG', capacidade: '120', produtorAtivo: true, mesmoMunicipio: true },
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.status).not.toBe(StatusMatch.SEM_MATCH);
  });

  it('gera sugestão para produtor de outro município com capacidade suficiente', () => {
    const result = engine.calculate({
      item: { produtoOriginal: 'BANANA PRATA', unidade: 'KG', quantidade: 80 },
      produtoReferencia: { nome: 'banana', palavrasChave: 'banana prata', ativo: true },
      produtorProduto: { produto: 'banana prata', unidade: 'KG', capacidade: '100', produtorAtivo: true, mesmoMunicipio: false },
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThan(90);
    expect(result.status).toBe(StatusMatch.SUGESTAO);
  });

  it('mantém match parcial quando capacidade é insuficiente', () => {
    const result = engine.calculate({
      item: { produtoOriginal: 'CHEIRO VERDE', unidade: 'UN', quantidade: 200 },
      produtoReferencia: { nome: 'cebolinha', sinonimos: 'salsa, cheiro-verde', ativo: true },
      produtorProduto: { produto: 'salsa', unidade: 'UN', capacidade: '50', produtorAtivo: true, mesmoMunicipio: true },
    });

    expect(result.capacidadeSuficiente).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.motivoScore).toContain('capacidade menor');
  });

  it('gera score baixo ou sem match para produto incompatível', () => {
    const result = engine.calculate({
      item: { produtoOriginal: 'ABACAXI PÉROLA', unidade: 'KG', quantidade: 10 },
      produtoReferencia: { nome: 'feijao', ativo: true },
      produtorProduto: { produto: 'arroz', unidade: 'KG', capacidade: '10', produtorAtivo: true, mesmoMunicipio: false },
    });

    expect(result.score).toBeLessThan(70);
    expect([StatusMatch.PENDENTE, StatusMatch.SEM_MATCH]).toContain(result.status);
  });
});
