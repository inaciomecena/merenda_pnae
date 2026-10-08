import { readFileSync } from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IbgeMunicipio {
  id: number;
  nome: string;
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function main() {
  const jsonPath = path.resolve(__dirname, '..', '..', '..', 'docs', 'inep', 'ibge-municipios-mt-2026-07-08.json');
  console.log(`Lendo arquivo: ${jsonPath}`);

  const raw = readFileSync(jsonPath, 'utf-8').replace(/^\uFEFF/, '');
  const municipios: IbgeMunicipio[] = JSON.parse(raw);

  console.log(`Municípios IBGE carregados: ${municipios.length}`);

  const ibgeMap = new Map<string, string>();
  for (const m of municipios) {
    ibgeMap.set(normalizeName(m.nome), String(m.id));
  }

  const dbMunicipios = await prisma.municipio.findMany({
    where: { uf: 'MT', deletedAt: null },
  });

  console.log(`Municípios no banco: ${dbMunicipios.length}`);

  let atualizados = 0;
  let jaPossuemCodigo = 0;
  let naoEncontrados: string[] = [];

  for (const dbMun of dbMunicipios) {
    const key = normalizeName(dbMun.nome);
    const ibgeCode = ibgeMap.get(key);

    if (!ibgeCode) {
      naoEncontrados.push(dbMun.nome);
      continue;
    }

    if (dbMun.codigoIbge === ibgeCode) {
      jaPossuemCodigo++;
      continue;
    }

    // Verificar se já existe outro município com esse código
    const existing = await prisma.municipio.findFirst({
      where: {
        codigoIbge: ibgeCode,
        id: { not: dbMun.id },
        deletedAt: null,
      },
    });

    if (existing) {
      console.log(`  ⚠️  Código ${ibgeCode} já usado por "${existing.nome}", pulando "${dbMun.nome}"`);
      continue;
    }

    await prisma.municipio.update({
      where: { id: dbMun.id },
      data: {
        codigoIbge: ibgeCode,
        updatedBy: 'script-update-ibge',
      },
    });

    console.log(`  ✅ ${dbMun.nome} → ${ibgeCode}`);
    atualizados++;
  }

  console.log('\n=== Resumo ===');
  console.log(`Total de municípios MT no banco: ${dbMunicipios.length}`);
  console.log(`Códigos IBGE atualizados: ${atualizados}`);
  console.log(`Já possuíam código correto: ${jaPossuemCodigo}`);
  console.log(`Não encontrados no JSON: ${naoEncontrados.length}`);

  if (naoEncontrados.length > 0) {
    console.log('\nMunicípios sem correspondência:');
    for (const nome of naoEncontrados) {
      console.log(`  - ${nome}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
