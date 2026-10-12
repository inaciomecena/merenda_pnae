// Auditoria rápida dos itens gerados no staging: procura itens suspeitos
// (texto corrido de cláusula virando "item de produto").
const fs = require('fs');
const path = require('path');

const dir = 'C:/Projetos/merenda_pnae/docs/importacao-pnae-2025/staging';
const arquivos = fs.readdirSync(dir).filter((f) => f.startsWith('ED-') && f.endsWith('.json'));

let total = 0;
const suspeitos = [];
for (const arq of arquivos) {
  const dados = JSON.parse(fs.readFileSync(path.join(dir, arq), 'utf8'));
  const itens = dados.itens || [];
  for (const it of itens) {
    total += 1;
    const p = (it.produto || '').trim();
    const d = (it.descricaoCompleta || '').trim();
    const problema =
      !p ? 'sem produto'
      : /^\d+\./.test(p) ? 'produto inicia com numeral de cláusula'
      : p.length > 60 ? 'produto longo demais'
      : /LEGAL|DISPOSIC|PRAZO|HABILITA|CRIT[ÉE]RIO|FUNDAMENTA|CL[ÁA]USULA|ANEXO|REFERA|SERA|PODER[ÁA]/i.test(p) ? 'texto de cláusula'
      : null;
    if (problema) {
      suspeitos.push({ arq, seq: it.sequencia, pagina: it.pagina, problema, produto: p, descricao: d.slice(0, 160), valores: { q: it.quantidade && it.quantidade.bruto, t: it.totalFonte && it.totalFonte.bruto } });
    }
  }
}
console.log('total itens:', total);
console.log('suspeitos:', suspeitos.length);
for (const s of suspeitos.slice(0, 60)) console.log(JSON.stringify(s));
