// Inspeção pontual de layout de tabela em .txt do pacote (uso interno).
const fs = require('fs');
const path = require('path');
const manifesto = JSON.parse(fs.readFileSync('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO/MANIFESTO_DOCUMENTOS.json', 'utf8'));
const docId = process.argv[2] || 'DOC-0016';
const doc = manifesto.documentos.find((d) => d.id_documento === docId);
if (!doc || !doc.texto_extraido) { console.log('sem texto_extraido'); process.exit(1); }
const t = fs.readFileSync(path.join('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO', doc.texto_extraido), 'utf8');
const linhas = t.split(/\r?\n/);
const hits = [];
linhas.forEach((l, i) => { if (/R\$/.test(l)) hits.push(i); });
console.log('linhas com R$:', hits.length);
if (hits.length) {
  const ini = Math.max(0, hits[0] - 8);
  console.log('--- contexto da primeira linha com R$ ---');
  console.log(linhas.slice(ini, hits[0] + 20).join('\n'));
}
