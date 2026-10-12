/**
 * CLI de PREPARAÇÃO da importação histórica PNAE MT 2025.
 *
 * Comandos:
 *   staging  — gera os JSONs de staging em docs/importacao-pnae-2025/staging
 *   dry-run  — simula a importação a partir do staging (NENHUMA escrita)
 *   aplicar  — [GUARDADO, NÃO EXECUTAR SEM AUTORIZAÇÃO EXPLÍCITA] gravação
 *              definitiva; recusa execução sem flag --confirmar e sem backup.
 *
 * REGRA DE OURO: staging e dry-run nunca escrevem no banco. O comando
 * `aplicar` é um placeholder protegido: a implementação definitiva deve
 * reutilizar os services existentes (importador-editais / chamadas-publicas)
 * e só será executada em etapa separada, com autorização e backup prévio.
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
} from '../src/modules/importacao-historica';

const DOCS = path.resolve(__dirname, '..', '..', '..', 'docs', 'importacao-pnae-2025');
const STAGING_DIR = path.join(DOCS, 'staging');
const SNAPSHOT_PATH = path.join(DOCS, 'snapshot-institucional.json');
const PACOTE_DIR = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');

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

function cmdAplicar(): void {
  console.error(
    [
      'BLOQUEADO: o comando `aplicar` NÃO está habilitado nesta etapa.',
      '',
      'A gravação definitiva depende de:',
      '  1. autorização explícita em etapa separada desta preparação;',
      '  2. backup do banco (mysqldump) antes de qualquer escrita;',
      '  3. implementação reutilizando os services existentes',
      '     (importador-editais / chamadas-publicas), não código novo;',
      '  4. conferência do dry-run-plano.json sem bloqueios inesperados.',
      '',
      'Nada foi gravado. Nenhuma migration foi aplicada.',
    ].join('\n'),
  );
  process.exitCode = 3;
}

(async () => {
  const comando = (process.argv[2] || '').toLowerCase();
  if (comando === 'staging') await cmdStaging();
  else if (comando === 'dry-run') await cmdDryRun();
  else if (comando === 'aplicar') cmdAplicar();
  else {
    console.error('uso: importacao-historica-pnae-2025.ts <staging|dry-run|aplicar>');
    process.exitCode = 64;
  }
})().catch((e) => {
  console.error('FATAL', e.stack || e.message);
  process.exit(1);
});
