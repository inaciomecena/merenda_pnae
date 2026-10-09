// Browser check using an isolated headless Chrome profile and only synthetic records.
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const uid = randomUUID();
const out = path.resolve('storage/validacao-editor');
let chrome, socket, templateId;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  await fs.mkdir(out, { recursive: true });
  try {
    await p.user.create({ data: { id: uid, name: 'Verificação visual DRE', email: `${uid}@example.test`, role: 'DRE', passwordHash: await bcrypt.hash('senha-visual-123', 4) } });
    const auth = await fetch('http://localhost:3000/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${uid}@example.test`, password: 'senha-visual-123' }) });
    const token = (await auth.json()).data.accessToken;
    const response = await fetch('http://localhost:3000/api/v1/templates-documento', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: `Verificação visual ${uid}`, tipo: 'ANEXO_III', formato: 'HTML', conteudo: '<p>Texto para o produtor {{produtor.nome}}.</p>', finalidade: 'PROJETO_VENDA', perfilFornecedor: 'INDIVIDUAL' }) });
    templateId = (await response.json()).data.id;
    chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9223', `--user-data-dir=${path.join(out, 'chrome-profile')}`, '--window-size=1440,1100', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    let targets;
    for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:9223/json')).json(); break; } catch { await sleep(100); } }
    assert(targets?.length, 'Chrome não iniciou');
    socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let seq = 0;
    const waiting = new Map();
    socket.onmessage = event => { const msg = JSON.parse(event.data); if (msg.id) { const fn = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? fn.reject(msg.error) : fn.resolve(msg.result); } };
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; waiting.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
    const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result?.value; };
    const until = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100); } throw new Error(`UI timeout: ${expression}`); };
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await until("location.origin === 'http://localhost:5173' && document.readyState === 'complete'");
    await evaluate(`localStorage.setItem('seaf_token', ${JSON.stringify(token)})`);
    await send('Page.navigate', { url: 'http://localhost:5173/templates-anexos' });
    await until(`document.body.textContent.includes(${JSON.stringify('Verificação visual ' + uid)})`);
    await evaluate(`Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Editar texto').find(b => b.parentElement.parentElement.textContent.includes(${JSON.stringify(uid)})).click()`);
    await until("document.querySelector('[contenteditable=true]') !== null");
    await evaluate("(() => { const e = document.querySelector('[contenteditable=true]'); e.focus(); e.innerHTML += '<p>Texto alterado pela DRE na conferência visual.</p>'; e.dispatchEvent(new InputEvent('input', {bubbles:true, inputType:'insertText'})); })()");
    await sleep(400);
    const screen = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(out, 'editor-dre.png'), Buffer.from(screen.data, 'base64'));
    await evaluate("Array.from(document.querySelectorAll('[role=dialog] button')).find(b => b.textContent === 'Salvar').click()");
    await until("document.querySelector('[role=dialog]') === null");
    const saved = await p.templateDocumento.findUnique({ where: { id: templateId } });
    assert(saved.conteudo.includes('Texto alterado pela DRE na conferência visual.'));
    assert.equal(saved.versaoAtual, 2);
    console.log('OK: DRE abre o editor, altera o texto e salva uma nova versão pela interface.');
    const modelos = await (await fetch('http://localhost:3000/api/v1/templates-documento', { headers: { Authorization: `Bearer ${token}` } })).json();
    const referencia = modelos.data.find(modelo => modelo.codigoModelo && modelo.tipo === 'EDITAL_PRINCIPAL');
    assert(referencia, 'Modelo com PDF de referência não encontrado');
    await evaluate(`Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Editar texto').find(b => b.parentElement.parentElement.textContent.includes(${JSON.stringify(referencia.titulo)})).click()`);
    await until("document.querySelector('iframe[title=\"PDF de referência do modelo\"]') !== null");
    const pdf = await evaluate("(async () => { const frame = document.querySelector('iframe[title=\"PDF de referência do modelo\"]'); frame.closest('details').open = true; frame.scrollIntoView(); const blob = await (await fetch(frame.src)).blob(); return { tipo: blob.type, assinatura: await blob.slice(0, 5).text() }; })()");
    assert.equal(pdf.tipo, 'application/pdf');
    assert.equal(pdf.assinatura, '%PDF-');
    await sleep(700);
    const pdfScreen = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(out, 'pdf-referencia.png'), Buffer.from(pdfScreen.data, 'base64'));
    console.log('OK: prévia no navegador usa um PDF válido com tipo application/pdf.');
  } finally {
    socket?.close();
    chrome?.kill();
    if (templateId) { await p.campoTemplate.deleteMany({ where: { templateId } }); await p.templateVersao.deleteMany({ where: { templateId } }); await p.templateDocumento.deleteMany({ where: { id: templateId } }); }
    await p.user.deleteMany({ where: { id: uid } });
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => p.$disconnect());
