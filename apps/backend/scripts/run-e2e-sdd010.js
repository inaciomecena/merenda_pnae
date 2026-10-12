/** Isolated SDD-010 runner. Creates a new database; never drops or resets one. */
const { spawn } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const original = new URL(process.env.DATABASE_URL || '');
if (original.pathname.slice(1) !== 'merenda_pnae') throw new Error('Banco de origem inesperado');
const reuse = process.env.E2E_REUSE === '1';
const prior = reuse ? JSON.parse(fs.readFileSync(path.resolve(__dirname, 'e2e-sdd010-environment.json'), 'utf8')) : null;
const name = prior?.database || `merenda_pnae_sdd010_${Date.now().toString(36)}`;
if (!/^merenda_pnae_sdd010_[a-z0-9]+$/.test(name)) throw new Error('Banco isolado inválido');
const isolated = new URL(original);
isolated.pathname = `/${name}`;
const env = { ...process.env, DATABASE_URL: isolated.toString(), PORT: '3210', E2E_BASE: 'http://localhost:3210/api/v1' };
const root = path.resolve(__dirname, '..');
const node = process.execPath;
function command(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(node, args, { cwd: root, env, stdio: 'inherit' });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${args[0]} saiu com código ${code}`)));
    child.on('error', reject);
  });
}
async function ready() {
  for (let i = 0; i < 60; i++) {
    try { const response = await fetch(`${env.E2E_BASE}/health`); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('API isolada não iniciou');
}
async function main() {
  if (!reuse) {
    const system = new URL(original); system.pathname = '/mysql';
    const prisma = new PrismaClient({ datasources: { db: { url: system.toString() } } });
    try { await prisma.$executeRawUnsafe(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); }
    finally { await prisma.$disconnect(); }
    const evidence = path.resolve(root, 'scripts/e2e-sdd010-environment.json');
    fs.writeFileSync(evidence, JSON.stringify({ database: name, isolated: true, createdAt: new Date().toISOString() }, null, 2));
    console.log(`Banco isolado criado: ${name}`);
    await command([path.resolve(root, '../../node_modules/prisma/build/index.js'), 'migrate', 'deploy']);
  } else console.log(`Reutilizando banco isolado: ${name}`);
  const server = spawn(node, [path.resolve(root, 'dist/main.js')], { cwd: root, env, stdio: 'ignore' });
  try { await ready(); await command([path.resolve(__dirname, 'e2e-sdd010.js')]); }
  finally { server.kill(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
