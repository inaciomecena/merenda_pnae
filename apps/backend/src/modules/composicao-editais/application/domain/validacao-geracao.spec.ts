import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { renderPdf } from './documento-renderer';
import { validarGeracao } from './validacao-geracao';

const base = {
  statusComposicao: 'RASCUNHO',
  numero: '001',
  ano: 2026,
  titulo: 'Chamada pública',
  objeto: 'Aquisição de gêneros da agricultura familiar',
  municipioNome: 'Alto Paraguai',
  dataPublicacao: '2026-01-10',
  dataSessao: '2026-01-20',
  valores: {
    'edital.numero': '001',
    'edital.ano': '2026',
    'edital.titulo': 'Chamada pública',
    'edital.objeto': 'Aquisição de gêneros da agricultura familiar',
    'edital.municipio.nome': 'Alto Paraguai',
  },
  variaveisPendentes: [],
  anexos: [{ tipo: 'EDITAL_PRINCIPAL', titulo: 'Edital', incluido: true, templateId: 't1', conteudo: '{{edital.objeto}} {{itens}}' }],
  itens: [{ produto: 'Banana', quantidade: 10, unidade: 'KG' }],
  conteudos: ['{{edital.objeto}} {{itens}}'],
};

describe('validação da geração', () => {
  it('aceita composição consistente', () => {
    expect(validarGeracao(base).ok).toBe(true);
  });

  it('aceita projeto e declarações distintos do mesmo tipo de anexo', () => {
    expect(validarGeracao({ ...base, anexos: [...base.anexos,
      { tipo: 'ANEXO_I', titulo: 'Projeto formal', incluido: true, templateId: 'projeto' },
      { tipo: 'ANEXO_I', titulo: 'Produção própria', incluido: true, templateId: 'producao' },
      { tipo: 'ANEXO_I', titulo: 'Limite de fornecimento', incluido: true, templateId: 'limite' },
    ] }).ok).toBe(true);
  });

  it('recusa a repetição do mesmo modelo, mesmo com outro título', () => {
    const resultado = validarGeracao({ ...base, anexos: [...base.anexos,
      { ...base.anexos[0], tipo: 'ANEXO_I', titulo: 'Cópia' },
    ] });
    expect(resultado.erros.join(' ')).toMatch(/modelos repetidos/);
  });

  it('bloqueia publicado, placeholder inválido, item sem unidade e data inconsistente', () => {
    const resultado = validarGeracao({
      ...base,
      statusComposicao: 'PUBLICADO',
      dataSessao: '2026-01-01',
      conteudos: ['{{nao.existe}}'],
      anexos: [{ tipo: 'ANEXO_I', titulo: 'Anexo I', incluido: true, conteudo: '' }],
      itens: [{ produto: 'Banana', quantidade: null, unidade: '' }],
      variaveisPendentes: ['edital.numero'],
    });
    expect(resultado.ok).toBe(false);
    expect(resultado.erros.join(' ')).toMatch(/publicado/);
    expect(resultado.erros.join(' ')).toMatch(/inválidos/);
    expect(resultado.erros.join(' ')).toMatch(/sem unidade/);
    expect(resultado.erros.join(' ')).toMatch(/anterior/);
    expect(resultado.erros.join(' ')).toMatch(/pendentes/);
  });
});

describe('renderização do PDF', () => {
  it('gera PDF paginado e legível', async () => {
    const destino = path.join(os.tmpdir(), `edital-pnae-${Date.now()}.pdf`);
    await renderPdf({
      numero: '001',
      ano: 2026,
      titulo: 'Chamada pública de teste',
      versao: 1,
      usuario: 'DRE Teste',
      geradoEm: '08/10/2026',
      valores: { 'edital.objeto': 'Aquisição de gêneros da agricultura familiar para a alimentação escolar.' },
      secoes: [
        { titulo: 'Edital principal', tipo: 'EDITAL_PRINCIPAL', ordem: 0, conteudo: '<h1>Objeto</h1><p>{{edital.objeto}}</p><p>{{itens}}</p><p>{{assinaturas}}</p>' },
        { titulo: 'Anexo V', tipo: 'ANEXO_V', ordem: 1, conteudo: '<p>{{escolas}}</p>' },
      ],
      itens: [{ colunas: ['Item', 'Produto', 'Qtd', 'Un'] }, { colunas: ['1', 'Banana prata', '10', 'KG'] }],
      escolas: ['Escola Estadual de Teste'],
      fornecedores: [],
    }, destino);
    const buffer = fs.readFileSync(destino);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
    fs.unlinkSync(destino);
  });
});
