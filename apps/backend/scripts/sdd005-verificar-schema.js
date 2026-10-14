// SDD-005 — verificação de schema do banco de desenvolvimento (somente leitura)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FISCAL = ['pnae_notas_fiscais', 'pnae_nota_fiscal_itens', 'pnae_nota_fiscal_documentos', 'pnae_vinculo_recebimento_fiscal', 'pnae_divergencias_fiscais', 'pnae_conferencias_fiscais', 'pnae_atestos', 'pnae_liquidacoes', 'pnae_pagamentos'];
const SDD001_004 = ['pnae_contratos', 'pnae_contrato_itens', 'pnae_entregas', 'pnae_entrega_itens', 'pnae_programacoes_entrega', 'pnae_programacao_entrega_itens', 'pnae_editais', 'pnae_propostas', 'produtores', 'users', 'vinculos_usuario', 'dres', 'escolas', 'municipios', 'pnae_entrega_estornos', 'pnae_audit_logs', 'pnae_configuracoes_sistema'];

(async () => {
  const tabelas = await prisma.$queryRawUnsafe(
    "SELECT TABLE_NAME AS nome, TABLE_ROWS AS linhas, ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'merenda_pnae' ORDER BY TABLE_NAME",
  );
  console.log(`TOTAL DE TABELAS: ${tabelas.length}`);
  const nomes = new Set(tabelas.map((t) => String(t.nome)));

  console.log('\n-- 9 tabelas fiscais SDD-005 --');
  let okFiscal = true;
  for (const t of FISCAL) {
    const achou = nomes.has(t);
    if (!achou) okFiscal = false;
    const row = tabelas.find((x) => String(x.nome) === t);
    console.log(`${achou ? '[OK]  ' : '[FALTA]'} ${t}  linhas=${row ? Number(row.linhas) : '-'} engine=${row ? row.engine : '-'}`);
  }

  console.log('\n-- Tabelas dos SDD-001 a SDD-004 --');
  for (const t of SDD001_004) {
    const row = tabelas.find((x) => String(x.nome) === t);
    console.log(`${row ? '[OK]  ' : '[n/a] '} ${t}  linhas=${row ? Number(row.linhas) : '-'}`);
  }

  console.log('\n-- Migrações aplicadas --');
  const migs = await prisma.$queryRawUnsafe(
    "SELECT migration_name AS nome, finished_at AS fim FROM information_schema.tables t JOIN (SELECT 1) x WHERE 1=0 UNION SELECT '' , NULL",
  ).catch(() => []);
  const aplicadas = await prisma.$queryRawUnsafe(
    "SELECT migration_name AS nome, finished_at AS fim FROM _prisma_migrations WHERE rolled_back_at IS NULL ORDER BY finished_at",
  );
  for (const m of aplicadas) console.log(`[OK] ${m.nome}${m.fim ? '' : ' (sem finished_at)'}`);
  console.log(`Migrações aplicadas: ${aplicadas.length}`);

  console.log('\n-- FKs nas tabelas fiscais --');
  for (const t of FISCAL) {
    const fks = await prisma.$queryRawUnsafe(
      `SELECT CONSTRAINT_NAME AS nome, COLUMN_NAME AS coluna, REFERENCED_TABLE_NAME AS tabela_ref
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = 'merenda_pnae' AND TABLE_NAME = '${t}' AND REFERENCED_TABLE_NAME IS NOT NULL`,
    );
    console.log(`${t}: ${fks.length} FK(s)${fks.length ? ' → ' + fks.map((f) => `${f.coluna}→${f.tabela_ref}`).join(', ') : ''}`);
  }

  console.log('\n-- Índices/úniqueness relevantes --');
  const uniq = await prisma.$queryRawUnsafe(
    "SELECT TABLE_NAME AS tabela, INDEX_NAME AS indice, COUNT(*) AS cols FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='merenda_pnae' AND NON_UNIQUE=0 AND TABLE_NAME IN ('pnae_notas_fiscais','pnae_nota_fiscal_itens','pnae_vinculo_recebimento_fiscal','pnae_liquidacoes','pnae_pagamentos') GROUP BY TABLE_NAME, INDEX_NAME ORDER BY TABLE_NAME",
  );
  for (const u of uniq) console.log(`${u.tabela}.${u.indice} (${Number(u.cols)} coluna(s))`);

  const erros = okFiscal ? 0 : 1;
  console.log(`\nRESULTADO: ${erros === 0 ? 'SCHEMA ÍNTEGRO' : 'DIVERGÊNCIA ENCONTRADA'}`);
  await prisma.$disconnect();
  process.exit(erros);
})();
