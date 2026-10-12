import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const municipio = await prisma.municipio.findFirst({ where: { deletedAt: null } });
  if (!municipio) throw new Error('Municipio ausente. Execute os seeds base.');
  let entidade = await prisma.entidadeExecutora.findFirst({ where: { municipioId: municipio.id } });
  if (!entidade) entidade = await prisma.entidadeExecutora.create({ data: { nome: 'Entidade E2E SDD-008', cnpj: '99887766000100', uf: municipio.uf, municipioId: municipio.id, createdBy: 'e2e-sdd008', updatedBy: 'e2e-sdd008' } });
  let dre = await prisma.dRE.findFirst({ where: { codigo: 'DRE-SDD008' } });
  if (!dre) dre = await prisma.dRE.create({ data: { nome: 'DRE E2E SDD-008', codigo: 'DRE-SDD008', entidadeExecutoraId: entidade.id, municipioSede: municipio.nome, createdBy: 'e2e-sdd008', updatedBy: 'e2e-sdd008' } });
  const escolas = await prisma.escola.findMany({ where: { municipioId: municipio.id, deletedAt: null, active: true }, take: 2 });
  if (escolas.length < 2) throw new Error('Duas escolas do mesmo municipio sao necessarias.');
  for (const escola of escolas) {
    const existente = await prisma.vinculoEscolaDRE.findFirst({ where: { escolaId: escola.id, dreId: dre.id } });
    if (existente) await prisma.vinculoEscolaDRE.update({ where: { id: existente.id }, data: { ativo: true } });
    else await prisma.vinculoEscolaDRE.create({ data: { escolaId: escola.id, dreId: dre.id, vigenciaInicio: new Date('2026-01-01'), ativo: true, createdBy: 'e2e-sdd008', updatedBy: 'e2e-sdd008' } });
  }
  let edital = await prisma.edital.findFirst({ where: { numero: 'SDD008-BASE', ano: 2026, deletedAt: null } });
  if (!edital) edital = await prisma.edital.create({ data: { numero: 'SDD008-BASE', ano: 2026, titulo: 'Edital base ficticio SDD-008', objeto: 'Cenario integrado de homologacao tecnica', status: 'ATIVO', municipioId: municipio.id, createdBy: 'e2e-sdd008', updatedBy: 'e2e-sdd008' } });
  const item = await prisma.editalItem.findFirst({ where: { editalId: edital.id, produtoOriginal: 'Mandioca SDD008' } });
  if (!item) await prisma.editalItem.create({ data: { editalId: edital.id, numeroItem: 1, produtoOriginal: 'Mandioca SDD008', especificacao: 'Produto ficticio de teste', quantidade: 20, unidade: 'KG', precoUnitario: 10, valorTotal: 200, status: 'CONFIRMADO', createdBy: 'e2e-sdd008', updatedBy: 'e2e-sdd008' } });
  const produtores = await prisma.produtor.findMany({ where: { deletedAt: null, active: true }, take: 3 });
  if (produtores.length < 3) throw new Error('Tres produtores sao necessarios. Execute seed-test.');
  console.log(JSON.stringify({ editalId: edital.id, dreId: dre.id, escolaIds: escolas.map((e) => e.id), produtorIds: produtores.map((p) => p.id) }));
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
