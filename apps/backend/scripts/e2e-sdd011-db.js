const { PrismaClient } = require('@prisma/client');
const crypto = require('node:crypto');

const prisma = new PrismaClient();
const id = () => crypto.randomUUID();
const result = [];
const check = (name, ok, evidence, error) => result.push({ id: name, result: ok ? 'PASS' : 'FAIL', evidence, ...(error ? { error: String(error.message || error) } : {}) });

(async () => {
  const municipioId = id(); const produtorId = id(); const editalId = id(); const itemId = id(); const raceItemId = id(); const chamadaId = id();
  const now = new Date(); const fim = new Date(now.getTime() + 7 * 86400000);
  await prisma.municipio.create({ data: { id: municipioId, nome: 'Município SDD011', uf: 'MT' } });
  await prisma.produtor.create({ data: { id: produtorId, nome: 'Produtor SDD011', municipioId } });
  await prisma.edital.create({ data: { id: editalId, numero: `SDD011-${Date.now()}`, ano: now.getFullYear(), titulo: 'Edital fixture SDD011', status: 'ATIVO', municipioId } });
  await prisma.editalItem.create({ data: { id: itemId, editalId, produtoOriginal: 'Milho verde', quantidade: 10, unidade: 'KG', status: 'CONFIRMADO' } });
  await prisma.editalItem.create({ data: { id: raceItemId, editalId, produtoOriginal: 'Feijão', quantidade: 10, unidade: 'KG', status: 'CONFIRMADO' } });
  await prisma.chamadaPublica.create({ data: { id: chamadaId, editalId, numero: `CH-SDD011-${Date.now()}`, exercicio: now.getFullYear(), objeto: 'Fixture SDD011', municipioId, inscricoesInicio: now, inscricoesFim: fim, status: 'INSCRICOES_ABERTAS' } });
  const interest = await prisma.interesseOportunidade.create({ data: { produtorId, chamadaId, editalItemId: itemId, quantidadePretendida: 5, observacoes: 'fixture', createdBy: produtorId } });
  check('valid-insert', Boolean(interest.id), { id: interest.id });
  try { await prisma.interesseOportunidade.create({ data: { produtorId, chamadaId, editalItemId: id(), createdBy: produtorId } }); check('invalid-fk', false, {}); } catch (e) { check('invalid-fk', e.code === 'P2003', { code: e.code }); }
  try { await prisma.interesseOportunidade.create({ data: { produtorId, chamadaId, editalItemId: itemId, createdBy: produtorId } }); check('duplicate', false, {}); } catch (e) { check('duplicate', e.code === 'P2002', { code: e.code }); }
  const concurrent = await Promise.allSettled([1, 2].map(() => prisma.interesseOportunidade.create({ data: { produtorId, chamadaId, editalItemId: raceItemId, createdBy: produtorId } })));
  check('concurrency', concurrent.filter(x => x.status === 'fulfilled').length === 1 && concurrent.filter(x => x.status === 'rejected' && x.reason.code === 'P2002').length === 1, { statuses: concurrent.map(x => x.status), rejectedCodes: concurrent.filter(x => x.status === 'rejected').map(x => x.reason.code) });
  const updated = await prisma.interesseOportunidade.update({ where: { id: interest.id }, data: { observacoes: 'atualizado', status: 'ATUALIZADO', updatedBy: produtorId } });
  check('update', updated.status === 'ATUALIZADO' && updated.observacoes === 'atualizado', { status: updated.status });
  const cancelled = await prisma.interesseOportunidade.update({ where: { id: interest.id }, data: { status: 'CANCELADO', updatedBy: produtorId } });
  check('cancel', cancelled.status === 'CANCELADO', { status: cancelled.status });
  const counts = { interests: await prisma.interesseOportunidade.count(), proposals: await prisma.proposta.count({ where: { produtorId } }), contracts: await prisma.contrato.count({ where: { produtorId } }) };
  check('no-auto-proposal-reservation', counts.proposals === 0 && counts.contracts === 0, counts);
  const output = { generatedAt: new Date().toISOString(), database: process.env.DATABASE_URL?.replace(/:\/\/([^:]+):([^@]*)@/, '://$1:***@').replace(/\/[^/?]+\?/, '/<isolated>?'), migration: '20261012170000_sdd_011_interesses_oportunidade', result: result.every(x => x.result === 'PASS') ? 'PASS' : 'FAIL', scenarios: result };
  const outputPath = require('node:path').resolve(__dirname, '../../..', 'output/e2e/sdd011-migrations-last-run.json');
  require('node:fs').mkdirSync(require('node:path').dirname(outputPath), { recursive: true });
  require('node:fs').writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify({ ...output, evidencePath: outputPath }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
