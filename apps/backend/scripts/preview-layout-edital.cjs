// Read-only preview: renders the current composition without changing the edital or its history.
require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs/promises');
const { PrismaClient } = require('@prisma/client');
const { ComposicaoEditalService } = require('../dist/modules/composicao-editais/application/services/composicao-edital.service');
const { GeracaoEditalService } = require('../dist/modules/composicao-editais/application/services/geracao-edital.service');
const { renderPdfEdital, montarHtmlEdital } = require('../dist/modules/composicao-editais/application/domain/edital-pdf-layout');
const prisma = new PrismaClient();
(async () => {
  const editalId = process.argv[2];
  if (!editalId) throw new Error('Informe o ID do edital para a prévia local.');
  const geracao = new GeracaoEditalService(prisma, new ComposicaoEditalService(prisma, null));
  const pacote = await geracao.montar(editalId);
  const out = path.resolve('storage/validacao-layout');
  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(path.join(out, 'edital-layout.html'), montarHtmlEdital(pacote.input, (await fs.readFile('assets/dre/seduc-mt.png')).toString('base64')));
  await renderPdfEdital(pacote.input, path.join(out, 'edital-layout.pdf'));
  console.log(JSON.stringify({ arquivo: path.join(out, 'edital-layout.pdf'), itens: pacote.input.produtos.length, secoes: pacote.input.secoes.length, validacao: pacote.validacao }));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
