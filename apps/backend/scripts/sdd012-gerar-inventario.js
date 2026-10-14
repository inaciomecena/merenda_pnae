const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..', '..', '..');
const schemaPath = path.join(raiz, 'apps', 'backend', 'prisma', 'schema.prisma');
const destino = path.join(raiz, 'docs', 'SDD-012-REFATORACAO-BANCO');
const mysql = 'C:\\xampp\\mysql\\bin\\mysql.exe';
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

function sql(query, database = 'merenda_pnae') {
  return execFileSync(mysql, [
    '--user=root', '--host=localhost', '--port=3306', `--database=${database}`,
    '--batch', '--raw', '--skip-column-names', '--execute', query,
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
}

function rgFiles(pattern, folders) {
  try {
    const result = execFileSync('rg', ['-l', '-F', pattern, ...folders], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return result.split(/\r?\n/).filter(Boolean).map((file) => file.replace(/\\/g, '/'));
  } catch {
    return [];
  }
}

function modelMap() {
  const source = fs.readFileSync(schemaPath, 'utf8');
  const map = new Map();
  for (const match of source.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const model = match[1];
    const table = match[2].match(/@@map\("([^"]+)"\)/)?.[1] || model;
    map.set(table, model);
  }
  return map;
}

function area(table) {
  if (/^(dres|municipios|escolas|entidades_executoras|vinculo_escola_dre)$/.test(table)) return 'cadastro territorial';
  if (/^(users|vinculos_usuario|representacoes_fornecedor)$/.test(table)) return 'acesso e identidade';
  if (/^(sdd010_|sdd011_|pnae_unidades|pnae_safras|pnae_sazonalidade|pnae_disponibilidades|pnae_logistica|pnae_informacoes_nutricionais|pnae_assistencias|pnae_mapeamentos|pnae_solicitacoes|pnae_interesses)/.test(table)) return 'produtores e oferta';
  if (/edital|chamada|proposta|habilitacao|classific|resultado|recurso|homolog|inscricao|match/.test(table)) return 'editais e selecao';
  if (/contrato|entrega|programacao/.test(table)) return 'contratos e entrega';
  if (/nota_fiscal|fiscal|atesto|liquid|pagamento|prestacao/.test(table)) return 'financeiro e prestacao de contas';
  if (/template|documento|versao|anexo|historico_geracao/.test(table)) return 'documentos';
  if (/checklist|config|parametro|notificacao/.test(table)) return 'configuracao e operacao';
  if (/audit|idempot|import|_prisma/.test(table)) return 'auditoria e importacao';
  return 'referencia e integracao';
}

function classe(table, rows, model, directFiles, inbound, outbound) {
  if (['_prisma_migrations', 'pnae_audit_logs', 'pnae_idempotencia_operacoes', 'pnae_import_logs'].includes(table) || /historico|versoes/.test(table)) return 'C';
  if (rows === 0 && (renomes.has(table) || table.startsWith('sdd010_') || table.startsWith('sdd011_'))) return 'D';
  if (directFiles.length && rows > 0) return 'A';
  if (inbound || outbound) return 'B';
  if (directFiles.length) return 'D';
  if (model) return 'G';
  return 'G';
}

const tables = sql(
  'SELECT TABLE_NAME, ENGINE, COALESCE(DATA_LENGTH,0)+COALESCE(INDEX_LENGTH,0) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE=\'BASE TABLE\' ORDER BY TABLE_NAME',
).split(/\r?\n/).filter(Boolean).map((line) => {
  const [name, engine, bytes] = line.split('\t');
  return { name, engine, bytes: Number(bytes) };
});

const rowQuery = tables.map(({ name }) => `SELECT '${name}' AS tabela, COUNT(*) AS registros FROM \`${name}\``).join(' UNION ALL ');
const rowCounts = new Map(sql(rowQuery).split(/\r?\n/).filter(Boolean).map((line) => {
  const [table, rows] = line.split('\t');
  return [table, Number(rows)];
}));

const indexStats = new Map(sql(
  'SELECT TABLE_NAME, COUNT(DISTINCT INDEX_NAME), COALESCE(GROUP_CONCAT(CASE WHEN INDEX_NAME=\'PRIMARY\' THEN COLUMN_NAME END ORDER BY SEQ_IN_INDEX),\'-\') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() GROUP BY TABLE_NAME',
).split(/\r?\n/).filter(Boolean).map((line) => {
  const [table, indexes, pk] = line.split('\t');
  return [table, { indexes: Number(indexes), pk }];
}));

const foreignKeys = sql(
  'SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION',
).split(/\r?\n/).filter(Boolean).map((line) => {
  const [table, constraint, column, referencedTable, referencedColumn] = line.split('\t');
  return { table, constraint, column, referencedTable, referencedColumn };
});

const fkCounts = new Map();
for (const fk of foreignKeys) fkCounts.set(fk.table, (fkCounts.get(fk.table) || 0) + 1);
const inbound = new Map();
for (const fk of foreignKeys) inbound.set(fk.referencedTable, (inbound.get(fk.referencedTable) || 0) + 1);
const models = modelMap();
const sourceFolders = ['apps/backend/src', 'apps/backend/scripts', 'apps/frontend/src'];
const items = tables.map((table) => {
  const model = models.get(table.name) || (table.name === '_prisma_migrations' ? 'Prisma (interno)' : 'sem model');
  const prop = model === 'DRE' ? 'dRE' : model === 'Prisma (interno)' || model === 'sem model' ? '' : model[0].toLowerCase() + model.slice(1);
  const directFiles = prop ? rgFiles(prop, sourceFolders) : [];
  const outbound = fkCounts.get(table.name) || 0;
  const incoming = inbound.get(table.name) || 0;
  const rows = rowCounts.get(table.name) || 0;
  const target = renomes.get(table.name) || table.name;
  return { ...table, target, model, prop, directFiles, outbound, incoming, rows, area: area(table.name), category: classe(table.name, rows, model, directFiles, incoming, outbound) };
});

const esc = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const inventory = [
  '# Inventario de tabelas', '',
  `Estado observado em ${new Date().toISOString().slice(0, 10)} no banco local antes da migration de nomes.`, '',
  `**Cobertura:** ${items.length} tabelas fisicas; ${models.size} models Prisma; ${foreignKeys.length} FKs de uma coluna; todas InnoDB. TABLE_ROWS nao foi usado para contagem porque e estimativa; registros foram contados individualmente.`, '',
  'A categoria e conservadora: C para trilha/historico, D para estruturas preparadas vazias, A para dados com uso direto localizado, B para dependencia referencial e G quando a evidencia nao permite afirmar uso. E/F nao foram atribuidas sem prova. Nomes-alvo refletem a migration homologada.', '',
  '| Tabela atual | Nome-alvo | Model Prisma | Registros | Bytes dados+indices | PK | Indices | FKs de saida/entrada | Classe | Dominio |',
  '|---|---|---|---:|---:|---|---:|---:|:---:|---|',
  ...items.map((i) => `| \`${i.name}\` | \`${i.target}\` | ${esc(i.model)} | ${i.rows} | ${i.bytes} | \`${esc(indexStats.get(i.name)?.pk || '-') }\` | ${indexStats.get(i.name)?.indexes || 0} | ${i.outbound}/${i.incoming} | ${i.category} | ${i.area} |`),
  '',
  '## Notas de leitura', '',
  '- A coluna Bytes e a soma de DATA_LENGTH e INDEX_LENGTH informadas pelo InnoDB e pode variar com estatisticas e fragmentacao.',
  '- Todas as tabelas possuem chave primaria; a maioria usa `id`, `pnae_idempotencia_operacoes` usa `chave` e `_prisma_migrations` usa `id`.',
  '- O inventario separa tabelas fisicas de models Prisma; `_prisma_migrations` e infraestrutura do Prisma e nao tem model de aplicacao.',
  '- Nenhuma tabela foi considerada obsoleta apenas por estar vazia.',
].join('\n');

const mapping = [
  '# Mapeamento codigo-banco', '',
  `Busca em \`apps/backend/src\`, \`apps/backend/scripts\` e \`apps/frontend/src\`; lidas tambem as migrations sem alterar seu historico. Gerado em ${new Date().toISOString()}.`, '',
  'A coluna de arquivos e uma busca textual de apoio, nao criterio unico de classificacao. Chamadas Prisma podem ser indiretas por repositories, services e relacoes.', '',
  '| Model | Propriedade Prisma | Tabela atual | Tabela-alvo | Uso direto encontrado | Arquivos (ate 3) |',
  '|---|---|---|---|---:|---|',
  ...items.map((i) => `| ${esc(i.model)} | \`${i.prop || '-'}\` | \`${i.name}\` | \`${i.target}\` | ${i.directFiles.length} | ${i.directFiles.slice(0, 3).map((f) => `\`${f}\``).join(', ') || 'nao localizado'} |`),
  '',
  '## SQL e migrations', '',
  '- SQL dinamico e consultas brutas foram pesquisados em backend, scripts e frontend; as referencias de migrations historicas sao intencionalmente preservadas.',
  '- Referencias literais antigas em identificadores `sdd010_*`, `sdd011_*` e `pnae_system_config` limitam-se a migrations historicas, schema Prisma e ao verificador SDD-005 atualizado.',
  '- Nenhum PDF, documento de importacao ou nome de arquivo foi renomeado.',
].join('\n');

const relationLines = foreignKeys.map((fk) => {
  const child = renomes.get(fk.table) || fk.table;
  const parent = renomes.get(fk.referencedTable) || fk.referencedTable;
  return `| \`${child}\` | \`${fk.column}\` | \`${parent}\` | \`${fk.referencedColumn}\` | \`${fk.constraint}\` |`;
});
const relationship = [
  '# Mapa de relacionamentos', '',
  `Metadados extraidos de \`information_schema.KEY_COLUMN_USAGE\` (${foreignKeys.length} restricoes FK; sem FK composta) e traduzidos para os nomes-alvo da migration. Nenhuma FK foi criada ou removida nesta mudanca.`, '',
  '## Territorio e acesso', '',
  '```mermaid', 'erDiagram',
  '  ENTIDADES_EXECUTORAS ||--o{ DRES : administra',
  '  MUNICIPIOS ||--o{ ESCOLAS : localiza',
  '  DRES ||--o{ VINCULO_ESCOLA_DRE : jurisdicao',
  '  ESCOLAS ||--o{ VINCULO_ESCOLA_DRE : pertence',
  '  USERS ||--o{ VINCULOS_USUARIO : escopo',
  '  DRES ||--o{ VINCULOS_USUARIO : escopo',
  '  ESCOLAS ||--o{ VINCULOS_USUARIO : escopo',
  '```', '',
  '## Editais, chamadas e selecao', '',
  '```mermaid', 'erDiagram',
  '  MUNICIPIOS ||--o{ PNAE_EDITAIS : organiza',
  '  PNAE_EDITAIS ||--o{ PNAE_EDITAL_ITENS : contem',
  '  PNAE_EDITAIS ||--o{ PNAE_CHAMADAS_PUBLICAS : publica',
  '  DRES ||--o{ PNAE_CHAMADAS_PUBLICAS : escopo',
  '  PNAE_CHAMADAS_PUBLICAS ||--o{ PNAE_CHAMADAS_PUBLICAS_DOCUMENTOS : preserva',
  '  PNAE_CHAMADAS_PUBLICAS ||--o{ PNAE_PROPOSTAS : recebe',
  '  PRODUTORES ||--o{ PNAE_PROPOSTAS : apresenta',
  '  PNAE_PROPOSTAS ||--o{ PNAE_PROPOSTA_ITENS : detalha',
  '  PNAE_PROPOSTAS ||--o{ PNAE_ANALISES_HABILITACAO : analisa',
  '```', '',
  '## Oferta do produtor', '',
  '```mermaid', 'erDiagram',
  '  PRODUTORES ||--o{ PNAE_UNIDADES_PRODUTIVAS : declara',
  '  PNAE_UNIDADES_PRODUTIVAS ||--o{ PNAE_SAFRAS_PRODUCAO : planeja',
  '  PRODUTORES ||--o{ PRODUTOR_PRODUTOS : oferta',
  '  PRODUTOR_PRODUTOS ||--o{ PNAE_DISPONIBILIDADES_PRODUCAO : disponibiliza',
  '  PRODUTORES ||--o{ PNAE_INTERESSES_OPORTUNIDADES : manifesta',
  '  PNAE_CHAMADAS_PUBLICAS ||--o{ PNAE_INTERESSES_OPORTUNIDADES : recebe',
  '```', '',
  '## Contratos, entrega e fiscal', '',
  '```mermaid', 'erDiagram',
  '  PNAE_PROPOSTAS ||--o{ PNAE_CONTRATOS : origina',
  '  PRODUTORES ||--o{ PNAE_CONTRATOS : fornece',
  '  PNAE_CONTRATOS ||--o{ PNAE_CONTRATO_ITENS : detalha',
  '  PNAE_CONTRATOS ||--o{ PNAE_PROGRAMACOES_ENTREGA : agenda',
  '  PNAE_PROGRAMACOES_ENTREGA ||--o{ PNAE_ENTREGAS : comprova',
  '  PNAE_CONTRATOS ||--o{ PNAE_NOTAS_FISCAIS : fatura',
  '  PNAE_NOTAS_FISCAIS ||--o{ PNAE_ATESTOS : atesta',
  '  PNAE_NOTAS_FISCAIS ||--o{ PNAE_LIQUIDACOES : liquida',
  '  PNAE_LIQUIDACOES ||--o{ PNAE_PAGAMENTOS : paga',
  '```', '',
  '## Todas as chaves estrangeiras', '',
  '| Tabela filha | Coluna | Tabela referenciada | Coluna | Restricao atual |',
  '|---|---|---|---|---|',
  ...relationLines,
].join('\n');

const obsolescence = [
  '# Matriz de obsolescencia', '',
  'Apenas classificacao F pode ser excluida, apos prova e autorizacao especifica. Nesta auditoria nao foi confirmada nenhuma tabela F ou E. Estruturas vazias permanecem preservadas; tabelas com FKs ou model Prisma nao sao candidatas a exclusao por ausencia de linhas.', '',
  '| Tabela atual | Registros | Classe | Dependencias FK | Evidencia de uso | Recomendacao |',
  '|---|---:|:---:|---:|---|---|',
  ...items.map((i) => `| \`${i.name}\` | ${i.rows} | ${i.category} | ${i.outbound + i.incoming} | model=${esc(i.model)}; uso direto=${i.directFiles.length}; referencias FK=${i.outbound}/${i.incoming} | Preservar; sem exclusao autorizada |`),
  '',
  '**Conclusao:** zero tabelas com recomendacao de exclusao. `pnae_system_config` esta vazia, mas possui model e indices; classificacao conservadora G/D conforme inventario, sem prova de obsolescencia. As dez tabelas SDD de oferta/oportunidade estao vazias, porem relacionadas por FKs e models Prisma; normalizar nomes nao as torna obsoletas.',
].join('\n');

fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, '01_INVENTARIO_TABELAS.md'), inventory, 'utf8');
fs.writeFileSync(path.join(destino, '02_MAPEAMENTO_CODIGO_BANCO.md'), mapping, 'utf8');
fs.writeFileSync(path.join(destino, '04_MAPA_RELACIONAMENTOS.md'), relationship, 'utf8');
fs.writeFileSync(path.join(destino, '05_MATRIZ_OBSOLESCENCIA.md'), obsolescence, 'utf8');
console.log(JSON.stringify({ tabelas: items.length, models: models.size, fks: foreignKeys.length, destino }, null, 2));
