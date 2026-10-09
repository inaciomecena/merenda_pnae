import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync('Admin@123', 10);

async function main() {
  console.log('=== SEED DE TESTE - FASE 7.5 ===\n');

  // 1. Usuarios (upsert para nao duplicar)
  const users = [
    { email: 'admin@seaf.gov.br', name: 'Administrador PNAE', role: 'ADMIN' as const },
    { email: 'extensionista@seaf.gov.br', name: 'Maria Oliveira - Extensionista', role: 'EXTENSIONISTA' as const },
    { email: 'dre@seaf.gov.br', name: 'Camara de Negocios - DRE', role: 'DRE' as const },
    { email: 'escola@seaf.gov.br', name: 'Joao Silva - Escola', role: 'ESCOLA' as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, active: true },
      create: { ...u, passwordHash, active: true, createdBy: 'system', updatedBy: 'system' },
    });
  }
  console.log('[OK] 3 usuarios criados');

  // 2. Municipios
  const munData = [
    { nome: 'Alto Paraguai', uf: 'MT', codigoIbge: '5100102' },
    { nome: 'Caceres', uf: 'MT', codigoIbge: '5102524' },
    { nome: 'Pontes e Lacerda', uf: 'MT', codigoIbge: '5106756' },
  ];

  const municipios: Record<string, any> = {};
  for (const m of munData) {
    const rec = await prisma.municipio.upsert({
      where: { codigoIbge: m.codigoIbge },
      update: { nome: m.nome, uf: m.uf, ativo: true },
      create: { ...m, ativo: true, createdBy: 'system', updatedBy: 'system' },
    });
    municipios[m.nome] = rec;
  }
  console.log('[OK] 3 municipios criados');

  // 3. Produtos de referencia
  const produtosData = [
    { nome: 'abacaxi', unidadePadrao: 'KG', palavrasChave: 'abacaxi perola', sinonimos: 'abacaxi perola' },
    { nome: 'banana', unidadePadrao: 'KG', palavrasChave: 'banana prata', sinonimos: 'banana-prata' },
    { nome: 'mandioca', unidadePadrao: 'KG', palavrasChave: 'mandioca descascada', sinonimos: 'aipim, macaxeira' },
    { nome: 'tomate', unidadePadrao: 'KG', palavrasChave: 'tomate italiano', sinonimos: 'tomate salada' },
    { nome: 'cebolinha', unidadePadrao: 'MAÇO', palavrasChave: 'cebolinha fresca', sinonimos: 'cheiro verde' },
    { nome: 'abobora cabotia', unidadePadrao: 'KG', palavrasChave: 'abobora cabotia', sinonimos: 'abobora cabotia' },
    { nome: 'cheiro verde', unidadePadrao: 'UN', palavrasChave: 'cheiro-verde, cebolinha, salsa', sinonimos: 'cebolinha, salsa' },
  ];

  const produtos: Record<string, any> = {};
  for (const p of produtosData) {
    const existing = await prisma.produtoReferencia.findFirst({ where: { nome: p.nome, deletedAt: null } });
    if (existing) {
      await prisma.produtoReferencia.update({ where: { id: existing.id }, data: { ...p, ativo: true } });
      produtos[p.nome] = existing;
    } else {
      const rec = await prisma.produtoReferencia.create({ data: { ...p, agriculturaFamiliar: true, ativo: true, createdBy: 'system', updatedBy: 'system' } });
      produtos[p.nome] = rec;
    }
  }
  console.log('[OK] 7 produtos de referencia criados');

  // 4. Escolas (algumas de cada municipio)
  const escolasData = [
    { nome: 'Escola Municipal Pedro Duarte', codigo: '51001021', municipioId: municipios['Alto Paraguai'].id, endereco: 'Centro, Alto Paraguai-MT', responsavel: 'Dir. Claudia' },
    { nome: 'Escola Municipal Bela Vista', codigo: '51001022', municipioId: municipios['Alto Paraguai'].id, endereco: 'Bela Vista, Alto Paraguai-MT', responsavel: 'Dir. Ana' },
    { nome: 'Escola Municipal 16 de Marco', codigo: '51025241', municipioId: municipios['Caceres'].id, endereco: 'Caceres-MT', responsavel: 'Dir. Helena' },
    { nome: 'Escola Municipal Buriti', codigo: '51025242', municipioId: municipios['Caceres'].id, endereco: 'Area Rural, Caceres-MT', responsavel: 'Dir. Paulo' },
    { nome: 'Escola Municipal Arlindo Antonio', codigo: '51067561', municipioId: municipios['Pontes e Lacerda'].id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Marcia' },
  ];

  for (const e of escolasData) {
    const existing = await prisma.escola.findFirst({ where: { codigo: e.codigo, deletedAt: null } });
    if (!existing) {
      await prisma.escola.create({ data: { ...e, active: true, createdBy: 'system', updatedBy: 'system' } });
    }
  }
  console.log('[OK] 5 escolas criadas');

  // 5. Produtores (extensionista cadastra)
  const extensionista = await prisma.user.findUnique({ where: { email: 'extensionista@seaf.gov.br' } });

  const produtoresData = [
    { nome: 'Joao da Silva', cpfCnpj: '123.456.789-00', municipioId: municipios['Alto Paraguai'].id, endereco: 'Zona Rural, Alto Paraguai-MT', telefone: '(65) 99999-0001' },
    { nome: 'Maria das Gracas', cpfCnpj: '987.654.321-00', municipioId: municipios['Caceres'].id, endereco: 'Area Rural, Caceres-MT', telefone: '(65) 99999-0002' },
    { nome: 'Pedro Souza', cpfCnpj: '456.789.123-00', municipioId: municipios['Pontes e Lacerda'].id, endereco: 'Zona Rural, Pontes e Lacerda-MT', telefone: '(65) 99999-0003' },
  ];

  const produtores: Record<string, any> = {};
  for (const p of produtoresData) {
    let existing = await prisma.produtor.findFirst({ where: { cpfCnpj: p.cpfCnpj, deletedAt: null } });
    if (!existing) {
      existing = await prisma.produtor.create({ data: { ...p, active: true, createdBy: extensionista!.id, updatedBy: extensionista!.id } });
    }
    produtores[p.nome] = existing;
  }
  console.log('[OK] 3 produtores criados');

  // 6. Produtos dos produtores (capacidade de fornecimento)
  const produtorProdutosData = [
    // Joao da Silva - Alto Paraguai
    { produtorId: produtores['Joao da Silva'].id, produto: 'abacaxi', capacidade: 500, unidade: 'KG', periodoProducao: 'Jan-Jun', precoSugerido: 4.50 },
    { produtorId: produtores['Joao da Silva'].id, produto: 'banana', capacidade: 300, unidade: 'KG', periodoProducao: 'Todo ano', precoSugerido: 3.00 },
    { produtorId: produtores['Joao da Silva'].id, produto: 'mandioca', capacidade: 200, unidade: 'KG', periodoProducao: 'Todo ano', precoSugerido: 2.50 },
    // Maria das Gracas - Caceres
    { produtorId: produtores['Maria das Gracas'].id, produto: 'tomate', capacidade: 400, unidade: 'KG', periodoProducao: 'Jun-Nov', precoSugerido: 5.00 },
    { produtorId: produtores['Maria das Gracas'].id, produto: 'cebolinha', capacidade: 100, unidade: 'MAÇO', periodoProducao: 'Todo ano', precoSugerido: 2.00 },
    { produtorId: produtores['Maria das Gracas'].id, produto: 'cheiro verde', capacidade: 80, unidade: 'UN', periodoProducao: 'Todo ano', precoSugerido: 1.50 },
    // Pedro Souza - Pontes e Lacerda
    { produtorId: produtores['Pedro Souza'].id, produto: 'abobora cabotia', capacidade: 250, unidade: 'KG', periodoProducao: 'Mar-Ago', precoSugerido: 3.50 },
    { produtorId: produtores['Pedro Souza'].id, produto: 'mandioca', capacidade: 600, unidade: 'KG', periodoProducao: 'Todo ano', precoSugerido: 2.00 },
  ];

  for (const pp of produtorProdutosData) {
    const existing = await prisma.produtorProduto.findFirst({
      where: { produtorId: pp.produtorId, produto: pp.produto, deletedAt: null },
    });
    if (!existing) {
      await prisma.produtorProduto.create({
        data: {
          produtorId: pp.produtorId,
          produto: pp.produto,
          capacidade: String(pp.capacidade),
          unidade: pp.unidade,
          periodoProducao: pp.periodoProducao,
          precoSugerido: pp.precoSugerido,
          createdBy: extensionista!.id,
          updatedBy: extensionista!.id,
        },
      });
    }
  }
  console.log('[OK] 8 produtos dos produtores criados');

  console.log('\n=== SEED DE TESTE CONCLUIDO ===');
  console.log('Dados prontos para homologacao funcional.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
