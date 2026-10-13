/**
 * VERIFICAÇÃO DE INTEGRIDADE — SOMENTE LEITURA.
 *
 * Confere, sem escrever nada:
 *  - índice de unicidade de `pnae_chamadas_publicas` no BANCO ATIVO e no ISOLADO;
 *  - se a migration nova consta como aplicada em cada um (`_prisma_migrations`);
 *  - contagem de ChamadaPublica e das 6 linhas de 2026 em cada um.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/verificar-integridade-bancos.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const ATIVO = 'merenda_pnae';
const HOMOLOG = 'merenda_pnae_homolog_2025';
const MIGRACAO = '20261012180000_chamada_publica_unicidade_por_dre';

function carregarEnvBackend() {
  const fs = require('fs');
  const caminho = path.join(RAIZ, 'apps', 'backend', '.env');
  if (!fs.existsSync(caminho)) return;
  for (const linha of fs.readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}
carregarEnvBackend();

function linhas(r) {
  if (Array.isArray(r)) return r;
  if (r && typeof r === 'object') return [r];
  return [];
}

(async () => {
  const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [RAIZ, path.join(RAIZ, 'apps', 'backend')] }));
  const urlAtiva = process.env.DATABASE_URL;
  if (!urlAtiva) throw new Error('DATABASE_URL nao definida');

  const uIsolada = new URL(urlAtiva);
  uIsolada.pathname = `/${HOMOLOG}`;

  const ativo = new PrismaClient({ datasources: { db: { url: urlAtiva } } });
  const isolado = new PrismaClient({ datasources: { db: { url: uIsolada.toString() } } });

  const investigar = async (p, nome) => {
    const db = linhas(await p.$queryRawUnsafe('SELECT DATABASE() AS db'))[0]?.db;
    const idx = linhas(
      await p.$queryRawUnsafe(
        `SELECT INDEX_NAME AS nome, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = '${nome}' AND TABLE_NAME = 'pnae_chamadas_publicas'
         GROUP BY INDEX_NAME HAVING MAX(NON_UNIQUE) = 0`,
      ),
    );
    const mig = linhas(
      await p.$queryRawUnsafe(
        `SELECT COUNT(*) AS n FROM \`${nome}\`._prisma_migrations WHERE migration_name = '${MIGRACAO}'`,
      ),
    )[0];
    const total = linhas(await p.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${nome}\`.pnae_chamadas_publicas`))[0];
    const anos = linhas(
      await p.$queryRawUnsafe(`SELECT exercicio, COUNT(*) AS n FROM \`${nome}\`.pnae_chamadas_publicas GROUP BY exercicio`),
    );
    const editais = linhas(await p.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${nome}\`.pnae_editais`))[0];
    const itens = linhas(await p.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${nome}\`.pnae_edital_itens`))[0];
    return {
      database: db,
      indicesUnicos: idx.map((r) => `${r.nome} (${r.cols})`),
      migracaoNovaAplicada: Number(mig?.n || 0) > 0,
      chamadasPublica: Number(total?.n || 0),
      chamadasPorExercicio: anos.map((a) => `${a.exercicio}:${a.n}`),
      editais: Number(editais?.n || 0),
      editalItens: Number(itens?.n || 0),
    };
  };

  const a = await investigar(ativo, ATIVO);
  const i = await isolado ? await investigar(isolado, HOMOLOG) : null;

  console.log(JSON.stringify({ [ATIVO]: a, [HOMOLOG]: i }, null, 2));

  await ativo.$disconnect();
  if (isolado) await isolado.$disconnect();
})().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
