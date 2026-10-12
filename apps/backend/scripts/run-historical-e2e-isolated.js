/** Re-run one historical E2E against an existing isolated fixture database. */
const { spawn } = require('node:child_process');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const suite = process.argv[2];
const suites = {
  '005': { database: 'merenda_pnae_sdd005_regressao_20261012', script: 'e2e-sdd005-run.ts' },
  '006': { database: 'merenda_pnae_sdd006_regressao', script: 'e2e-sdd006-run.ts' },
  '007': { database: 'merenda_pnae_sdd008', script: 'e2e-sdd007-run.ts' },
  '008': { database: 'merenda_pnae_sdd008', script: 'e2e-sdd008.ts' },
};
if (!suites[suite]) throw new Error('Informe 005, 006, 007 ou 008');
const selected = suites[suite];
const url = new URL(process.env.DATABASE_URL || '');
if (url.pathname.slice(1) !== 'merenda_pnae') throw new Error('Banco de origem inesperado');
url.pathname = `/${selected.database}`;
const backend = path.resolve(__dirname, '..');
const root = path.resolve(__dirname, '../../..');
const env = { ...process.env, DATABASE_URL: url.toString(), PORT: '3211', E2E_BASE: 'http://localhost:3211/api/v1', BOOTSTRAP_ADMIN_TOKEN: process.env.BOOTSTRAP_ADMIN_TOKEN || 'sdd005-e2e-bootstrap-2026', TS_NODE_TRANSPILE_ONLY: '1', TS_NODE_PROJECT: path.resolve(backend, 'tsconfig.json') };
async function main() {
  const server = spawn(process.execPath, [path.resolve(backend, 'dist/main.js')], { cwd: backend, env, stdio: 'ignore' });
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) { try { if ((await fetch(`${env.E2E_BASE}/health`)).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 1000)); }
    if (!ready) throw new Error('API isolada indisponível');
    const code = await new Promise((resolve, reject) => {
      const cwd = suite === '007' ? root : backend;
      const child = spawn(process.execPath, ['-r', require.resolve('ts-node/register'), path.resolve(__dirname, selected.script)], { cwd, env, stdio: 'inherit' });
      child.on('error', reject); child.on('exit', resolve);
    });
    if (code !== 0) throw new Error(`E2E SDD-${suite} retornou ${code}`);
  } finally { server.kill(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
