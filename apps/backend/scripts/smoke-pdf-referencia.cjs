const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const id = randomUUID();
const base = 'http://localhost:3000/api/v1';
(async () => {
  try {
    await prisma.user.create({ data: { id, name: 'Validação PDF', email: `${id}@example.test`, role: 'DRE', passwordHash: await bcrypt.hash('senha-pdf-local', 4) } });
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${id}@example.test`, password: 'senha-pdf-local' }) });
    assert.equal(login.status, 201);
    const headers = { Authorization: `Bearer ${(await login.json()).data.accessToken}` };
    const list = await fetch(`${base}/templates-documento`, { headers });
    assert.equal(list.status, 200);
    const modelos = (await list.json()).data.filter(modelo => modelo.codigoModelo);
    assert(modelos.length >= 15);
    for (const modelo of modelos) {
      const response = await fetch(`${base}/templates-documento/${modelo.id}/arquivo`, { headers });
      assert.equal(response.status, 200, modelo.titulo);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', modelo.titulo);
      assert.match(response.headers.get('content-type') || '', /^application\/pdf(?:;|$)/, `${modelo.titulo}: tipo incorreto do arquivo`);
      assert.match(response.headers.get('content-disposition') || '', /^inline;/);
    }
    console.log(`OK: ${modelos.length} PDFs de referência entregues com conteúdo e cabeçalhos corretos.`);
  } finally {
    await prisma.user.deleteMany({ where: { id } });
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
