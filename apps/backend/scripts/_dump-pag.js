// Dump bruto de uma página de um documento do pacote (linhas numeradas).
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const manifesto = JSON.parse(fs.readFileSync('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO/MANIFESTO_DOCUMENTOS.json', 'utf8'));
const docId = process.argv[2] || 'DOC-0001';
const paginaAlvo = Number(process.argv[3] || 4);
const doc = manifesto.documentos.find((d) => d.id_documento === docId);
if (!doc) { console.log('doc nao encontrado'); process.exit(1); }
const raiz = 'C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO';
const caminho = path.join(raiz, doc.caminho);
const buffer = fs.readFileSync(caminho);
const parser = new PDFParse({ data: buffer });
parser.getText().then((r) => {
  const p = r.pages[paginaAlvo - 1];
  const linhas = (p.text || '').split(/\r?\n/);
  linhas.forEach((l, i) => console.log(String(i).padStart(3), JSON.stringify(l)));
  return parser.destroy();
}).catch((e) => { console.error(e); process.exit(1); });
