/**
 * Confirma se o bloco de item 1 de DOC-0069 contém a linha "Quilogram".
 * Reproduz o recorte de bloco igual a blocosDePagina.
 */
import * as fs from 'fs';
import * as path from 'path';
import { lerPaginasPdf } from '../src/modules/importacao-historica/aplicacao/extrator-documento';

const manifesto = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO', 'MANIFESTO_DOCUMENTOS.json'), 'utf8'),
) as { documentos: Array<{ id_documento: string; caminho: string }> };
const doc = manifesto.documentos.find((d: { id_documento: string }) => d.id_documento === 'DOC-0069');
if (!doc) throw new Error('doc não encontrado');
const raiz = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const buffer = fs.readFileSync(path.join(raiz, doc.caminho));

const preparar = (l: string) => l.replace(/\t+/g, '  ').replace(/\s+$/, '').trimStart();
const INICIO_ITEM_SOZINHO = /^(\d{1,3})\.?\s*$/;

(async () => {
  const paginas = await lerPaginasPdf(buffer);
  const p = paginas.find((x) => x.numero === 3);
  const linhas = (p?.texto || '').split(/\r?\n/).map(preparar).filter(Boolean);
  // bloco do item 1: da linha "1." até a linha "2."
  const ini = linhas.findIndex((l) => INICIO_ITEM_SOZINHO.test(l));
  const fim = linhas.findIndex((l, i) => i > ini && INICIO_ITEM_SOZINHO.test(l));
  const bloco = linhas.slice(ini, fim);
  console.log('bloco item 1, linhas:', bloco.length);
  bloco.forEach((l, i) => console.log(i, JSON.stringify(l)));
  const idxValores = bloco.findIndex((l) => l.includes('376'));
  console.log('idxValores no bloco:', idxValores);
  const anteriores = bloco.slice(Math.max(0, idxValores - 6), idxValores);
  console.log('janela anterior (', anteriores.length, 'linhas):');
  anteriores.forEach((l, i) => console.log(' ', JSON.stringify(l)));
})();
