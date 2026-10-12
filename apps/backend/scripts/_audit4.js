// Categoriza os itens extraídos por (produto, unidade, valores) para definir
// a política de ruído: o que vira item, o que vira pendência e o que é descartado.
const fs = require('fs');
const path = require('path');
const dir = 'C:/Projetos/merenda_pnae/docs/importacao-pnae-2025/staging';
const arqs = fs.readdirSync(dir).filter((f) => f.startsWith('ED-') && f.endsWith('.json'));
const combos = {};
const exemplos = {};
for (const a of arqs) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, a), 'utf8'));
  for (const i of d.itens || []) {
    const k = [
      i.produto ? 'P' : '-',
      i.unidadeComercial ? 'U' : '-',
      i.quantidade ? 'Q' : '-',
      i.totalFonte ? 'T' : '-',
      i.precoUnitario ? 'R' : '-',
    ].join('');
    combos[k] = (combos[k] || 0) + 1;
    if (!exemplos[k]) exemplos[k] = { a, seq: i.sequencia, pag: i.pagina, desc: (i.descricaoCompleta || '').slice(0, 140) };
  }
}
console.log(JSON.stringify(combos, null, 0));
for (const [k, v] of Object.entries(exemplos)) console.log(k, JSON.stringify(v));
