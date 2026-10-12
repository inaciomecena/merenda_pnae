/**
 * SDD-005 — Seed do cenário E2E em banco ISOLADO (nunca roda no banco ativo).
 *
 * Pré-requisitos: banco isolado criado, `prisma migrate deploy` aplicado e
 * `prisma/seed.ts` + `prisma/seed-test.ts` executados no mesmo banco
 * (usuários, municípios, escolas, produtores de referência).
 *
 * Cria: entidade executora, 2 DREs (escopos distintos), fornecedor com o CNPJ
 * do XML de teste, edital, proposta, contrato VIGENTE e o usuário DRE-A.
 * Escreve o contexto em scripts/.e2e-sdd005-context.json para o runner.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const municipio = await prisma.municipio.findFirst({ where: { codigoIbge: '5100102' } });
  if (!municipio) throw new Error('Municípios ausentes. Rode prisma/seed.ts no banco isolado primeiro.');

  const escola = await prisma.escola.findFirst({ where: { codigo: '51001021', deletedAt: null } });
  if (!escola) throw new Error('Escolas ausentes. Rode prisma/seed-test.ts no banco isolado primeiro.');

  let entidade = await prisma.entidadeExecutora.findFirst({ where: { cnpj: '12345678000195' } });
  if (!entidade) {
    entidade = await prisma.entidadeExecutora.create({
      data: {
        nome: 'Prefeitura Municipal de Alto Paraguai (E2E SDD-005)',
        cnpj: '12345678000195',
        uf: 'MT',
        municipioId: municipio.id,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  const dres = async (codigo: string, nome: string) => {
    const existente = await prisma.dRE.findFirst({ where: { codigo } });
    return (
      existente ??
      (await prisma.dRE.create({
        data: {
          nome,
          codigo,
          entidadeExecutoraId: entidade!.id,
          municipioSede: municipio.nome,
          createdBy: 'e2e-seed',
          updatedBy: 'e2e-seed',
        },
      }))
    );
  };
  const dreA = await dres('DRE-E2E-A', 'DRE E2E A (escopo do contrato - SDD-005)');
  const dreB = await dres('DRE-E2E-B', 'DRE E2E B (fora do escopo - SDD-005)');

  // Fornecedor com CNPJ idêntico ao emitente do XML de teste (dígitos).
  let fornecedor = await prisma.produtor.findFirst({ where: { cpfCnpj: '12345678000195' } });
  if (!fornecedor) {
    fornecedor = await prisma.produtor.create({
      data: {
        nome: 'Fornecedor Teste SDD-005',
        cpfCnpj: '12345678000195',
        municipioId: municipio.id,
        endereco: 'Zona Rural, Alto Paraguai-MT',
        telefone: '(65) 99999-0000',
        active: true,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let edital = await prisma.edital.findFirst({ where: { numero: '001/2026', ano: 2026, deletedAt: null } });
  if (!edital) {
    edital = await prisma.edital.create({
      data: {
        numero: '001/2026',
        ano: 2026,
        titulo: 'Chamada pública E2E SDD-005',
        status: 'ATIVO',
        municipioId: municipio.id,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let proposta = await prisma.proposta.findFirst({
    where: { editalId: edital.id, produtorId: fornecedor.id, deletedAt: null },
  });
  if (!proposta) {
    proposta = await prisma.proposta.create({
      data: {
        editalId: edital.id,
        produtorId: fornecedor.id,
        status: 'FINALIZADA',
        valorTotal: 1000,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let contrato = await prisma.contrato.findFirst({
    where: { numero: '0001/2026', exercicio: 2026, deletedAt: null },
  });
  if (!contrato) {
    contrato = await prisma.contrato.create({
      data: {
        numero: '0001/2026',
        exercicio: 2026,
        editalId: edital.id,
        propostaId: proposta.id,
        produtorId: fornecedor.id,
        dreId: dreA.id,
        escolaId: escola.id,
        municipioId: municipio.id,
        valorInicial: 1000,
        valorAtualizado: 1000,
        status: 'VIGENTE',
        objeto: 'Fornecimento de gêneros alimentícios (cenário E2E SDD-005)',
        vigenciaInicio: new Date('2026-01-01'),
        vigenciaFim: new Date('2026-12-31'),
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  // Usuário DRE adicional: mesmo papel, escopo institucional diferente.
  const hash = bcrypt.hashSync('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'dre-a@seaf.gov.br' },
    update: { name: 'DRE A - E2E SDD-005', role: 'DRE', active: true, updatedBy: 'e2e-seed' },
    create: {
      name: 'DRE A - E2E SDD-005',
      email: 'dre-a@seaf.gov.br',
      passwordHash: hash,
      role: 'DRE',
      active: true,
      createdBy: 'e2e-seed',
      updatedBy: 'e2e-seed',
    },
  });

  // ── Cadeia de recebimento (item contratual + entrega ACEITA) usada pelo
  // grupo J (associação manual de recebimentos à nota fiscal). ─────────────
  let propostaItem = await prisma.propostaItem.findFirst({
    where: { propostaId: proposta.id, produto: 'Arroz', deletedAt: null },
  });
  if (!propostaItem) {
    propostaItem = await prisma.propostaItem.create({
      data: {
        propostaId: proposta.id,
        produto: 'Arroz',
        unidade: 'KG',
        quantidade: 100,
        precoUnitario: 10,
        valorTotal: 1000,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let contratoItem = await prisma.contratoItem.findFirst({
    where: { contratoId: contrato.id, produto: 'Arroz', deletedAt: null },
  });
  if (!contratoItem) {
    contratoItem = await prisma.contratoItem.create({
      data: {
        contratoId: contrato.id,
        propostaItemId: propostaItem.id,
        produto: 'Arroz',
        unidade: 'KG',
        quantidadeContratada: 100,
        quantidadeDisponivel: 100,
        valorUnitario: 10,
        valorTotal: 1000,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let programacao = await prisma.programacaoEntrega.findFirst({
    where: { contratoId: contrato.id, numero: 'PE-E2E-001' },
  });
  if (!programacao) {
    programacao = await prisma.programacaoEntrega.create({
      data: {
        numero: 'PE-E2E-001',
        contratoId: contrato.id,
        fornecedorId: fornecedor.id,
        unidadeEscolarId: escola.id,
        dreId: dreA.id,
        municipioId: municipio.id,
        dataPrevista: new Date('2026-10-01'),
        status: 'CONFIRMADA',
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let programacaoItem = await prisma.programacaoEntregaItem.findFirst({
    where: { programacaoId: programacao.id },
  });
  if (!programacaoItem) {
    programacaoItem = await prisma.programacaoEntregaItem.create({
      data: {
        programacaoId: programacao.id,
        contratoItemId: contratoItem.id,
        produto: 'Arroz',
        unidadeMedida: 'KG',
        quantidadeProgramada: 100,
        valorUnitarioContratual: 10,
        valorTotalPrevisto: 1000,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let entrega = await prisma.entrega.findFirst({ where: { programacaoId: programacao.id } });
  if (!entrega) {
    entrega = await prisma.entrega.create({
      data: {
        numero: 'ENT-E2E-001',
        programacaoId: programacao.id,
        fornecedorId: fornecedor.id,
        unidadeEscolarId: escola.id,
        dreId: dreA.id,
        municipioId: municipio.id,
        dataEntrega: new Date('2026-10-05'),
        status: 'ACEITA',
        aceitaEm: new Date('2026-10-05'),
        aceitaPor: 'e2e-seed',
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  let entregaItem = await prisma.entregaItem.findFirst({ where: { entregaId: entrega.id } });
  if (!entregaItem) {
    entregaItem = await prisma.entregaItem.create({
      data: {
        entregaId: entrega.id,
        programacaoItemId: programacaoItem.id,
        quantidadeInformada: 10,
        quantidadeAceita: 10,
        quantidadeRejeitada: 0,
        createdBy: 'e2e-seed',
        updatedBy: 'e2e-seed',
      },
    });
  }

  const emails = [
    'admin@seaf.gov.br',
    'dre@seaf.gov.br',
    'dre-a@seaf.gov.br',
    'escola@seaf.gov.br',
    'extensionista@seaf.gov.br',
  ];
  const users: Record<string, string> = {};
  for (const email of emails) {
    const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!u) throw new Error(`Usuário ${email} ausente. Rode prisma/seed.ts no banco isolado.`);
    users[email] = u.id;
  }

  const contexto = {
    databaseUrl: process.env.DATABASE_URL ?? null,
    contratoId: contrato.id,
    fornecedorId: fornecedor.id,
    contratoItemId: contratoItem.id,
    entregaId: entrega.id,
    entregaItemId: entregaItem.id,
    dreAId: dreA.id,
    dreBId: dreB.id,
    escolaId: escola.id,
    municipioId: municipio.id,
    users,
  };

  fs.writeFileSync(path.join(__dirname, '.e2e-sdd005-context.json'), JSON.stringify(contexto, null, 2));
  console.log('[E2E-SEED OK]', JSON.stringify(contexto, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
