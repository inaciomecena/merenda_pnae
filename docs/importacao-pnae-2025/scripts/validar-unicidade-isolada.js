/**
 * HOMOLOGAÇÃO ISOLADA DA UNICIDADE — cenários A–H (SDD §9) + §9.2.
 *
 * SOMENTE ESCREVE no schema isolado `merenda_pnae_homolog_2025_unicidade`.
 * Fail-closed: antes de QUALQUER escrita, confirma a identidade efetiva da
 * conexão (SELECT DATABASE()) e aborta (exit 1) se não for exatamente o schema
 * isolado autorizado. O banco ativo `merenda_pnae` é recusado.
 *
 * Uso:
 *   set DATABASE_URL=mysql://root:@127.0.0.1:3306/merenda_pnae_homolog_2025_unicidade?charset=utf8mb4
 *   node docs/importacao-pnae-2025/scripts/validar-unicidade-isolada.js
 *
 * Evidências: imprime JSON consolidado no stdout.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const SCHEMA_ISOLADO = 'merenda_pnae_homolog_2025_unicidade';
const STAGING_DIR = path.join(RAIZ, 'docs', 'importacao-pnae-2025', 'staging');
const PLANO_DRY_RUN = path.join(STAGING_DIR, 'planos', 'dry-run-plano.json');
const EDITAL_EXPERIMENTAL = '24f2257e-d350-48ea-92e7-39decb6e2698'; // pnae_editais 001/2025 do snapshot

function falhar(motivo) {
  process.stderr.write(`ABORTADO (fail-closed): ${motivo}\n`);
  process.exit(1);
}

/** Carrega apps/backend/.env apenas se DATABASE_URL não vier do ambiente. */
function carregarEnvBackend() {
  if (process.env.DATABASE_URL) return;
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

async function main() {
  // --- 1. Identidade efetiva (SDD §9 pré-condições: servidor/schema/não-ativo) ---
  carregarEnvBackend();
  const { PrismaClient } = require(path.join(RAIZ, 'node_modules', '@prisma/client'));
  const prisma = new PrismaClient();
  const ident = await prisma.$queryRawUnsafe('SELECT DATABASE() AS db, @@hostname AS host, @@port AS porta, VERSION() AS versao');
  const db = String(ident[0]?.db ?? '');
  if (db !== SCHEMA_ISOLADO) {
    falhar(`conexão aponta para "${db}" — autorizado apenas "${SCHEMA_ISOLADO}" (banco ativo merenda_pnae é recusado)`);
  }
  const identidade = { database: db, host: String(ident[0].host), porta: Number(ident[0].porta), versao: String(ident[0].versao) };

  const evidencias = { identidade, dataExecucao: new Date().toISOString(), cenarios: {} };
  const base = (dreId, numero, exercicio) => ({
    editalId: EDITAL_EXPERIMENTAL,
    numero,
    exercicio,
    objeto: `homologacao unicidade ${numero}`,
    inscricoesInicio: new Date('2025-03-01T00:00:00.000Z'),
    inscricoesFim: new Date('2025-04-01T00:00:00.000Z'),
    dreId,
    municipioId: null,
  });
  const codigo = (e) => String(e?.code ?? e?.message ?? e);
  const criar = (data) => prisma.chamadaPublica.create({ data });
  // dreEscopo é coluna @ignore — invisível no Client (por design); lida via SQL.
  const lerEscopo = async (id) => String((await prisma.$queryRawUnsafe(
    'SELECT dreEscopo AS v FROM pnae_chamadas_publicas WHERE id = ?', id))[0]?.v ?? '');

  // DREs reais do snapshot (via SQL direto — sem depender de nomes de modelos)
  const dres = await prisma.$queryRawUnsafe('SELECT id, nome FROM dres ORDER BY nome LIMIT 2');
  if (dres.length < 2) falhar('menos de 2 DREs no snapshot');
  const [dreA, dreB] = dres;

  // --- G pré: snapshot coluna-a-coluna dos 6 registros legados de 2026 (E2E-*) ---
  const colunas = (await prisma.$queryRawUnsafe(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${SCHEMA_ISOLADO}' AND TABLE_NAME='pnae_chamadas_publicas' AND COLUMN_NAME <> 'dreEscopo' ORDER BY ORDINAL_POSITION`,
  )).map((r) => String(r.c));
  const projetar = (a) => `CONCAT_WS('|', ${colunas.map((c) => `COALESCE(${a}.\`${c}\`,'<NULL>')`).join(', ')})`;
  const lerE2E = () => prisma.$queryRawUnsafe(
    `SELECT id, ${projetar('x')} AS hash FROM pnae_chamadas_publicas x WHERE exercicio = 2026 AND numero LIKE 'E2E-%' ORDER BY id`,
  );
  const snapshotPre = await lerE2E();

  // --- Cenário A: DREs diferentes, mesmo numero/exercicio → PERMITIDO ---
  const a1 = await criar(base(dreA.id, 'SC-A/2025', 2025));
  const a2 = await criar(base(dreB.id, 'SC-A/2025', 2025));
  evidencias.cenarios.A = {
    resultado: 'PERMITIDO — 2 chamadas criadas',
    ids: [a1.id, a2.id],
    dreIds: [dreA.nome, dreB.nome],
    dreEscopo: [await lerEscopo(a1.id), await lerEscopo(a2.id)],
  };

  // --- Cenário B: mesma DRE duplicada → BLOQUEADO pelo banco ---
  let bErro = null;
  await criar(base(dreA.id, 'SC-A/2025', 2025)).catch((e) => (bErro = codigo(e)));
  evidencias.cenarios.B = {
    resultado: bErro ? 'BLOQUEADO pelo banco' : 'FALHA — duplicidade aceita!',
    erro: bErro,
  };

  // --- Cenário C: mesma DRE, mesmo numero, exercicio DIFERENTE → PERMITIDO ---
  const c1 = await criar(base(dreA.id, 'SC-A/2025', 2026));
  evidencias.cenarios.C = { resultado: 'PERMITIDO', id: c1.id, exercicio: 2026, nota: 'linhas E2E de 2026 não são afetadas (ver G)' };

  // --- Cenário D: duas estaduais (dreId NULL) idênticas → BLOQUEADO pela persistência ---
  const d1 = await criar(base(null, 'SC-D/2025', 2025));
  let dErro = null;
  await criar(base(null, 'SC-D/2025', 2025)).catch((e) => (dErro = codigo(e)));
  evidencias.cenarios.D = {
    resultado: dErro ? 'BLOQUEADO pela persistência' : 'FALHA — duplicidade estadual aceita!',
    erro: dErro,
    dreEscopoDaPrimeira: await lerEscopo(d1.id),
    prova: 'escrita feita via Prisma Client direto (sem service) — somente o índice do banco poderia bloquear',
  };

  // --- Cenário E: estadual x DRE, mesmo numero/exercicio → PERMITIDO ---
  const e1 = await criar(base(dreA.id, 'SC-D/2025', 2025));
  evidencias.cenarios.E = {
    resultado: 'PERMITIDO — escopos institucionais distintos',
    id: e1.id,
    justificativa: "sentinela 'ESTADUAL' nunca iguala um dreId real (UUID da tabela dres)",
  };

  // --- Cenário F: concorrência — 2 escritas simultâneas idênticas → só 1 persiste ---
  const [f1, f2] = await Promise.allSettled([
    criar(base(dreB.id, 'SC-F/2025', 2025)),
    criar(base(dreB.id, 'SC-F/2025', 2025)),
  ]);
  const fOk = [f1, f2].filter((r) => r.status === 'fulfilled');
  const fFalha = [f1, f2].filter((r) => r.status === 'rejected');
  evidencias.cenarios.F = {
    resultado: fOk.length === 1 && fFalha.length === 1 ? 'OK — 1 persistida, 1 rejeitada' : 'FALHA',
    persistida: fOk[0]?.value?.id ?? null,
    erroRejeitada: fFalha[0] ? codigo(fFalha[0].reason) : null,
    metodo: 'Promise.allSettled sem await intermediário — duas conexões simultâneas do pool Prisma',
  };

  // --- Cenário H: importação experimental do plano real (51 CREATEs), executada 2x ---
  // Só os arquivos de staging de edital (ED-NNNN_dre_DECISAO.json) — os
  // indice_*.json auxiliares não são StagingEdital.
  const staging = fs.readdirSync(STAGING_DIR)
    .filter((f) => /^ED-\d+_.+_(APROVADO|BLOQUEADO|SEGREGADO)\.json$/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(STAGING_DIR, f), 'utf8')));
  const plano = JSON.parse(fs.readFileSync(PLANO_DRY_RUN, 'utf8'));
  const acoesChamada = plano.acoes.filter((a) => a.model === 'ChamadaPublica');

  const mapaChaves = acoesChamada.reduce((m, a) => {
    const k = `${a.payload.numero}|${a.payload.exercicio}`;
    (m[k] ||= new Set()).add(a.payload.dreId);
    return m;
  }, {});
  const repetidosEntreDres = Object.values(mapaChaves).filter((s) => s.size > 1).length;

  const executarAcoes = async () => {
    const resultados = [];
    for (const acao of acoesChamada) {
      const p = acao.payload;
      // identidade lógica da importação: MESMA regra do executor (dreId, numero, exercicio)
      const jaExiste = await prisma.chamadaPublica.findFirst({ where: { dreId: p.dreId ?? null, numero: p.numero, exercicio: p.exercicio } });
      if (jaExiste) { resultados.push({ decisao: 'JA_EXISTENTE', id: jaExiste.id }); continue; }
      const linha = await criar({
        editalId: EDITAL_EXPERIMENTAL,
        numero: p.numero,
        exercicio: p.exercicio,
        objeto: p.objeto || `Chamada Publica ${p.numero}`,
        inscricoesInicio: new Date('2025-01-01T00:00:00.000Z'),
        inscricoesFim: new Date('2025-02-01T00:00:00.000Z'),
        dreId: p.dreId ?? null,
        municipioId: p.municipioId ?? null,
      });
      resultados.push({ decisao: 'CREATE', id: linha.id });
    }
    return resultados;
  };

  const contar = (rs) => rs.reduce((m, r) => ((m[r.decisao] = (m[r.decisao] || 0) + 1), m), {});
  const totalAntes = await prisma.chamadaPublica.count();
  const passada1 = await executarAcoes();
  const totalApos1 = await prisma.chamadaPublica.count();
  const passada2 = await executarAcoes();
  const totalApos2 = await prisma.chamadaPublica.count();

  // Re-simulação do plano com existentes carregados do banco real (pós-importação)
  let resimulacao = { executado: false };
  const tsNodeDir = [
    path.join(RAIZ, 'apps', 'backend', 'node_modules', 'ts-node'),
    path.join(RAIZ, 'node_modules', 'ts-node'), // workspaces hoisted
  ].find((p) => fs.existsSync(path.join(p, 'package.json')));
  if (tsNodeDir) {
    require(tsNodeDir).register({
      transpileOnly: true,
      compilerOptions: { module: 'commonjs', target: 'es2019', experimentalDecorators: true, emitDecoratorMetadata: true },
    });
    const { simularImportacao } = require(path.join(RAIZ, 'apps', 'backend', 'src', 'modules', 'importacao-historica', 'aplicacao', 'simulador-importacao.ts'));
    const existentesBanco = {
      chamadasPublicas: await prisma.chamadaPublica.findMany({ select: { numero: true, exercicio: true, dreId: true } }),
      editais: [],
      hashesDocumento: [],
      idempotencias: [],
    };
    const planoPosImportacao = simularImportacao(staging, existentesBanco);
    const criacoesChamada = planoPosImportacao.acoes.filter((a) => a.model === 'ChamadaPublica');
    resimulacao = {
      executado: true,
      chamadasRestantesNoPlano: criacoesChamada.length,
      jaExistentesChamada: planoPosImportacao.jaExistentes.filter((j) => j.motivo.includes('ChamadaPublica')).length,
      novosCandidatos: planoPosImportacao.resumo.novosCandidatos,
      resultado: criacoesChamada.length === 0 ? 'OK — plano re-simulado sem nenhuma criação de ChamadaPublica pendente' : 'FALHA',
    };
  } else {
    resimulacao = { executado: false, nota: 'ts-node ausente — idempotência do plano coberta em jest (unicidade-escopo.spec.ts, cenário H)' };
  }

  const hOk =
    passada1.filter((r) => r.decisao === 'CREATE').length === 48 && // 48 chaves únicas no lote (51 ações − 3 repetições intra-lote)
    passada2.every((r) => r.decisao === 'JA_EXISTENTE') &&
    totalApos1 === totalAntes + 48 &&
    totalApos2 === totalApos1 &&
    (!resimulacao.executado || resimulacao.chamadasRestantesNoPlano === 0);
  evidencias.cenarios.H = {
    resultado: hOk ? 'OK — 1ª: 48 CREATEs (48 chaves únicas; 3 repetições intra-lote detectadas); 2ª: 51 JA_EXISTENTE; contagem estável' : 'FALHA',
    passada1: contar(passada1),
    passada2: contar(passada2),
    contagem: { antes: totalAntes, apos1: totalApos1, apos2: totalApos2 },
    chaveIntraLoteDuplicada: '012/2024|2025 (DRE Alta Floresta) planejada 4× (ED-0092/0093/0094/0096) — 2ª+ ocorrência detectada como JA_EXISTENTE pela identidade (dreId,numero,exercicio)',
    numerosRepetidosEntreDresNoPlano: repetidosEntreDres,
    provaDeEscopo: 'chaves repetidas entre DREs importaram todas (antes, impedidas pela unique global)',
    resimulacaoPlano: resimulacao,
    nota: 'importação EXPERIMENTAL no banco isolado — nada foi importado no ativo; aplicar definitivo permanece bloqueado (exit 3)',
  };

  // --- G pós: os 6 registros legados de 2026 intactos (coluna a coluna) ---
  const snapshotPos = await lerE2E();
  const divergencias = snapshotPre.filter((r, i) => r.hash !== snapshotPos[i]?.hash).length;
  const contagem2026 = await prisma.$queryRawUnsafe("SELECT COUNT(*) AS n FROM pnae_chamadas_publicas WHERE exercicio = 2026");
  evidencias.cenarios.G = {
    resultado: snapshotPre.length === 6 && divergencias === 0 ? 'OK — 6 registros idênticos, coluna a coluna' : `FALHA — ${divergencias} divergência(s)`,
    registrosLegados: snapshotPre.length,
    totalLinhasExercicio2026: Number(contagem2026[0].n), // 6 legadas + 1 do cenário C
    colunasComparadas: colunas.length,
  };

  // --- Integridade referencial (§9.2 passo 6) ---
  const orfaos = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM pnae_chamadas_publicas c LEFT JOIN pnae_editais e ON e.id = c.editalId WHERE e.id IS NULL) AS semEdital,
      (SELECT COUNT(*) FROM pnae_chamadas_publicas c LEFT JOIN dres d ON d.id = c.dreId WHERE c.dreId IS NOT NULL AND d.id IS NULL) AS semDre,
      (SELECT COUNT(*) FROM pnae_chamadas_publicas c LEFT JOIN municipios m ON m.id = c.municipioId WHERE c.municipioId IS NOT NULL AND m.id IS NULL) AS semMunicipio,
      (SELECT COUNT(*) FROM pnae_chamadas_publicas) AS totalChamadas`);
  evidencias.integridadeReferencial = {
    semEdital: Number(orfaos[0].semEdital),
    semDre: Number(orfaos[0].semDre),
    semMunicipio: Number(orfaos[0].semMunicipio),
    totalChamadas: Number(orfaos[0].totalChamadas),
    resultado: Number(orfaos[0].semEdital) === 0 && Number(orfaos[0].semDre) === 0 && Number(orfaos[0].semMunicipio) === 0 ? 'OK — 0 órfãs' : 'FALHA',
  };

  // --- Índices finais (§9.2 passo 4) ---
  const indices = await prisma.$queryRawUnsafe(`
    SELECT INDEX_NAME AS nome, NON_UNIQUE AS unico, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS colunas
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA='${SCHEMA_ISOLADO}' AND TABLE_NAME='pnae_chamadas_publicas'
    GROUP BY INDEX_NAME, NON_UNIQUE ORDER BY INDEX_NAME`);
  evidencias.indices = indices.map((i) => ({ nome: String(i.nome), unico: Number(i.unico) === 0, colunas: String(i.colunas) }));

  process.stdout.write(JSON.stringify(evidencias, null, 2) + '\n');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  process.stderr.write(`ERRO no harness: ${e?.message ?? e}\n`);
  process.exit(1);
});
