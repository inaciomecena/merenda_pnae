#!/usr/bin/env node
/**
 * Script de diagnóstico SDD-001
 * Compara dump merenda.sql com schema Prisma e migrações sem tocar no banco ativo.
 * Não executa migrate deploy, migrate reset, db push ou seed.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');
const dumpPath = path.join(rootDir, 'merenda.sql');
const schemaPath = path.join(rootDir, 'apps/backend/prisma/schema.prisma');
const migrationsDir = path.join(rootDir, 'apps/backend/prisma/migrations');

console.log('=== SDD-001: Validação de Compatibilidade (modo estático) ===\n');

// 1. Verificar arquivos base
console.log('1. Verificando arquivos base...');
const fileChecks = [
  { path: dumpPath, name: 'merenda.sql' },
  { path: schemaPath, name: 'schema.prisma' },
  { path: migrationsDir, name: 'migrations/' }
];

fileChecks.forEach(({ path, name }) => {
  const exists = fs.existsSync(path);
  console.log(`   ${exists ? '✓' : '✗'} ${name}: ${exists ? 'encontrado' : 'NÃO ENCONTRADO'}`);
  if (!exists && name === 'merenda.sql') {
    console.error('\n❌ ERRO: dump merenda.sql não encontrado. Abortando.');
    process.exit(1);
  }
});

// 2. Extrair tabelas do dump
console.log('\n2. Extraindo estrutura do dump...');
const dumpContent = fs.readFileSync(dumpPath, 'utf8');
const dumpTables = [];
const createTableRegex = /CREATE TABLE IF NOT EXISTS `([^`]+)`/g;
let match;
while ((match = createTableRegex.exec(dumpContent)) !== null) {
  dumpTables.push(match[1]);
}
console.log(`   Tabelas no dump: ${dumpTables.length}`);
dumpTables.sort().forEach(t => console.log(`      - ${t}`));

// 3. Extrair models do schema Prisma
console.log('\n3. Extraindo models do schema.prisma...');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const prismaModels = [];
const modelRegex = /model\s+(\w+)\s*{/g;
while ((match = modelRegex.exec(schemaContent)) !== null) {
  prismaModels.push(match[1]);
}
console.log(`   Models no schema: ${prismaModels.length}`);

// Mapear para nomes de tabela (convenção @@map)
const prismaTables = [];
const mapRegex = /model\s+(\w+)\s*\{[\s\S]*?@@map\("([^"]+)"\)/g;
while ((match = mapRegex.exec(schemaContent)) !== null) {
  prismaTables.push({ model: match[1], table: match[2] });
}
console.log(`   Tables mapeados: ${prismaTables.length}`);
prismaTables.forEach(t => console.log(`      - ${t.model} → ${t.table}`));

// 4. Listar migrações aplicadas no dump
console.log('\n4. Migrações aplicadas (dump)...');
const migrationsInDump = [];
const migrationInsertRegex = /'\d{14}_[^']+'/g;
while ((match = migrationInsertRegex.exec(dumpContent)) !== null) {
  migrationsInDump.push(match[0].replace(/'/g, ''));
}
console.log(`   Migrações no dump: ${migrationsInDump.length}`);
migrationsInDump.sort().forEach(m => console.log(`      ✓ ${m}`));

// 5. Listar migrações no repositório
console.log('\n5. Migrações no repositório...');
const migrationsInRepo = fs.readdirSync(migrationsDir)
  .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
  .sort();
console.log(`   Migrações no repo: ${migrationsInRepo.length}`);
migrationsInRepo.forEach(m => {
  const applied = migrationsInDump.includes(m);
  console.log(`      ${applied ? '✓' : '⚠'} ${m} ${applied ? '(aplicada)' : '(PENDENTE)'}`);
});

// 6. Detectar divergências de tabelas
console.log('\n6. Comparando tabelas...');
const tablesInSchemaOnly = prismaTables
  .map(t => t.table)
  .filter(t => !dumpTables.includes(t));
const tablesInDumpOnly = dumpTables
  .filter(t => !prismaTables.some(pt => pt.table === t) && t !== '_prisma_migrations');

if (tablesInSchemaOnly.length > 0) {
  console.log('   ⚠ Tabelas no schema mas NÃO no dump:');
  tablesInSchemaOnly.forEach(t => console.log(`      - ${t}`));
} else {
  console.log('   ✓ Todas as tabelas do schema estão no dump');
}

if (tablesInDumpOnly.length > 0) {
  console.log('   ⚠ Tabelas no dump mas NÃO no schema:');
  tablesInDumpOnly.forEach(t => console.log(`      - ${t}`));
} else {
  console.log('   ✓ Todas as tabelas do dump estão no schema');
}

// 7. Verificar colunas críticas mencionadas no SDD-001
console.log('\n7. Verificando colunas críticas mencionadas...');
const criticalChecks = [
  { table: 'pnae_system_config', column: null, inDump: dumpTables.includes('pnae_system_config') },
  { table: 'produtores', column: 'dadosDocumentais', inDump: /`dadosDocumentais`/.test(dumpContent) },
  { table: 'pnae_templates_documento', column: 'codigoModelo', inDump: /`codigoModelo`/.test(dumpContent) },
  { table: 'pnae_propostas', column: 'documentosJson', inDump: /`documentosJson`/.test(dumpContent) },
  { table: 'pnae_templates_documento', column: 'finalidade', inDump: /finalidade/.test(dumpContent) },
  { table: 'pnae_templates_documento', column: 'perfilFornecedor', inDump: /perfilFornecedor/.test(dumpContent) }
];

criticalChecks.forEach(({ table, column, inDump }) => {
  const label = column ? `${table}.${column}` : table;
  console.log(`   ${inDump ? '✓' : '✗'} ${label}: ${inDump ? 'presente' : 'AUSENTE'}`);
});

// 8. Verificar referências a arquivos
console.log('\n8. Verificando referências a arquivos...');
const storageRefs = (dumpContent.match(/storage\\\\/g) || []).length;
const storageDirExists = fs.existsSync(path.join(rootDir, 'storage'));
console.log(`   Referências "storage\\\\" no dump: ${storageRefs}`);
console.log(`   Diretório storage/ no projeto: ${storageDirExists ? 'existe' : 'NÃO EXISTE'}`);
if (storageRefs > 0 && !storageDirExists) {
  console.log('   ⚠ Arquivos referenciados podem estar ausentes');
}

// 9. Resumo
console.log('\n=== RESUMO ===');
const pendingMigrations = migrationsInRepo.filter(m => !migrationsInDump.includes(m));
console.log(`✓ Dump analisado: ${dumpTables.length} tabelas, ${migrationsInDump.length} migrações aplicadas`);
console.log(`✓ Schema Prisma: ${prismaModels.length} models, ${prismaTables.length} tabelas mapeadas`);
console.log(`${pendingMigrations.length > 0 ? '⚠' : '✓'} Migrações pendentes: ${pendingMigrations.length}`);
if (pendingMigrations.length > 0) {
  pendingMigrations.forEach(m => console.log(`   - ${m}`));
}
console.log(`${tablesInSchemaOnly.length > 0 || tablesInDumpOnly.length > 0 ? '⚠' : '✓'} Divergências de tabelas: ${tablesInSchemaOnly.length + tablesInDumpOnly.length}`);

const criticalMissing = criticalChecks.filter(c => !c.inDump);
console.log(`${criticalMissing.length > 0 ? '⚠' : '✓'} Colunas críticas ausentes: ${criticalMissing.length}`);
if (criticalMissing.length > 0) {
  criticalMissing.forEach(c => console.log(`   - ${c.column ? `${c.table}.${c.column}` : c.table}`));
}

console.log('\n✓ Análise estática concluída sem tocar no banco ativo.');
console.log('⚠ Para validação completa, restaurar dump em banco isolado.');
