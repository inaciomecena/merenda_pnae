// Conta itens do staging por "profile" para decidir a política de ruído.
const fs = require('fs');
const path = require('path');
const dir = 'C:/Projetos/merenda_pnae/docs/importacao-pnae-2025/staging';
const arqs = fs.readdirSync(dir).filter((f) => f.startsWith('ED-') && f.endsWith('.json'));
let tot = 0, semValores = 0, comProdutoSemValores = 0, semProdutoComValores = 0, ok = 0;
const porArq = [];
for (const a of arqs) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, a), 'utf8'));
  const itens = d.itens || [];
  let l1 = 0, l2 = 0, l3 = 0, l4 = 0;
  for (const i of itens) {
    tot++;
    const temValores = Boolean(i.quantidade || i.totalFonte);
    if (!temValores) { semValores++; l1++; if (i.produto) { comProdutoSemValores++; l2++; } }
    else if (!i.produto) { semProdutoComValores++; l3++; }
    else ok++;
  }
  if (l1 || l3) porArq.push({ a, semValores: l1, comProdutoSemValores: l2, semProdutoComValores: l3, itens: itens.length });
}
console.log({ tot, semValores, comProdutoSemValores, semProdutoComValores, ok });
console.log(JSON.stringify(porArq, null, 1).slice(0, 3000));
