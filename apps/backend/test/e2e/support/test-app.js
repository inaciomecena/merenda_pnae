const { spawn } = require('node:child_process');
const { once } = require('node:events');

async function startNest({ cwd, env, port }) {
  const child = spawn(process.execPath, ['-r', 'ts-node/register/transpile-only', 'src/main.ts'], { cwd, env: { ...process.env, ...env, PORT: String(port), TS_NODE_TRANSPILE_ONLY: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk.toString(); });
  child.stderr.on('data', chunk => { logs += chunk.toString(); });
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try { const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/me`); if (response.status === 401) return { child, logs: () => logs }; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
    if (child.exitCode !== null) throw new Error(`Nest encerrou durante o boot (${child.exitCode}): ${logs}`);
  }
  child.kill(); throw new Error(`Timeout iniciando Nest: ${logs}`);
}

async function stopNest(app) {
  if (!app?.child || app.child.exitCode !== null) return;
  app.child.kill(); await Promise.race([once(app.child, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))]);
}

module.exports = { startNest, stopNest };
