import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const importacaoId = process.argv[2];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function category(nome: string) {
  const value = normalize(nome);
  if (/carne|peixe|queijo|leite|manteiga|requeijao|bebida lactea/.test(value)) return 'Proteínas e lácteos';
  if (/bolo|pao|farinha|cafe|colorau|acafrao|doce/.test(value)) return 'Processados';
  if (/polpa|banana|abacaxi|abobora|batata|beterraba|cenoura|mandioca|melancia|melao|mamao|laranja|limao|ponca|tomate|pepino|pimentao|repolho/.test(value)) return 'Hortifrúti';
  return 'Hortaliças e temperos';
}

async function main() {
  if (!importacaoId) throw new Error('Informe o id da importação.');
  const log = await prisma.importLog.findUnique({ where: { id: importacaoId }, include: { edital: { include: { itens: { where: { deletedAt: null } } } } } });
  if (!log?.edital) throw new Error('Importação ou edital não encontrado.');

  const corrections: Record<number, { nome: string; unidade: string }> = {
    30: { nome: 'LARANJA PÊRA', unidade: 'KG' },
    31: { nome: 'LEITE PASTEURIZADO INTEGRAL', unidade: 'L' },
    32: { nome: 'LIMÃO TAHITI', unidade: 'KG' },
    35: { nome: 'MANJERICÃO', unidade: 'KG' },
  };

  let linked = 0;
  for (const item of log.edital.itens) {
    const correction = corrections[item.numeroItem ?? 0];
    const nome = correction?.nome || item.produtoOriginal;
    if (!nome || /^(sujidades|integral)$/i.test(nome)) continue;
    const unidade = correction?.unidade || item.unidade || 'KG';
    const key = normalize(nome);
    const terms = Array.from(new Set([nome, key])).join(', ');
    const existing = await prisma.produtoReferencia.findFirst({ where: { deletedAt: null, nome } });
    const reference = existing
      ? await prisma.produtoReferencia.update({ where: { id: existing.id }, data: { unidadePadrao: existing.unidadePadrao || unidade, categoria: existing.categoria || category(nome), palavrasChave: existing.palavrasChave || terms, sinonimos: existing.sinonimos || nome, ativo: true, updatedBy: 'sync-import-products' } })
      : await prisma.produtoReferencia.create({ data: { nome, unidadePadrao: unidade, categoria: category(nome), palavrasChave: terms, sinonimos: nome, agriculturaFamiliar: true, ativo: true, createdBy: 'sync-import-products', updatedBy: 'sync-import-products' } });
    await prisma.editalItem.update({ where: { id: item.id }, data: { produtoOriginal: nome, unidade, produtoReferenciaId: reference.id, updatedBy: 'sync-import-products' } });
    linked += 1;
  }
  console.log(`Produtos sincronizados: ${linked}`);
}

main().finally(() => prisma.$disconnect());
