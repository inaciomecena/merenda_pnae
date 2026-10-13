/**
 * ANÁLISE DE UNICIDADE — SOMENTE LEITURA (ChamadaPublica).
 *
 * REGRA: apenas SELECT (findMany/groupBy/count). Nenhum create/update/
 * delete/executeRaw/$transaction de escrita. Não aplica migrations.
 *
 * Objetivo: reunir as evidências de dados para avaliar a proposta
 *   @@unique([numero, exercicio])  ->  @@unique([dreId, numero, exercicio])
 * sem tocar no schema nem no banco.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/analisar-unicidade-readonly.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
function out(label, valor) { console.log('=== ' + label + ' ==='); console.log(JSON.stringify(valor, null, 1)); }

async function safe(label, fn) {
  try { return await fn(); } catch (e) { out('ERRO ' + label, { mensagem: e.message.split('\n')[0] }); return null; }
}

(async () => {
  await safe('connect', () => prisma.$connect());

  const total = await safe('ChamadaPublica.count', () => prisma.chamadaPublica.count());
  out('total chamadas publicas', { total });

  // 1) Colisões da UNIQUE ATUAL (numero, exercicio) — já existentes no banco.
  //    Se houver colisão aqui, o banco atual já violaria o índice atual (impossível);
  //    serve como sanity check.
  const porNumeroExercicio = await safe('groupBy numero+exercicio', () =>
    prisma.chamadaPublica.groupBy({ by: ['numero', 'exercicio'], _count: { _all: true } }));
  if (porNumeroExercicio) {
    const duplicadosAtual = porNumeroExercicio.filter((g) => g._count._all > 1);
    out('colisoes da unique ATUAL (numero,exercicio)', { grupos: porNumeroExercicio.length, colisoes: duplicadosAtual });
  }

  // 2) Colisões que a PROPOSTA permitiria vs. impediria:
  //    (dreId, numero, exercicio) — quantos grupos, e quantos (numero,exercicio)
  //    hoje são compartilhados por MAIS DE UMA dreId (estes seriam BLOQUEADOS
  //    pela unique atual e LIBERTADOS pela proposta).
  const porDreNumeroExercicio = await safe('groupBy dreId+numero+exercicio', () =>
    prisma.chamadaPublica.groupBy({ by: ['dreId', 'numero', 'exercicio'], _count: { _all: true } }));
  if (porNumeroExercicio && porDreNumeroExercicio) {
    const gruposProposta = porDreNumeroExercicio.filter((g) => g._count._all > 1);
    // (numero,exercicio) com dreIds distintos
    const mapa = new Map();
    for (const g of porDreNumeroExercicio) {
      const k = `${g.numero}|${g.exercicio}`;
      if (!mapa.has(k)) mapa.set(k, new Set());
      mapa.get(k).add(g.dreId === null ? '<null>' : g.dreId);
    }
    const multiDre = [...mapa.entries()].filter(([, s]) => s.size > 1).map(([k, s]) => ({ chave: k, dres: [...s] }));
    out('colisoes que a PROPOSTA impediria (dreId,numero,exercicio)', { grupos: porDreNumeroExercicio.length, colisoes: gruposProposta });
    out('(numero,exercicio) hoje em mais de uma DRE', { qtd: multiDre.length, exemplos: multiDre.slice(0, 20) });
  }

  // 3) dreId nulo — a proposta usa coluna anulável; em MySQL, NULL em unique
  //    permite repetição. Quantas chamadas têm dreId null hoje?
  const semDre = await safe('count dreId null', () => prisma.chamadaPublica.count({ where: { dreId: null } }));
  out('chamadas com dreId NULL', { semDre });

  // 4) Registros de 2026 (exercicio) — preservação.
  const porExercicio = await safe('groupBy exercicio', () =>
    prisma.chamadaPublica.groupBy({ by: ['exercicio'], _count: { _all: true }, orderBy: { exercicio: 'asc' } }));
  out('chamadas por exercicio', porExercicio);
  const e2026 = await safe('exercicio 2026', () => prisma.chamadaPublica.findMany({ where: { exercicio: 2026 }, select: { id: true, numero: true, exercicio: true, dreId: true, status: true } }));
  out('chamadas exercicio 2026 (amostra ate 20)', e2026 ? { qtd: e2026.length, amostra: e2026.slice(0, 20) } : null);

  // 5) Edital: a proposta não altera, mas ChamadaPublica exige editalId.
  const totalEditais = await safe('Edital.count', () => prisma.edital.count());
  const editaisPorAno = await safe('groupBy Edital.ano', () =>
    prisma.edital.groupBy({ by: ['ano'], _count: { _all: true }, orderBy: { ano: 'asc' } }).catch(() => null));
  out('editais', { total: totalEditais, porAno: editaisPorAno });

  // 6) Amostra real de linhas (para ver forma do numero: tem zero à esquerda?)
  const amostra = await safe('amostra chamadas', () =>
    prisma.chamadaPublica.findMany({ take: 15, select: { id: true, numero: true, exercicio: true, dreId: true, status: true, createdAt: true } }));
  out('amostra de chamadas existentes', amostra);

  // 7) Nomes de índices reais na tabela (evidência da migração atual).
  const indices = await safe('indices pnae_chamadas_publicas', () =>
    prisma.$queryRawUnsafe("SHOW INDEX FROM pnae_chamadas_publicas").catch(() => null));
  if (indices) {
    const resumido = indices.map((i) => ({
      nome: String(i.Key_name),
      coluna: String(i.Column_name),
      seq: Number(i.Seq_in_index),
      unico: Number(i.Non_unique) === 0,
    }));
    out('indices da tabela', resumido);
  }

  await safe('disconnect', () => prisma.$disconnect());
})().catch((e) => { console.error('FATAL', e.stack || e.message); process.exit(1); });
