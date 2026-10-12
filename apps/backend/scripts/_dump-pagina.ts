/**
 * Dump cru das linhas de uma página (apenas \n, sem limpar) para ver como o
 * pdf-parse emite as colunas.
 */
import * as fs from 'fs';
import * as path from 'path';
import { lerPaginasPdf } from '../src/modules/importacao-historica/aplicacao/extrator-documento';

const manifesto = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO', 'MANIFESTO_DOCUMENTOS.json'), 'utf8'),
) as { documentos: Array<{ id_documento: string; caminho: string }> };
const docId = process.argv[2] || 'DOC-0069';
const paginaAlvo = Number(process.argv[3] || 3);
const doc = manifesto.documentos.find((d: { id_documento: string }) => d.id_documento === docId);
if (!doc) throw new Error('doc não encontrado');
const raiz = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const buffer = fs.readFileSync(path.join(raiz, doc.caminho));

(async () => {
  const paginas = await lerPaginasPdf(buffer);
  const p = paginas.find((x) => x.numero === paginaAlvo);
  if (!p) throw new Error('página não encontrada');
  const linhas = (p.texto || '').split(/\r?\n/);
  console.log(`página ${paginaAlvo}: ${linhas.length} linhas`);
  linhas.forEach((l, i) => console.log(i + ': ' + JSON.stringify(l)));
})();
