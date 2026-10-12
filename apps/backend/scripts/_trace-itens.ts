/**
 * Trace interno de extrairItens: mostra se o gate de tabela abre e quantos
 * blocos são formados por página (uso interno de depuração).
 */
import * as fs from 'fs';
import * as path from 'path';
import { lerPaginasPdf } from '../src/modules/importacao-historica/aplicacao/extrator-documento';

const manifesto = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO', 'MANIFESTO_DOCUMENTOS.json'), 'utf8'),
) as { documentos: Array<{ id_documento: string; caminho: string }> };
const docId = process.argv[2] || 'DOC-0016';
const doc = manifesto.documentos.find((d: { id_documento: string }) => d.id_documento === docId);
if (!doc) throw new Error('doc não encontrado: ' + docId);
const raiz = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const buffer = fs.readFileSync(path.join(raiz, doc.caminho));

(async () => {
  const paginas = await lerPaginasPdf(buffer);
  let dentro = false;
  let gateEmPagina = -1;
  for (const p of paginas) {
    const linhas = (p.texto || '').split(/\r?\n/).map((l) => l.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!dentro) {
      const gate = linhas.some((l) => /PRODUTO|ESPECIFICA|QUANTIDADE|UNIDADE/i.test(l) && /QUANTIDADE|MEDIDO|PRODUTO/i.test(l));
      if (gate) { dentro = true; gateEmPagina = p.numero; }
    }
  }
  console.log('gate abriu na página:', gateEmPagina, 'de', paginas.length);
  // mostra a página do gate
  const pg = paginas.find((p) => p.numero === Math.max(gateEmPagina, 1));
  const linhasPg = (pg?.texto || '').split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  console.log('--- página', pg?.numero, 'primeiras 30 linhas limpas ---');
  console.log(linhasPg.slice(0, 30).map((l) => JSON.stringify(l)).join('\n'));
})();
