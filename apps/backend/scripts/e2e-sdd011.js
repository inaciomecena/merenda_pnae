const base = process.env.SDD011_API_URL || 'http://localhost:3000/api/v1';
const token = process.env.SDD011_TOKEN;
if (!token) { console.error('Defina SDD011_TOKEN para executar o harness contra um ambiente isolado.'); process.exit(2); }
const headers = { Authorization: `Bearer ${token}` };
async function get(path) { const response = await fetch(`${base}${path}`, { headers }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(body)}`); return body.data ?? body; }
(async () => {
  const result = await get('/produtor/minhas-oportunidades?page=1&limit=20');
  const summary = await get('/produtor/minhas-oportunidades/resumo');
  const interests = await get('/produtor/meus-interesses');
  const evidence = { executedAt: new Date().toISOString(), opportunities: result.items?.length ?? 0, total: result.total ?? 0, summary, interests: interests.length ?? 0, notes: ['Somente chamadas abertas foram consultadas.', 'Este harness é somente leitura; manifestação deve ser validada em cenário isolado separado.', 'Nenhuma proposta ou reserva é criada pela consulta.'] };
  console.log(JSON.stringify(evidence, null, 2));
})().catch(error => { console.error(error.message); process.exit(1); });
