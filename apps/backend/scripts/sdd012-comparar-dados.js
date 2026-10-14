const { execFileSync } = require('child_process');
const { createHash } = require('crypto');

const mysql = 'C:\\xampp\\mysql\\bin\\mysql.exe';
const antes = process.env.SDD012_ANTES_SCHEMA || 'merenda_pnae_sdd012_backup_20261013';
const depois = process.env.SDD012_DEPOIS_SCHEMA || 'merenda_pnae';
const renomes = new Map([
  ['sdd010_unidades_produtivas', 'pnae_unidades_produtivas'],
  ['sdd010_safras_producao', 'pnae_safras_producao'],
  ['sdd010_sazonalidade_producao', 'pnae_sazonalidade_producao'],
  ['sdd010_disponibilidades_producao', 'pnae_disponibilidades_producao'],
  ['sdd010_logistica_produtor', 'pnae_logistica_produtores'],
  ['sdd010_informacoes_nutricionais', 'pnae_informacoes_nutricionais'],
  ['sdd010_assistencia_tecnica', 'pnae_assistencias_tecnicas'],
  ['sdd010_mapeamentos_produto_edital', 'pnae_mapeamentos_produto_edital'],
  ['sdd011_interesses_oportunidade', 'pnae_interesses_oportunidades'],
  ['sdd010_solicitacoes_catalogo', 'pnae_solicitacoes_catalogo'],
  ['pnae_system_config', 'pnae_configuracoes_sistema'],
]);

function mysqlQuery(query, database) {
  return execFileSync(mysql, [
    '--user=root', '--host=localhost', '--port=3306', `--database=${database}`,
    '--batch', '--skip-column-names', '--execute', query,
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function quote(name) {
  return `\`${name.replace(/`/g, '``')}\``;
}

function readMetadata() {
  const columns = mysqlQuery(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${antes}' ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    antes,
  ).trim().split(/\r?\n/).map((line) => line.split('\t'));
  const keys = mysqlQuery(
    `SELECT TABLE_NAME, COLUMN_NAME, SEQ_IN_INDEX FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='${antes}' AND INDEX_NAME='PRIMARY' ORDER BY TABLE_NAME, SEQ_IN_INDEX`,
    antes,
  ).trim().split(/\r?\n/).map((line) => line.split('\t'));
  const tables = new Map();
  for (const [table, column] of columns) {
    if (table === '_prisma_migrations') continue;
    if (!tables.has(table)) tables.set(table, { columns: [], pk: [] });
    tables.get(table).columns.push(column);
  }
  for (const [table, column] of keys) tables.get(table)?.pk.push(column);
  for (const [table, entry] of tables) if (!entry.pk.length) throw new Error(`PK ausente na origem: ${table}`);
  return tables;
}

function hashByTable(output) {
  const hashes = new Map();
  let table;
  let linhas = [];
  const salvar = () => {
    if (!table) return;
    const conteudo = linhas.join('\n');
    hashes.set(table, { sha256: createHash('sha256').update(conteudo, 'utf8').digest('hex'), linhas: linhas.length });
  };
  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith('@@SDD012_BEGIN@@')) {
      salvar();
      table = line.slice('@@SDD012_BEGIN@@'.length);
      linhas = [];
    } else if (line.length) {
      linhas.push(line);
    }
  }
  salvar();
  return hashes;
}

function lerDados(schema, tabelas) {
  const statements = [];
  for (const [table, { columns, pk }] of tabelas) {
    const atual = schema === antes ? table : (renomes.get(table) || table);
    statements.push(`SELECT '@@SDD012_BEGIN@@${table}';`);
    statements.push(`SELECT ${columns.map(quote).join(', ')} FROM ${quote(atual)} ORDER BY ${pk.map(quote).join(', ')};`);
  }
  return hashByTable(mysqlQuery(statements.join('\n'), schema));
}

const tables = readMetadata();
const before = lerDados(antes, tables);
const after = lerDados(depois, tables);
const differences = [];
for (const [table, left] of before) {
  const right = after.get(table);
  if (!right || left.sha256 !== right.sha256 || left.linhas !== right.linhas) {
    differences.push({ table, before: left, after: right || null });
  }
}
const result = { tablesCompared: tables.size, differences: differences.length, differencesDetail: differences };
console.log(JSON.stringify(result, null, 2));
if (differences.length) process.exitCode = 1;
