/**
 * Trace de blocos de item: mostra onde os marcadores são (ou não) detectados.
 */
import * as fs from 'fs';
import * as path from 'path';
import { lerPaginasPdf } from '../src/modules/importacao-historica/aplicacao/extrator-documento';

const manifesto = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO', 'MANIFESTO_DOCUMENTOS.json'), 'utf8'),
) as { documentos: Array<{ id_documento: string; caminho: string }> };
const docId = process.argv[2] || 'DOC-0069';
const doc = manifesto.documentos.find((d: { id_documento: string }) => d.id_documento === docId);
if (!doc) throw new Error('doc não encontrado');
const raiz = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const buffer = fs.readFileSync(path.join(raiz, doc.caminho));

const INICIO_ITEM_INLINE = /^(\d{1,3})\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])/;
const INICIO_ITEM_SOZINHO = /^(\d{1,3})\.?\s*$/;

(async () => {
  const paginas = await lerPaginasPdf(buffer);
  for (const p of paginas.slice(1, 5)) {
    const linhas = (p.texto || '').split(/\r?\n/).map((l) => l.replace(/\t/g, ' ').replace(/\s+$/, '').trimStart()).filter(Boolean);
    const marcadores: string[] = [];
    linhas.forEach((l, i) => {
      if (INICIO_ITEM_SOZINHO.test(l)) marcadores.push(`SOZINHO ${i}: ${JSON.stringify(l)}`);
      else if (INICIO_ITEM_INLINE.test(l)) marcadores.push(`INLINE ${i}: ${JSON.stringify(l).slice(0, 90)}`);
    });
    console.log(`--- página ${p.numero}: ${linhas.length} linhas, ${marcadores.length} marcadores ---`);
    console.log(marcadores.slice(0, 6).join('\n'));
    // mostra a linha que deveria ser o resumo do item 1
    const idxProd = linhas.findIndex((l) => /ABACAXI/i.test(l));
    if (idxProd >= 0) {
      console.log('  linha ABACAXI:', JSON.stringify(linhas[idxProd]));
      console.log('  split \\s{2,}:', JSON.stringify(linhas[idxProd].trim().split(/\s{2,}/)));
    }
  }
})();
