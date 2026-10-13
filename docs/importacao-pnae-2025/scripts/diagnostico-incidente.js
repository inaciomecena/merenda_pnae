/**
 * DIAGNÓSTICO DE INCIDENTE — SOMENTE LEITURA. NÃO ESCREVE NADA.
 *
 * Confirma se a migration de unicidade foi aplicada POR ENGANO ao banco ATIVO
 * merenda_pnae, e quando (via _prisma_migrations.started_at/finished_at).
 *
 * Uso: node docs/importacao-pnae-2025/scripts/diagnostico-incidente.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const ATIVO = 'merenda_pnae';
const MIGRACAO = '20261012180000_chamada_publica_unicidade_por_dre';

function carregarEnvBackend() {
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
  const url = process.env.DATABASE_URL;
  const p = new PrismaClient({ datasources: { db: { url } } });

  const db = linhas(await p.$queryRawUnsafe('SELECT DATABASE() AS db, NOW() AS agora'))[0];
  console.log('conectado a:', db.db, '| agora:', String(db.agora));

  const migracoes = linhas(
    await p.$queryRawUnsafe(
      `SELECT migration_name, started_at, finished_at, rolled_back_at, logs
       FROM \`${ATIVO}\`._prisma_migrations
       WHERE migration_name LIKE '%chamada_publica_unicidade%'`,
    ),
  );
  console.log('\nlinhas em _prisma_migrations (banco ATIVO):');
  console.log(JSON.stringify(migracoes, (k, v) => (v instanceof Date ? v.toISOString() : v), 2));

  const idx = linhas(
    await p.$queryRawUnsafe(
      `SELECT INDEX_NAME AS nome, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = '${ATIVO}' AND TABLE_NAME = 'pnae_chamadas_publicas'
       GROUP BY INDEX_NAME, NON_UNIQUE`,
    ),
  );
  console.log('\nindices de pnae_chamadas_publicas no ATIVO:');
  console.log(JSON.stringify(idx, (k, v) => (typeof v === 'bigint' ? Number(v) : v), 2));

  const mig = linhas(
    await p.$queryRawUnsafe(
      `SELECT COUNT(*) AS n FROM \`${ATIVO}\`._prisma_migrations WHERE migration_name = '${MIGRACAO}' AND rolled_back_at IS NULL`,
    ),
  )[0];
  const temIdxNovo = idx.some((r) => r.nome === 'pnae_chamadas_publicas_dreId_numero_exercicio_key');
  const temIdxAntigo = idx.some((r) => r.nome === 'pnae_chamadas_publicas_numero_exercicio_key');

  console.log('\n=== CONCLUSAO ===');
  console.log('migration registrada como aplicada no ATIVO :', Number(mig.n) > 0);
  console.log('indice NOVO (dreId,numero,exercicio) no ATIVO:', temIdxNovo);
  console.log('indice ANTIGO (numero,exercicio) no ATIVO    :', temIdxAntigo);

  await p.$disconnect();
})().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
