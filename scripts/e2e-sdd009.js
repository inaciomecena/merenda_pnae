const fs = require('fs');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000/api/v1';
const evidence = { suite: 'SDD-009', startedAt: new Date().toISOString(), cases: [] };
async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  let body = null; try { body = await response.json(); } catch { body = await response.text(); }
  return { status: response.status, body };
}
function data(result) { return result.body?.data ?? result.body; }
function check(name, result, expected) { const ok = result.status === expected; evidence.cases.push({ name, status: result.status, expected, ok }); if (!ok) throw new Error(`${name}: esperado ${expected}, recebido ${result.status} ${JSON.stringify(result.body)}`); return data(result); }
(async () => {
  const login = check('login administrativo', await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: process.env.E2E_EMAIL || 'admin@seaf.gov.br', password: process.env.E2E_PASSWORD || 'Admin@123' }) }), 201);
  const token = login.accessToken;
  const auth = { Authorization: `Bearer ${token}` };
  check('health público sanitizado', await request('/health'), 200);
  const dashboard = check('painel operacional derivado', await request('/gestao-operacional/dashboard', { headers: auth }), 200);
  check('central de pendências derivada', await request('/gestao-operacional/pendencias', { headers: auth }), 200);
  const suffix = Date.now();
  const key = `e2e.sdd009.${suffix}`;
  const globalConfig = check('configuração global', await request('/gestao-operacional/configuracoes', { method: 'POST', headers: auth, body: JSON.stringify({ chave: key, valor: 'global', tipo: 'texto', escopo: 'GLOBAL' }) }), 201);
  check('resolução por precedência global', await request(`/gestao-operacional/configuracoes/resolver?chave=${encodeURIComponent(key)}`, { headers: auth }), 200);
  const parameter = check('parâmetro operacional pendente de validação', await request('/gestao-operacional/parametros', { method: 'POST', headers: auth, body: JSON.stringify({ codigo: key, descricao: 'Parâmetro de aceite automatizado', valor: '10', tipo: 'numero', status: 'PENDENTE_VALIDACAO' }) }), 201);
  check('nova versão do parâmetro', await request(`/gestao-operacional/parametros/${parameter.id}/versoes`, { method: 'POST', headers: auth, body: JSON.stringify({ codigo: key, valor: '20', tipo: 'numero', status: 'ATIVO' }) }), 201);
  const notification = check('notificação interna', await request('/gestao-operacional/notificacoes', { method: 'POST', headers: auth, body: JSON.stringify({ userId: login.user.id, tipo: 'E2E', titulo: 'E2E SDD-009', mensagem: 'Notificação de teste controlado', dedupeKey: key, origem: 'e2e' }) }), 201);
  check('deduplicação de notificação', await request('/gestao-operacional/notificacoes', { method: 'POST', headers: auth, body: JSON.stringify({ userId: login.user.id, tipo: 'E2E', titulo: 'duplicada', mensagem: 'deve reutilizar a original', dedupeKey: key, origem: 'e2e' }) }), 201);
  check('listar notificações', await request('/gestao-operacional/notificacoes', { headers: auth }), 200);
  check('marcar notificação lida', await request(`/gestao-operacional/notificacoes/${notification.id}/lida`, { method: 'PATCH', headers: auth }), 200);
  const checklist = check('criar checklist de implantação', await request('/gestao-operacional/checklists', { method: 'POST', headers: auth, body: JSON.stringify({ nome: `E2E SDD-009 ${suffix}`, escopo: 'GLOBAL' }) }), 201);
  check('bloquear homologação com pendências', await request(`/gestao-operacional/checklists/${checklist.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'HOMOLOGADO_OPERACIONALMENTE' }) }), 409);
  for (const item of checklist.itens) check(`concluir item ${item.codigo}`, await request(`/gestao-operacional/checklists/${checklist.id}/itens`, { method: 'POST', headers: auth, body: JSON.stringify({ codigo: item.codigo, titulo: item.titulo, status: 'CONCLUIDO', evidencia: 'e2e-sdd009' }) }), 201);
  check('homologar checklist completo', await request(`/gestao-operacional/checklists/${checklist.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'HOMOLOGADO_OPERACIONALMENTE', observacao: 'Aceite técnico automatizado; aceite institucional pendente' }) }), 200);
  check('relatório de prontidão', await request(`/gestao-operacional/checklists/${checklist.id}/relatorio`, { headers: auth }), 200);
  check('diagnóstico restrito', await request('/monitoramento/diagnostico', { headers: auth }), 200);
  check('diagnóstico sem autenticação bloqueado', await request('/monitoramento/diagnostico'), 401);
  check('auditoria administrativa', await request('/audit?entity=ConfiguracaoInstitucional', { headers: auth }), 200);
  evidence.dashboard = dashboard;
  evidence.checklistId = checklist.id;
  evidence.configurationId = globalConfig.id;
  evidence.finishedAt = new Date().toISOString();
  evidence.result = 'PASS';
  fs.mkdirSync('output/e2e', { recursive: true });
  fs.writeFileSync('output/e2e/sdd009-last-run.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ result: evidence.result, cases: evidence.cases.length, passed: evidence.cases.filter(c => c.ok).length, evidence: 'output/e2e/sdd009-last-run.json' }, null, 2));
})().catch(error => { evidence.result = 'FAIL'; evidence.error = error.message; fs.mkdirSync('output/e2e', { recursive: true }); fs.writeFileSync('output/e2e/sdd009-last-run.json', JSON.stringify(evidence, null, 2)); console.error(error.message); process.exit(1); });
