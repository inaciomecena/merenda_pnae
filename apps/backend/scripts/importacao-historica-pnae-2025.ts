/**
 * CLI de staging, simulação e aplicação da importação histórica PNAE MT 2025.
 *
 * Comandos:
 *   staging  — gera os JSONs de staging em docs/importacao-pnae-2025/staging
 *   dry-run  — simula a importação a partir do staging (NENHUMA escrita)
 *   aplicar  — gravação definitiva, restrita ao banco local confirmado e com
 *              validação restaurável do backup pré-importação.
 *
 * REGRA DE OURO: staging e dry-run nunca escrevem no banco. `aplicar` reutiliza
 * os services existentes e exige confirmação da identidade efetiva do destino.
 *
 * Uso (em apps/backend):
 *   npx ts-node -r tsconfig-paths/register scripts/importacao-historica-pnae-2025.ts staging
 *   npx ts-node -r tsconfig-paths/register scripts/importacao-historica-pnae-2025.ts dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  gerarStaging,
  gravarStaging,
  simularImportacao,
  formatarPlano,
  ChavesExistentes,
  SnapshotInstitucional,
  StagingEdital,
} from '../src/modules/importacao-historica';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { PolicyService } from '../src/common/auth/policy.service';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { ExecutorImportacaoHistorica } from '../src/modules/importacao-historica/persistencia/executor-importacao-historica';
import { AuthenticatedUser } from '../src/common/auth/user-scope';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { chaveIdempotenciaOperacao } from '../src/modules/importacao-historica';

const DOCS = path.resolve(__dirname, '..', '..', '..', 'docs', 'importacao-pnae-2025');
const STAGING_DIR = path.join(DOCS, 'staging');
const SNAPSHOT_PATH = path.join(DOCS, 'snapshot-institucional.json');
const PACOTE_DIR = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const BACKUP_ANTES = path.resolve(__dirname, '..', '..', '..', 'backups', 'pnae-antes-importacao-2025');
const OPERACAO = 'importacao-historica-pnae-2025';

function carregarSnapshot(): SnapshotInstitucional {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    throw new Error(`Snapshot institucional não encontrado: ${SNAPSHOT_PATH}. Rode antes: node docs/importacao-pnae-2025/scripts/dump-snapshot-institucional.js`);
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) as SnapshotInstitucional;
}

/** Lê do staging os números/exercícios que SERÃO criados, para simular a segunda execução. */
async function cmdStaging(): Promise<void> {
  const snapshot = carregarSnapshot();
  const resultado = await gerarStaging({
    raizPacote: PACOTE_DIR,
    snapshot,
    extrairItensPdf: true,
    onProgresso: (m) => console.log(`  · ${m}`),
  });

  const { arquivos, indices } = gravarStaging(resultado, STAGING_DIR);
  console.log(`staging gravado: ${arquivos.length} procedimentos + ${indices.length} índices em ${STAGING_DIR}`);
  console.log(JSON.stringify(resultado.resumo, null, 2));
}

