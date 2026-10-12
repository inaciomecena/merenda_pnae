// Verificação pontual pós-homologação: vínculos e divergências da nota (somente leitura)
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();
(async () => {
  const ids = JSON.parse(fs.readFileSync('C:/Users/HP ELITE/AppData/Local/Temp/opencode/backup-sdd005/homologacao-ids.json', 'utf8'));
  const vins = await p.vinculoRecebimentoFiscal.findMany({
    where: { notaFiscalId: ids.notaId },
    select: { id: true, notaFiscalItemId: true, quantidadeVinculada: true, entregaItemId: true },
  });
  console.log('Vínculos na nota:', vins.length);
  vins.forEach((v) => console.log(JSON.stringify(v)));
  const divs = await p.divergenciaFiscal.count({ where: { notaFiscalId: ids.notaId } });
  console.log('Divergências:', divs);
  const pagamentos = await p.pagamento.findMany({ where: { liquidacaoId: ids.liquidacaoId } });
  console.log('Pagamentos:', pagamentos.map((pg) => ({ valorPago: String(pg.valorPago), tipo: null, status: pg.status, numeroOrdemPagamento: pg.numeroOrdemPagamento })));
  await p.$disconnect();
  process.exit(vins.length === 2 && divs === 0 ? 0 : 1);
})().catch((e) => { console.error('ERRO:', e.message.slice(0, 300)); process.exit(1); });
