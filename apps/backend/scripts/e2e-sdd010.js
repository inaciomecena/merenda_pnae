/** Run only against a disposable, isolated MySQL database with a separately started API. */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const base = process.env.E2E_BASE;
const dbUrl = process.env.DATABASE_URL;
if (!base || !dbUrl || !/^merenda_pnae_sdd010_[a-z0-9]+$/.test(new URL(dbUrl).pathname.slice(1))) {
  throw new Error('E2E_BASE e DATABASE_URL de banco isolado merenda_pnae_sdd010_* são obrigatórios');
}
const db = new PrismaClient();
const results = [];
async function call(method, route, token, body) {
  const response = await fetch(base + route, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, data: json.data ?? json };
}
function check(name, response, status) {
  const ok = response.status === status;
  results.push({ name, status: response.status, expected: status, ok });
  if (!ok) throw new Error(`${name}: ${response.status}, esperado ${status}: ${JSON.stringify(response.data)}`);
  return response.data;
}
async function login(email) { return check(`login ${email}`, await call('POST', '/auth/login', null, { email, password: 'Sdd010-test-2026!' }), 201).accessToken; }

async function main() {
  const suffix = Date.now().toString(36);
  const municipio = await db.municipio.create({ data: { nome: 'Município de Teste', uf: 'MT', codigoIbge: `SDD010${suffix}`, ativo: true } });
  const p1 = await db.produtor.create({ data: { nome: 'Produtor Teste A', municipioId: municipio.id } });
  const p2 = await db.produtor.create({ data: { nome: 'Produtor Teste B', municipioId: municipio.id } });
  const reference = await db.produtoReferencia.create({ data: { nome: `Produto E2E ${suffix}`, unidadePadrao: 'KG', agriculturaFamiliar: true, ativo: true } });
  const passwordHash = await bcrypt.hash('Sdd010-test-2026!', 10);
  const makeUser = async (role, label) => db.user.create({ data: { name: label, email: `${label}-${suffix}@example.test`, passwordHash, role } });
  const admin = await makeUser('ADMIN', 'admin');
  const owner = await makeUser('PRODUTOR', 'owner');
  const other = await makeUser('PRODUTOR', 'other');
  const ext = await makeUser('EXTENSIONISTA', 'extensionista');
  await db.vinculoUsuario.createMany({ data: [
    { userId: owner.id, funcao: 'PRODUTOR', produtorId: p1.id, vigenciaInicio: new Date(), ativo: true },
    { userId: other.id, funcao: 'PRODUTOR', produtorId: p2.id, vigenciaInicio: new Date(), ativo: true },
    { userId: ext.id, funcao: 'EXTENSIONISTA', municipioId: municipio.id, vigenciaInicio: new Date(), ativo: true },
  ] });
  const [adminToken, ownerToken, otherToken, extToken] = await Promise.all([admin, owner, other, ext].map(u => login(u.email)));
  check('JWT exigido', await call('GET', `/produtor/meu-painel?produtorId=${p1.id}`), 401);
  check('outro produtor bloqueado', await call('GET', `/produtor/meu-painel?produtorId=${p1.id}`, otherToken), 403);
  check('extensionista sem vínculo bloqueado', await call('GET', `/produtor/meu-painel?produtorId=${p1.id}`, extToken), 403);
  check('auto concessão bloqueada', await call('POST', '/produtor/assistencia-tecnica', extToken, { produtorId: p1.id, extensionistaId: ext.id, vigenciaInicio: new Date().toISOString() }), 403);
  const q = `?produtorId=${p1.id}`;
  const unit = check('criar unidade', await call('POST', `/produtor/minhas-unidades${q}`, ownerToken, { nome: 'Sítio Teste', municipioId: municipio.id, comunidade: 'Comunidade Teste' }), 201);
  check('outro produtor não altera unidade', await call('PATCH', `/produtor/minhas-unidades/${unit.id}`, otherToken, { nome: 'Invasão', municipioId: municipio.id, versao: unit.versao }), 403);
  check('versão errada da unidade bloqueada', await call('PATCH', `/produtor/minhas-unidades/${unit.id}`, ownerToken, { nome: 'Sítio Teste', municipioId: municipio.id, versao: unit.versao + 1 }), 409);
  check('atualizar unidade com versão', await call('PATCH', `/produtor/minhas-unidades/${unit.id}`, ownerToken, { nome: 'Sítio Atualizado', municipioId: municipio.id, versao: unit.versao }), 200);
  check('coordenada inválida', await call('POST', `/produtor/minhas-unidades${q}`, ownerToken, { nome: 'Invalida', municipioId: municipio.id, latitude: 100 }), 400);
  const product = check('cadastrar produto do catálogo', await call('POST', `/produtor/meus-produtos${q}`, ownerToken, { produto: reference.nome, produtoReferenciaId: reference.id, unidadeProdutivaId: unit.id, unidade: 'KG' }), 201);
  check('produto duplicado bloqueado', await call('POST', `/produtor/meus-produtos${q}`, ownerToken, { produto: reference.nome, produtoReferenciaId: reference.id, unidadeProdutivaId: unit.id, unidade: 'KG' }), 409);
  check('produto sem catálogo bloqueado', await call('POST', `/produtor/meus-produtos${q}`, ownerToken, { produto: 'livre' }), 400);
  const harvest = check('registrar safra', await call('POST', `/produtor/minhas-safras${q}`, ownerToken, { produtoProdutorId: product.id, unidadeProdutivaId: unit.id, nome: 'Safra teste', inicio: '2026-10-01', fim: '2026-12-01', quantidadePrevista: 100, quantidadeColhida: 60, perdas: 5, unidade: 'KG' }), 201);
  check('bloquear reserva sem operação', await call('POST', `/produtor/minha-disponibilidade${q}`, ownerToken, { safraProducaoId: harvest.id, produtoProdutorId: product.id, quantidade: 5, unidade: 'KG', status: 'COMPROMETIDA', origem: 'manual' }), 400);
  check('saldo confirmado', await call('GET', `/produtor/minha-disponibilidade${q}`, ownerToken), 200);
  const balance = (await call('GET', `/produtor/minha-disponibilidade${q}`, ownerToken)).data.find(x => x.safraId === harvest.id);
  if (balance?.saldo !== 55) throw new Error(`Saldo incorreto: ${JSON.stringify(balance)}`);
  results.push({ name: 'saldo 60 - 5 = 55', ok: true, expected: 55, status: balance.saldo });
  check('atualizar colheita com versão', await call('PATCH', `/produtor/minhas-safras/${harvest.id}`, ownerToken, { produtoProdutorId: product.id, unidadeProdutivaId: unit.id, nome: harvest.nome, inicio: harvest.inicio, fim: harvest.fim, quantidadePrevista: 100, quantidadeColhida: 65, perdas: 5, unidade: 'KG', status: 'EM_PRODUCAO', versao: harvest.versao }), 200);
  check('versão antiga bloqueada', await call('PATCH', `/produtor/minhas-safras/${harvest.id}`, ownerToken, { produtoProdutorId: product.id, unidadeProdutivaId: unit.id, nome: harvest.nome, inicio: harvest.inicio, fim: harvest.fim, quantidadePrevista: 100, quantidadeColhida: 66, perdas: 5, unidade: 'KG', status: 'EM_PRODUCAO', versao: harvest.versao }), 409);
  check('sazonalidade', await call('POST', `/produtor/minha-sazonalidade${q}`, ownerToken, { produtoProdutorId: product.id, mes: 12, quantidadePrevista: 40, unidade: 'KG' }), 201);
  const delivery = check('logística', await call('POST', `/produtor/minha-logistica${q}`, ownerToken, { modalidade: 'ENTREGA_PROPRIA', municipiosAtendidos: municipio.nome, capacidadeDiaria: 20, unidadeCapacidade: 'KG' }), 201);
  check('atualizar logística com versão', await call('PATCH', `/produtor/minha-logistica/${delivery.id}`, ownerToken, { modalidade: 'ENTREGA_PROPRIA', municipiosAtendidos: municipio.nome, capacidadeDiaria: 25, unidadeCapacidade: 'KG', versao: delivery.versao }), 200);
  check('versão antiga da logística bloqueada', await call('PATCH', `/produtor/minha-logistica/${delivery.id}`, ownerToken, { modalidade: 'ENTREGA_PROPRIA', municipiosAtendidos: municipio.nome, capacidadeDiaria: 30, unidadeCapacidade: 'KG', versao: delivery.versao }), 409);
  const link = check('concessão administrativa pendente', await call('POST', '/produtor/assistencia-tecnica', adminToken, { produtorId: p1.id, extensionistaId: ext.id, vigenciaInicio: '2026-01-01' }), 201);
  check('pendente não autoriza', await call('GET', `/produtor/minhas-unidades${q}`, extToken), 403);
  check('ativação administrativa', await call('PATCH', `/produtor/assistencia-tecnica/${link.id}`, adminToken, { status: 'ATIVA' }), 200);
  check('extensionista autorizado', await call('GET', `/produtor/minhas-unidades${q}`, extToken), 200);
  const scope = check('lista de produtores assistidos', await call('GET', '/produtor/meus-vinculos', extToken), 200);
  if (!scope.some(row => row.id === p1.id) || scope.some(row => row.id === p2.id)) throw new Error('Escopo de assistência incorreto');
  results.push({ name: 'seletor contém somente produtor autorizado', ok: true, expected: p1.id, status: scope.map(row => row.id) });
  check('extensionista outro produtor bloqueado', await call('GET', `/produtor/minhas-unidades?produtorId=${p2.id}`, extToken), 403);
  check('catálogo', await call('GET', `/catalogo-produtos/${reference.id}`, ownerToken), 200);
  check('nutrição ausente', await call('GET', `/catalogo-produtos/${reference.id}/nutricao`, ownerToken), 200);
  const audit = await db.auditLog.findMany({ where: { entityId: unit.id } });
  if (!audit.length) throw new Error('Auditoria da unidade ausente');
  results.push({ name: 'auditoria persistida', ok: true, expected: '>=1', status: audit.length });
}
main().then(() => { const output = path.resolve(__dirname, 'e2e-sdd010-last-run.json'); fs.writeFileSync(output, JSON.stringify({ result: 'PASS', results }, null, 2)); console.log(`PASS ${results.length}/${results.length}: ${output}`); }).catch(e => { const output = path.resolve(__dirname, 'e2e-sdd010-last-run.json'); fs.writeFileSync(output, JSON.stringify({ result: 'FAIL', error: String(e), results }, null, 2)); console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
