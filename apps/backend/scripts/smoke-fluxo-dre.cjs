const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const { CAMPOS_PRODUTOR } = require('../dist/modules/composicao-editais/application/domain/campos-produtor');
const prefix = `teste-modelos-${randomUUID()}`;
const ids = { municipio: randomUUID(), produtor: randomUUID(), edital: randomUUID(), item: randomUUID(), match: randomUUID(), dre: randomUUID(), extensionista: randomUUID(), fora: randomUUID() };
let propostaId, templateId;
const base = 'http://localhost:3000/api/v1';
async function request(method, url, token, body, expected = 200) {
  const r = await fetch(base + url, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await r.json();
  assert.equal(r.status, expected, `${method} ${url}: ${JSON.stringify(data)}`);
  return data.data;
}
(async () => {
  try {
    await p.municipio.create({ data: { id: ids.municipio, nome: prefix, uf: 'MT' } });
    const hash = await bcrypt.hash('senha-teste-local-123', 4);
    for (const [key, role] of [['dre', 'DRE'], ['extensionista', 'EXTENSIONISTA'], ['fora', 'EXTENSIONISTA']]) {
      await p.user.create({ data: { id: ids[key], name: 'Teste de modelos', email: `${key}-${prefix}@example.test`, passwordHash: hash, role, ...(key === 'extensionista' ? { municipioId: ids.municipio } : {}) } });
    }
    const tokens = {};
    for (const key of ['dre', 'extensionista', 'fora']) tokens[key] = (await request('POST', '/auth/login', null, { email: `${key}-${prefix}@example.test`, password: 'senha-teste-local-123' }, 201)).accessToken;
    const extra = Object.fromEntries(CAMPOS_PRODUTOR.filter(([key]) => /^(produtor|representante|grupo)\./.test(key) && !['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.telefone', 'produtor.municipio'].includes(key)).map(([key]) => [key, 'Dado fictício do cadastro']));
    extra['produtor.dapCaf'] = 'CAF-FLUXO-123';
    await p.produtor.create({ data: { id: ids.produtor, nome: 'Produtor Fictício do Fluxo', cpfCnpj: `TESTE-${prefix}`, municipioId: ids.municipio, endereco: 'Endereço fictício', telefone: '(65) 0000-0000', dadosDocumentais: extra } });
    await request('PATCH', `/produtores/${ids.produtor}`, tokens.extensionista, { dadosDocumentais: extra });
    await p.edital.create({ data: { id: ids.edital, numero: prefix, ano: 2026, titulo: 'Edital de teste do fluxo', objeto: 'Alimentos', municipioId: ids.municipio, dataPublicacao: new Date() } });
    await p.editalItem.create({ data: { id: ids.item, editalId: ids.edital, produtoOriginal: 'Banana', quantidade: 10, precoUnitario: 5, unidade: 'KG' } });
    await p.match.create({ data: { id: ids.match, editalId: ids.edital, editalItemId: ids.item, produtorId: ids.produtor, status: 'APROVADO' } });
    const template = await request('POST', '/templates-documento', tokens.dre, { tipo: 'ANEXO_III', titulo: `Modelo do fluxo ${prefix}`, finalidade: 'PROJETO_VENDA', perfilFornecedor: 'INDIVIDUAL', formato: 'HTML', conteudo: '<h1>PROJETO PERSONALIZADO V1</h1><p>{{produtor.nome}} — {{produtor.cpfCnpj}} — {{produtor.dapCaf}}</p><p>{{itens}}</p>', ativo: true }, 201);
    templateId = template.id;
    await request('PATCH', `/templates-documento/${templateId}`, tokens.extensionista, { titulo: 'Tentativa sem permissão' }, 403);
    const preview = await request('POST', '/propostas/preview', tokens.extensionista, { editalId: ids.edital, produtorId: ids.produtor, tipoDocumento: 'PROJETO_VENDA' }, 201);
    assert.equal(preview.itens.length, 1);
    const proposta = await request('POST', '/propostas', tokens.extensionista, { editalId: ids.edital, produtorId: ids.produtor, tipoDocumento: 'PROJETO_VENDA', itens: [{ produto: 'Banana', quantidade: 10, precoUnitario: 5, unidade: 'KG', matchId: ids.match }] }, 201);
    propostaId = proposta.id;
    const prepared = await request('GET', `/propostas/${propostaId}/documentos`, tokens.extensionista);
    assert.equal(prepared.valores['produtor.dapCaf'], 'CAF-FLUXO-123');
    const modelo = prepared.modelos.find(m => m.templateId === templateId);
    const declaracao = prepared.modelos.find(m => m.perfilFornecedor === 'INDIVIDUAL' && m.finalidade === 'PRODUCAO_PROPRIA');
    assert(modelo && declaracao);
    const valores = { ...prepared.valores, 'projeto.cronograma': 'Semanal' };
    await request('PUT', `/propostas/${propostaId}/documentos`, tokens.extensionista, { modelos: [modelo, declaracao].map(m => ({ templateId: m.templateId, versaoId: m.versaoId })), valores });
    const updated = await request('PATCH', `/templates-documento/${templateId}`, tokens.dre, { conteudo: '<h1>PROJETO PERSONALIZADO V2</h1><p>{{produtor.nome}} — {{itens}}</p>' });
    assert.equal(updated.versaoAtual, 2);
    const saved = await request('GET', `/propostas/${propostaId}/documentos/previa`, tokens.extensionista);
    assert(saved.documentos[0].texto.includes('PROJETO PERSONALIZADO V1'));
    assert(saved.documentos[0].texto.includes('Produtor Fictício do Fluxo'));
    assert(saved.documentos[0].texto.includes('CAF-FLUXO-123'));
    assert.deepEqual(saved.pendencias, []);
    await request('GET', `/propostas/${propostaId}/documentos`, tokens.fora, undefined, 403);
    await request('POST', `/propostas/${propostaId}/gerar`, tokens.extensionista, {}, 201);
    for (const formato of ['pdf', 'docx']) {
      const r = await fetch(`${base}/propostas/${propostaId}/download/${formato}`, { headers: { Authorization: `Bearer ${tokens.extensionista}` } });
      assert.equal(r.status, 200);
      assert((await r.arrayBuffer()).byteLength > 1000);
    }
    await request('PUT', `/propostas/${propostaId}/finalizar`, tokens.extensionista);
    await request('PUT', `/propostas/${propostaId}/documentos`, tokens.extensionista, { modelos: [{ templateId, versaoId: modelo.versaoId }], valores }, 400);
    console.log('OK: DRE cria/edita; extensionista usa os modelos; dados do cadastro; versão preservada; escopo; PDF/DOCX; finalização protegida.');
  } finally {
    if (propostaId) { await p.propostaItem.deleteMany({ where: { propostaId } }); await p.proposta.deleteMany({ where: { id: propostaId } }); }
    if (templateId) { await p.campoTemplate.deleteMany({ where: { templateId } }); await p.templateVersao.deleteMany({ where: { templateId } }); await p.templateDocumento.deleteMany({ where: { id: templateId } }); }
    await p.match.deleteMany({ where: { id: ids.match } });
    await p.editalItem.deleteMany({ where: { id: ids.item } });
    await p.edital.deleteMany({ where: { id: ids.edital } });
    await p.produtor.deleteMany({ where: { id: ids.produtor } });
    await p.user.deleteMany({ where: { id: { in: [ids.dre, ids.extensionista, ids.fora] } } });
    await p.municipio.deleteMany({ where: { id: ids.municipio } });
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => p.$disconnect());
