/**
 * SNAPSHOT INSTITUCIONAL — SOMENTE LEITURA.
 *
 * Exporta DREs, Municípios, Entidades Executoras e (resumo) Escolas/Vínculos
 * para um JSON estático, que alimenta a resolução institucional da importação
 * histórica SEM depender de conexão ao banco durante os testes e o dry-run.
 *
 * REGRA: apenas SELECT (findMany). Nenhum create/update/delete/executeRaw.
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const dres = await prisma.DRE.findMany({
    select: { id: true, nome: true, codigo: true, municipioSede: true, ativo: true },
    orderBy: { nome: 'asc' },
  });
  const municipios = await prisma.Municipio.findMany({
    select: { id: true, nome: true, nomeNormalizado: true, uf: true, codigoIbge: true, ativo: true },
    orderBy: { nome: 'asc' },
  });
  const entidades = await prisma.EntidadeExecutora.findMany({
    select: { id: true, nome: true, cnpj: true, tipo: true, uf: true, municipioId: true, ativo: true },
    orderBy: { nome: 'asc' },
  });
  const escolas = await prisma.Escola.findMany({
    select: { id: true, nome: true, codigo: true, municipioId: true, active: true },
  });
  const vinculos = await prisma.VinculoEscolaDRE.findMany({
    select: { escolaId: true, dreId: true, vigenciaInicio: true, vigenciaFim: true, ativo: true },
  });

  const snapshot = {
    geradoEm: new Date().toISOString(),
    origem: 'somente leitura (findMany) — apps/backend prisma',
    dres,
    municipios,
    entidadesExecutoras: entidades,
    escolas: escolas.map((e) => ({
      id: e.id,
      nome: e.nome,
      codigoInep: e.codigo,
      municipioId: e.municipioId,
      ativo: e.active,
    })),
    vinculosEscolaDRE: vinculos,
  };

  const destino = path.resolve(__dirname, '..', 'snapshot-institucional.json');
  fs.writeFileSync(destino, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`snapshot gravado: ${destino}`);
  console.log(JSON.stringify({
    dres: dres.length,
    municipios: municipios.length,
    entidades: entidades.length,
    escolas: escolas.length,
    vinculos: vinculos.length,
  }));
  await prisma.$disconnect();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
