// Mostra contexto ao redor das ocorrências de um padrão.
const fs = require('fs');
const path = require('path');
const manifesto = JSON.parse(fs.readFileSync('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO/MANIFESTO_DOCUMENTOS.json', 'utf8'));
const docId = process.argv[2] || 'DOC-0016';
const padrao = process.argv[3] || 'PRODUTO';
const antes = Number(process.argv[4] || 3);
const depois = Number(process.argv[5] || 20);
const doc = manifesto.documentos.find((d) => d.id_documento === docId);
if (!doc || !doc.texto_extraido) { console.log('sem texto_extraido'); process.exit(1); }
const t = fs.readFileSync(path.join('C:/Projetos/merenda_pnae/docs/PNAE_MT_2025_PACOTE_IMPORTACAO', doc.texto_extraido), 'utf8');
const linhas = t.split(/\r?\n/);
const idxs = [];
linhas.forEach((l, i) => { if (l.toUpperCase().includes(padrao)) idxs.push(i); });
console.log('doc', docId, 'padrao', padrao, 'ocorrencias', idxs.length);
// pula as 5 primeiras (prosa) e mostra a 6ª, que provavelmente é o cabeçalho da tabela
const alvo = idxs[Math.min(5, idxs.length - 1)];
console.log('--- contexto a partir da linha', alvo, '---');
console.log(linhas.slice(Math.max(0, alvo - antes), alvo + depois).map((l) => JSON.stringify(l)).join('\n'));
