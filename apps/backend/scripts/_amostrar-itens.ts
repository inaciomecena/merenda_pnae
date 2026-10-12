/**
 * Amostra os primeiros N itens extraídos de um documento (uso interno).
 */
import * as fs from 'fs';
import * as path from 'path';
import { lerPaginasPdf, extrairItens } from '../src/modules/importacao-historica/aplicacao/extrator-documento';

const manifesto = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO', 'MANIFESTO_DOCUMENTOS.json'), 'utf8'),
) as { documentos: Array<{ id_documento: string; caminho: string; sha256: string | null }> };
const docId = process.argv[2] || 'DOC-0016';
const quantos = Number(process.argv[3] || 6);
const doc = manifesto.documentos.find((d: { id_documento: string }) => d.id_documento === docId);
if (!doc) throw new Error('doc não encontrado');
const raiz = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const buffer = fs.readFileSync(path.join(raiz, doc.caminho));

(async () => {
  const paginas = await lerPaginasPdf(buffer);
  const itens = extrairItens(paginas, docId, doc.sha256 ?? null);
  console.log(`total itens: ${itens.length}`);
  for (const it of itens.slice(0, quantos)) {
    console.log(JSON.stringify({
      seq: it.sequencia,
      produto: it.produto,
      unidade: it.unidadeComercial,
      qtd: it.quantidade?.bruto,
      preco: it.precoUnitario?.bruto,
      total: it.totalFonte?.bruto,
      totalCalc: it.totalCalculado,
      diverg: it.divergencia,
      pagina: it.pagina,
      revisao: it.statusRevisao,
      pend: it.pendencia,
    }));
  }
})();
