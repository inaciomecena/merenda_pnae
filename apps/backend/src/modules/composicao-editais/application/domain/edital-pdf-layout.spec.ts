import { montarHtmlEdital, EditalPdfInput } from './edital-pdf-layout';
import { MODELOS_DRE } from './templates-dre';

const input: EditalPdfInput = {
  numero: '011/2025', ano: 2026, titulo: 'Chamada pública', versao: 1, usuario: 'DRE', geradoEm: 'teste',
  valores: { 'edital.numero': '011/2025', 'edital.ano': '2026', 'edital.municipio.nome': 'Nova Maringá' },
  secoes: MODELOS_DRE.map((modelo, ordem) => ({ ...modelo, codigoModelo: modelo.arquivo, ordem })),
  itens: [], escolas: ['Escola teste'], fornecedores: [],
  escolasDetalhes: [{ nome: 'Escola teste', endereco: 'Rua de teste', telefone: '123' }],
  produtos: [{ numero: 1, produto: 'ABACAXI PÉROLA', especificacao: 'ABACAXI PÉROLA, inteiro e fresco.', quantidade: '72', unidade: 'KG', precoUnitario: '15.32', total: '1103.04' }],
};

describe('layout do edital de referência', () => {
  it('mantém brasão, cláusulas formatadas, seis colunas, preços e dados escolares', () => {
    const html = montarHtmlEdital(input, 'logo');
    expect(html).toContain('Times New Roman');
    expect(html).toContain('data:image/png;base64,logo');
    expect(html).toContain('class="ementa"');
    expect(html).toContain('ESPECIFICAÇÃO TÉCNICA');
    expect(html).toContain('PREÇO DE AQUISIÇÃO');
    expect(html).toContain('1.103,04');
    expect(html).toContain('Rua de teste');
    expect(html).toContain('CLÁUSULA PRIMEIRA');
    expect(html).toContain('CLÁUSULA DÉCIMA NONA');
    for (const numero of ['4.2', '4.3', '4.4', '21.1']) expect(html).toContain(numero);
    expect(html).not.toContain('{{');
    expect(html).not.toContain('011/2025/2026');
  });

  it('publica a tabela real uma vez; projetos e minuta recebem grades em branco', () => {
    const html = montarHtmlEdital(input, 'logo');
    expect(html.match(/ABACAXI PÉROLA/g)).toHaveLength(1);
    expect(html.match(/class="formulario"/g)).toHaveLength(4);
    expect(html).toContain('class="contrato-itens"');
    expect(html.match(/<section /g)).toHaveLength(15);
  });

  it('isola a tabela de compras em páginas horizontais com coluna de especificação ampliada', () => {
    const html = montarHtmlEdital(input, 'logo');
    expect(html).toContain('@page itens { size: A4 landscape;');
    expect(html.match(/class="pagina-itens"/g)).toHaveLength(1);
    expect(html).toMatch(/class="pagina-itens"><h2><strong>1\. OBJETO/);
    expect(html).toContain('<col style="width:51%">');
    expect(html).toContain('.produtos thead { display: table-header-group; }');
    expect(html).toContain('@page { size: A4;');
  });

  it('preserva edição de texto e formatação, escapando valores e removendo conteúdo ativo', () => {
    const html = montarHtmlEdital({ ...input, valores: { 'edital.objeto': '<img src=x onerror=alert(1)>' }, secoes: [{ tipo: 'EDITAL_PRINCIPAL', titulo: 'Personalizado', ordem: 0, conteudo: '<p><strong>Texto editado</strong> {{edital.objeto}}</p><script>alert(1)</script><img src="https://example.test/segredo">' }] }, 'logo');
    expect(html).toContain('<strong>Texto editado</strong>');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('https://example.test/segredo');
  });
});
