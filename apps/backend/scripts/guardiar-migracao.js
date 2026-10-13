/**
 * GUARDA DE MIGRAÇÃO PRISMA — FAIL-CLOSED. SOMENTE LEITURA.
 *
 * Contexto: em 12/10/2026 a migration `20261012180000_chamada_publica_unicidade_por_dre`
 * foi aplicada por engano ao banco ATIVO `merenda_pnae` degradando o índice de
 * unicidade de `pnae_chamadas_publicas` (ver docs/importacao-pnae-2025/
 * INCIDENTE_MIGRATION_BANCO_ATIVO.md). Este script é a correção local que passa a
 * rodar ANTES de qualquer `prisma migrate deploy`.
 *
 * O que ele faz (e nada mais):
 *  1. Lê `DATABASE_URL` e a converte com `new URL()` — nunca por concatenação/
 *     regex de string. URL ausente, não parseável, sem schema ou com protocolo
 *     inesperado => BLOQUEADO (exit 1).
 *  2. Aplica lista de PROIBIÇÃO (sempre) e, se definida, lista de PERMITIÇÃO.
 *     Estar fora da lista de permitição quando ela existe também bloqueia.
 *  3. Conecta e compara a IDENTIDADE EFETIVA da conexão (`SELECT DATABASE()`,
 *     `@@port`, `@@hostname`, `CURRENT_USER()`) com o que a URL declara.
 *     Divergência => BLOQUEADO (exit 1).
 *  4. Só com exit 0 o chamador (`prisma migrate deploy`) pode executar.
 *
 * Qualquer erro (servidor fora do ar, schema inexistente, timeout, exceção) também
 * bloqueia: não há caminho "padrão" que libere a migração — é fail-closed por
 * construção. Nenhuma escrita é feita aqui: apenas SELECT.
 *
 * Variáveis opcionais (`.env` do backend ou ambiente):
 *   MIGRACAO_SCHEMAS_PROIBIDOS   lista CSV de schemas sempre recusados
 *                                (o guard já recusa `merenda_pnae` por padrão)
 *   MIGRACAO_SCHEMAS_PERMITIDOS  lista CSV fechada de schemas aceitos; se definida,
 *                                qualquer outro schema é recusado
 *   MIGRACAO_HOSTS_EQUIVALENTES  lista CSV de hosts declarados na URL que se aceita
 *                                como equivalentes a `@@hostname` (aliases DNS)
 *
 * Uso (em apps/backend): node scripts/guardiar-migracao.js
 * Sai com 0 = migração permitida; 1 = bloqueada.
 */

const fs = require('fs');
const path = require('path');

// Este arquivo fica em apps/backend/scripts/ → três níveis até a raiz do repositório.
const RAIZ = path.resolve(__dirname, '..', '..', '..');
/** Banco ativo da produção — recusado incondicionalmente. */
const SCHEMA_ATIVO = 'merenda_pnae';

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

