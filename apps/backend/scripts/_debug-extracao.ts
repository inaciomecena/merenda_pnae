/**
 * Depuração pontual: roda a extração em um documento e imprime o stack
 * completo do erro (uso interno durante a preparação; não faz escritas).
 */
import * as fs from 'fs';
import * as path from 'path';
import { lerPaginasPdf, extrairItens, extrairIdentificacao, extrairAnexos } from '../src/modules/importacao-historica/aplicacao/extrator-documento';

const docId = process.argv[2] || 'DOC-0001';
const manifesto = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO', 'MANIFESTO_DOCUMENTOS.json'), 'utf8'),
) as { documentos: Array<{ id_documento: string; caminho: string; sha256: string | null; numero_edital: string | null; municipio: string | null; dre: string; exercicio: number | null }> };
const doc = manifesto.documentos.find((d: { id_documento: string }) => d.id_documento === docId);
if (!doc) throw new Error('doc não encontrado: ' + docId);

const raiz = path.resolve(__dirname, '..', '..', '..', 'docs', 'PNAE_MT_2025_PACOTE_IMPORTACAO');
const caminho = path.join(raiz, doc.caminho);
const buffer = fs.readFileSync(caminho);

(async () => {
  const paginas = await lerPaginasPdf(buffer);
  console.log(`páginas: ${paginas.length}, p1 len: ${paginas[0]?.texto?.length}`);
  try {
    const id = extrairIdentificacao(paginas, {
      numeroManifesto: doc.numero_edital ?? null,
      municipioManifesto: doc.municipio ?? null,
      dreManifesto: doc.dre,
      exercicioManifesto: doc.exercicio ?? null,
    });
    console.log('identificacao ok, numero=', id.numeroBruto);
  } catch (e) {
    console.error('FALHA identificacao:', (e as Error).stack);
  }
  try {
    const itens = extrairItens(paginas, docId, doc.sha256 ?? null);
    console.log('itens ok:', itens.length);
  } catch (e) {
    console.error('FALHA itens:', (e as Error).stack);
  }
  try {
    const anexos = extrairAnexos(paginas, docId);
    console.log('anexos ok:', anexos.length);
  } catch (e) {
    console.error('FALHA anexos:', (e as Error).stack);
  }
})();
