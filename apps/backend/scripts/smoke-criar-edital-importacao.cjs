// Fluxo real da interface, com registros fictícios removidos ao final.
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { JwtService } = require('@nestjs/jwt');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const perfil = process.argv.includes('--admin') ? 'ADMIN' : 'DRE';
const ids = Object.fromEntries(['user', 'municipio', 'escola', 'edital', 'importacao', 'estrutura'].map(key => [key, randomUUID()]));
const titulo = `Validação preenchimento ${ids.importacao}`;
const out = path.resolve('storage/validacao-criar-edital');
const base = 'http://localhost:3000/api/v1';
let chrome, socket, uploadImportacao;
const pdfUpload = path.join(out, `validacao-upload-${ids.importacao}.pdf`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  try {
    await fs.mkdir(out, { recursive: true });
    await fs.copyFile(path.resolve('../../docs/dre/01_Edital_Principal.pdf'), pdfUpload);
    await prisma.user.create({ data: { id: ids.user, name: `Validação ${perfil}`, email: `${ids.user}@example.test`, role: perfil, passwordHash: await bcrypt.hash('senha-edital-local', 4) } });
    await prisma.municipio.create({ data: { id: ids.municipio, nome: `Município teste ${ids.municipio}`, uf: 'MT' } });
    await prisma.escola.create({ data: { id: ids.escola, municipioId: ids.municipio, nome: 'Escola do preenchimento' } });
    await prisma.edital.create({ data: { id: ids.edital, numero: '42', ano: 2026, titulo, objeto: 'Aquisição de alimentos', municipioId: ids.municipio, escolaId: ids.escola,
      itens: { create: [ { produtoOriginal: 'Banana de teste', numeroItem: 1, quantidade: 12.5, precoUnitario: 4.2, unidade: 'KG' }, { produtoOriginal: 'Item para remover', numeroItem: 2, quantidade: 1, precoUnitario: 3, unidade: 'KG' } ] },
      escolasVinculadas: { create: { escolaId: ids.escola } },
    } });
    await prisma.importLog.create({ data: { id: ids.importacao, editalId: ids.edital, arquivoNome: `${titulo}.pdf`, arquivoCaminho: path.resolve('../../docs/dre/01_Edital_Principal.pdf'), origem: 'UPLOAD', status: 'PENDENTE_CONFERENCIA' } });
    await prisma.importacaoEstrutura.create({ data: { id: ids.estrutura, importLogId: ids.importacao, editalId: ids.edital,
      campos: { create: [
        { chave: 'edital.processoAdministrativo', rotulo: 'Processo', valorExtraido: 'PROC-123' },
        { chave: 'edital.dataSessao', rotulo: 'Data', valorExtraido: '14 de janeiro de 2027' },
        { chave: 'edital.localSessao', rotulo: 'Local', valorExtraido: 'Local da sessão' },
      ] },
    } });
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${ids.user}@example.test`, password: 'senha-edital-local' }) });
    const sessao = (await login.json()).data;
    const token = sessao.accessToken;
    const expirado = new JwtService({ secret: process.env.JWT_SECRET || 'dev-secret' }).sign({ sub: ids.user, role: 'DRE' }, { expiresIn: -1 });
    const quantidadeAntes = await prisma.edital.count();
    const prepared = await fetch(`${base}/importacoes/${ids.importacao}/preparar-edital`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    assert.equal(prepared.status, 201);
    assert.equal((await prepared.json()).data.numero, '42');
    assert.equal(await prisma.edital.count(), quantidadeAntes, 'Carregar dados criou um edital prematuramente');
    chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9224', `--user-data-dir=${path.join(out, 'chrome-profile')}`, '--window-size=1440,1100', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    let targets;
    for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:9224/json')).json(); break; } catch { await sleep(100); } }
    assert(targets?.length, 'Chrome não iniciou');
    socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let seq = 0;
    const waiting = new Map();
    socket.onmessage = event => { const msg = JSON.parse(event.data); if (msg.id) { const fn = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? fn.reject(msg.error) : fn.resolve(msg.result); } };
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; waiting.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
    const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result?.value; };
    const until = async expression => { for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await sleep(100); } throw new Error(`UI timeout: ${expression}\n${await evaluate("location.href + '\\n' + document.body.textContent.slice(-3000)")}`); };
    await send('Page.enable');
    // Documento sem React para configurar a sessão sem disputar com o AuthProvider.
    await send('Page.navigate', { url: 'http://localhost:5173/@vite/client' });
    await until("location.origin === 'http://localhost:5173' && document.readyState === 'complete'");
    await evaluate(`localStorage.setItem('seaf_token', ${JSON.stringify(token)}); localStorage.setItem('seaf_refresh', ${JSON.stringify(sessao.refreshToken)})`);
    await send('Page.navigate', { url: 'http://localhost:5173/editais' });
    await until("Array.from(document.querySelectorAll('a,button')).some(b => b.textContent === 'Criar a partir de importação')");
    await evaluate("Array.from(document.querySelectorAll('a,button')).find(b => b.textContent === 'Criar a partir de importação').click()");
    await until("location.pathname === '/importacoes/importar' && document.querySelector('input[type=file]') !== null");
    assert.equal(await evaluate("new URLSearchParams(location.search).get('destino')"), 'edital');
    const root = await send('DOM.getDocument');
    const input = await send('DOM.querySelector', { nodeId: root.root.nodeId, selector: 'input[type=file]' });
    await send('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [pdfUpload] });
    await until("Array.from(document.querySelectorAll('button')).some(b => b.textContent === 'Enviar e processar' && !b.disabled)");
    await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Enviar e processar').click()");
    await until("location.pathname === '/editais/novo' && document.body.textContent.includes('Dados da importação carregados.')");
    const uploadId = await evaluate("new URLSearchParams(location.search).get('importacaoId')");
    uploadImportacao = await prisma.importLog.findUnique({ where: { id: uploadId }, include: { edital: { include: { itens: { where: { deletedAt: null }, orderBy: { numeroItem: 'asc' } } } }, estrutura: true } });
    assert(uploadImportacao?.edital?.itens.length, 'O upload não processou os itens do PDF');
    assert(['PROCESSADO', 'PENDENTE_CONFERENCIA'].includes(uploadImportacao.status));
    const field = label => `document.getElementById(Array.from(document.querySelectorAll('label')).find(l => l.textContent === ${JSON.stringify(label)}).htmlFor)`;
    assert.equal(await evaluate(`${field('Número')}.value`), uploadImportacao.edital.numero);
    assert.equal(await evaluate(`${field('Título')}.value`), uploadImportacao.edital.titulo);
    assert.equal(await evaluate(`${field('Produto')}.value`), uploadImportacao.edital.itens[0].produtoOriginal);
    assert.equal(await prisma.editalDocumento.count({ where: { importacaoId: uploadId } }), 0, 'Upload salvou a composição antes da revisão');
    console.log(`OK: botão abre upload; PDF real processado com ${uploadImportacao.edital.itens.length} itens e formulário preenchido automaticamente.`);
    await send('Page.navigate', { url: `http://localhost:5173/editais/novo?importacaoId=${ids.importacao}` });
    await until("location.pathname === '/editais/novo' && document.body.textContent.includes('Dados da importação carregados.')");
    assert.equal(await evaluate(`${field('Número')}.value`), '42');
    assert.equal(await evaluate(`${field('Título')}.value`), titulo);
    assert.equal(await evaluate(`${field('Processo administrativo')}.value`), 'PROC-123');
    assert.equal(await evaluate(`${field('Data de recebimento')}.value`), '2027-01-14');
    assert.equal(await evaluate(`${field('Produto')}.value`), 'Banana de teste');
    assert.equal(await evaluate(`${field('Quantidade')}.value`), '12.5');
    assert.equal(await evaluate(`${field('Preço unitário (R$)')}.value`), '4.2');
    assert((await evaluate("document.querySelectorAll('[data-anexo]').length")) >= 15, 'Anexos e declarações não foram vinculados no formulário');
    assert((await evaluate("Array.from(document.querySelectorAll('[data-anexo]')).filter(a => a.textContent.includes('Declaração')).length")) >= 7);
    await evaluate("document.querySelector('[aria-label=\"Excluir item 2\"]').click()");
    assert.equal(await evaluate("Array.from(document.querySelectorAll('label')).filter(l => l.textContent === 'Produto').length"), 1);
    await evaluate("(() => { const anexo = document.querySelector('[data-anexo]'); const input = anexo.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, 'Título do anexo revisado antes de salvar'); input.dispatchEvent(new Event('input', { bubbles: true })); })()");
    await evaluate("document.querySelectorAll('[data-anexo]')[1].querySelector('.MuiChip-clickable').click()");
    const larguraModelo = await evaluate("document.querySelector('[data-anexo] [role=combobox]').getBoundingClientRect().width");
    assert(larguraModelo > 300, `Seletor do modelo muito estreito: ${larguraModelo}`);
    await until("document.body.textContent.includes('Escola do preenchimento')");
    assert.equal(await prisma.edital.count(), quantidadeAntes + 1);
    await evaluate(`(() => { const input = ${field('Título')}; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(titulo + ' revisado')}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    const screen = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(out, 'formulario-preenchido.png'), Buffer.from(screen.data, 'base64'));
    await evaluate("document.querySelector('[data-anexo]').scrollIntoView({block:'start'})");
    await sleep(200);
    const screenAnexos = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(out, 'anexos-declaracoes.png'), Buffer.from(screenAnexos.data, 'base64'));
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate("document.querySelector('[data-anexo]').scrollIntoView({block:'start'})");
    await sleep(200);
    const screenMobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(out, 'anexos-mobile.png'), Buffer.from(screenMobile.data, 'base64'));
    await send('Emulation.clearDeviceMetricsOverride');
    // A sessão vence enquanto o usuário revisa o formulário: salvar deve renovar e repetir o envio.
    await evaluate(`localStorage.setItem('seaf_token', ${JSON.stringify(expirado)})`);
    await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Salvar').click()");
    await until("location.pathname.startsWith('/editais/') && location.pathname !== '/editais/novo' && document.body.textContent.includes('Estrutura do edital')");
    const criado = await prisma.edital.findFirst({ where: { createdBy: ids.user }, include: { itens: true, escolasVinculadas: true, documento: true } });
    assert(criado);
    assert.notEqual(criado.id, ids.edital);
    assert.equal(criado.titulo, titulo + ' revisado');
    assert.equal(criado.itens.length, 1);
    assert.equal(Number(criado.itens[0].quantidade), 12.5);
    assert.equal(Number(criado.itens[0].precoUnitario), 4.2);
    assert.equal(Number(criado.itens[0].valorTotal), 52.5);
    assert.equal(criado.escolasVinculadas[0].escolaId, ids.escola);
    assert.equal(criado.documento.importacaoId, ids.importacao);
    assert.equal(criado.documento.processoAdministrativo, 'PROC-123');
    assert.equal(criado.documento.origem, 'IMPORTACAO');
    assert.notEqual(await evaluate("localStorage.getItem('seaf_token')"), expirado, 'A sessão não foi renovada ao salvar');
    const anexosSalvos = await prisma.editalAnexo.findMany({ where: { documentoId: criado.documento.id }, include: { template: true }, orderBy: { ordem: 'asc' } });
    assert(anexosSalvos.length >= 15);
    assert.equal(anexosSalvos[0].titulo, 'Título do anexo revisado antes de salvar');
    assert.equal(anexosSalvos[1].incluido, false);
    assert(anexosSalvos.filter(anexo => ['PRODUCAO_PROPRIA', 'CONTROLE_LIMITE'].includes(anexo.template.finalidade)).length >= 7);
    assert.equal((await prisma.edital.findUnique({ where: { id: ids.edital } })).titulo, titulo);
    await until("!document.body.textContent.includes('Carregando dados do edital...') && Array.from(document.querySelectorAll('button')).some(b => b.textContent === 'Salvar' && !b.disabled)");
    await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Salvar').click()");
    for (let i = 0; i < 100; i++) {
      const antigo = await prisma.editalItem.findUnique({ where: { id: criado.itens[0].id } });
      if (antigo.deletedAt) break;
      await sleep(100);
    }
    await until("document.body.textContent.includes('Estrutura salva.') && !Array.from(document.querySelectorAll('button')).some(b => b.textContent === 'Salvando...')");
    assert.equal(await prisma.edital.count({ where: { createdBy: ids.user } }), 1, 'Salvar novamente duplicou o edital');
    assert.equal(await prisma.editalItem.count({ where: { editalId: criado.id, deletedAt: null } }), 1);
    console.log('OK: formulário carrega dados/escolas/itens/preços, permite revisão e cria a composição somente ao salvar, preservando a origem.');
    console.log('OK: sessão expirada é renovada automaticamente e o formulário é salvo sem perder as alterações.');
    assert(await evaluate("Array.from(document.querySelectorAll('button')).filter(b => /^Baixar (PDF|DOCX)$/.test(b.textContent)).every(b => b.disabled)"));
    await evaluate(`(() => { const input = ${field('Quantidade')}; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ''); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Gerar edital').click()");
    await until("document.body.textContent.includes('Revise as pendências abaixo')");
    assert(!(await evaluate("document.body.textContent.includes('anexos duplicados') || document.body.textContent.includes('modelos repetidos')")));
    assert((await evaluate("document.querySelector('[role=alert] ul')?.children.length")) > 0, 'Pendências não foram apresentadas em lista');
    for (const [label, value] of [['Quantidade', '12.5']]) {
      await evaluate(`(() => { const input = ${field(label)}; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    }
    await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Gerar edital').click()");
    await until("document.body.textContent.includes('PDF e DOCX gerados.')");
    assert(await evaluate("Array.from(document.querySelectorAll('button')).filter(b => /^Baixar (PDF|DOCX)$/.test(b.textContent)).every(b => !b.disabled)"));
    console.log('OK: geração apresenta somente pendências reais em lista e libera os downloads após gerar PDF/DOCX.');
    await until(`Array.from(document.querySelector('[aria-label="Ações do edital"]').children).every(b => !b.disabled)`);
    await sleep(350);
    const acoes = await evaluate(`Array.from(document.querySelector('[aria-label="Ações do edital"]').children).map(b => ({ texto: b.textContent, cor: getComputedStyle(b).backgroundColor, topo: b.getBoundingClientRect().top }))`);
    assert.equal(acoes.length, 6);
    assert.equal(new Set(acoes.map(a => a.cor)).size, 1, `As ações têm cores diferentes: ${JSON.stringify(acoes)}`);
    assert.equal(new Set(acoes.map(a => Math.round(a.topo))).size, 1, 'As ações não estão lado a lado no desktop');
    assert(!await evaluate("document.body.textContent.includes('Origem IMPORTACAO') || document.body.textContent.includes('Arquivo-fonte:')"));
    const arquivosAntes = await prisma.historicoGeracaoDocumento.findMany({ where: { editalId: criado.id, status: 'SUCESSO' } });
    await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Atualizar PDF/DOCX').click()");
    await until("document.body.textContent.includes('PDF e DOCX atualizados.')");
    const arquivosDepois = await prisma.historicoGeracaoDocumento.findMany({ where: { editalId: criado.id, status: 'SUCESSO' } });
    const novosArquivos = arquivosDepois.filter(arquivo => !arquivosAntes.some(anterior => anterior.id === arquivo.id));
    assert.deepEqual(novosArquivos.map(a => a.formato).sort(), ['DOCX', 'PDF']);
    assert(novosArquivos.every(a => !arquivosAntes.some(anterior => anterior.arquivoPath === a.arquivoPath)), 'Os arquivos não foram reprocessados');
    await until(`Array.from(document.querySelector('[aria-label="Ações do edital"]').children).every(b => !b.disabled)`);
    await sleep(350);
    await evaluate('window.scrollTo(0, 0)');
    const screenAcoes = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(out, 'acoes-edital.png'), Buffer.from(screenAcoes.data, 'base64'));
    console.log('OK: ações azuis lado a lado, origem oculta e Atualizar PDF/DOCX reprocessa os dois arquivos.');
  } finally {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' }));
    socket?.close(); chrome?.kill();
    uploadImportacao ||= await prisma.importLog.findFirst({ where: { arquivoNome: path.basename(pdfUpload) }, include: { estrutura: true } });
    const editais = await prisma.edital.findMany({ where: { OR: [{ id: ids.edital }, { createdBy: ids.user }, ...(uploadImportacao?.editalId ? [{ id: uploadImportacao.editalId }] : [])] }, select: { id: true } });
    const editalIds = editais.map(e => e.id);
    const documentos = await prisma.editalDocumento.findMany({ where: { editalId: { in: editalIds } }, select: { id: true } });
    const documentoIds = documentos.map(d => d.id);
    const geracoes = await prisma.historicoGeracaoDocumento.findMany({ where: { editalId: { in: editalIds }, arquivoPath: { not: null } } });
    for (const geracao of geracoes) {
      const caminho = path.resolve(geracao.arquivoPath);
      assert.equal(path.dirname(caminho), path.resolve('storage/editais-gerados', geracao.editalId));
      await fs.unlink(caminho);
    }
    await prisma.historicoGeracaoDocumento.deleteMany({ where: { editalId: { in: editalIds } } });
    await prisma.editalVersao.deleteMany({ where: { documentoId: { in: documentoIds } } });
    await prisma.editalAnexo.deleteMany({ where: { documentoId: { in: documentoIds } } });
    await prisma.editalVariavel.deleteMany({ where: { documentoId: { in: documentoIds } } });
    await prisma.editalDocumento.deleteMany({ where: { id: { in: documentoIds } } });
    const estruturaIds = [ids.estrutura, ...(uploadImportacao?.estrutura ? [uploadImportacao.estrutura.id] : [])];
    await prisma.importacaoCampo.deleteMany({ where: { estruturaId: { in: estruturaIds } } });
    await prisma.importacaoEstrutura.deleteMany({ where: { id: { in: estruturaIds } } });
    await prisma.importLog.deleteMany({ where: { id: { in: [ids.importacao, ...(uploadImportacao ? [uploadImportacao.id] : [])] } } });
    await prisma.editalEscola.deleteMany({ where: { editalId: { in: editalIds } } });
    await prisma.editalItem.deleteMany({ where: { editalId: { in: editalIds } } });
    await prisma.edital.deleteMany({ where: { id: { in: editalIds } } });
    await prisma.escola.deleteMany({ where: { id: ids.escola } });
    await prisma.municipio.deleteMany({ where: { id: ids.municipio } });
    await prisma.user.deleteMany({ where: { id: ids.user } });
    if (uploadImportacao?.arquivoCaminho && path.dirname(path.resolve(uploadImportacao.arquivoCaminho)) === path.resolve('storage/importacoes') && path.basename(uploadImportacao.arquivoCaminho).endsWith(path.basename(pdfUpload))) await fs.rm(uploadImportacao.arquivoCaminho, { force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
