// SDD-005 — inspeção de cadastros existentes no banco de desenvolvimento (somente leitura)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('== USUÁRIOS ==');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  for (const u of users) console.log(`${u.id} | ${u.email} | role=${u.role} | ativo=${u.active} | ${u.name}`);

  console.log('\n== VÍNCULOS ==');
  const vins = await prisma.vinculoUsuario.findMany({
    select: { id: true, userId: true, funcao: true, dreId: true, escolaId: true, municipioId: true, produtorId: true, ativo: true, vigenciaInicio: true, vigenciaFim: true },
  });
  console.log(`Total: ${vins.length}`);
  for (const v of vins) console.log(JSON.stringify(v));

  console.log('\n== DREs ==');
  const dres = await prisma.dRE.findMany({ select: { id: true, nome: true, codigo: true, entidadeExecutoraId: true, municipioSede: true, ativo: true }, orderBy: { nome: 'asc' } });
  console.log(`Total: ${dres.length}`);
  for (const d of dres.slice(0, 10)) console.log(`${d.id} | ${d.nome} | codigo=${d.codigo} | entidade=${d.entidadeExecutoraId} | sede=${d.municipioSede} | ativo=${d.ativo}`);
  if (dres.length > 10) console.log(`... +${dres.length - 10}`);

  console.log('\n== MUNICÍPIOS (amostra) ==');
  const muns = await prisma.municipio.count();
  console.log(`Total: ${muns}`);
  const muns3 = await prisma.municipio.findMany({ take: 5, select: { id: true, nome: true, uf: true, codigoIbge: true } });
  for (const m of muns3) console.log(`${m.id} | ${m.nome}/${m.uf} | ibge=${m.codigoIbge}`);

  console.log('\n== ESCOLAS (contagem) ==');
  console.log(`Total: ${await prisma.escola.count()}`);

  console.log('\n== PRODUTORES (fornecedores) ==');
  const pros = await prisma.produtor.findMany({ select: { id: true, nome: true, cpfCnpj: true, municipioId: true, active: true }, orderBy: { nome: 'asc' } });
  console.log(`Total: ${pros.length}`);
  for (const p of pros) console.log(`${p.id} | ${p.nome} | ${p.cpfCnpj} | mun=${p.municipioId} | ativo=${p.active}`);

  console.log('\n== EDITAIS ==');
  const eds = await prisma.edital.findMany({ select: { id: true, numero: true, ano: true, titulo: true, status: true, municipioId: true } });
  console.log(`Total: ${eds.length}`);
  for (const e of eds) console.log(`${e.id} | nº ${e.numero}/${e.ano} | ${e.titulo} | status=${e.status} | mun=${e.municipioId}`);

  console.log('\n== CONTRATOS ==');
  const cons = await prisma.contrato.findMany({
    select: { id: true, numero: true, exercicio: true, status: true, editalId: true, propostaId: true, produtorId: true, dreId: true, valorAtualizado: true, vigenciaInicio: true, vigenciaFim: true },
  });
  console.log(`Total: ${cons.length}`);
  for (const c of cons) console.log(`${c.id} | nº ${c.numero}/${c.exercicio} | status=${c.status} | edital=${c.editalId} | proposta=${c.propostaId} | produtor=${c.produtorId} | dre=${c.dreId} | valor=${c.valorAtualizado}`);

  console.log('\n== CONTRATOS × ITENS × ENTREGAS ==');
  console.log(`ContratoItem: ${await prisma.contratoItem.count()} | ProgramacaoEntrega: ${await prisma.programacaoEntrega.count()} | Entrega: ${await prisma.entrega.count()} | EntregaItem: ${await prisma.entregaItem.count()}`);

  console.log('\n== NOTAS FISCAIS / FISCAL (pré-ativação) ==');
  console.log(`NotaFiscal: ${await prisma.notaFiscal.count()} | Itens: ${await prisma.notaFiscalItem.count()} | Atestos: ${await prisma.atesto.count()} | Liquidações: ${await prisma.liquidacao.count()} | Pagamentos: ${await prisma.pagamento.count()}`);

  console.log('\n== ENTIDADES EXECUTORAS ==');
  const entidades = await prisma.entidadeExecutora.findMany({ select: { id: true, nome: true, tipo: true } });
  console.log(`Total: ${entidades.length}`);
  for (const e of entidades) console.log(`${e.id} | ${e.nome} | tipo=${e.tipo}`);

  console.log('\n== AUDITORIA (últimos 5) ==');
  const aud = await prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, action: true, entity: true, createdAt: true } });
  for (const a of aud) console.log(`${a.createdAt.toISOString()} | ${a.action} | ${a.entity}`);

  await prisma.$disconnect();
})().catch(async (e) => { console.error('ERRO:', e.message.slice(0, 400)); await prisma.$disconnect(); process.exit(1); });
