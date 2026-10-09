const fs = require('node:fs/promises');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');

(async () => {
  const folder = path.resolve(__dirname, '../../../docs/dre');
  const output = {};
  for (const file of (await fs.readdir(folder)).filter(f => f.endsWith('.pdf')).sort()) {
    const parser = new PDFParse({ data: await fs.readFile(path.join(folder, file)) });
    try { output[file] = (await parser.getText()).text; }
    finally { await parser.destroy(); }
  }
  await fs.writeFile(path.join(folder, 'textos-extraidos.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(`Extraídos ${Object.keys(output).length} PDFs.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
