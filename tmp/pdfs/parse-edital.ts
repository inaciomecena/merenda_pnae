import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SearchablePdfEditalParserService } from '../../apps/backend/src/modules/importador-editais/application/services/searchable-pdf-edital-parser.service';
(async () => {
 const dir = 'C:/Users/HP ELITE/Downloads';
 const name = readdirSync(dir).find(n => n.includes('ALTO PARAGUAI') && n.toLowerCase().endsWith('.pdf'))!;
 const result = await new SearchablePdfEditalParserService().parse(readFileSync(join(dir,name)), name);
 writeFileSync('alto-paraguai-parsed.json', JSON.stringify(result, null, 2), 'utf8');
 console.log(JSON.stringify({titulo: result.titulo, numero: result.numero, ano: result.ano, municipio: result.municipio, escola: result.escola, items: result.itens.length}));
 for (const item of result.itens) console.log(`${item.numeroItem}\t${item.produtoOriginal}\t${item.unidade}\t${item.quantidade}`);
})().catch(e => { console.error(e); process.exit(1); });
