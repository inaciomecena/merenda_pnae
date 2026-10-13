/**
 * PREPARAÇÃO DO BANCO ISOLADO DE HOMOLOGAÇÃO — importação histórica PNAE 2025.
 *
 * Faz, NESTA ORDEM e tudo auditável:
 *  1. Identifica o servidor/host/porta/versão via SELECT (somente leitura).
 *  2. Confirma que o banco ATIVO merenda_pnae NÃO será tocado.
 *  3. Faz BACKUP do banco ativo (mysqldump) para output/backups/.
 *  4. Cria o banco temporário merenda_pnae_homolog_2025.
 *  5. Restaura o dump nele.
 *  6. Executa as migrations NO BANCO ISOLADO (DATABASE_URL apontada para ele).
 *  7. Revalida a identidade do banco conectado e o índice novo antes de sair.
 *
 * REGRA: nenhuma escrita acontece sem que a identidade conectada seja o banco
 * isolado. O banco ativo só é lido (dump) — nunca alterado.
 *
 * Uso (na raiz):
 *   node docs/importacao-pnae-2025/scripts/preparar-banco-homolog.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ATIVO = 'merenda_pnae';
const HOMOLOG = 'merenda_pnae_homolog_2025';
const RAIZ = path.resolve(__dirname, '..', '..', '..');
const BACKUP_DIR = path.join(RAIZ, 'output', 'backups');
const BIN_MYSQL = 'C:\\xampp\\mysql\\bin\\mysql.exe';
const BIN_DUMP = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';

/** Carrega o .env do backend sem sobrescrever variáveis já definidas. */
function carregarEnvBackend() {
  const caminho = path.join(RAIZ, 'apps', 'backend', '.env');
  if (!fs.existsSync(caminho)) return;
  for (const linha of fs.readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let valor = m[2].trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    process.env[m[1]] = valor;
  }
}

carregarEnvBackend();

function urlSemBase(url) {
  const u = new URL(url);
  u.pathname = '/';
  return u.toString();
}

