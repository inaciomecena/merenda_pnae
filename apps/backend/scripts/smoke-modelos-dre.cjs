// End-to-end document generation with synthetic data; no application database changes.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const { MODELOS_DRE } = require('../dist/modules/composicao-editais/application/domain/templates-dre');
const { PropostaDocumentosService, camposDosModelos } = require('../dist/modules/propostas/application/services/proposta-documentos.service');

(async () => {
  for (const perfil of ['INDIVIDUAL', 'FORMAL', 'INFORMAL', 'EFR']) {
    const modelos = MODELOS_DRE.filter(m => m.perfilFornecedor === perfil);
    let proposta = {
      id: `validacao-dre-${perfil}`, status: 'RASCUNHO', documentosJson: null,
      produtor: { nome: 'Agricultor Teste dos Modelos', cpfCnpj: '000.000.000-00', endereco: 'Rua de Teste', telefone: '(65) 0000-0000', municipioId: 'm1', municipio: { nome: 'Município de Teste', uf: 'MT' }, dadosDocumentais: { 'produtor.dapCaf': 'CAF-TESTE-123' } },
      edital: { numero: 'TESTE', ano: 2026, titulo: 'Chamada de validação', dataPublicacao: new Date('2026-10-01T12:00:00Z'), municipio: { nome: 'Município de Teste', uf: 'MT' }, escolasVinculadas: [], documento: null },
      itens: [{ produto: 'Banana da agricultura familiar', especificacao: 'Produção própria', unidade: 'KG', quantidade: 10, precoUnitario: 5, valorTotal: 50 }],
    };
    const templates = modelos.map((m, i) => ({ ...m, id: `t-${i}`, versoes: [{ id: `v-${i}`, numero: 1, formato: 'HTML', conteudo: m.conteudo, titulo: m.titulo }] }));
    const prisma = {
      proposta: { findFirst: async () => proposta, update: async ({ data }) => (proposta = { ...proposta, ...data }) },
      templateDocumento: { findMany: async () => templates },
    };
    const service = new PropostaDocumentosService(prisma);
    const p = await service.preparar(proposta.id);
    assert.equal(p.valores['produtor.dapCaf'], 'CAF-TESTE-123');
    const valores = { ...p.valores };
    for (const c of camposDosModelos(p.modelos)) if (!valores[c.chave]) valores[c.chave] = c.chave === 'projeto.cronograma' ? 'Entrega semanal' : `Teste ${c.rotulo}`;
    valores['produtor.nome'] = 'NOME ADULTERADO';
    const saved = await service.salvar(proposta.id, { modelos: p.modelos.map(m => ({ templateId: m.templateId, versaoId: m.versaoId })), valores });
    assert.equal(saved.valores['produtor.nome'], proposta.produtor.nome);
    const previa = await service.previa(proposta.id);
    assert.deepEqual(previa.pendencias, []);
    const files = await service.gerar(proposta.id);
    const parser = new PDFParse({ data: await fs.readFile(files.pdfPath) });
    let pdf;
    try { pdf = await parser.getText(); } finally { await parser.destroy(); }
    const docx = (await mammoth.extractRawText({ path: files.docxPath })).value;
    for (const text of [pdf.text, docx]) {
      assert(!text.includes('{{'), 'Documento gerado contém variável não preenchida');
      assert(!text.includes('NOME ADULTERADO'));
      assert(text.includes('Agricultor Teste dos Modelos') || perfil === 'INFORMAL');
      assert(text.includes('Banana da agricultura familiar'));
      assert(text.includes('PRODUÇÃO PRÓPRIA'));
      if (perfil !== 'INDIVIDUAL') assert(text.includes('CONTROLE DO LIMITE'));
    }
    assert(pdf.total >= modelos.length, 'Cada documento precisa começar em página própria');
    for (const page of pdf.pages) assert(page.text.replace(/PNAE.*|Página \d+ de \d+/g, '').trim().length > 50, 'Página vazia criada durante a paginação');
    console.log(JSON.stringify({ perfil, documentos: modelos.length, paginas: pdf.total, pdf: files.pdfPath, docx: files.docxPath, resultado: 'OK' }));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
