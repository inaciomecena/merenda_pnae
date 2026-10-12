/**
 * Leitura das abas do INVENTARIO_EDITAIS_PNAE_MT_2025.xlsx para reconciliação
 * com MANIFESTO_DOCUMENTOS.json. Somente leitura.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/dump-inventario.js [aba] [limite]
 */
const path = require('path');
const XLSX = require('xlsx'); // resolvido em C:\Projetos\merenda_pnae\node_modules\xlsx

const PKG = path.resolve(__dirname, '..', '..', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const FILE = path.join(PKG, 'INVENTARIO_EDITAIS_PNAE_MT_2025.xlsx');

const wb = XLSX.readFile(FILE, { cellDates: false });
const alvo = process.argv[2];
const limite = Number(process.argv[3] || 5);

const resumo = wb.SheetNames.map((name) => {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null });
  return { aba: name, linhas: rows.length, colunas: rows[0] ? Object.keys(rows[0]) : [] };
});
console.log('=== ABAS ===');
console.log(JSON.stringify(resumo, null, 1));

const alvos = alvo && alvo !== 'ALL' ? [alvo] : wb.SheetNames;
for (const name of alvos) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null });
  console.log(`\n=== ${name} (${rows.length} linhas) — primeiras ${limite} ===`);
  console.log(JSON.stringify(rows.slice(0, limite), null, 1));
}
