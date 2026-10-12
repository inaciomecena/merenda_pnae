const UNIDADES =
  '(Quilograma|Quilogramas|Kg|kg|Kilo|Kilos|Quilo|Quilos|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade|Unidades|Un|un|Pacote|Pacotes|PCT|Caixa|Caixas|CX|Maço|Maços|Maco|Macos|MACO|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias|Fardo|Fardos|Saco|Sacos|Duzia|Peso)';
const UNIDADES_SET = new Set(UNIDADES.split('|').map((u) => u.toUpperCase()));
const ehUnidadeConhecida = (tok) => UNIDADES_SET.has(tok.toUpperCase());
function tentarCompletarUnidade(atual, proximo) {
  const a = atual.toLowerCase().trim();
  const p = proximo.toLowerCase().trim();
  if (!p || p.length > 4) return null;
  for (const u of UNIDADES_SET) {
    const ul = u.toLowerCase();
    if (ul.startsWith(a) && ul.endsWith(p) && ul.length === a.length + p.length) return u;
  }
  return null;
}
const anteriores = ['características deverão atender aos', 'requisitos mínimos de identidade e', 'qualidade estabelecidos na legislação', 'vigente.', 'Quilogram', 'a'];
const finais = [];
for (let j = anteriores.length - 1; j >= 0 && finais.length < 4; j--) {
  const t = anteriores[j].trim();
  if (!t) continue;
  finais.push(t.split(/\s{2,}/).pop()?.trim() ?? '');
}
console.log('finais:', finais);
for (let i = 0; i < finais.length; i++) {
  const atual = finais[i];
  if (!atual) continue;
  console.log('i=', i, 'atual=', JSON.stringify(atual), 'conhecida=', ehUnidadeConhecida(atual));
  if (ehUnidadeConhecida(atual)) { console.log('  -> unidade direta'); break; }
  for (let n = 1; n <= 2 && i + n < finais.length; n++) {
    const combinado = finais.slice(i, i + n + 1).join('');
    const c = tentarCompletarUnidade(atual, combinado);
    console.log('  n=', n, 'combinado=', JSON.stringify(combinado), '->', c);
    if (c) { console.log('  -> unidade quebrada', c); break; }
  }
}