async function cmdDryRun(): Promise<void> {
  const snapshot = carregarSnapshot();

  // 1) Gera (ou relê) o staging em memória.
  const resultado = await gerarStaging({ raizPacote: PACOTE_DIR, snapshot, extrairItensPdf: true });

  // 2) "Existentes" reais: apenas o que já existe no sistema (6 chamadas de
  //    teste E2E, 3 editais). Como são de exercícios/distintos, nenhum
  //    histórico de 2025 colide — mas o mecanismo de idempotência é exercitado.
  const existentes: ChavesExistentes = {
    chamadasPublicas: [
      // Exemplo real do banco (read-only): numero|exercicio das chamadas de teste.
      { numero: '901/2026', exercicio: 2026, dreId: null },
      { numero: '902/2026', exercicio: 2026, dreId: null },
      { numero: '903/2026', exercicio: 2026, dreId: null },
      { numero: '904/2026', exercicio: 2026, dreId: null },
      { numero: '905/2026', exercicio: 2026, dreId: null },
      { numero: '906/2026', exercicio: 2026, dreId: null },
    ],
    editais: [],
    hashesDocumento: [],
    idempotencias: [],
  };

  const plano = simularImportacao(resultado.staging, existentes);
  console.log(formatarPlano(plano));

  const caminhoPlano = path.join(STAGING_PLANO(), 'dry-run-plano.json');
  fs.mkdirSync(path.dirname(caminhoPlano), { recursive: true });
  fs.writeFileSync(caminhoPlano, JSON.stringify(plano, null, 2), 'utf8');
  console.log(`plano gravado em ${caminhoPlano}`);

  // 3) Segunda execução (idempotência): as ações de 1ª execução passam a
  //    "existentes" — o resultado esperado é 0 novos candidatos.
  const existentesAposPrimeira: ChavesExistentes = {
    chamadasPublicas: existentes.chamadasPublicas.concat(
      resultado.staging
        .filter((s) => s.decisao === 'APROVADO')
        .map((s) => ({ numero: s.identificacao.numeroNormalizado || '', exercicio: s.identificacao.exercicio || 0, dreId: s.vinculosInstitucionais.dre.dreId })),
    ),
    editais: [],
    hashesDocumento: resultado.staging.flatMap((s) => s.documentos.map((d) => d.sha256 || '').filter(Boolean)),
    idempotencias: [],
  };
  const segunda = simularImportacao(resultado.staging, existentesAposPrimeira);
  console.log(`\nsegunda execução (idempotência): novos candidatos = ${segunda.resumo.novosCandidatos} (esperado: 0)`);
  if (segunda.resumo.novosCandidatos !== 0) {
    console.error('ALERTA: idempotência não confirmada — revisar antes de qualquer aplicação.');
    process.exitCode = 2;
  }
}

function STAGING_PLANO(): string {
  return path.join(STAGING_DIR, 'planos');
}

function lerStagingAprovado(): StagingEdital[] {
  const staging = fs.readdirSync(STAGING_DIR)
    .filter((nome) => /^ED-.*\.json$/.test(nome))
    .map((nome) => JSON.parse(fs.readFileSync(path.join(STAGING_DIR, nome), 'utf8')) as StagingEdital)
    .filter((s) => s.decisao === 'APROVADO');
  const itens = staging.reduce((n, s) => n + s.itens.length, 0);
  const documentos = staging.flatMap((s) => s.documentos);
  if (staging.length > 51 || itens > 2652 || documentos.length > 54) {
    throw new Error(`STAGING_INCOMPATIVEL: aprovados=${staging.length}, itens=${itens}, documentos=${documentos.length}`);
  }
  for (const documento of documentos) {
    if (!documento.caminho) throw new Error(`CAMINHO_DOCUMENTO_AUSENTE: ${documento.idDocumento}`);
    const arquivo = path.resolve(PACOTE_DIR, documento.caminho);
    if (!arquivo.startsWith(`${PACOTE_DIR}${path.sep}`) || !fs.existsSync(arquivo)) {
      throw new Error(`DOCUMENTO_AUSENTE_OU_FORA_DO_PACOTE: ${documento.caminho}`);
    }
    const hash = createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');
    if (hash !== documento.sha256) throw new Error(`HASH_DOCUMENTO_DIVERGENTE: ${documento.caminho}`);
  }
  return staging;
}

function bloquearNoStaging(s: StagingEdital, motivo: string): void {
  s.decisao = 'BLOQUEADO';
  s.motivosBloqueio.push(motivo);
  const arquivo = fs.readdirSync(STAGING_DIR).find((nome) => nome.startsWith(`${s.idPacote}_`));
  if (!arquivo) throw new Error(`STAGING_NAO_ENCONTRADO: ${s.idPacote}`);
  fs.writeFileSync(path.join(STAGING_DIR, arquivo), JSON.stringify(s, null, 2), 'utf8');
}

function sha256Arquivo(arquivo: string): string {
  return createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');
}

function coletarArquivos(raiz: string, diretorio = raiz): Array<{ caminho: string; bytes: number; sha256: string }> {
  return fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const arquivo = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) return coletarArquivos(raiz, arquivo);
    return [{ caminho: path.relative(raiz, arquivo).replace(/\\/g, '/'), bytes: fs.statSync(arquivo).size, sha256: sha256Arquivo(arquivo) }];
  });
}

const MYSQL_BIN = 'C:\\xampp\\mysql\\bin';
const MYSQL = path.join(MYSQL_BIN, 'mysql.exe');

