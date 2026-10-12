// SDD-005 — ETAPA 4: validação de autorização no banco de desenvolvimento
// Cenários 1–6, 8 e 10 aqui; cenários 7 (DRE×DRE) e 9 (fornecedor×fornecedor) rodam
// no script da Etapa 5, quando existirem documentos fiscais para isolar.
const { PrismaClient } = require('@prisma/client');
const BASE = process.env.BASE ?? 'http://localhost:3200/api/v1';
const prisma = new PrismaClient();

const resultados = [];
function registrar(cenario, esperado, obtido, ok) {
  resultados.push({ cenario, ok });
  console.log(`  ${ok ? '[OK]   ' : '[FALHA]'} ${cenario} — esperado: ${esperado} | obtido: ${obtido}`);
}

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

  console.log('\n== ETAPA 4 — TESTES DE AUTORIZAÇÃO (banco de desenvolvimento) ==');

  // 1) ADMIN autorizado
  {
    const r = await req('GET', '/notas-fiscais', await login('admin@seaf.gov.br'));
    registrar('1) ADMIN autorizado', '200', String(r.status), r.status === 200);
  }
  // 2) DRE com vínculo ativo
  {
    const r = await req('GET', '/notas-fiscais', await login('dre@seaf.gov.br'));
    registrar('2) DRE com vínculo ativo', '200', String(r.status), r.status === 200);
  }
  // 3) Escola com vínculo ativo
  {
    const r = await req('GET', '/notas-fiscais', await login('escola@seaf.gov.br'));
    registrar('3) Escola com vínculo ativo', '200', String(r.status), r.status === 200);
  }
  // 4) Extensionista com vínculo ativo
  {
    const r = await req('GET', '/notas-fiscais', await login('extensionista@seaf.gov.br'));
    registrar('4) Extensionista com vínculo ativo', '200', String(r.status), r.status === 200);
  }
  // 5) Usuário sem vínculo
  {
    const r = await req('GET', '/notas-fiscais', await login('sem-vinculo@seaf.gov.br'));
    registrar('5) Usuário sem vínculo', '403', String(r.status), r.status === 403);
  }
  // 6) Vínculo com vigência encerrada (inativo)
  {
    const r = await req('GET', '/notas-fiscais', await login('inativo-teste@seaf.gov.br'));
    registrar('6) Vínculo inativo (vigência encerrada)', '403', String(r.status), r.status === 403);
  }
  // 8) Usuário sem permissão tenta atesto (rota exige ADMIN/DRE; id inexistente não importa — o guard rejeita antes)
  {
    const tokenEscola = await login('escola@seaf.gov.br');
    const r1 = await req('POST', '/notas-fiscais/id-inexistente/atestos', tokenEscola, { conferenciaId: 'x', observacoes: 'teste' });
    const r2 = await req('POST', '/notas-fiscais/id-inexistente/atestos', await login('extensionista@seaf.gov.br'), { conferenciaId: 'x', observacoes: 'teste' });
    const ok = r1.status === 403 && r2.status === 403;
    registrar('8) Usuário sem permissão tenta atesto (ESCOLA e EXTENSIONISTA)', '403 e 403', `${r1.status} e ${r2.status}`, ok);
  }
  // 10) Revogação de vínculo
  {
    const tokenRev = await login('revogado-teste@seaf.gov.br');
    const antes = await req('GET', '/notas-fiscais', tokenRev);
    const rev = await req('DELETE', '/vinculos/95082025-4093-4bce-b4ff-db5b21633fa9', admin);
    const depois = await req('GET', '/notas-fiscais', await login('revogado-teste@seaf.gov.br'));
    const ok = antes.status === 200 && rev.status < 400 && depois.status === 403;
    registrar('10) Revogação de vínculo derruba o acesso', '200 → revoga → 403', `${antes.status} → HTTP ${rev.status} → ${depois.status}`, ok);
  }

  const falhas = resultados.filter((r) => !r.ok).length;
  console.log(`\nParcial Etapa 4: ${resultados.length - falhas}/${resultados.length} cenários OK (7 e 9 rodam após a Etapa 5)`);
  await prisma.$disconnect();
  process.exit(falhas === 0 ? 0 : 1);
})().catch(async (e) => { console.error('ERRO:', e.message.slice(0, 400)); await prisma.$disconnect(); process.exit(1); });
