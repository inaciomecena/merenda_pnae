/** Re-run SDD-009 against the isolated SDD-010 database, never the primary database. */
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const record = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'e2e-sdd010-environment.json'), 'utf8'));
if (!record.isolated || !/^merenda_pnae_sdd010_[a-z0-9]+$/.test(record.database)) throw new Error('Banco isolado inválido');
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${record.database}`;
const env = { ...process.env, DATABASE_URL: url.toString(), PORT: '3210', E2E_BASE_URL: 'http://localhost:3210/api/v1', E2E_PASSWORD: 'Sdd010-test-2026!' };
async function main() {
  const db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  try { const admin = await db.user.findFirst({ where: { role: 'ADMIN' } }); if (!admin) throw new Error('Fixture administrativa ausente'); env.E2E_EMAIL = admin.email; }
  finally { await db.$disconnect(); }
  const server = spawn(process.execPath, [path.resolve(__dirname, '../dist/main.js')], { cwd: path.resolve(__dirname, '..'), env, stdio: 'ignore' });
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) { try { if ((await fetch(`${env.E2E_BASE_URL}/health`)).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 1000)); }
    if (!ready) throw new Error('API isolada indisponível');
    await new Promise((resolve, reject) => {
      const test = spawn(process.execPath, [path.resolve(__dirname, '../../../scripts/e2e-sdd009.js')], { cwd: path.resolve(__dirname, '../../..'), env, stdio: 'inherit' });
      test.on('error', reject); test.on('exit', code => code === 0 ? resolve() : reject(new Error(`SDD-009: código ${code}`)));
    });
  } finally { server.kill(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
