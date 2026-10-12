// Procura linhas com números de item seguidos de produto (layout de colunas)
// e mostra几几几 contextos. Uso interno.
const fs = require('fs');
const path = require('path');
const manifesto = JSON.parse(fs.readFileSync('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO/MANIFESTO_DOCUMENTOS.json', 'utf8'));
const docId = process.argv[2] || 'DOC-0069';
const doc = manifesto.documentos.find((d) => d.id_documento === docId);
const t = fs.readFileSync(path.join('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO', doc.texto_extraido), 'utf8');
const linhas = t.split(/\r?\n/);
console.log('doc', docId);
console.log('--- linhas com cabeçalho de tabela (Nº/ITEM + PRODUTO + QUANTIDADE) ---');
linhas.forEach((l, i) => {
  const c = l.replace(/\s+/g, ' ').trim();
  if (/(PRODUTO)/i.test(c) && /(QUANTIDADE|UNIDADE)/i.test(c) && i < 1400) console.log(i, JSON.stringify(c));
});
console.log('--- linhas que casam ^NN. + texto maiúsculo (candidato a item) ---');
const reItem = /^\s*(\d{1,3})\.\s+[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ]/;
let n = 0;
linhas.forEach((l, i) => {
  if (reItem.test(l) && n < 12) { console.log(i, JSON.stringify(l)); n++; }
});
