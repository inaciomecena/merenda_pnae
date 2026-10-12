/**
 * Debug pontual do parser de valores separados (layout DOC-0069).
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

const UNIDADES =
  '(Quilograma|Quilogramas|Kg|kg|Kilo|Kilos|Quilo|Quilos|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade|Unidades|Un|un|Pacote|Pacotes|PCT|Caixa|Caixas|CX|Maço|Maços|Maco|Macos|MACO|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias|Fardo|Fardos|Saco|Sacos|Duzia|Peso)';
const UNIDADES_SET = new Set(UNIDADES.split('|').map((u) => u.toUpperCase()));
const ehUnidadeConhecida = (tok: string): boolean => UNIDADES_SET.has(tok.toUpperCase());
function ehPrefixoUnidade(tok: string): boolean {
  const t = tok.toLowerCase().trim();
  if (t.length < 4) return false;
  for (const u of UNIDADES_SET) {
    const ul = u.toLowerCase();
    if (ul.startsWith(t) && ul.length > t.length) return true;
  }
  return false;
}
function tentarCompletarUnidade(atual: string, proximo: string): string | null {
  const a = atual.toLowerCase().trim();
  const p = proximo.toLowerCase().trim();
  if (!p || p.length > 4) return null;
  for (const u of UNIDADES_SET) {
    const ul = u.toLowerCase();
    if (ul.startsWith(a) && ul.endsWith(p) && ul.length === a.length + p.length) return u;
  }
  return null;
}

(async () => {
  const paginas = await lerPaginasPdf(buffer);
  const p = paginas.find((x) => x.numero === 3);
  const colunas = (p?.texto || '').split(/\r?\n/).map((l) => l.replace(/\t+/g, '  ').replace(/\s+$/, '').trimStart()).filter(Boolean);
  const idxValores = colunas.findIndex((l) => l.includes('376') && l.includes('14,00'));
  console.log('índice da linha de valores:', idxValores);
  console.log('linha de valores:', JSON.stringify(colunas[idxValores]));
  console.log('split \\s{2,}:', JSON.stringify(colunas[idxValores].trim().split(/\s{2,}/)));
  const anteriores = colunas.slice(Math.max(0, idxValores - 6), idxValores);
  console.log('--- 6 linhas anteriores (com índice absoluto) ---');
  anteriores.forEach((l, k) => {
    const abs = Math.max(0, idxValores - 6) + k;
    const ult = l.trim().split(/\s{2,}/).pop()?.trim() ?? '';
    console.log(abs, JSON.stringify(l), '| ultTok=', JSON.stringify(ult), '| conhecida=', ehUnidadeConhecida(ult), '| prefixo=', ehPrefixoUnidade(ult));
  });
})();
