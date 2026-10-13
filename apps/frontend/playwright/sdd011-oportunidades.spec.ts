import { test, expect } from '@playwright/test';

const viewports = [[375, 812], [390, 844], [768, 1024], [1366, 768]] as const;

for (const [width, height] of viewports) {
  test(`oportunidades PNAE ${width}x${height}`, async ({ page }) => {
    page.on('pageerror', error => console.log(`PAGEERROR ${width}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') console.log(`CONSOLE ${width}: ${message.text()}`); });
    await page.setViewportSize({ width, height });
    let interest = false;
    await page.route('**/api/v1/**', async route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
      const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ data }) });
      if (path === '/auth/me') return json({ id: 'u1', name: 'Produtor', email: 'produtor@test.local', role: 'PRODUTOR' });
      if (path === '/auth/me/contexto') return json({ vinculos: [{ id: 'v1', funcao: 'PRODUTOR', produtor: { id: 'p1', nome: 'Produtor Teste' } }], representacoes: [], pendencias: [] });
      if (path === '/produtor/meus-vinculos') return json([{ id: 'p1', nome: 'Produtor Teste' }]);
      if (path.startsWith('/produtor/minhas-oportunidades/') && path.endsWith('/interesse') && request.method() === 'POST') { interest = true; return json({ id: 'interest-1', status: 'ATIVO' }); }
      if (path === '/produtor/minhas-oportunidades') return json({ items: [{ id: 'c1:i1', chamadaId: 'c1', editalItemId: 'i1', edital: { titulo: 'Chamada de hortaliças' }, chamada: { numero: '1/2026', status: 'INSCRICOES_ABERTAS', inscricoesFim: '2099-12-31T00:00:00.000Z', dre: { nome: 'DRE Teste' } }, item: { produtoOriginal: 'Alface', unidade: 'KG' }, produto: { nome: 'Alface', unidade: 'KG' }, classification: 'ALTA_COMPATIBILIDADE', quantidadeSolicitada: 20, quantidadeDisponivel: 15, motivos: ['ProdutoReferencia igual', 'Disponível confirmado: 15'], pendencias: [], interesse: interest ? { id: 'interest-1' } : null }] });
      if (path === '/catalogo-produtos') return json([]);
      if (path === '/municipios') return json({ items: [] });
      if (path.includes('/meu-painel')) return json({ produtor: { nome: 'Produtor Teste' }, indicadores: { unidades: 1, produtos: 1, safras: 1, propostas: 0, contratos: 0, saldoPorUnidade: {} }, disponibilidade: [] });
      if (path.includes('/minhas-unidades') || path.includes('/meus-produtos') || path.includes('/minhas-safras') || path.includes('/minha-sazonalidade') || path.includes('/minha-logistica')) return json([]);
      return json({});
    });
    await page.addInitScript(() => localStorage.setItem('seaf_token', 'playwright-fixture-token'));
    await page.goto('/meu-campo');
    await expect(page.getByRole('heading', { name: 'Meu campo' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: 'Oportunidades PNAE' }).click();
    await expect(page.getByRole('heading', { name: 'Oportunidades PNAE' })).toBeVisible();
    await expect(page.getByText('Chamada de hortaliças')).toBeVisible();
    await expect(page.getByText('ProdutoReferencia igual')).toBeVisible();
    await page.getByLabel('Compatibilidade').click();
    await page.getByRole('option', { name: 'Alta' }).click();
    await expect(page.getByText('Chamada de hortaliças')).toBeVisible();
    await page.getByRole('button', { name: 'Demonstrar interesse' }).click();
    await expect(page.getByText('Manifestação registrada. Ela não cria proposta nem reserva produção.')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `../../output/e2e/sdd011-mobile/oportunidades-${width}x${height}-${test.info().project.name}.png`, fullPage: true });
  });
}
