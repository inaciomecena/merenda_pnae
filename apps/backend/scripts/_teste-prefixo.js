const UNIDADES =
  '(Quilograma|Quilogramas|Kg|kg|Kilo|Kilos|Quilo|Quilos|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade|Unidades|Un|un|Pacote|Pacotes|PCT|Caixa|Caixas|CX|Maço|Maços|Maco|Macos|MACO|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias|Fardo|Fardos|Saco|Sacos|Duzia|Peso)';
const UNIDADES_SET = new Set(UNIDADES.split('|').map((u) => u.toUpperCase()));
function ehPrefixoUnidade(tok) {
  const t = tok.toLowerCase().trim();
  if (t.length < 4) return false;
  for (const u of UNIDADES_SET) {
    const ul = u.toLowerCase();
    if (ul.startsWith(t) && ul.length > t.length) return true;
  }
  return false;
}
function tentarCompletarUnidade(atual, proximo) {
  const a = atual.toLowerCase().trim();
  const p = proximo.toLowerCase().trim();
  if (!p || p.length > 4) return null;
  for (const u of UNIDADES_SET) {
    const ul = u.toLowerCase();
    if (ul === `${a}${p}` || ul === `${a} ${p}`) return u;
  }
  return null;
}
console.log('set size:', UNIDADES_SET.size);
console.log('has QUILOGRAMA:', UNIDADES_SET.has('QUILOGRAMA'));
console.log('ehPrefixoUnidade(Quilogram):', ehPrefixoUnidade('Quilogram'));
console.log('completar(Quilogram, a):', tentarCompletarUnidade('Quilogram', 'a'));
console.log('completar(Quilograma, s):', tentarCompletarUnidade('Quilograma', 's'));