function listaCsv(valor) {
  return (valor || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizar(nome) {
  return String(nome || '').trim().toLowerCase();
}

const loopback = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', '[::1]']);

function bloquear(etapa, motivo, detalhe) {
  const saida = { decisao: 'BLOQUEADO', etapa, motivo, ...(detalhe ? { detalhe } : {}) };
  console.error(JSON.stringify(saida, null, 2));
  console.error(`\nMIGRACAO BLOQUEADA (${etapa}): ${motivo}`);
  process.exit(1);
}

carregarEnvBackend();

// ---------------------------------------------------------------------------
// 1) Parse da URL com new URL() — nunca concatenação/regex de string.
// ---------------------------------------------------------------------------
const urlBruta = process.env.DATABASE_URL;
if (!urlBruta) bloquear('url', 'DATABASE_URL ausente — sem alvo declarado não há migração');

let alvo;
try {
  alvo = new URL(urlBruta);
} catch (e) {
  bloquear('url', 'DATABASE_URL não parseável por new URL()', e.message);
}

if (alvo.protocol !== 'mysql:') {
  bloquear('url', `protocolo inesperado "${alvo.protocol}" — esperado mysql:`, alvo.protocol);
}

const schema = decodeURIComponent((alvo.pathname || '').replace(/^\//, ''));
if (!schema) bloquear('url', 'URL sem schema (pathname vazio) — Prisma migra sem alvo explícito? recusado');
if (schema.includes('/')) {
  bloquear('url', `schema com barra extra "${schema}" — forma não suportada`, schema);
}

const hostUrl = alvo.hostname;
const portaUrl = alvo.port ? Number(alvo.port) : 3306;

// ---------------------------------------------------------------------------
// 2) Políticas de proibição/permitição (fail-closed).
// ---------------------------------------------------------------------------
const proibidos = new Set([SCHEMA_ATIVO, ...listaCsv(process.env.MIGRACAO_SCHEMAS_PROIBIDOS)].map(normalizar));
if (proibidos.has(normalizar(schema))) {
  bloquear('politica', `schema "${schema}" está na lista de schemas PROIBIDOS (inclui o banco ativo ${SCHEMA_ATIVO})`);
}

const permitidos = listaCsv(process.env.MIGRACAO_SCHEMAS_PERMITIDOS).map(normalizar);
if (permitidos.length && !permitidos.includes(normalizar(schema))) {
  bloquear('politica', `schema "${schema}" não está em MIGRACAO_SCHEMAS_PERMITIDOS`, permitidos.join(', '));
}

// ---------------------------------------------------------------------------
// 3) Identidade EFETIVA da conexão vs. identidade DECLARADA na URL.
// ---------------------------------------------------------------------------
(async () => {
  const { PrismaClient } = require(require.resolve('@prisma/client', {
    paths: [RAIZ, path.join(RAIZ, 'apps', 'backend')],
  }));
  const prisma = new PrismaClient({ datasources: { db: { url: urlBruta } } });
  try {
    const linhas = await prisma.$queryRawUnsafe(
      'SELECT DATABASE() AS db, @@hostname AS host, @@port AS porta, CURRENT_USER() AS usuario, VERSION() AS versao',
    );
    const info = Array.isArray(linhas) ? linhas[0] : linhas;
    if (!info) bloquear('identidade', 'servidor não devolveu identidade — sem identidade, sem migração');

    const dbConectado = info.db === null || info.db === undefined ? '' : String(info.db);
    const hostConectado = String(info.host || '');
    const portaConectada = Number(info.porta);

    if (!dbConectado) {
      bloquear('identidade', 'SELECT DATABASE() vazio — conexão sem schema ativo, recusada', `esperado: ${schema}`);
    }
    if (normalizar(dbConectado) !== normalizar(schema)) {
      bloquear(
        'identidade',
        'o banco EFETIVAMENTE conectado difere do declarado na URL',
        `URL declara "${schema}"; conexão está em "${dbConectado}"`,
      );
    }
    if (portaUrl !== portaConectada) {
      bloquear('identidade', 'porta da conexão difere da porta da URL', `URL: ${portaUrl}; servidor: ${portaConectada}`);
    }

    const hostsEquivalentes = new Set(
      [hostUrl, ...listaCsv(process.env.MIGRACAO_HOSTS_EQUIVALENTES)].map((h) => normalizar(h)),
    );
    const hostEhLoopback = loopback.has(hostUrl.toLowerCase());
    if (!hostEhLoopback && !hostsEquivalentes.has(normalizar(hostConectado))) {
      bloquear(
        'identidade',
        'host efetivo (@@hostname) difere do host declarado na URL',
        `URL: ${hostUrl}; servidor: ${hostConectado} (use MIGRACAO_HOSTS_EQUIVALENTES se for alias DNS legítimo)`,
      );
    }

    console.log(
      JSON.stringify(
        {
          decisao: 'PERMITIDO',
          schema,
          identidadeEfetiva: { database: dbConectado, hostname: hostConectado, porta: portaConectada, usuario: String(info.usuario || ''), versao: String(info.versao || '') },
          hostnameInformado: hostEhLoopback ? 'loopback na URL — hostname do servidor apenas reportado' : 'host declarado confere com @@hostname',
          proximoPasso: 'prisma migrate deploy',
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  bloquear('conexao', 'falha ao verificar a identidade efetiva da conexão (fail-closed)', String(e.message || e).split('\n')[0]);
});
