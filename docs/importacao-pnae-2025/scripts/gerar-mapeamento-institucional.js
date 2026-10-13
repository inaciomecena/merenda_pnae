/* Gera MAPEAMENTO_INSTITUCIONAL.json a partir do staging + snapshot */
const fs = require('fs');
const path = require('path');

const raiz = 'C:/Projetos/merenda_pnae/docs/importacao-pnae-2025';
const dirStaging = path.join(raiz, 'staging');
const arqs = fs.readdirSync(dirStaging).filter((f) => f.startsWith('ED-') && f.endsWith('.json'));

const porDre = new Map();
const naoResolvidos = [];
let totalItens = 0;
let totalComValores = 0;
let totalPendencias = 0;
const tiposPendencia = {};

for (const a of arqs) {
  const d = JSON.parse(fs.readFileSync(path.join(dirStaging, a), 'utf8'));
  const dre = d.dre;
  const linha = porDre.get(dre) || {
    dre,
    aprovados: 0, segregados: 0, bloqueados: 0, pendentes: 0,
    itensExtraidos: 0, itensComValores: 0, itensSemValores: 0,
    blocosNaoItem: 0, pendencias: 0,
    dreStatus: null, dreId: null, dreDetalhe: null,
    municipios: new Set(), entidadesExecutoras: new Set(),
    municipiosNaoResolvidos: [], entidadesNaoResolvidas: [],
  };

  if (d.decisao === 'APROVADO') linha.aprovados++;
  else if (d.decisao === 'SEGREGADO') linha.segregados++;
  else if (d.decisao === 'BLOQUEADO') linha.bloqueados++;
  else linha.pendentes++;

  const v = d.vinculosInstitucionais || {};
  if (v.dre) {
    if (!linha.dreStatus) { linha.dreStatus = v.dre.status; linha.dreId = v.dre.dreId; linha.dreDetalhe = v.dre.detalhe; }
    if (v.dre.status !== 'CONFIRMADO') naoResolvidos.push({ edital: d.idPacote, tipo: 'DRE', bruto: v.dre.nomePacote, status: v.dre.status, detalhe: v.dre.detalhe });
  }
  if (v.municipio) {
    if (v.municipio.status === 'CONFIRMADO') linha.municipios.add(v.municipio.municipioId);
    else linha.municipiosNaoResolvidos.push({ edital: d.idPacote, bruto: v.municipio.nomePacote, status: v.municipio.status, detalhe: v.municipio.detalhe });
  }
  for (const u of v.unidadesExecutoras || []) {
    if (u.status === 'CONFIRMADO') linha.entidadesExecutoras.add(u.entidadeExecutoraId);
    else linha.entidadesNaoResolvidas.push({ edital: d.idPacote, nome: u.nome, cnpj: u.cnpj, status: u.status, detalhe: u.detalhe });
  }

  for (const i of d.itens || []) {
    linha.itensExtraidos++;
    totalItens++;
    if (i.quantidade || i.precoUnitario || i.totalFonte) { linha.itensComValores++; totalComValores++; }
    else linha.itensSemValores++;
  }
  linha.blocosNaoItem += (d.metadadoExtracao || {}).blocosNaoItem || 0;
  for (const p of d.pendencias || []) {
    linha.pendencias++; totalPendencias++;
    tiposPendencia[p.tipo] = (tiposPendencia[p.tipo] || 0) + 1;
  }
  porDre.set(dre, linha);
}

const saida = {
  gerado_em: new Date().toISOString(),
  fonte: 'docs/importacao-pnae-2025/staging/*.json + snapshot-institucional.json (leitura somente)',
  principio: 'A resolução institucional NUNCA cria nem atualiza cadastro. Correspondência exata por CNPJ (entidade executora) e por código IBGE (município). AMBIGUO e NAO_ENCONTRADO ficam pendentes para revisão administrativa.',
  totais: {
    editais: arqs.length,
    itensExtraidos: totalItens,
    itensComValores: totalComValores,
    itensSemValores: totalItens - totalComValores,
    pendencias: totalPendencias,
  },
  pendenciasPorTipo: tiposPendencia,
  por_dre: [...porDre.values()].map((l) => ({
    dre: l.dre,
    aprovados: l.aprovados, segregados: l.segregados, bloqueados: l.bloqueados, pendentes: l.pendentes,
    resolucaoDre: { status: l.dreStatus, dreId: l.dreId, detalhe: l.dreDetalhe },
    municipiosResolvidos: l.municipios.size,
    municipiosNaoResolvidos: l.municipiosNaoResolvidos,
    entidadesExecutorasResolvidas: l.entidadesExecutoras.size,
    entidadesNaoResolvidas: l.entidadesNaoResolvidas,
    itens: { extraidos: l.itensExtraidos, comValores: l.itensComValores, semValores: l.itensSemValores },
    blocosNaoItem: l.blocosNaoItem,
    pendencias: l.pendencias,
  })).sort((a, b) => a.dre.localeCompare(b.dre, 'pt-BR')),
  vinculos_pendentes: naoResolvidos,
};

fs.writeFileSync(path.join(raiz, 'MAPEAMENTO_INSTITUCIONAL.json'), JSON.stringify(saida, null, 2), 'utf8');
console.log('gravado MAPEAMENTO_INSTITUCIONAL.json');
console.log('totais', JSON.stringify(saida.totais));
console.log('pendenciasPorTipo', JSON.stringify(saida.pendenciasPorTipo));
console.log('por_dre', saida.por_dre.map((l) => `${l.dre}: ap=${l.aprovados} seg=${l.segregados} blq=${l.bloqueados} itens=${l.itens.extraidos}(+${l.itens.comValores}/-${l.itens.semValores}) dre=${l.resolucaoDre.status}`).join('\n'));
