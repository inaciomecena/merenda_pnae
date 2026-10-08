import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { PrismaClient } from '@prisma/client';

type CsvRow = Record<string, string>;

interface Args {
  file?: string;
  dryRun: boolean;
  confirmBackup: boolean;
  encoding: BufferEncoding;
}

interface Report {
  startedAt: string;
  finishedAt?: string;
  sourceFile?: string;
  dryRun: boolean;
  municipiosLidos: number;
  municipiosCriados: number;
  municipiosAtualizados: number;
  municipiosDuplicadosDesativados: number;
  municipiosForaMtSemDependenciasDesativados: number;
  escolasLidas: number;
  escolasCriadas: number;
  escolasAtualizadas: number;
  escolasForaDaFonteDesativadas: number;
  vinculosCorrigidos: number;
  linhasIgnoradas: number;
  inconsistencias: string[];
}

const prisma = new PrismaClient();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error('Informe o arquivo CSV oficial do INEP com --file caminho\\arquivo.csv');
  }

  if (!args.dryRun && !args.confirmBackup) {
    throw new Error('Antes de executar, gere backup logico e repita com --confirm-backup. Use --dry-run para simular.');
  }

  const filePath = path.resolve(args.file);
  if (!existsSync(filePath)) throw new Error(`Arquivo nao encontrado: ${filePath}`);

  const report: Report = {
    startedAt: new Date().toISOString(),
    sourceFile: filePath,
    dryRun: args.dryRun,
    municipiosLidos: 0,
    municipiosCriados: 0,
    municipiosAtualizados: 0,
    municipiosDuplicadosDesativados: 0,
    municipiosForaMtSemDependenciasDesativados: 0,
    escolasLidas: 0,
    escolasCriadas: 0,
    escolasAtualizadas: 0,
    escolasForaDaFonteDesativadas: 0,
    vinculosCorrigidos: 0,
    linhasIgnoradas: 0,
    inconsistencias: [],
  };

  await normalizeExistingMunicipios(report, args.dryRun);
  await deactivateOtherStatesWithoutDependencies(report, args.dryRun);

  const municipioCache = new Map<string, string>();
  const seenMunicipios = new Set<string>();
  const seenEscolas = new Set<string>();

  for await (const row of readCsv(filePath, args.encoding)) {
    const uf = getValue(row, ['SG_UF', 'UF']);
    if (uf !== 'MT') {
      report.linhasIgnoradas += 1;
      continue;
    }

    const codigoIbge = onlyDigits(getValue(row, ['CO_MUNICIPIO', 'COD_MUNICIPIO', 'CO_MUNICIPIO_END']));
    const nomeMunicipio = normalizeDisplayName(getValue(row, ['NO_MUNICIPIO', 'NOME_MUNICIPIO']));
    const codigoInep = onlyDigits(getValue(row, ['CO_ENTIDADE', 'COD_ESCOLA', 'CO_ESCOLA']));
    const nomeEscola = normalizeDisplayName(getValue(row, ['NO_ENTIDADE', 'NOME_ESCOLA', 'NO_ESCOLA']));

    if (!codigoIbge || !nomeMunicipio || !codigoInep || !nomeEscola) {
      report.linhasIgnoradas += 1;
      report.inconsistencias.push(`Linha ignorada por campos obrigatorios ausentes: ${JSON.stringify(row).slice(0, 500)}`);
      continue;
    }

    if (!seenMunicipios.has(codigoIbge)) {
      report.municipiosLidos += 1;
      seenMunicipios.add(codigoIbge);
    }
    if (!seenEscolas.has(codigoInep)) {
      report.escolasLidas += 1;
      seenEscolas.add(codigoInep);
    }

    const municipioId = await ensureMunicipio(codigoIbge, nomeMunicipio, report, args.dryRun, municipioCache);
    if (!municipioId) continue;

    await ensureEscola(codigoInep, nomeEscola, municipioId, report, args.dryRun);
  }

  await deactivateSchoolsOutsideOfficialSource(seenEscolas, report, args.dryRun);

  report.finishedAt = new Date().toISOString();
  writeReport(report);
  printReport(report);
}