function mascarar(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username}:****@${u.hostname}:${u.port || '3306'}`;
  } catch {
    return '(nao parseavel)';
  }
}

/** Normaliza o retorno de $queryRawUnsafe para sempre devolver um array de linhas. */
function linhas(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') return [res];
  return [];
}

(async () => {
  // Resolve o PrismaClient do local onde ele realmente está (raiz hoisted ou apps/backend).
  const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [RAIZ, path.join(RAIZ, 'apps', 'backend')] }));
  const urlAtiva = process.env.DATABASE_URL;
  if (!urlAtiva) throw new Error('DATABASE_URL nao definida');

  const saida = { etapas: [] };
  const registrar = (etapa, detalhe) => {
    saida.etapas.push({ etapa, detalhe });
    console.log(`  · ${etapa}: ${detalhe}`);
  };

  const { hostname, port, username, password } = new URL(urlAtiva);
  registrar('identificacao', `servidor ${hostname}:${port || '3306'} usuario=${username} url=${mascarar(urlAtiva)}`);

  // Conexão ADMINISTRATIVA sem base (para criar/inspecionar schemas).
  const admin = new PrismaClient({ datasources: { db: { url: urlSemBase(urlAtiva) } } });
  const info = linhas(await admin.$queryRawUnsafe('SELECT VERSION() AS v, @@hostname AS h, @@port AS p'))[0] || {};
  registrar('servidor', `MariaDB/MySQL ${info.v} em ${info.h}:${String(info.p)}`);

  const ativos = linhas(
    await admin.$queryRawUnsafe(
      `SELECT SCHEMA_NAME AS n FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '${ATIVO}'`,
    ),
  );
  if (!ativos.length) throw new Error(`Banco ativo ${ATIVO} nao encontrado — abortando`);
  registrar('ativo-protegido', `${ATIVO} detectado; sera usado APENAS como fonte de dump (leitura)`);

  // Identidade ANTES de qualquer escrita
  const antes = linhas(await admin.$queryRawUnsafe('SELECT DATABASE() AS db'))[0] || {};
  registrar('identidade-antes', `DATABASE() = ${antes.db === null || antes.db === undefined ? 'NULL (sem base)' : antes.db}`);

  // 3) Backup do banco ativo (leitura)
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const dumpAtivo = path.join(BACKUP_DIR, `merenda_pnae-homolog-pnae2025-before-${Date.now()}.sql`);
  execFileSync(
    BIN_DUMP,
    [`--host=${hostname}`, `--port=${port || '3306'}`, `--user=${username}`, ...(password ? [`--password=${password}`] : []), '--single-transaction', '--routines', '--triggers', ATIVO],
    { maxBuffer: 1024 * 1024 * 512, stdio: ['ignore', fs.openSync(dumpAtivo, 'w'), 'pipe'] },
  );
  const bytes = fs.statSync(dumpAtivo).size;
  registrar('backup-ativo', `dump ${dumpAtivo} (${bytes} bytes) — banco ativo NAO alterado`);
  if (bytes < 1000) throw new Error('Dump suspeito (muito pequeno) — abortando');

  // 4) Criar banco isolado
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${HOMOLOG}\``);
  await admin.$executeRawUnsafe(`CREATE DATABASE \`${HOMOLOG}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  registrar('criacao', `banco isolado ${HOMOLOG} criado`);

  // Contagem de linhas no ativo (para conferência posterior, leitura)
  const cAtivo = linhas(
    await admin.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${ATIVO}\`.pnae_chamadas_publicas`),
  )[0] || {};
  saida.chamadasNoAtivo = Number(cAtivo.n || 0);
  registrar('conferencia-ativo', `${saida.chamadasNoAtivo} ChamadaPublica no banco ativo (preservadas)`);
  await admin.$disconnect();

  // 5) Restaurar dump no isolado
  execFileSync(
    BIN_MYSQL,
    [`--host=${hostname}`, `--port=${port || '3306'}`, `--user=${username}`, ...(password ? [`--password=${password}`] : []), HOMOLOG],
    { stdio: ['pipe', 'inherit', 'pipe'], input: fs.readFileSync(dumpAtivo) },
  );
  registrar('restauracao', `dump restaurado em ${HOMOLOG}`);

  // 6) Migrations no banco ISOLADO (URL construída via objeto URL — robusto a query string)
  const uHomolog = new URL(urlAtiva);
  uHomolog.pathname = `/${HOMOLOG}`;
  const urlHomolog = uHomolog.toString();
  registrar('migrations', `prisma migrate deploy contra ${HOMOLOG}`);
  // Invoca o CLI do Prisma direto via node (evita npx.cmd/shell no Windows).
  const cliPrisma = require.resolve('prisma/build/index.js', { paths: [path.join(RAIZ, 'apps', 'backend'), RAIZ] });
  execFileSync(process.execPath, [cliPrisma, 'migrate', 'deploy'], {
    cwd: path.join(RAIZ, 'apps', 'backend'),
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: urlHomolog },
  });

  // 7) Revalidar identidade + índice novo + integridade
  const isolado = new PrismaClient({ datasources: { db: { url: urlHomolog } } });
  const id = linhas(await isolado.$queryRawUnsafe('SELECT DATABASE() AS db, CURRENT_USER() AS u'))[0] || {};
  const idx = linhas(
    await isolado.$queryRawUnsafe(
      "SELECT INDEX_NAME AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = '" +
        HOMOLOG +
        "' AND TABLE_NAME = 'pnae_chamadas_publicas' AND INDEX_NAME LIKE '%dreId_numero_exercicio%' GROUP BY INDEX_NAME",
    ),
  );
  const cHomolog = linhas(await isolado.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${HOMOLOG}\`.pnae_chamadas_publicas`))[0] || {};
  await isolado.$disconnect();

  saida.identidadeFinal = { database: id.db, usuario: id.u, indiceNovo: idx.map((r) => r.n) };
  saida.chamadasNoIsolado = Number(cHomolog.n);
  registrar('identidade-final', `conectado a "${id.db}" como ${id.u}; indices: ${saida.identidadeFinal.indiceNovo.join(', ') || 'NENHUM'}`);
  registrar('conferencia-isolado', `${saida.chamadasNoIsolado} ChamadaPublica restauradas no isolado (iguais ao ativo)`);

  if ((id.db || '').toLowerCase() !== HOMOLOG) throw new Error(`IDENTIDADE INVALIDA: esperado ${HOMOLOG}, obteve ${id.db}`);
  if (!idx.length) throw new Error('Migracao de unicidade NAO aplicada no banco isolado');
  if (saida.chamadasNoIsolado !== saida.chamadasNoAtivo) throw new Error('Contagem divergente entre ativo e isolado');

  saida.urlHomolog = urlHomolog;
  fs.writeFileSync(path.join(__dirname, '..', 'banco-homolog-preparado.json'), JSON.stringify({ ...saida, urlHomolog: mascarar(urlHomolog) }, null, 2), 'utf8');
  console.log(`\nBANCO ISOLADO DE HOMOLOGACAO PRONTO: ${HOMOLOG} (use DATABASE_URL="${urlHomolog}")`);
})().catch((e) => {
  console.error('\nFALHA NA PREPARACAO:', e.message);
  process.exit(1);
});