function rodarMysql(args: string[]): string {
  return execFileSync(MYSQL, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}

function validarRestoreDump(dump: string, consultas: string[], esperados: number[]): { schema: string; valores: number[] } {
  if (!fs.existsSync(dump) || fs.statSync(dump).size < 1000) throw new Error(`BACKUP_AUSENTE_OU_VAZIO: ${dump}`);
  const schema = `pnae_restore_check_${Date.now()}`;
  rodarMysql(['--user=root', '--host=localhost', '--port=3306', '--execute', `CREATE DATABASE ${schema} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`]);
  let validado = false;
  try {
    rodarMysql(['--user=root', '--host=localhost', '--port=3306', `--database=${schema}`, '--execute', `SOURCE ${dump.replace(/\\/g, '/')}`]);
    const valores = consultas.map((consulta) => {
      const saida = rodarMysql(['--user=root', '--host=localhost', '--port=3306', `--database=${schema}`, '--batch', '--skip-column-names', '--execute', consulta]).trim();
      return Number(saida);
    });
    if (valores.some((valor, i) => !Number.isFinite(valor) || valor !== esperados[i])) {
      throw new Error(`RESTORE_DIVERGENTE: schema=${schema}, esperado=${esperados.join(',')}, obtido=${valores.join(',')}`);
    }
    validado = true;
    return { schema, valores };
  } finally {
    if (validado) rodarMysql(['--user=root', '--host=localhost', '--port=3306', '--execute', `DROP DATABASE ${schema}`]);
  }
}

function gerarBackupFinal(resumo: Record<string, unknown>): { diretorio: string; sql: string; manifestoSha256: string; validacao: unknown } {
  const raizProjeto = path.resolve(__dirname, '..', '..', '..');
  const diretorio = path.join(raizProjeto, 'backups', 'pnae-2025-importado');
  if (fs.existsSync(diretorio)) throw new Error(`BACKUP_FINAL_JA_EXISTE_NAO_SOBRESCRITO: ${diretorio}`);
  fs.mkdirSync(diretorio, { recursive: true });
  const sql = path.join(diretorio, 'merenda_pnae_com_editais_2025_2026.sql');
  const dumpExe = path.join(MYSQL_BIN, 'mysqldump.exe');
  execFileSync(dumpExe, [
    '--user=root', '--host=localhost', '--port=3306', '--single-transaction', '--routines', '--events',
    '--triggers', '--hex-blob', '--default-character-set=utf8mb4', `--result-file=${sql}`, 'merenda_pnae',
  ], { stdio: 'pipe', maxBuffer: 16 * 1024 * 1024 });
  const docsDestino = path.join(diretorio, 'documentos', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
  fs.mkdirSync(path.dirname(docsDestino), { recursive: true });
  fs.cpSync(PACOTE_DIR, docsDestino, { recursive: true, errorOnExist: true });
  fs.writeFileSync(path.join(diretorio, 'RESTAURACAO.txt'), [
    'BACKUP MERENDA PNAE - EDITAIS 2025/2026', '',
    '1. Crie um schema vazio compatível no MySQL/MariaDB.',
    '2. Restaure merenda_pnae_com_editais_2025_2026.sql usando mysql --database=<schema> <arquivo.sql>.',
    '3. Preserve _prisma_migrations; não execute migrations automaticamente durante a restauração.',
    '4. Os caminhos de ChamadaPublicaDocumento são relativos a PNAE_MT_2025/. Os arquivos originais estão em documentos/PNAE_MT_2025_PACOTE_IMPORTACAO/PNAE_MT_2025/.',
    '5. Reponha essa pasta na raiz de documentos do sistema ou configure o storage para resolver os caminhos relativos.',
    '6. Confira manifesto-arquivos.json e manifesto-arquivos.sha256.', '',
  ].join('\n'), 'utf8');

  const consultas = [
    'SELECT COUNT(*) FROM pnae_chamadas_publicas WHERE exercicio=2025',
    "SELECT COUNT(*) FROM pnae_edital_itens WHERE createdBy='importacao-historica-pnae-2025'",
    "SELECT COUNT(*) FROM pnae_chamadas_publicas_documentos WHERE tipo='EDITAL_HISTORICO'",
    'SELECT COUNT(*) FROM pnae_chamadas_publicas WHERE exercicio=2026',
    'SELECT COUNT(*) FROM _prisma_migrations WHERE rolled_back_at IS NULL',
  ];
  const validacao = validarRestoreDump(sql, consultas, [
    Number(resumo.chamadas2025), Number(resumo.itensImportados), Number(resumo.documentosVinculados),
    Number(resumo.chamadas2026), Number(resumo.migrations),
  ]);
  fs.writeFileSync(path.join(diretorio, 'validacao-restauracao.json'), JSON.stringify({ status: 'PASS', ...validacao, resumo }, null, 2), 'utf8');
  const manifesto = { formato: 'pnae-backup-files/1', banco: 'merenda_pnae', geradoEm: new Date().toISOString(), arquivos: coletarArquivos(diretorio) };
  const manifestoTexto = JSON.stringify(manifesto, null, 2);
  fs.writeFileSync(path.join(diretorio, 'manifesto-arquivos.json'), manifestoTexto, 'utf8');
  const manifestoSha256 = createHash('sha256').update(manifestoTexto).digest('hex');
  fs.writeFileSync(path.join(diretorio, 'manifesto-arquivos.sha256'), `${manifestoSha256}  manifesto-arquivos.json\n`, 'ascii');
  return { diretorio, sql, manifestoSha256, validacao };
}

async function capturarEstado2026(prisma: PrismaService): Promise<unknown> {
  return prisma.chamadaPublica.findMany({
    where: { exercicio: 2026 },
    orderBy: { id: 'asc' },
    include: {
      edital: { include: { itens: true, contratos: true, importLogs: true, documento: { include: { anexos: true, versoes: true } }, escolasVinculadas: true } },
      documentos: true,
      escolas: true,
      inscricoes: true,
      projetos: { include: { itens: true } },
      requisitos: true,
      resultados: true,
      recursos: true,
      homologacao: true,
    },
  });
}

function canonizar(valor: any): any {
  if (Array.isArray(valor)) return valor.map(canonizar).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
    return Object.fromEntries(Object.keys(valor).sort().map((chave) => [chave, canonizar(valor[chave])]));
  }
  return valor;
}

async function cmdAplicar(args: string[]): Promise<void> {
  const confirmacao = args.find((arg) => arg.startsWith('--confirmar-destino='))?.split('=', 2)[1];
  if (!confirmacao) throw new Error('CONFIRMACAO_OBRIGATORIA: use --confirmar-destino=merenda_pnae@HP:3306');
  const dotenv = require('dotenv') as { config: (opts: { path: string }) => void };
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

  const staging = lerStagingAprovado();
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const identidade = await prisma.$queryRawUnsafe<Array<{ db: string | null; host: string; porta: number }>>(
      'SELECT DATABASE() AS db, @@hostname AS host, @@port AS porta',
    );
    const alvo = identidade[0];
    if (!alvo || `${alvo.db}@${alvo.host}:${alvo.porta}` !== confirmacao) {
      throw new Error(`DESTINO_DIFERENTE_DA_CONFIRMACAO: efetivo=${alvo?.db}@${alvo?.host}:${alvo?.porta || ''}`);
    }

    const migrations = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>('SELECT COUNT(*) AS total FROM _prisma_migrations WHERE rolled_back_at IS NULL');
    const migrationCount = Number(migrations[0].total);

    const caminhoBackupAntes = path.join(BACKUP_ANTES, 'merenda_pnae_antes_importacao.sql');
    const qAntes = [
      'SELECT COUNT(*) FROM pnae_chamadas_publicas WHERE exercicio=2026',
      'SELECT COUNT(*) FROM pnae_editais',
      'SELECT COUNT(*) FROM pnae_edital_itens',
      'SELECT COUNT(*) FROM _prisma_migrations WHERE rolled_back_at IS NULL',
    ];
    const restoreAntes = validarRestoreDump(caminhoBackupAntes, qAntes, [6, 3, 171, migrationCount]);
    fs.writeFileSync(path.join(BACKUP_ANTES, 'validacao-restore-antes.json'), JSON.stringify({ status: 'PASS', ...restoreAntes, dumpSha256: sha256Arquivo(caminhoBackupAntes) }, null, 2), 'utf8');

    const indices = await prisma.$queryRawUnsafe<Array<{ Key_name: string; Non_unique: number; Seq_in_index: number; Column_name: string }>>(
      'SHOW INDEX FROM pnae_chamadas_publicas',
    );
    const indicesUnicos = new Map<string, typeof indices>();
    for (const index of indices) if (Number(index.Non_unique) === 0) indicesUnicos.set(index.Key_name, [...(indicesUnicos.get(index.Key_name) || []), index]);
    const dreUniqueOk = [...indicesUnicos.values()].some((rows) => rows.sort((a, b) => Number(a.Seq_in_index) - Number(b.Seq_in_index)).map((r) => r.Column_name).join(',') === 'dreId,numero,exercicio');
    if (!dreUniqueOk) throw new Error('INDICE_UNICIDADE_DRE_AUSENTE: nenhum DDL foi executado');

    const dreIds = [...new Set(staging.map((s) => s.vinculosInstitucionais.dre.dreId).filter((id): id is string => Boolean(id)))];
    const municipioIds = [...new Set(staging.map((s) => s.vinculosInstitucionais.municipio.municipioId).filter((id): id is string => Boolean(id)))];
    const entidadeIds = [...new Set(staging.flatMap((s) => s.vinculosInstitucionais.unidadesExecutoras.map((e) => e.entidadeExecutoraId).filter((id): id is string => Boolean(id))))];
    const [dres, municipios, entidades] = await Promise.all([
      prisma.dRE.findMany({ where: { id: { in: dreIds } }, select: { id: true } }),
      prisma.municipio.findMany({ where: { id: { in: municipioIds } }, select: { id: true } }),
      entidadeIds.length ? prisma.entidadeExecutora.findMany({ where: { id: { in: entidadeIds } }, select: { id: true } }) : Promise.resolve([]),
    ]);
    const dreExistentes = new Set(dres.map((r) => r.id));
    const municipiosExistentes = new Set(municipios.map((r) => r.id));
    const entidadesExistentes = new Set(entidades.map((r) => r.id));
    const motivosPreflight = new Map<string, string>();
    const grupos = new Map<string, StagingEdital[]>();
    for (const s of staging) {
      const chave = `${s.vinculosInstitucionais.dre.dreId || 'SEM_DRE'}|${s.identificacao.numeroNormalizado?.trim().toUpperCase()}|${s.identificacao.exercicio}`;
      grupos.set(chave, [...(grupos.get(chave) || []), s]);
    }
    for (const [chave, grupo] of grupos) if (grupo.length > 1) {
      for (const s of grupo) motivosPreflight.set(s.idPacote, `CONFLITO_UNICIDADE_DRE_NUMERO_EXERCICIO: ${chave}; revisão documental necessária`);
    }
    for (const s of staging) {
      const dreId = s.vinculosInstitucionais.dre.dreId;
      const municipioId = s.vinculosInstitucionais.municipio.municipioId;
      if (!dreId || !dreExistentes.has(dreId)) motivosPreflight.set(s.idPacote, `DRE_NAO_RESOLVIDA_OU_AUSENTE_NO_BANCO: ${s.vinculosInstitucionais.dre.detalhe}`);
      else if (!municipioId || !municipiosExistentes.has(municipioId)) motivosPreflight.set(s.idPacote, `MUNICIPIO_NAO_RESOLVIDO_OU_AUSENTE_NO_BANCO: ${s.vinculosInstitucionais.municipio.detalhe}`);
      else if (s.vinculosInstitucionais.unidadesExecutoras.some((e) => e.entidadeExecutoraId && !entidadesExistentes.has(e.entidadeExecutoraId))) {
        motivosPreflight.set(s.idPacote, 'ENTIDADE_EXECUTORA_VINCULADA_AUSENTE_NO_BANCO');
      }
    }
    for (const [id, motivo] of motivosPreflight) {
      const s = staging.find((row) => row.idPacote === id)!;
      bloquearNoStaging(s, motivo);
    }
    let lote = staging.filter((s) => s.decisao === 'APROVADO');
    const chamadasExistentes = await prisma.chamadaPublica.findMany({ select: { numero: true, exercicio: true, dreId: true } });
    const chavesExistentes = new Set(chamadasExistentes.map((c) => `${c.dreId || 'SEM_DRE'}|${c.numero.trim().toUpperCase()}|${c.exercicio}`));
    const idempotencias = await prisma.idempotenciaOperacao.findMany({ where: { operacao: OPERACAO }, select: { chave: true } });
    const idemExistentes = new Set(idempotencias.map((i) => i.chave));
    for (const s of [...lote]) {
      const chave = `${s.vinculosInstitucionais.dre.dreId}|${s.identificacao.numeroNormalizado!.trim().toUpperCase()}|${s.identificacao.exercicio}`;
      const idem = chaveIdempotenciaOperacao(OPERACAO, s.chaveLogica);
      if (chavesExistentes.has(chave) && !idemExistentes.has(idem)) {
        const motivo = `CHAMADA_EXISTENTE_SEM_IDEMPOTENCIA: ${chave}; mantida pendente, sem sobrescrita`;
        bloquearNoStaging(s, motivo);
        motivosPreflight.set(s.idPacote, motivo);
      }
    }
    lote = lote.filter((s) => s.decisao === 'APROVADO');
    if (!lote.length) throw new Error('NENHUM_CANDIDATO_ELEGIVEL_APOS_VALIDACOES');

    const hashesDocumento = await prisma.chamadaPublicaDocumento.findMany({ where: { hashSha256: { not: null } }, select: { hashSha256: true } });
    const plano = simularImportacao(lote, {
      chamadasPublicas: chamadasExistentes,
      editais: [],
      hashesDocumento: hashesDocumento.map((d) => d.hashSha256!).filter(Boolean),
      idempotencias: [...idemExistentes],
    });
    if (plano.resumo.bloqueados !== 0) throw new Error(`PLANO_COM_BLOQUEIOS: ${JSON.stringify(plano.resumo)}`);

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', active: true, deletedAt: null }, select: { id: true }, take: 1 });
    if (!admins.length) throw new Error('ADMIN_ATIVO_NAO_ENCONTRADO: auditoria requer usuário ADMIN existente');
    const estadoAntes = await capturarEstado2026(prisma);
    if ((estadoAntes as unknown[]).length !== 6) throw new Error(`ESTADO_2026_INESPERADO: ${(estadoAntes as unknown[]).length} chamadas`);
    const estadoAntesPath = path.join(BACKUP_ANTES, 'estado-chamadas-2026-antes.json');
    fs.writeFileSync(estadoAntesPath, JSON.stringify(estadoAntes, null, 2), 'utf8');

    const chamadas2025Antes = await prisma.chamadaPublica.count({ where: { exercicio: 2025 } });
    const itensAntes = await prisma.editalItem.count({ where: { createdBy: 'importacao-historica-pnae-2025' } });
    const docsAntes = await prisma.chamadaPublicaDocumento.count({ where: { tipo: 'EDITAL_HISTORICO' } });
    const editaisAntes = await prisma.edital.count();
    const executor = new ExecutorImportacaoHistorica(prisma, new PolicyService(prisma), new AuditService(prisma));
    const user = { sub: admins[0].id, role: 'ADMIN' } as AuthenticatedUser;
    const resultado = await executor.executar(lote, user, { confirmacaoDestino: confirmacao });
    const resultadoPorId = new Map(resultado.procedimentos.map((p) => [p.idPacote, p]));
    for (const p of resultado.procedimentos.filter((r) => r.decisao === 'BLOQUEADO')) {
      const s = lote.find((row) => row.idPacote === p.idPacote)!;
      const motivo = `FALHA_PERSISTENCIA: ${(p.motivos || []).join('; ')}`;
      bloquearNoStaging(s, motivo);
      motivosPreflight.set(s.idPacote, motivo);
    }
    const loteIdempotencia = lote.filter((s) => resultadoPorId.get(s.idPacote)?.decisao !== 'BLOQUEADO');
    const segunda = await executor.executar(loteIdempotencia, user, { confirmacaoDestino: confirmacao });
    const idempotenciaOk = segunda.importados === 0 && segunda.jaExistentes === loteIdempotencia.length && segunda.bloqueados === 0;
    if (!idempotenciaOk) throw new Error(`IDEMPOTENCIA_FALHOU: ${JSON.stringify({ lote: loteIdempotencia.length, importados: segunda.importados, jaExistentes: segunda.jaExistentes, bloqueados: segunda.bloqueados })}`);

    const estadoDepois = await capturarEstado2026(prisma);
    const estado2026Preservado = JSON.stringify(canonizar(estadoAntes)) === JSON.stringify(canonizar(estadoDepois));
    if (!estado2026Preservado) throw new Error('REGISTROS_2026_DIVERGIRAM: estado posterior difere do snapshot anterior');
    const [chamadas2025, itensImportados, documentosVinculados, editaisDepois, chamadas2026, auditorias] = await Promise.all([
      prisma.chamadaPublica.count({ where: { exercicio: 2025 } }),
      prisma.editalItem.count({ where: { createdBy: 'importacao-historica-pnae-2025' } }),
      prisma.chamadaPublicaDocumento.count({ where: { tipo: 'EDITAL_HISTORICO' } }),
      prisma.edital.count(),
      prisma.chamadaPublica.count({ where: { exercicio: 2026 } }),
      prisma.auditLog.count({ where: { action: 'IMPORTACAO_HISTORICA' } }),
    ]);
    const documentosEsperadosNovos = lote.filter((s) => resultadoPorId.get(s.idPacote)?.decisao === 'IMPORTADO').reduce((n, s) => n + s.documentos.length, 0);
    if (chamadas2025 !== chamadas2025Antes + resultado.importados || itensImportados !== itensAntes + resultado.itensCriados || documentosVinculados !== docsAntes + documentosEsperadosNovos || editaisDepois !== editaisAntes + resultado.importados) {
      throw new Error(`CONTAGENS_POS_IMPORTACAO_DIVERGENTES: ${JSON.stringify({ chamadas2025, chamadas2025Antes, importados: resultado.importados, itensImportados, itensAntes, itensCriados: resultado.itensCriados, documentosVinculados, docsAntes, documentosEsperadosNovos, editaisDepois, editaisAntes })}`);
    }
    const integridade = await prisma.$queryRawUnsafe<Array<{ orfaos: bigint }>>(
      'SELECT (SELECT COUNT(*) FROM pnae_chamadas_publicas c LEFT JOIN pnae_editais e ON e.id=c.editalId WHERE e.id IS NULL) + (SELECT COUNT(*) FROM pnae_edital_itens i LEFT JOIN pnae_editais e ON e.id=i.editalId WHERE e.id IS NULL) + (SELECT COUNT(*) FROM pnae_chamadas_publicas_documentos d LEFT JOIN pnae_chamadas_publicas c ON c.id=d.chamadaId WHERE c.id IS NULL) AS orfaos',
    );
    if (Number(integridade[0].orfaos) !== 0) throw new Error(`ORFAOS_REFERENCIAIS: ${integridade[0].orfaos}`);
    const dresContempladas = await prisma.chamadaPublica.findMany({ where: { exercicio: 2025 }, distinct: ['dreId'], select: { dreId: true, dre: { select: { nome: true } } } });
    const resumoFinal = { chamadas2025, itensImportados, documentosVinculados, chamadas2026, migrations: migrationCount };
    const backupFinal = gerarBackupFinal(resumoFinal);
    const relatorio = {
      destino: alvo,
      candidatosIniciais: 51,
      elegiveisAntesDaPersistencia: lote.length,
      chamadasCriadas: resultado.importados,
      chamadasJaExistentes: resultado.jaExistentes,
      itensPersistidos: resultado.itensCriados,
      documentosVinculadosNovos: documentosEsperadosNovos,
      dres: dresContempladas.map((d) => d.dre?.nome || d.dreId),
      procedimentosPendentes: [...motivosPreflight].map(([idPacote, motivo]) => ({ idPacote, motivo })),
      falhasIndividuais: resultado.procedimentos.filter((p) => p.decisao === 'BLOQUEADO'),
      bloqueadosOuSegregadosOriginais: 74,
      auditorias,
      integridadeReferencial: Number(integridade[0].orfaos) === 0,
      idempotenciaOk,
      registros2026Preservados: estado2026Preservado,
      snapshotAntes: estadoAntesPath,
      backupFinal,
    };
    const relatorioJson = JSON.stringify(relatorio, (_chave, valor) => typeof valor === 'bigint' ? Number(valor) : valor, 2);
    fs.writeFileSync(path.join(BACKUP_ANTES, 'relatorio-importacao-pnae-2025.json'), relatorioJson, 'utf8');
    console.log(relatorioJson);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  const comando = (process.argv[2] || '').toLowerCase();
  if (comando === 'staging') await cmdStaging();
  else if (comando === 'dry-run') await cmdDryRun();
  else if (comando === 'aplicar') await cmdAplicar(process.argv.slice(3));
  else {
    console.error('uso: importacao-historica-pnae-2025.ts <staging|dry-run|aplicar>');
    process.exitCode = 64;
  }
})().catch((e) => {
  console.error('FATAL', e.stack || e.message);
  process.exit(1);
});
