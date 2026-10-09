const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ids = Object.fromEntries(['admin', 'dre', 'ext', 'importacao', 'processando', 'edital', 'item', 'itemExcluido', 'match', 'proposta'].map(key => [key, randomUUID()]));
const arquivo = path.resolve('../../docs', `validacao-soft-delete-${ids.importacao}.pdf`);
const base = 'http://localhost:3000/api/v1';
async function request(method, rota, token, expected, body) {
  const response = await fetch(base + rota, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const json = await response.json();
  assert.equal(response.status, expected, `${method} ${rota}: ${JSON.stringify(json)}`);
  return json.data;
}
(async () => {
  try {
    const passwordHash = await bcrypt.hash('senha-soft-delete-local', 4);
    const tokens = {};
    for (const [key, role] of [['admin', 'ADMIN'], ['dre', 'DRE'], ['ext', 'EXTENSIONISTA']]) {
      await prisma.user.create({ data: { id: ids[key], name: 'Validação exclusão', email: `${ids[key]}@example.test`, role, passwordHash } });
      tokens[key] = (await request('POST', '/auth/login', '', 201, { email: `${ids[key]}@example.test`, password: 'senha-soft-delete-local' })).accessToken;
    }
    await prisma.edital.create({ data: { id: ids.edital, numero: ids.edital, ano: 2026, titulo: 'Validação exclusão lógica' } });
    await prisma.editalItem.create({ data: { id: ids.item, editalId: ids.edital, produtoOriginal: 'Banana' } });
    await prisma.editalItem.create({ data: { id: ids.itemExcluido, editalId: ids.edital, produtoOriginal: 'Item excluído' } });
    await prisma.match.create({ data: { id: ids.match, editalId: ids.edital, editalItemId: ids.item } });
    await prisma.proposta.create({ data: { id: ids.proposta, editalId: ids.edital } });
    await prisma.importLog.create({ data: { id: ids.importacao, editalId: ids.edital, arquivoCaminho: arquivo, arquivoNome: path.basename(arquivo), origem: 'DOCS', status: 'PENDENTE_CONFERENCIA' } });
    await prisma.importLog.create({ data: { id: ids.processando, arquivoCaminho: arquivo + '.processing', arquivoNome: 'processando.pdf', origem: 'UPLOAD', status: 'PROCESSANDO' } });
    await fs.copyFile(path.resolve('../../docs/dre/01_Edital_Principal.pdf'), arquivo);
    await request('DELETE', `/importacoes/${ids.importacao}/itens/${ids.itemExcluido}`, tokens.ext, 403);
    await request('DELETE', `/importacoes/${ids.importacao}/itens/${randomUUID()}`, tokens.dre, 404);
    const remocao = await request('DELETE', `/importacoes/${ids.importacao}/itens/${ids.itemExcluido}`, tokens.dre, 200);
    assert.equal(remocao.quantidadeItens, 1);
    assert((await prisma.editalItem.findUnique({ where: { id: ids.itemExcluido } })).deletedAt);
    const conferido = await request('GET', `/importacoes/${ids.importacao}`, tokens.dre, 200);
    assert.equal(conferido.edital.itens.length, 1);
    assert.equal(conferido.quantidadeItens, 1);
    await prisma.importLog.update({ where: { id: ids.importacao }, data: { status: 'CONFIRMADO' } });
    await request('DELETE', `/importacoes/${ids.importacao}/itens/${ids.item}`, tokens.dre, 409);
    await request('DELETE', `/importacoes/${ids.importacao}`, tokens.ext, 403);
    await request('DELETE', `/importacoes/${ids.processando}`, tokens.admin, 409);
    assert.equal((await prisma.importLog.findUnique({ where: { id: ids.processando } })).deletedAt, null);
    await request('DELETE', `/importacoes/${ids.importacao}`, tokens.dre, 200);
    for (const [model, id] of [['importLog', ids.importacao], ['edital', ids.edital], ['editalItem', ids.item], ['match', ids.match]]) {
      const row = await prisma[model].findUnique({ where: { id } });
      assert(row.deletedAt, `${model} continua ativo`);
      assert.equal(row.updatedBy, ids.dre);
    }
    assert.equal((await prisma.proposta.findUnique({ where: { id: ids.proposta } })).deletedAt, null);
    await fs.access(arquivo);
    for (const rota of [`/importacoes/${ids.importacao}`, `/importacoes/${ids.importacao}/pdf`, `/importacoes/${ids.importacao}/estrutura`]) await request('GET', rota, tokens.admin, 404);
    await request('POST', `/importacoes/${ids.importacao}/processar`, tokens.admin, 404, { reprocessar: true });
    const sync = await request('POST', '/importacoes/sincronizar-docs', tokens.admin, 201, { processarAutomaticamente: false });
    assert(!sync.importacoes.some(row => row.id === ids.importacao));
    const list = await request('GET', '/importacoes?limit=100', tokens.admin, 200);
    assert(!list.items.some(row => row.id === ids.importacao));
    assert.equal(await prisma.importLog.count({ where: { arquivoCaminho: arquivo } }), 1, 'PDF excluído foi reimportado');
    await request('DELETE', `/importacoes/${ids.importacao}`, tokens.admin, 404);
    console.log('OK: exclusão lógica, permissões, bloqueio durante processamento, histórico e PDF preservados; sincronização não recria a importação.');
  } finally {
    await fs.rm(arquivo, { force: true });
    await prisma.proposta.deleteMany({ where: { id: ids.proposta } });
    await prisma.match.deleteMany({ where: { id: ids.match } });
    await prisma.editalItem.deleteMany({ where: { id: { in: [ids.item, ids.itemExcluido] } } });
    await prisma.importLog.deleteMany({ where: { id: { in: [ids.importacao, ids.processando] } } });
    await prisma.edital.deleteMany({ where: { id: ids.edital } });
    await prisma.user.deleteMany({ where: { id: { in: [ids.admin, ids.dre, ids.ext] } } });
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
