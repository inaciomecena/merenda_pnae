import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { DRES_SEDUC_MT, PRODUTOS_EDITAL_ALTO_PARAGUAI } from './reference-data';

type MunicipioIbge = { id: number; nome: string };

export type ReferenceSeedReport = {
  municipios: number;
  produtos: number;
  dres: number;
  escolasFonte: number;
  escolasVinculadas: number;
  escolasJaVinculadas: number;
  escolasNaoEncontradas: string[];
  escolasAmbiguas: string[];
};

export function normalizeReference(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[ªº°]/g, '')
    .replace(/\b(escola estadual|ee)\b/g, ' ')
    .replace(/\b(professora|professor|prof)\b/g, 'prof ')
    .replace(/\b(doutora|doutor|dr)\b/g, 'dr ')
    .replace(/\b(deputada|deputado|dep)\b/g, 'dep ')
    .replace(/\b(senadora|senador|sen)\b/g, 'sen ')
    .replace(/\b(marechal|mal)\b/g, 'mal ')
    .replace(/\b(padre|pe)\b/g, 'pe ')
    .replace(/\b(presidente|pres)\b/g, 'pres ')
    .replace(/\b(governador|gov)\b/g, 'gov ')
    .replace(/\b(coronel|cel)\b/g, 'cel ')
    .replace(/\b(vereador|ver)\b/g, 'ver ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSchoolReference(value: string) {
  return normalizeReference(value)
    .replace(/\b(civico militar|de tempo integral|tempo integral|militar tiradentes|militar dom pedro ii)\b/g, ' ')
    .replace(/\b(ten|sgt|cb|sd|pm|bm|maj)\b/g, ' ')
    .replace(/\b(nsa sra)\b/g, 'nossa senhora')
    .replace(/\b([a-z]+)ski\b/g, '$1ski')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(left: string, right: string) {
  const a = new Set(left.split(' ').filter((word) => word.length > 1));
  const b = new Set(right.split(' ').filter((word) => word.length > 1));
  const intersection = [...a].filter((word) => b.has(word)).length;
  return (2 * intersection) / Math.max(1, a.size + b.size);
}

function splitSchoolAndMunicipality(label: string) {
  const parts = label.split(/\s[-–—]\s/);
  return { escola: parts[0], municipio: parts.length > 1 ? parts[parts.length - 1] : undefined };
}

export async function seedReferenceData(prisma: PrismaClient): Promise<ReferenceSeedReport> {
  const report: ReferenceSeedReport = {
    municipios: 0, produtos: 0, dres: 0, escolasFonte: 0,
    escolasVinculadas: 0, escolasJaVinculadas: 0,
    escolasNaoEncontradas: [], escolasAmbiguas: [],
  };

  const municipiosPath = path.resolve(__dirname, '..', '..', '..', 'docs', 'inep', 'ibge-municipios-mt-2026-07-08.json');
  const municipios = JSON.parse(readFileSync(municipiosPath, 'utf8').replace(/^\uFEFF/, '')) as MunicipioIbge[];
  for (const item of municipios) {
    const codigoIbge = String(item.id);
    const nomeNormalizado = normalizeReference(item.nome);
    const existingByCode = await prisma.municipio.findUnique({ where: { codigoIbge } });
    const existingByName = existingByCode ?? await prisma.municipio.findFirst({
      where: { uf: 'MT', deletedAt: null, OR: [{ nomeNormalizado }, { nome: item.nome }] },
      orderBy: { createdAt: 'asc' },
    });
    if (existingByName) {
      await prisma.municipio.update({ where: { id: existingByName.id }, data: {
        nome: item.nome, nomeNormalizado, uf: 'MT', codigoIbge, ativo: true, deletedAt: null,
        updatedBy: 'seed-referencias-oficiais',
      } });
    } else {
      await prisma.municipio.create({ data: {
        nome: item.nome, nomeNormalizado, uf: 'MT', codigoIbge, ativo: true,
        createdBy: 'seed-referencias-oficiais', updatedBy: 'seed-referencias-oficiais',
      } });
    }
    report.municipios += 1;
  }

  const existingProducts = await prisma.produtoReferencia.findMany({ where: { deletedAt: null } });
  const canonicalProductKeys = new Set(PRODUTOS_EDITAL_ALTO_PARAGUAI.map((item) => normalizeReference(item.nome)));
  for (const item of PRODUTOS_EDITAL_ALTO_PARAGUAI) {
    const existing = existingProducts.find((product) => normalizeReference(product.nome) === normalizeReference(item.nome));
    const data = { ...item, subcategoria: 'Edital 001/2025 - Alto Paraguai', agriculturaFamiliar: true, ativo: true,
      updatedBy: 'seed-edital-alto-paraguai' };
    if (existing) await prisma.produtoReferencia.update({ where: { id: existing.id }, data });
    else await prisma.produtoReferencia.create({ data: { ...data, createdBy: 'seed-edital-alto-paraguai' } });
    report.produtos += 1;
  }
  for (const product of existingProducts) {
    if (canonicalProductKeys.has(normalizeReference(product.nome)) || product.createdBy !== 'system') continue;
    const dependencies = await prisma.produtoReferencia.findUnique({ where: { id: product.id },
      select: { _count: { select: { editalItems: true, matches: true } } } });
    if (dependencies && dependencies._count.editalItems + dependencies._count.matches === 0) {
      await prisma.produtoReferencia.update({ where: { id: product.id }, data: { ativo: false, updatedBy: 'seed-edital-alto-paraguai' } });
    }
  }

  let entidade = await prisma.entidadeExecutora.findFirst({
    where: { nome: 'Secretaria de Estado de Educação de Mato Grosso', deletedAt: null },
  });
  entidade ??= await prisma.entidadeExecutora.create({ data: {
    nome: 'Secretaria de Estado de Educação de Mato Grosso', tipo: 'ESTADUAL', uf: 'MT', ativo: true,
    createdBy: 'seed-seduc-mt', updatedBy: 'seed-seduc-mt',
  } });

  const dbSchools = await prisma.escola.findMany({
    where: { deletedAt: null },
    include: { municipio: { select: { nome: true } } },
  });
  const schoolsByName = new Map<string, typeof dbSchools>();
  const schoolsByReference = new Map<string, typeof dbSchools>();
  for (const school of dbSchools) {
    const key = normalizeReference(school.nome);
    schoolsByName.set(key, [...(schoolsByName.get(key) ?? []), school]);
    const referenceKey = normalizeSchoolReference(school.nome);
    schoolsByReference.set(referenceKey, [...(schoolsByReference.get(referenceKey) ?? []), school]);
  }

  const regionalMunicipalities = new Map<string, Set<string>>();
  for (const source of DRES_SEDUC_MT) {
    const municipalities = new Set<string>();
    for (const label of source.escolas) {
      const parsed = splitSchoolAndMunicipality(label);
      const direct = schoolsByName.get(normalizeReference(parsed.escola)) ?? [];
      const relaxed = schoolsByReference.get(normalizeSchoolReference(parsed.escola)) ?? [];
      const candidates = direct.length ? direct : relaxed;
      if (candidates.length === 1) municipalities.add(normalizeReference(candidates[0].municipio.nome));
      if (parsed.municipio) municipalities.add(normalizeReference(parsed.municipio));
    }
    regionalMunicipalities.set(source.codigo, municipalities);
  }

  const start = new Date('2026-01-01T00:00:00.000Z');
  for (const source of DRES_SEDUC_MT) {
    const dre = await prisma.dRE.upsert({
      where: { codigo: source.codigo },
      update: { nome: source.nome, municipioSede: source.municipioSede, entidadeExecutoraId: entidade.id,
        ativo: true, deletedAt: null, updatedBy: 'seed-seduc-mt' },
      create: { codigo: source.codigo, nome: source.nome, municipioSede: source.municipioSede,
        entidadeExecutoraId: entidade.id, ativo: true, createdBy: 'seed-seduc-mt', updatedBy: 'seed-seduc-mt' },
    });
    report.dres += 1;

    for (const label of source.escolas) {
      report.escolasFonte += 1;
      const parsed = splitSchoolAndMunicipality(label);
      let candidates = schoolsByName.get(normalizeReference(parsed.escola)) ?? [];
      if (candidates.length === 0) candidates = schoolsByReference.get(normalizeSchoolReference(parsed.escola)) ?? [];
      if (parsed.municipio) {
        candidates = candidates.filter((item) => normalizeReference(item.municipio.nome) === normalizeReference(parsed.municipio!));
      }
      if (candidates.length !== 1) {
        const municipalities = regionalMunicipalities.get(source.codigo) ?? new Set<string>();
        const regional = candidates.filter((item) => municipalities.has(normalizeReference(item.municipio.nome)));
        if (regional.length === 1) candidates = regional;
      }
      if (candidates.length === 0) {
        const target = normalizeSchoolReference(parsed.escola);
        const municipalities = regionalMunicipalities.get(source.codigo) ?? new Set<string>();
        const ranked = dbSchools
          .filter((item) => municipalities.has(normalizeReference(item.municipio.nome)))
          .map((item) => ({ item, score: similarity(target, normalizeSchoolReference(item.nome)) }))
          .sort((a, b) => b.score - a.score);
        if (ranked[0]?.score >= 0.86 && ranked[0].score - (ranked[1]?.score ?? 0) >= 0.08) candidates = [ranked[0].item];
      }
      if (candidates.length === 0) { report.escolasNaoEncontradas.push(`${source.codigo}: ${label}`); continue; }
      if (candidates.length > 1) { report.escolasAmbiguas.push(`${source.codigo}: ${label}`); continue; }

      const school = candidates[0];
      if (!school.active) {
        await prisma.escola.update({ where: { id: school.id }, data: { active: true, updatedBy: 'seed-seduc-mt' } });
      }
      const current = await prisma.vinculoEscolaDRE.findFirst({ where: { escolaId: school.id, ativo: true } });
      if (current?.dreId === dre.id) { report.escolasJaVinculadas += 1; continue; }
      await prisma.$transaction(async (tx) => {
        if (current) await tx.vinculoEscolaDRE.update({ where: { id: current.id }, data: {
          ativo: false, vigenciaFim: new Date(start.getTime() - 1), updatedBy: 'seed-seduc-mt',
        } });
        await tx.vinculoEscolaDRE.create({ data: {
          escolaId: school.id, dreId: dre.id, vigenciaInicio: start, ativo: true,
          createdBy: 'seed-seduc-mt', updatedBy: 'seed-seduc-mt',
        } });
      });
      report.escolasVinculadas += 1;
    }
  }
  return report;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const report = await seedReferenceData(prisma);
    console.log(JSON.stringify(report, null, 2));
    const outputDir = path.resolve(__dirname, '..', '..', '..', 'output');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, 'seed-reference-report.json'), JSON.stringify(report, null, 2), 'utf8');
    if (report.escolasAmbiguas.length || report.escolasNaoEncontradas.length) {
      console.warn('Carga concluída com escolas pendentes de correspondência segura. Consulte output/seed-reference-report.json.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) void main();
