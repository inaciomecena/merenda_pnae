// Verifica estrutura do .txt: total de linhas, últimas 30, e procura por
// padrões de item ("ITEM", "PRODUTO", "QUANTIDADE", "VALOR").
const fs = require('fs');
const path = require('path');
const manifesto = JSON.parse(fs.readFileSync('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO/MANIFESTO_DOCUMENTOS.json', 'utf8'));
const docId = process.argv[2] || 'DOC-0016';
const doc = manifesto.documentos.find((d) => d.id_documento === docId);
if (!doc || !doc.texto_extraido) { console.log('sem texto_extraido'); process.exit(1); }
const t = fs.readFileSync(path.join('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO', doc.texto_extraido), 'utf8');
const linhas = t.split(/\r?\n/);
console.log('doc', docId, 'paginas manifesto', doc.paginas, 'bytes txt', t.length, 'linhas', linhas.length);
const padroes = ['ITEM', 'PRODUTO', 'QUANTIDADE', 'VALOR UNIT', 'VALOR TOTAL', 'ANEXO', 'Tabela'];
for (const p of padroes) {
  const n = linhas.filter((l) => l.toUpperCase().includes(p)).length;
  console.log(`  ocorrencias "${p}": ${n}`);
}
console.log('--- últimas 25 linhas ---');
console.log(linhas.slice(-25).join('\n'));
