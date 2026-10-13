/**
 * VERIFICAÇÃO DA EVIDÊNCIA DA ENTIDADE EXECUTORA — SOMENTE LEITURA.
 *
 * Lê alguns PDFs do pacote e aplica a extração documental do CNPJ da
 * entidade executora, imprimindo a proveniência (documento, página, hash).
 * Não escreve nada no banco nem no staging.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/verificar-evidencia-entidade.js
 */
const fs = require('fs');
const path = require('path');

// Compila o módulo puro via ts-node/register para reaproveitar o código real.
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });

const { lerPaginasPdf } = require('../../../apps/backend/src/modules/importacao-historica/aplicacao/extrator-documento');
const {
  extrairEvidenciaEntidadeExecutora,
} = require('../../../apps/backend/src/modules/importacao-historica/aplicacao/resolucao-entidade-executora');
const { carregarPacote } = require('../../../apps/backend/src/modules/importacao-historica/aplicacao/leitor-pacote');

const PACOTE = path.resolve(__dirname, '..', '..', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const ALVOS = ['DOC-0007', 'DOC-0080', 'DOC-0072', 'DOC-0021', 'DOC-0124', 'DOC-0128'];

(async () => {
  const pacote = carregarPacote(PACOTE);
  const porId = new Map(pacote.manifesto.documentos.map((d) => [d.id_documento, d]));

  for (const id of ALVOS) {
    const doc = porId.get(id);
    if (!doc) { console.log(`${id}: nao encontrado`); continue; }
    const val = pacote.validacoesPorId[id];
    if (!val || !val.caminho_abs) { console.log(`${id}: sem caminho`); continue; }
    try {
      const buf = fs.readFileSync(val.caminho_abs);
      const paginas = await lerPaginasPdf(buf);
      const ev = extrairEvidenciaEntidadeExecutora(paginas, { documentoId: id, sha256: val.sha256_calculado });
      if (!ev) {
        console.log(`${id} (${doc.dre}): SEM EVIDENCIA`);
        continue;
      }
      console.log(`${id} (${doc.dre}):`);
      console.log(`   cnpjBruto   = ${JSON.stringify(ev.cnpjBruto)}`);
      console.log(`   cnpjDigitos = ${JSON.stringify(ev.cnpjDigitos)}`);
      console.log(`   nomeBruto   = ${JSON.stringify(ev.nomeBruto)}`);
      console.log(`   pagina      = ${ev.pagina}`);
      console.log(`   sha256      = ${String(ev.sha256).slice(0, 16)}...`);
      console.log(`   trecho      = ${JSON.stringify(ev.trecho).slice(0, 180)}`);
    } catch (e) {
      console.log(`${id}: ERRO ${e.message.split('\n')[0]}`);
    }
  }
})();
