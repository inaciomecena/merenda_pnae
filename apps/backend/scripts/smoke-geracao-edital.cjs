const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const mammoth = require('mammoth');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const usuarioId = randomUUID(), municipioId = randomUUID();
let editalId;
const base = 'http://localhost:3000/api/v1';
async function request(method, url, token, body, esperado = 200) {
  const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  assert.equal(response.status, esperado, JSON.stringify(data));
  return esperado >= 400 ? data : data.data;
}
(async () => {
  try {
    const email = `geracao-${usuarioId}@example.test`;
    await prisma.user.create({ data: { id: usuarioId, name: 'Teste de geração', email, role: 'DRE', passwordHash: await bcrypt.hash('teste-local-123', 4) } });
    await prisma.municipio.create({ data: { id: municipioId, nome: `Município teste ${municipioId}`, uf: 'MT' } });
    const token = (await request('POST', '/auth/login', null, { email, password: 'teste-local-123' }, 201)).accessToken;
    const campos = { numero: 'TESTE-001', ano: 2026, titulo: 'Edital sintético de geração', objeto: 'Aquisição de alimentos', municipioId,
      processoAdministrativo: 'PROC-123', dataPublicacao: '2026-10-01', dataRecebimento: '2026-10-20',
      localRecebimento: 'Local de teste', horarioRecebimento: '09:00', legislacaoAplicavel: 'Legislação de teste', escolaIds: [] };
    const edital = await request('POST', '/editais/composicao', token, { ...campos, itens: [{ produtoOriginal: 'Banana', unidade: '' }] }, 201);
    editalId = edital.id;
    assert.equal(edital.documento.anexos.length, 15);
    // Reproduz documento importado legado: formulário preenchido e variáveis sensíveis vazias.
    await prisma.editalDocumento.update({ where: { id: edital.documento.id }, data: { origem: 'IMPORTACAO' } });
    await prisma.editalVariavel.updateMany({ where: { documentoId: edital.documento.id, sensivel: true }, data: { valor: null, origem: 'extraido_automaticamente', statusRevisao: 'pendente_revisao' } });
    const salvo = await request('PATCH', `/editais/${editalId}/composicao`, token, campos);
    for (const chave of ['edital.numero', 'edital.ano', 'edital.processoAdministrativo', 'edital.municipio.nome', 'edital.municipio.uf', 'edital.dataSessao', 'edital.localSessao']) {
      const variavel = salvo.documento.variaveis.find(v => v.chave === chave);
      assert(variavel.valor, chave);
      assert.equal(variavel.statusRevisao, 'confirmado', chave);
    }
    const recusado = await request('POST', `/editais/${editalId}/composicao/gerar`, token, {}, 400);
    assert.deepEqual(recusado.erros, ['Item 1 (Banana) sem quantidade.', 'Item 1 (Banana) sem unidade.']);
    await request('POST', `/editais/${editalId}/composicao/itens`, token, { itens: [{ produtoOriginal: 'Banana', quantidade: 10, unidade: 'KG', precoUnitario: 5 }] }, 201);
    const gerado = await request('POST', `/editais/${editalId}/composicao/gerar`, token, {}, 201);
    assert.equal(gerado.documento.statusComposicao, 'GERADO');
    for (const formato of ['pdf', 'docx']) {
      assert(gerado.documento.geracoes.some(g => g.status === 'SUCESSO' && g.formato === formato.toUpperCase() && g.versaoNumero === gerado.documento.versaoAtual));
      const response = await fetch(`${base}/editais/${editalId}/composicao/download?formato=${formato}`, { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(response.status, 200);
      const buffer = Buffer.from(await response.arrayBuffer());
      assert(buffer.length > 1000);
      if (formato === 'pdf') {
        const pdf = await PDFDocument.load(buffer);
        assert(pdf.getPageCount() > 1);
        assert(pdf.getPage(0).getWidth() < pdf.getPage(0).getHeight(), 'Abertura deve continuar na vertical');
        assert(pdf.getPages().some(page => page.getWidth() > page.getHeight()), 'Itens devem sair na horizontal');
        assert(pdf.getPage(pdf.getPageCount() - 1).getWidth() < pdf.getPage(pdf.getPageCount() - 1).getHeight(), 'Cláusulas e anexos devem voltar à vertical');
      }
      else {
        const texto = (await mammoth.extractRawText({ buffer })).value;
        assert(!texto.includes('{{'), 'Nenhuma variável literal no documento publicado');
        assert(texto.includes('PROC-123'));
        assert(texto.includes('________________'));
      }
    }
    // Campo apagado deve limpar a variável antiga e voltar a impedir a geração.
    await request('PATCH', `/editais/${editalId}/composicao`, token, { localRecebimento: '' });
    const previa = await request('GET', `/editais/${editalId}/composicao/previa`, token);
    assert(previa.validacao.erros.some(e => e.includes('edital.localSessao')));
    console.log('OK: importação legada sincronizada; 15 modelos sem falsas duplicatas; somente pendências reais; PDF/DOCX preenchidos; campos do produtor em branco; limpeza de valor antigo.');
  } finally {
    if (editalId) {
      const arquivos = await prisma.historicoGeracaoDocumento.findMany({ where: { editalId, arquivoPath: { not: null } } });
      for (const arquivo of arquivos) {
        const alvo = path.resolve(arquivo.arquivoPath);
        const pasta = path.resolve('storage', 'editais-gerados', editalId);
        assert.equal(path.dirname(alvo), pasta);
        await fs.unlink(alvo).catch(e => { if (e.code !== 'ENOENT') throw e; });
      }
      await prisma.historicoGeracaoDocumento.deleteMany({ where: { editalId } });
      const doc = await prisma.editalDocumento.findUnique({ where: { editalId } });
      if (doc) {
        await prisma.editalVersao.deleteMany({ where: { documentoId: doc.id } });
        await prisma.editalAnexo.deleteMany({ where: { documentoId: doc.id } });
        await prisma.editalVariavel.deleteMany({ where: { documentoId: doc.id } });
        await prisma.editalDocumento.delete({ where: { id: doc.id } });
      }
      await prisma.editalItem.deleteMany({ where: { editalId } });
      await prisma.editalEscola.deleteMany({ where: { editalId } });
      await prisma.edital.delete({ where: { id: editalId } });
      await fs.rmdir(path.resolve('storage', 'editais-gerados', editalId)).catch(e => { if (e.code !== 'ENOENT') throw e; });
    }
    await prisma.user.deleteMany({ where: { id: usuarioId } });
    await prisma.municipio.deleteMany({ where: { id: municipioId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
