// SDD-005 — ETAPA 3: criação de contas de teste fictícias e vínculos institucionais (via API)
// Uso: node scripts/sdd005-ativacao-etapa3.js   (backend fase B rodando na porta 3200)
const { PrismaClient } = require('@prisma/client');

const BASE = process.env.BASE ?? 'http://localhost:3200/api/v1';
const SUFIXO_NOME = '(fictício - teste SDD-005)';

const prisma = new PrismaClient();

async function req(metodo, rota, token, json) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (json !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`${BASE}${rota}`, { method: metodo, headers, body: json !== undefined ? JSON.stringify(json) : undefined });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

async function login(email) {
  const r = await req('POST', '/auth/login', undefined, { email, password: 'Admin@123' });
  const token = r.body?.data?.accessToken;
  if (!token) throw new Error(`Login falhou para ${email}: HTTP ${r.status} ${JSON.stringify(r.body)}`);
  return token;
}

(async () => {
  const admin = await login('admin@seaf.gov.br');

  // --- referências do banco (reuso de cadastros existentes; nada é inventado) ---
  const dreMetro = await prisma.dRE.findFirst({ where: { codigo: 'CBA' } }); // DRE Metropolitana (DRE-A)
  const dreCaceres = await prisma.dRE.findFirst({ where: { codigo: 'CCR' } }); // DRE Cáceres (DRE-B)
  const municipioCuiaba = await prisma.municipio.findFirst({ where: { nome: 'Cuiabá' } });
  const escolaCuiaba = await prisma.escola.findFirst({ where: { municipioId: municipioCuiaba.id } });
  const produtorHomolog = await prisma.produtor.findFirst({ where: { nome: 'Joao da Silva' } }); // fornecedor da homologação
  const produtorOutro = await prisma.produtor.findFirst({ where: { nome: 'Cooperativa Frutos do Pantanal' } }); // "outro fornecedor"
  if (!dreMetro || !dreCaceres || !municipioCuiaba || !escolaCuiaba || !produtorHomolog || !produtorOutro) {
    throw new Error('Referências obrigatórias ausentes no banco de dev');
  }
  console.log('Referências: DRE-A=' + dreMetro.nome + ' | DRE-B=' + dreCaceres.nome + ' | escola=' + escolaCuiaba.nome + ' | município=' + municipioCuiaba.nome);
  console.log('Fornecedor da homologação: ' + produtorHomolog.nome + ' | outro fornecedor (isolamento): ' + produtorOutro.nome);

  // --- 1) contas de teste fictícias (reutilizando as 4 contas existentes) ---
  const usuarios = [
    { email: 'dre-b@seaf.gov.br', name: `Usuário DRE-B ${SUFIXO_NOME}`, role: 'DRE' },
    { email: 'produtor-teste@seaf.gov.br', name: `Usuário Fornecedor/Produtor ${SUFIXO_NOME}`, role: 'PRODUTOR' },
    { email: 'sem-vinculo@seaf.gov.br', name: `Usuário sem vínculo ${SUFIXO_NOME}`, role: 'DRE' },
    { email: 'inativo-teste@seaf.gov.br', name: `Usuário com vínculo inativo ${SUFIXO_NOME}`, role: 'DRE' },
    { email: 'revogado-teste@seaf.gov.br', name: `Usuário com vínculo revogável ${SUFIXO_NOME}`, role: 'EXTENSIONISTA', municipioId: municipioCuiaba.id },
  ];
  const existentes = await req('GET', '/users?limit=100', admin);
  const mapaUsers = new Map((existentes.body?.data?.items ?? []).map((u) => [u.email, u.id]));
  for (const u of usuarios) {
    if (mapaUsers.has(u.email)) { console.log(`Usuário já existe: ${u.email}`); continue; }
    const r = await req('POST', '/users', admin, { ...u, password: 'Admin@123' });
    if (r.status >= 400) throw new Error(`POST /users ${u.email} → HTTP ${r.status} ${JSON.stringify(r.body)}`);
    mapaUsers.set(u.email, r.body.data.id);
    console.log(`Usuário criado: ${u.email} (${u.role}) id=${r.body.data.id}`);
  }
  // contas pré-existentes do seed
  const seed = { 'admin@seaf.gov.br': '16d05213-5567-4d0b-81ba-1e13151f016f', 'dre@seaf.gov.br': '08033cc8-767d-4b89-a8fb-272c6ea8cbb9', 'escola@seaf.gov.br': '4194b792-5bbe-42ec-a74e-f54d90d4b6b9', 'extensionista@seaf.gov.br': '3cdb0d9b-4ae3-42cd-8087-64b9ae199e27' };
  for (const [email, id] of Object.entries(seed)) mapaUsers.set(email, id);

  // --- 2) vínculos institucionais ---
  const hoje = new Date().toISOString();
  const ontem = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const vinculos = [
    { rotulo: 'DRE-A (dre@) → DRE Metropolitana', userId: mapaUsers.get('dre@seaf.gov.br'), funcao: 'DRE', dreId: dreMetro.id, vigenciaInicio: hoje },
    { rotulo: 'DRE-B (dre-b@) → DRE Cáceres', userId: mapaUsers.get('dre-b@seaf.gov.br'), funcao: 'DRE', dreId: dreCaceres.id, vigenciaInicio: hoje },
    { rotulo: 'ESCOLA (escola@) → escola de Cuiabá', userId: mapaUsers.get('escola@seaf.gov.br'), funcao: 'ESCOLA', escolaId: escolaCuiaba.id, vigenciaInicio: hoje },
    { rotulo: 'EXTENSIONISTA (extensionista@) → município Cuiabá', userId: mapaUsers.get('extensionista@seaf.gov.br'), funcao: 'EXTENSIONISTA', municipioId: municipioCuiaba.id, vigenciaInicio: hoje },
    { rotulo: 'FORNECEDOR/PRODUTOR (produtor-teste@) → Cooperativa', userId: mapaUsers.get('produtor-teste@seaf.gov.br'), funcao: 'PRODUTOR', produtorId: produtorOutro.id, vigenciaInicio: hoje },
    { rotulo: 'VÍNCULO INATIVO (inativo-teste@) → DRE Metropolitana, vigência encerrada', userId: mapaUsers.get('inativo-teste@seaf.gov.br'), funcao: 'DRE', dreId: dreMetro.id, vigenciaInicio: ontem, vigenciaFim: ontem },
    { rotulo: 'VÍNCULO REVOGÁVEL (revogado-teste@) → município Cuiabá', userId: mapaUsers.get('revogado-teste@seaf.gov.br'), funcao: 'EXTENSIONISTA', municipioId: municipioCuiaba.id, vigenciaInicio: hoje },
  ];
  const ids = {};
  for (const v of vinculos) {
    const verif = await req('GET', `/vinculos/usuario/${v.userId}`, admin);
    const jaTem = (verif.body?.data ?? []).some((x) => x.ativo && x.funcao === v.funcao);
    if (jaTem) { console.log(`Vínculo já existe: ${v.rotulo}`); continue; }
    const r = await req('POST', '/vinculos', admin, { userId: v.userId, funcao: v.funcao, dreId: v.dreId, escolaId: v.escolaId, municipioId: v.municipioId, produtorId: v.produtorId, vigenciaInicio: v.vigenciaInicio, vigenciaFim: v.vigenciaFim });
    if (r.status >= 400) throw new Error(`POST /vinculos "${v.rotulo}" → HTTP ${r.status} ${JSON.stringify(r.body)}`);
    ids[v.rotulo] = r.body.data.id;
    console.log(`Vínculo criado: ${v.rotulo} → id=${r.body.data.id} ativo=${r.body.data.ativo}`);
  }

  // --- 3) resumo para as próximas etapas ---
  const resumo = {
    users: Object.fromEntries(mapaUsers),
    dreMetropolitanaId: dreMetro.id,
    dreCaceresId: dreCaceres.id,
    escolaId: escolaCuiaba.id,
    municipioCuiabaId: municipioCuiaba.id,
    produtorHomologacaoId: produtorHomolog.id,
    produtorOutroId: produtorOutro.id,
    vinculosCriados: ids,
  };
  const fs = require('fs');
  const arquivo = 'C:\\Users\\HP ELITE\\AppData\\Local\\Temp\\opencode\\backup-sdd005\\ativacao-ids.json';
  fs.writeFileSync(arquivo, JSON.stringify(resumo, null, 2));
  console.log('\nResumo gravado em: ' + arquivo);

  const total = await prisma.vinculoUsuario.count();
  console.log(`\nVínculos totais no banco agora: ${total}`);
  console.log('ETAPA 3 CONCLUÍDA');
  await prisma.$disconnect();
})().catch(async (e) => { console.error('ERRO:', e.message.slice(0, 500)); await prisma.$disconnect(); process.exit(1); });
