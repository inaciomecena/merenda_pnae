// Procura o cabeçalho de tabela e marcadores de item no .txt.
const fs = require('fs');
const path = require('path');
const manifesto = JSON.parse(fs.readFileSync('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO/MANIFESTO_DOCUMENTOS.json', 'utf8'));
const docId = process.argv[2] || 'DOC-0016';
const doc = manifesto.documentos.find((d) => d.id_documento === docId);
const t = fs.readFileSync(path.join('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO', doc.texto_extraido), 'utf8');
const linhas = t.split(/\r?\n/);
console.log('--- linhas que casam o gate de cabeçalho (PRODUTO/QUANTIDADE/UNIDADE) ---');
linhas.forEach((l, i) => {
  if (/(PRODUTO|ESPECIFICA|QUANTIDADE|UNIDADE)/i.test(l) && /(QUANTIDADE|MEDIDO|PRODUTO)/i.test(l) && /VALOR|UNIT|TOTAL/i.test(l)) {
    console.log(i, JSON.stringify(l));
  }
});
console.log('--- linhas que são só número+ponto (início de item) ---');
const re = /^(\d{1,3})\.?\s*$/;
const marc = [];
linhas.forEach((l, i) => { if (re.test(l.trim())) marc.push(i + ':' + JSON.stringify(l)); });
console.log('total', marc.length);
console.log(marc.slice(0, 8).join('\n'));
console.log('--- contexto do 1º marcador de item ---');
if (marc.length) {
  const i0 = Number(marc[0].split(':')[0]);
  console.log(linhas.slice(i0 - 2, i0 + 8).map((l) => JSON.stringify(l)).join('\n'));
}
