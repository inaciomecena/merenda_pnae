import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const passwordHash = bcrypt.hashSync('Admin@123', 10);

async function main() {
  // ─── USUÁRIOS ───────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@seaf.gov.br' },
    update: { name: 'Administrador PNAE', role: 'ADMIN', active: true, updatedBy: 'system' },
    create: {
      name: 'Administrador PNAE',
      email: 'admin@seaf.gov.br',
      passwordHash,
      role: 'ADMIN',
      active: true,
      createdBy: 'system',
      updatedBy: 'system',
    },
  });

  await prisma.user.upsert({
    where: { email: 'extensionista@seaf.gov.br' },
    update: { name: 'Maria Oliveira - Extensionista', role: 'EXTENSIONISTA', active: true, updatedBy: 'system' },
    create: {
      name: 'Maria Oliveira - Extensionista',
      email: 'extensionista@seaf.gov.br',
      passwordHash,
      role: 'EXTENSIONISTA',
      active: true,
      createdBy: 'system',
      updatedBy: 'system',
    },
  });

  await prisma.user.upsert({
    where: { email: 'dre@seaf.gov.br' },
    update: { name: 'Câmara de Negócios - DRE', role: 'DRE', active: true, updatedBy: 'system' },
    create: {
      name: 'Câmara de Negócios - DRE',
      email: 'dre@seaf.gov.br',
      passwordHash,
      role: 'DRE',
      active: true,
      createdBy: 'system',
      updatedBy: 'system',
    },
  });

  await prisma.user.upsert({
    where: { email: 'escola@seaf.gov.br' },
    update: { name: 'João Silva - Escola', role: 'ESCOLA', active: true, updatedBy: 'system' },
    create: {
      name: 'João Silva - Escola',
      email: 'escola@seaf.gov.br',
      passwordHash,
      role: 'ESCOLA',
      active: true,
      createdBy: 'system',
      updatedBy: 'system',
    },
  });

  // ─── MUNICÍPIOS ─────────────────────────────────────────────
  const municipios = [
    { nome: 'Alto Paraguai', uf: 'MT', codigoIbge: '5100102' },
    { nome: 'Cáceres', uf: 'MT', codigoIbge: '5102524' },
    { nome: 'Pontes e Lacerda', uf: 'MT', codigoIbge: '5106756' },
  ];

  for (const municipio of municipios) {
    await prisma.municipio.upsert({
      where: { codigoIbge: municipio.codigoIbge },
      update: { nome: municipio.nome, uf: municipio.uf, ativo: true, updatedBy: 'system' },
      create: { ...municipio, ativo: true, createdBy: 'system', updatedBy: 'system' },
    });
  }

  // ─── PRODUTOS DE REFERÊNCIA ─────────────────────────────────
  const produtos = [
    { nome: 'abacaxi', unidadePadrao: 'KG', palavrasChave: 'abacaxi perola', sinonimos: 'abacaxi pérola' },
    { nome: 'abobora cabotia', unidadePadrao: 'KG', palavrasChave: 'abóbora cabotiã, cabotia', sinonimos: 'abobora cabotiã' },
    { nome: 'banana', unidadePadrao: 'KG', palavrasChave: 'banana prata', sinonimos: 'banana-prata' },
    { nome: 'mandioca', unidadePadrao: 'KG', palavrasChave: 'mandioca descascada', sinonimos: 'aipim, macaxeira' },
    { nome: 'cheiro verde', unidadePadrao: 'UN', palavrasChave: 'cheiro-verde, cebolinha, salsa', sinonimos: 'cebolinha, salsa' },
    { nome: 'tomate', unidadePadrao: 'KG', palavrasChave: 'tomate italiano', sinonimos: 'tomate salada' },
    { nome: 'cebolinha', unidadePadrao: 'MAÇO', palavrasChave: 'cebolinha fresca', sinonimos: 'cheiro verde' },
  ];

  for (const produto of produtos) {
    const existing = await prisma.produtoReferencia.findFirst({ where: { nome: produto.nome, deletedAt: null } });
    if (existing) {
      await prisma.produtoReferencia.update({ where: { id: existing.id }, data: { ...produto, ativo: true, agriculturaFamiliar: true, updatedBy: 'system' } });
    } else {
      await prisma.produtoReferencia.create({ data: { ...produto, agriculturaFamiliar: true, ativo: true, createdBy: 'system', updatedBy: 'system' } });
    }
  }

  // ─── ESCOLAS DEMONSTRATIVAS ────────────────────────────────
  // Escolas oficiais devem ser importadas pelo script `import:inep:mt`.
  const altoParaguai = await prisma.municipio.findUnique({ where: { codigoIbge: '5100102' } });
  const caceres = await prisma.municipio.findUnique({ where: { codigoIbge: '5102524' } });
  const pontes = await prisma.municipio.findUnique({ where: { codigoIbge: '5106756' } });
  if (process.env.SEED_DEMO_SCHOOLS === 'true') {

  const escolas = [
    // Alto Paraguai - 9 escolas públicas (Código INEP real)
    { nome: 'Escola Municipal Pedro Duarte de Miranda Lima', codigo: '51001021', municipioId: altoParaguai!.id, endereco: 'Centro, Alto Paraguai-MT', responsavel: 'Dir. Cláudia Martins' },
    { nome: 'Escola Municipal Bela Vista', codigo: '51001022', municipioId: altoParaguai!.id, endereco: 'Bela Vista, Alto Paraguai-MT', responsavel: 'Dir. Ana Souza' },
    { nome: 'Escola Municipal Nova Esperança Zona Rural', codigo: '51001023', municipioId: altoParaguai!.id, endereco: 'Zona Rural, Alto Paraguai-MT', responsavel: 'Dir. Carlos Mendes' },
    { nome: 'Escola Estadual Água Santa', codigo: '51183803', municipioId: altoParaguai!.id, endereco: 'Alto Paraguai-MT', responsavel: 'Dir. Fernanda Lima' },
    { nome: 'Escola Estadual Alexandre Gomes Silva Chaves', codigo: '51061497', municipioId: altoParaguai!.id, endereco: 'Centro, Alto Paraguai-MT', responsavel: 'Dir. Roberto Alves' },
    { nome: 'Escola Estadual Dr. Arnaldo Esteves de Figueiredo', codigo: '51001024', municipioId: altoParaguai!.id, endereco: 'Alto Paraguai-MT', responsavel: 'Dir. Patrícia Costa' },
    { nome: 'Escola Estadual Henrique José Trindade', codigo: '51001025', municipioId: altoParaguai!.id, endereco: 'Alto Paraguai-MT', responsavel: 'Dir. Marcos Ribeiro' },
    { nome: 'Escola Estadual Professora Zélia Costa de Almeida', codigo: '51001026', municipioId: altoParaguai!.id, endereco: 'Alto Paraguai-MT', responsavel: 'Dir. Luciana Pereira' },
    { nome: 'CMEI Vovó Nezinha', codigo: '51001027', municipioId: altoParaguai!.id, endereco: 'Bela Vista, Alto Paraguai-MT', responsavel: 'Dir. Sandra Machado' },

    // Cáceres - 20 escolas públicas (Códigos INEP reais)
    { nome: 'Escola Municipal 16 de Março', codigo: '51025241', municipioId: caceres!.id, endereco: 'Cáceres-MT', responsavel: 'Dir. Helena Santos' },
    { nome: 'Escola Municipal Buriti', codigo: '51025242', municipioId: caceres!.id, endereco: 'Área Rural, Cáceres-MT', responsavel: 'Dir. Paulo Nascimento' },
    { nome: 'Escola Municipal Centro Educacional Dom Maximo Biennes', codigo: '51025243', municipioId: caceres!.id, endereco: 'Santa Isabel, Cáceres-MT', responsavel: 'Dir. Juliana Ferreira' },
    { nome: 'Escola Municipal Clarinópolis', codigo: '51025244', municipioId: caceres!.id, endereco: 'Área Rural, Cáceres-MT', responsavel: 'Dir. Eduardo Campos' },
    { nome: 'Escola Municipal Desembargador Gabriel Pinto de Arruda', codigo: '51025245', municipioId: caceres!.id, endereco: 'Jardim Padre Paulo, Cáceres-MT', responsavel: 'Dir. Tânia Ribeiro' },
    { nome: 'Escola Municipal Dr. José Rodrigues Fontes', codigo: '51025246', municipioId: caceres!.id, endereco: 'Cavalhada II, Cáceres-MT', responsavel: 'Dir. Ricardo Almeida' },
    { nome: 'Escola Municipal Duque de Caxias', codigo: '51025247', municipioId: caceres!.id, endereco: 'Centro, Cáceres-MT', responsavel: 'Dir. Simone Barros' },
    { nome: 'Escola Municipal Fazendo Arte', codigo: '51025248', municipioId: caceres!.id, endereco: 'Cavalhada II, Cáceres-MT', responsavel: 'Dir. André Martins' },
    { nome: 'Escola Municipal Garçês', codigo: '51025249', municipioId: caceres!.id, endereco: 'Garçês, Cáceres-MT', responsavel: 'Dir. Vanessa Oliveira' },
    { nome: 'Escola Municipal Gotinhas do Saber', codigo: '51025250', municipioId: caceres!.id, endereco: 'São Lourenço, Cáceres-MT', responsavel: 'Dir. Lucas Araújo' },
    { nome: 'Escola Municipal Jardim Guanabara', codigo: '51025251', municipioId: caceres!.id, endereco: 'Jardim Guanabara, Cáceres-MT', responsavel: 'Dir. Priscila Mendes' },
    { nome: 'Escola Municipal Jardim Paraíso', codigo: '51025252', municipioId: caceres!.id, endereco: 'Jardim Paraíso, Cáceres-MT', responsavel: 'Dir. Fernando Costa' },
    { nome: 'Escola Municipal Laranjeira I', codigo: '51025253', municipioId: caceres!.id, endereco: 'Área Rural, Cáceres-MT', responsavel: 'Dir. Aline Sousa' },
    { nome: 'Escola Municipal Limoeiro', codigo: '51025254', municipioId: caceres!.id, endereco: 'Área Rural, Cáceres-MT', responsavel: 'Dir. Thiago Lima' },
    { nome: 'Escola Municipal Nossa Senhora Aparecida', codigo: '51025255', municipioId: caceres!.id, endereco: 'Área Rural, Cáceres-MT', responsavel: 'Dir. Cristina Nunes' },
    { nome: 'Escola Municipal Novo Oriente', codigo: '51025256', municipioId: caceres!.id, endereco: 'Santo Antônio, Cáceres-MT', responsavel: 'Dir. Diego Rodrigues' },
    { nome: 'Escola Municipal Paulo Freire', codigo: '51025257', municipioId: caceres!.id, endereco: 'Área Rural, Cáceres-MT', responsavel: 'Dir. Camila Ferreira' },
    { nome: 'Escola Municipal Pequeno Sábio', codigo: '51025258', municipioId: caceres!.id, endereco: 'Jardim Padre Paulo, Cáceres-MT', responsavel: 'Dir. Gustavo Pereira' },
    { nome: 'Escola Estadual 12 de Outubro', codigo: '51025259', municipioId: caceres!.id, endereco: 'Área Rural, Cáceres-MT', responsavel: 'Dir. Letícia Campos' },
    { nome: 'Escola Estadual Frei Ambrosio', codigo: '51025260', municipioId: caceres!.id, endereco: 'Junco, Cáceres-MT', responsavel: 'Dir. Renato Silva' },

    // Pontes e Lacerda - 18 escolas públicas (Códigos INEP reais)
    { nome: 'Escola Municipal Arlindo Antonio Nogueira', codigo: '51067561', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Márcia Rocha' },
    { nome: 'Escola Municipal Cirila Francisca da Silva', codigo: '51067562', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Sérgio Alves' },
    { nome: 'Escola Municipal Sanaria Silvéria de Souza', codigo: '51067563', municipioId: pontes!.id, endereco: 'Jardim São Gabriel, Pontes e Lacerda-MT', responsavel: 'Dir. Natália Borges' },
    { nome: 'Escola Municipal Alcides Franco da Rocha', codigo: '51067564', municipioId: pontes!.id, endereco: 'Jardim Marília, Pontes e Lacerda-MT', responsavel: 'Dir. Cláudio Mendes' },
    { nome: 'Escola Municipal Antonio Carlos de Brito', codigo: '51067565', municipioId: pontes!.id, endereco: 'Jardim Morada da Serra, Pontes e Lacerda-MT', responsavel: 'Dir. Elaine Santos' },
    { nome: 'Escola Municipal Neli Nunes Teodoro - Tia Neli', codigo: '51067566', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Wanderley Nunes' },
    { nome: 'Escola Municipal Vale do Guaporé', codigo: '51067567', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Rosângela Pires' },
    { nome: 'Escola Municipal Professora Rosilei Pereira dos Santos', codigo: '51067568', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Alexandre Costa' },
    { nome: 'Escola Estadual Dep. Dormevil Faria', codigo: '51067569', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Karla Rodrigues' },
    { nome: 'Escola Estadual Mário Spinelli', codigo: '51067570', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Eduardo Martins' },
    { nome: 'Escola Estadual Militar Tiradentes', codigo: '51067571', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Patrícia Lopes' },
    { nome: 'Escola Estadual São José', codigo: '51067572', municipioId: pontes!.id, endereco: 'São José, Pontes e Lacerda-MT', responsavel: 'Dir. Roberto Nascimento' },
    { nome: 'CEI Celio Candido de Oliveira', codigo: '51067573', municipioId: pontes!.id, endereco: 'Residencial Glória, Pontes e Lacerda-MT', responsavel: 'Dir. Silvia Araújo' },
    { nome: 'CEI Maria Antônia Galvão Neto', codigo: '51067574', municipioId: pontes!.id, endereco: 'Vila Bernec, Pontes e Lacerda-MT', responsavel: 'Dir. Marco Túlio' },
    { nome: 'CEI Máximo Assunção', codigo: '51067575', municipioId: pontes!.id, endereco: 'Vila Guaporé, Pontes e Lacerda-MT', responsavel: 'Dir. Bruna Oliveira' },
    { nome: 'CEI Prefeito Gercino Rodrigues de Souza', codigo: '51067576', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Carlos Eduardo' },
    { nome: 'CEI Vereador Oriel Mendes Lucas', codigo: '51067577', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Daniela Ferreira' },
    { nome: 'IFMT Campus Pontes e Lacerda', codigo: '51067578', municipioId: pontes!.id, endereco: 'Pontes e Lacerda-MT', responsavel: 'Dir. Prof. Helena Takahashi' },
  ];

  for (const escola of escolas) {
    const existing = await prisma.escola.findFirst({ where: { codigo: escola.codigo, deletedAt: null } });
    if (existing) {
      await prisma.escola.update({ where: { id: existing.id }, data: { ...escola, active: true, updatedBy: 'system' } });
    } else {
      await prisma.escola.create({ data: { ...escola, active: true, createdBy: 'system', updatedBy: 'system' } });
    }
  }
  }

  // ─── PRODUTORES ─────────────────────────────────────────────
  if (altoParaguai && caceres) {
    const produtorAlto = await prisma.produtor.upsert({
      where: { cpfCnpj: '00000000000191' },
      update: { nome: 'Associação Vale do Paraguai', municipioId: altoParaguai.id, active: true, updatedBy: 'system' },
      create: { nome: 'Associação Vale do Paraguai', cpfCnpj: '00000000000191', municipioId: altoParaguai.id, active: true, createdBy: 'system', updatedBy: 'system' },
    });

    const produtorCaceres = await prisma.produtor.upsert({
      where: { cpfCnpj: '00000000000272' },
      update: { nome: 'Cooperativa Frutos do Pantanal', municipioId: caceres.id, active: true, updatedBy: 'system' },
      create: { nome: 'Cooperativa Frutos do Pantanal', cpfCnpj: '00000000000272', municipioId: caceres.id, active: true, createdBy: 'system', updatedBy: 'system' },
    });

    const produtosProdutor = [
      { produtorId: produtorAlto.id, produto: 'abacaxi pérola', capacidade: '500', unidade: 'KG', periodoProducao: 'Nov-Mar' },
      { produtorId: produtorAlto.id, produto: 'abobora cabotia', capacidade: '100', unidade: 'KG', periodoProducao: 'Abr-Jul' },
      { produtorId: produtorAlto.id, produto: 'cheiro verde', capacidade: '50', unidade: 'UN', periodoProducao: 'Ano todo' },
      { produtorId: produtorCaceres.id, produto: 'banana prata', capacidade: '1000', unidade: 'KG', periodoProducao: 'Ano todo' },
      { produtorId: produtorCaceres.id, produto: 'mandioca', capacidade: '80', unidade: 'KG', periodoProducao: 'Mai-Set' },
      { produtorId: produtorCaceres.id, produto: 'tomate', capacidade: '200', unidade: 'KG', periodoProducao: 'Jun-Out' },
      { produtorId: produtorCaceres.id, produto: 'cebolinha', capacidade: '100', unidade: 'MAÇO', periodoProducao: 'Ano todo' },
    ];

    for (const item of produtosProdutor) {
      const existing = await prisma.produtorProduto.findFirst({ where: { produtorId: item.produtorId, produto: item.produto, deletedAt: null } });
      if (existing) {
        await prisma.produtorProduto.update({ where: { id: existing.id }, data: { ...item, updatedBy: 'system' } });
      } else {
        await prisma.produtorProduto.create({ data: { ...item, createdBy: 'system', updatedBy: 'system' } });
      }
    }
  }

  console.log('Seed concluído!');
  console.log('Credenciais de teste:');
  console.log('  Admin:         admin@seaf.gov.br / Admin@123');
  console.log('  Extensionista: extensionista@seaf.gov.br / Admin@123');
  console.log('  Escola:        escola@seaf.gov.br / Admin@123');
}

main()
  .finally(async () => { await prisma.$disconnect(); })
  .catch(async (error) => { await prisma.$disconnect(); throw error; });
