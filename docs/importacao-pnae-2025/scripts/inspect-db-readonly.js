/**
 * INSPEÇÃO SOMENTE LEITURA do banco configurado em apps/backend/.env (MySQL local).
 *
 * REGRA: este script executa APENAS consultas find/count (SELECT). Não há
 * create/update/delete/upsert/execute raw. Não aplica migrations nem seeds.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/inspect-db-readonly.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const log = [];
function reg(o) { log.push(o); console.log(JSON.stringify(o)); }

async function safe(label, fn) {
  try { return await fn(); } catch (e) { reg({ erro: label, mensagem: e.message.split('\n')[0] }); return null; }
}

(async () => {
  reg({ connect: await safe('connect', async () => { await prisma.$connect(); return 'ok'; }) });

  const models = [
    'DRE', 'Municipio', 'Escola', 'VinculoEscolaDRE', 'EntidadeExecutora',
    'Edital', 'EditalEscola', 'EditalItem', 'EditalDocumento', 'EditalVersao', 'EditalAnexo', 'EditalVariavel',
    'ChamadaPublica', 'ChamadaPublicaEscola', 'ChamadaPublicaDocumento',
    'TemplateDocumento', 'TemplateVersao', 'CampoTemplate',
    'ImportacaoEstrutura', 'ImportacaoCampo', 'ImportLog', 'IdempotenciaOperacao',
    'AuditLog', 'User', 'VinculoUsuario', 'Proposta', 'Contrato', 'SystemConfig',
  ];
  for (const m of models) {
    const n = await safe(`count:${m}`, () => prisma[m].count());
    if (n !== null) reg({ model: m, count: n });
  }

  const dres = await safe('DRE.findMany', () => prisma.DRE.findMany({ select: { id: true, nome: true, sigla: true } }).catch(() => prisma.DRE.findMany()));
  if (dres) reg({ dre: dres });

  const editalExemplo = await safe('Edital.findMany(3)', () => prisma.Edital.findMany({ take: 3 }));
  if (editalExemplo) reg({ edital_exemplo: editalExemplo });

  const chamadaExemplo = await safe('ChamadaPublica.findMany(2)', () => prisma.ChamadaPublica.findMany({ take: 2 }));
  if (chamadaExemplo) reg({ chamada_exemplo: chamadaExemplo });

  const docExemplo = await safe('EditalDocumento.findMany(2)', () => prisma.EditalDocumento.findMany({ take: 2 }));
  if (docExemplo) reg({ edital_documento_exemplo: docExemplo });

  const estruturas = await safe('ImportacaoEstrutura.findMany', () => prisma.ImportacaoEstrutura.findMany({ take: 5 }));
  if (estruturas) reg({ importacao_estrutura_exemplo: estruturas });

  await safe('disconnect', () => prisma.$disconnect());
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
