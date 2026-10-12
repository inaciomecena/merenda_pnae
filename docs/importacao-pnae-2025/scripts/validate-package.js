/**
 * Validação do pacote documental PNAE_MT_2025_PACOTE_IMPORTACAO.
 *
 * - Resolve cada caminho relativo do manifesto DENTRO de PACKAGE_DIR (bloqueia traversal).
 * - Confere existência, cabeçalho %PDF-, tamanho e SHA-256 contra o manifesto.
 * - Identifica duplicados binários preservando todas as URLs de proveniência.
 * - Não baixa nada e não altera nenhum arquivo do pacote.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/validate-package.js [caminhoSaidaJSON]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PACKAGE_DIR = path.join(ROOT, 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const MANIFESTO = path.join(PACKAGE_DIR, 'MANIFESTO_DOCUMENTOS.json');

function classify(doc, target, rel) {
  const out = {
    id_documento: doc.id_documento,
    caminho_manifesto: doc.caminho || null,
    resolvido_rel: rel || null,
    status_manifesto: doc.status,
    elegibilidade: doc.elegibilidade || null,
    dre: doc.dre || null,
    urls: [doc.url, doc.url_download, doc.url_publicacao].filter(Boolean),
    sha256_manifesto: doc.sha256 || null,
    bytes_manifesto: typeof doc.bytes === 'number' ? doc.bytes : null,
    paginas_manifesto: typeof doc.paginas === 'number' ? doc.paginas : null,
    classificacao: null,
    detalhes: [],
  };

  if (!doc.caminho) {
    out.classificacao = 'AUSENTE';
    out.detalhes.push('Sem caminho no manifesto (download falhou na pesquisa).');
    return out;
  }

  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    out.classificacao = 'FORA_DO_PACOTE';
    out.detalhes.push('Caminho escapa de PACKAGE_DIR; bloqueado.');
    return out;
  }

  if (!fs.existsSync(target)) {
    out.classificacao = 'AUSENTE';
    out.detalhes.push('Arquivo não encontrado em PACKAGE_DIR.');
    return out;
  }

  const buf = fs.readFileSync(target);
  out.bytes_lidos = buf.length;
  const isPdf = buf.slice(0, 5).toString('latin1') === '%PDF-';
  out.header_pdf = isPdf;
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  out.sha256_calculado = hash;

  if (!isPdf) {
    out.classificacao = 'INVALIDO';
    out.detalhes.push('Cabeçalho %PDF- ausente.');
    return out;
  }
  if (!doc.sha256) {
    out.classificacao = 'SEM_HASH_MANIFESTO';
    out.detalhes.push('Manifesto não registra hash para este documento.');
    return out;
  }
  if (hash !== doc.sha256) {
    out.classificacao = 'ALTERADO';
    out.detalhes.push('SHA-256 divergente do manifesto.');
    return out;
  }
  out.classificacao = 'INTEIRO';
  if (typeof doc.bytes === 'number' && doc.bytes !== buf.length) {
    out.detalhes.push(`Tamanho difere do manifesto (${buf.length} vs ${doc.bytes}).`);
  }
  return out;
}

function main() {
  const manifestoRaw = fs.readFileSync(MANIFESTO);
  const manifestoHash = crypto.createHash('sha256').update(manifestoRaw).digest('hex');
  const m = JSON.parse(manifestoRaw.toString('utf8'));

  const documentos = [];
  const byHash = {};
  const traversalTentativas = [];

  for (const doc of m.documentos) {
    let target = null;
    let rel = null;
    if (doc.caminho) {
      target = path.resolve(PACKAGE_DIR, doc.caminho);
      rel = path.relative(PACKAGE_DIR, target);
      if (rel.startsWith('..') || path.isAbsolute(rel)) traversalTentativas.push(doc.id_documento);
    }
    const out = classify(doc, target, rel);
    if (out.sha256_calculado) (byHash[out.sha256_calculado] = byHash[out.sha256_calculado] || []).push(out);
    documentos.push(out);
  }

  const duplicados = Object.entries(byHash)
    .filter(([, list]) => list.length > 1)
    .map(([sha256, list]) => ({
      sha256,
      ids: list.map((d) => d.id_documento),
      total_ids: list.length,
      urls_proveniencia: list.reduce((acc, d) => acc.concat(d.urls), []),
      dre: list[0].dre,
      mesmo_caminho: new Set(list.map((d) => d.caminho_manifesto)).size === 1,
      caminhos: [...new Set(list.map((d) => d.caminho_manifesto))],
    }));

  const resumo = {};
  documentos.forEach((d) => { resumo[d.classificacao] = (resumo[d.classificacao] || 0) + 1; });

  // Reconciliação manifesto x contagens declaradas no pacote
  const contagens = {
    portais: m.portais.length,
    editais: m.editais.length,
    documentos: m.documentos.length,
    itens: m.itens.length,
    anexos: m.anexos.length,
    pendencias: m.pendencias.length,
    urls_com_caminho: m.documentos.filter((d) => d.caminho).length,
    urls_sem_caminho: m.documentos.filter((d) => !d.caminho).length,
    hashes_unicos: Object.keys(byHash).length,
    grupos_duplicados: duplicados.length,
  };

  const editalPorId = {};
  m.editais.forEach((e) => { editalPorId[e.id] = e; });
  const docsPorEdital = {};
  m.documentos.forEach((d) => {
    if (!d.id_edital) return;
    (docsPorEdital[d.id_edital] = docsPorEdital[d.id_edital] || []).push(d.id_documento);
  });

  const elegiveis = m.editais.filter((e) => e.elegibilidade === 'ELEGIVEL_2025');
  const editaisPorElegibilidade = {};
  m.editais.forEach((e) => { editaisPorElegibilidade[e.elegibilidade] = (editaisPorElegibilidade[e.elegibilidade] || 0) + 1; });

  const saida = {
    gerado_em: new Date().toISOString(),
    package_dir: PACKAGE_DIR,
    manifesto: {
      caminho: MANIFESTO,
      sha256: manifestoHash,
      bytes: manifestoRaw.length,
      data_pesquisa: m.data_pesquisa,
      status: m.status,
    },
    contagens,
    editais_por_elegibilidade: editaisPorElegibilidade,
    edital_para_documentos: docsPorEdital,
    documentos_elegiveis: elegiveis.map((e) => ({
      id_edital: e.id,
      dre: e.dre,
      municipio: e.municipio,
      numero: e.numero,
      exercicio: e.exercicio,
      documentos: docsPorEdital[e.id] || [],
      todos_integros: (docsPorEdital[e.id] || []).every((id) => {
        const d = documentos.find((x) => x.id_documento === id);
        return d && d.classificacao === 'INTEIRO';
      }),
    })),
    resumo_classificacao: resumo,
    tentativas_de_traversal: traversalTentativas,
    duplicados_binarios: duplicados,
    documentos,
  };

  const destino = process.argv[2] || path.join(__dirname, '..', 'VALIDACAO_PACOTE.json');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify(saida, null, 2), 'utf8');
  console.log(JSON.stringify({ manifesto_sha256: manifestoHash, contagens, resumo, duplicados: duplicados.map((d) => ({ sha256: d.sha256.slice(0, 16), ids: d.ids })), traversal: traversalTentativas, saida: destino }, null, 2));
}

main();
