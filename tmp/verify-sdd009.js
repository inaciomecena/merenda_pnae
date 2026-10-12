const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  for (const table of [
    'pnae_configuracoes_institucionais',
    'pnae_configuracoes_institucionais_historico',
    'pnae_parametros_operacionais',
    'pnae_parametros_operacionais_versoes',
    'pnae_notificacoes_internas',
    'pnae_checklists_implantacao',
    'pnae_itens_checklist_implantacao',
  ]) {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM ${table}`);
    console.log(table, String(rows[0].c));
  }
  const migrations = await prisma.$queryRawUnsafe("SELECT COUNT(*) AS c FROM _prisma_migrations WHERE migration_name='20261012140000_sdd_009_gestao_operacional'");
  console.log('migration', String(migrations[0].c));
  await prisma.$disconnect();
})().catch(async error => { console.error(error); await prisma.$disconnect(); process.exit(1); });
