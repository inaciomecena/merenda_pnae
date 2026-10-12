// Inspeciona blocos específicos do staging (itens "sem produto") contra o PDF.
const fs = require('fs');
const path = require('path');

const alvo = process.argv[2] || 'ED-0001_diamantino_APROVADO.json';
const dir = 'C:/Projetos/merenda_pnae/docs/importacao-pnae-2025/staging';
const dados = JSON.parse(fs.readFileSync(path.join(dir, alvo), 'utf8'));
console.log('documento principal:', dados.documentos[0] && dados.documentos[0].idDocumento);
const itens = dados.itens || [];
console.log('itens:', itens.length);
const semProdutoComValor = itens.filter((i) => !i.produto && (i.quantidade || i.totalFonte));
const semProdutoSemValor = itens.filter((i) => !i.produto && !i.quantidade && !i.totalFonte);
console.log('sem produto COM valor:', semProdutoComValor.length);
console.log('sem produto SEM valor:', semProdutoSemValor.length);
console.log('com produto:', itens.filter((i) => i.produto).length);
for (const i of semProdutoComValor.slice(0, 8)) {
  console.log(JSON.stringify({ seq: i.sequencia, pag: i.pagina, desc: i.descricaoCompleta, q: i.quantidade && i.quantidade.bruto, p: i.precoUnitario && i.precoUnitario.bruto, t: i.totalFonte && i.totalFonte.bruto, pend: i.pendencia }));
}