async function deactivateSchoolsOutsideOfficialSource(seenEscolas: Set<string>, report: Report, dryRun: boolean) {
  const escolas = await prisma.escola.findMany({ where: { deletedAt: null } });
  for (const escola of escolas) {
    const codigo = onlyDigits(escola.codigo ?? '');
    if (codigo && seenEscolas.has(codigo)) continue;

    const dependencies = await countEscolaDependencies(escola.id);
    if (dependencies.total === 0) {
      report.escolasForaDaFonteDesativadas += 1;
      if (!dryRun) {
        await prisma.escola.update({
          where: { id: escola.id },
          data: { deletedAt: new Date(), active: false, updatedBy: 'import-inep-mt' },
        });
      }
    } else {
      report.inconsistencias.push(
        `Escola ausente da fonte oficial MT mantida por dependencias: ${escola.nome} (${codigo || 'sem codigo INEP'}) ${JSON.stringify(dependencies)}`,
      );
    }
  }
}

async function normalizeExistingMunicipios(report: Report, dryRun: boolean) {
  const municipios = await prisma.municipio.findMany({ where: { deletedAt: null } });
  for (const municipio of municipios) {
    const nomeNormalizado = normalizeKey(municipio.nome);
    const uf = municipio.uf.toUpperCase().trim();
    if (municipio.nomeNormalizado !== nomeNormalizado || municipio.uf !== uf) {
      report.municipiosAtualizados += 1;
      if (!dryRun) {
        await prisma.municipio.update({
          where: { id: municipio.id },
          data: { nomeNormalizado, uf, updatedBy: 'import-inep-mt' },
        });
      }
    }
  }
}

async function deactivateOtherStatesWithoutDependencies(report: Report, dryRun: boolean) {
  const municipios = await prisma.municipio.findMany({ where: { deletedAt: null, uf: { not: 'MT' } } });
  for (const municipio of municipios) {
    const dependencies = await countMunicipioDependencies(municipio.id);
    if (dependencies.total === 0) {
      report.municipiosForaMtSemDependenciasDesativados += 1;
      if (!dryRun) {
        await prisma.municipio.update({
          where: { id: municipio.id },
          data: { deletedAt: new Date(), updatedBy: 'import-inep-mt' },
        });
      }
    } else {
      report.inconsistencias.push(
        `Municipio fora de MT mantido por dependencias: ${municipio.nome}-${municipio.uf} (${JSON.stringify(dependencies)})`,
      );
    }
  }
}

