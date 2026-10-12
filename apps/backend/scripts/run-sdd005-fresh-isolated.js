/** Fresh, nondestructive SDD-005 regression fixture. Creates a new database. */
const { spawn } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const backend = path.resolve(__dirname, '..');
const root = path.resolve(__dirname, '../../..');
const source = new URL(process.env.DATABASE_URL || '');
if (source.pathname.slice(1) !== 'merenda_pnae') throw new Error('Banco de origem inesperado');
const name = `merenda_pnae_sdd005_${Date.now().toString(36)}`;
const url = new URL(source); url.pathname = `/${name}`;
const env = { ...process.env, DATABASE_URL: url.toString(), PORT: '3212', E2E_BASE: 'http://localhost:3212/api/v1', BOOTSTRAP_ADMIN_TOKEN: 'sdd005-e2e-bootstrap-2026', TS_NODE_PROJECT: path.resolve(backend, 'tsconfig.json'), TS_NODE_TRANSPILE_ONLY: '1' };
function command(args, cwd = backend, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, stdio: output ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    if (output) {
      child.stdout.on('data', chunk => { process.stdout.write(chunk); output.push(String(chunk)); });
      child.stderr.on('data', chunk => { process.stderr.write(chunk); output.push(String(chunk)); });
    }
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${args.at(-1)} saiu com código ${code}`)));
  });
}
async function main() {
  const system = new URL(source); system.pathname = '/mysql';
  const db = new PrismaClient({ datasources: { db: { url: system.toString() } } });
  try { await db.$executeRawUnsafe(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); }
  finally { await db.$disconnect(); }
  console.log(`Banco isolado criado: ${name}`);
  await command([path.resolve(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy']);
  const context = path.resolve(__dirname, '.e2e-sdd005-context.json');
  if (fs.existsSync(context)) fs.copyFileSync(context, path.resolve(__dirname, '../../..', 'output/e2e/sdd005-context-before-sdd010.json'));
  for (const file of ['prisma/seed.ts', 'prisma/seed-test.ts', 'scripts/e2e-sdd005-seed.ts']) await command(['-r', require.resolve('ts-node/register'), path.resolve(backend, file)]);
  const server = spawn(process.execPath, [path.resolve(backend, 'dist/main.js')], { cwd: backend, env, stdio: 'ignore' });
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) { try { if ((await fetch(`${env.E2E_BASE}/health`)).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 1000)); }
    if (!ready) throw new Error('API isolada indisponível');
    const output = [];
    try { await command(['-r', require.resolve('ts-node/register'), path.resolve(__dirname, 'e2e-sdd005-run.ts')], backend, output); }
    finally { fs.writeFileSync(path.resolve(__dirname, 'e2e-sdd005-sdd010-run.log'), output.join('')); }
  } finally { server.kill(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
