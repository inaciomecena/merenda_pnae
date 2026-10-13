/**
 * ANÁLISE DE DISPONIBILIDADE DE CAMPOS OBRIGATÓRIOS — SOMENTE LEITURA.
 *
 * Confere, para os 51 editais APROVADOS do staging, se os campos OBRIGATÓRIOS
 * dos models reais (Edital, ChamadaPublica, EditalItem) têm valor disponível.
 * Não escreve nada.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/analisar-campos-obrigatorios.js
 */
const fs = require('fs');
const path = require('path');

const STAGING = path.resolve(__dirname, '..', 'staging');

const arquivos = fs.readdirSync(STAGING).filter((f) => /^ED-\d+/.test(f));
const aprovados = [];
for (const f of arquivos) {
  const e = JSON.parse(fs.readFileSync(path.join(STAGING, f), 'utf8'));
  if (e.decisao === 'APROVADO') aprovados.push(e);
}

const falhas = {
  editalNumero: [],
  editalAno: [],
  chamadaObjeto: [],
  dataSessao: [],
  dataPublicacao: [],
  itemProduto: [],
  itemSequencia: [],
};
let itens = 0;

for (const s of aprovados) {
  const id = s.idPacote;
  const i = s.identificacao;
  if (!i.numeroNormalizado) falhas.editalNumero.push(id);
  if (!i.exercicio) falhas.editalAno.push(id);
  if (!i.objeto) falhas.chamadaObjeto.push(id);
  if (!i.dataSessao) falhas.dataSessao.push(id);
  if (!i.dataPublicacao) falhas.dataPublicacao.push(id);
  for (const it of s.itens) {
    itens += 1;
    if (!it.produto) falhas.itemProduto.push(`${id}#${it.sequencia}`);
    if (it.sequencia === null || it.sequencia === undefined) falhas.itemSequencia.push(id);
  }
}

console.log(`aprovados=${aprovados.length} itens=${itens}`);
console.log(`Edital.numero ausente:            ${falhas.editalNumero.length}`);
console.log(`Edital.ano/exercicio ausente:     ${falhas.editalAno.length}`);
console.log(`Chamada.objeto ausente:           ${falhas.chamadaObjeto.length}`);
console.log(`ident.dataSessao ausente:         ${falhas.dataSessao.length}`);
console.log(`ident.dataPublicacao ausente:     ${falhas.dataPublicacao.length}`);
console.log(`Item.produto ausente:             ${falhas.itemProduto.length}`);
console.log(`Item.sequencia ausente:           ${falhas.itemSequencia.length}`);
if (falhas.chamadaObjeto.length) console.log('  sem objeto: ' + falhas.chamadaObjeto.join(', '));
if (falhas.itemProduto.length) console.log('  sem produto: ' + falhas.itemProduto.slice(0, 25).join(', '));