async function ensureMunicipio(
  codigoIbge: string,
  nome: string,
  report: Report,
  dryRun: boolean,
  cache: Map<string, string>,
) {
  const cached = cache.get(codigoIbge);
  if (cached) return cached;

  const nomeNormalizado = normalizeKey(nome);
  const byCode = await prisma.municipio.findFirst({ where: { codigoIbge, deletedAt: null } });
  const byName = await prisma.municipio.findMany({
    where: { uf: 'MT', nomeNormalizado, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  const canonical = byCode ?? byName[0];
  if (!canonical) {
    report.municipiosCriados += 1;
    if (dryRun) return `dry-run-${codigoIbge}`;
    const created = await prisma.municipio.create({
      data: {
        nome,
        nomeNormalizado,
        uf: 'MT',
        codigoIbge,
        ativo: true,
        createdBy: 'import-inep-mt',
        updatedBy: 'import-inep-mt',
      },
    });
    cache.set(codigoIbge, created.id);
    return created.id;
  }

  if (canonical.nome !== nome || canonical.uf !== 'MT' || canonical.codigoIbge !== codigoIbge || canonical.nomeNormalizado !== nomeNormalizado) {
    report.municipiosAtualizados += 1;
    if (!dryRun) {
      await prisma.municipio.update({
        where: { id: canonical.id },
        data: { nome, uf: 'MT', codigoIbge, nomeNormalizado, ativo: true, updatedBy: 'import-inep-mt' },
      });
    }
  }

  const duplicates = byName.filter((item) => item.id !== canonical.id);
  for (const duplicate of duplicates) {
    await mergeMunicipio(duplicate.id, canonical.id, duplicate.nome, report, dryRun);
  }

  cache.set(codigoIbge, canonical.id);
  return canonical.id;
}

async function mergeMunicipio(fromId: string, toId: string, label: string, report: Report, dryRun: boolean) {
  const dependencies = await countMunicipioDependencies(fromId);
  if (!dryRun) {
    await prisma.escola.updateMany({ where: { municipioId: fromId }, data: { municipioId: toId, updatedBy: 'import-inep-mt' } });
    await prisma.produtor.updateMany({ where: { municipioId: fromId }, data: { municipioId: toId, updatedBy: 'import-inep-mt' } });
    await prisma.edital.updateMany({ where: { municipioId: fromId }, data: { municipioId: toId, updatedBy: 'import-inep-mt' } });
    await prisma.municipio.update({
      where: { id: fromId },
      data: { deletedAt: new Date(), ativo: false, updatedBy: 'import-inep-mt' },
    });
  }

  report.municipiosDuplicadosDesativados += 1;
  report.inconsistencias.push(`Municipio duplicado consolidado: ${label}. Dependencias movidas: ${JSON.stringify(dependencies)}`);
}

async function ensureEscola(codigo: string, nome: string, municipioId: string, report: Report, dryRun: boolean) {
  if (dryRun && municipioId.startsWith('dry-run-')) {
    report.escolasCriadas += 1;
    return;
  }

  const existing = await prisma.escola.findFirst({ where: { codigo, deletedAt: null } });
  if (!existing) {
    report.escolasCriadas += 1;
    if (!dryRun) {
      await prisma.escola.create({
        data: {
          nome,
          codigo,
          municipioId,
          active: true,
          createdBy: 'import-inep-mt',
          updatedBy: 'import-inep-mt',
        },
      });
    }
    return;
  }

  const municipioChanged = existing.municipioId !== municipioId;
  const nomeChanged = existing.nome !== nome;
  if (municipioChanged) report.vinculosCorrigidos += 1;
  if (municipioChanged || nomeChanged || !existing.active) {
    report.escolasAtualizadas += 1;
    if (!dryRun) {
      await prisma.escola.update({
        where: { id: existing.id },
        data: {
          nome,
          municipioId,
          active: true,
          updatedBy: 'import-inep-mt',
        },
      });
    }
  }
}

async function countMunicipioDependencies(id: string) {
  const [escolas, produtores, editais] = await Promise.all([
    prisma.escola.count({ where: { municipioId: id, deletedAt: null } }),
    prisma.produtor.count({ where: { municipioId: id, deletedAt: null } }),
    prisma.edital.count({ where: { municipioId: id, deletedAt: null } }),
  ]);
  return { escolas, produtores, editais, total: escolas + produtores + editais };
}

async function countEscolaDependencies(id: string) {
  const [editais, matches] = await Promise.all([
    prisma.edital.count({ where: { escolaId: id, deletedAt: null } }),
    prisma.match.count({ where: { escolaId: id, deletedAt: null } }),
  ]);
  return { editais, matches, total: editais + matches };
}

async function* readCsv(filePath: string, encoding: BufferEncoding): AsyncGenerator<CsvRow> {
  const input = createReadStream(filePath, { encoding });
  const reader = readline.createInterface({ input, crlfDelay: Infinity });
  let headers: string[] | null = null;
  let delimiter = ';';

  for await (const rawLine of reader) {
    const line = rawLine.replace(/^\uFEFF/, '');
    if (!line.trim()) continue;

    if (!headers) {
      delimiter = detectDelimiter(line);
      headers = parseCsvLine(line, delimiter).map((header) => header.trim().toUpperCase());
      continue;
    }

    const values = parseCsvLine(line, delimiter);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? '';
    });
    yield row;
  }
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}

function detectDelimiter(line: string) {
  const semicolon = (line.match(/;/g) ?? []).length;
  const comma = (line.match(/,/g) ?? []).length;
  return semicolon >= comma ? ';' : ',';
}

function getValue(row: CsvRow, names: string[]) {
  for (const name of names) {
    const value = row[name.toUpperCase()];
    if (value) return value.trim();
  }
  return '';
}

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeKey(value: string) {
  return normalizeDisplayName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, confirmBackup: false, encoding: 'latin1' };
  for (const item of argv) {
    if (item === '--dry-run') args.dryRun = true;
    else if (item === '--confirm-backup') args.confirmBackup = true;
    else if (item.startsWith('--file=')) args.file = item.slice('--file='.length);
    else if (item.startsWith('--encoding=')) args.encoding = item.slice('--encoding='.length) as BufferEncoding;
  }
  return args;
}

function writeReport(report: Report) {
  const dir = path.resolve(process.cwd(), '..', '..', 'docs', 'inep');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(path.join(dir, `import-report-${stamp}.json`), JSON.stringify(report, null, 2), 'utf8');
}

function printReport(report: Report) {
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
