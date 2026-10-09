import { prepararDadosEdital } from './preenchimento-importacao';

describe('preenchimento do edital a partir da importação', () => {
  it('carrega os dados revisados, vínculos e preços sem reutilizar a identidade do edital', () => {
    const importacao = {
      id: 'importacao', arquivoCaminho: '/fonte.pdf', numeroExtraido: 'numero antigo',
      edital: {
        id: 'origem', numero: '42', ano: 2026, titulo: 'Título revisado', objeto: 'Alimentos',
        municipioId: 'municipio', escolaId: 'escola', dataPublicacao: new Date('2026-10-01T00:00:00Z'),
        itens: [{ id: 'item antigo', numeroItem: 1, produtoOriginal: 'Banana', quantidade: '12.5', unidade: 'KG', precoUnitario: '4.20' }],
      },
    };
    const dados = prepararDadosEdital(importacao, { campos: [
      { chave: 'edital.processoAdministrativo', valor: 'Processo revisado', valorExtraido: 'Processo antigo' },
      { chave: 'edital.dataSessao', valor: null, valorExtraido: '14 de janeiro de 2027' },
      { chave: 'edital.localSessao', valorExtraido: 'Escola Estadual' },
    ] });
    expect(dados).toMatchObject({ numero: '42', ano: 2026, titulo: 'Título revisado', municipioId: 'municipio', dataPublicacao: '2026-10-01' });
    expect(dados.escolasVinculadas).toEqual([{ escolaId: 'escola' }]);
    expect(dados.itens[0]).toMatchObject({ produtoOriginal: 'Banana', quantidade: 12.5, precoUnitario: 4.2 });
    expect(dados.documento).toMatchObject({ origem: 'IMPORTACAO', importacaoId: 'importacao', processoAdministrativo: 'Processo revisado', dataRecebimento: '2027-01-14', localRecebimento: 'Escola Estadual' });
    expect(dados).not.toHaveProperty('id');
    expect(dados.itens[0]).not.toHaveProperty('id');
  });

  it('mantém campos ausentes em branco e descarta datas impossíveis', () => {
    const dados = prepararDadosEdital({ id: 'importacao', arquivoNome: 'fonte.pdf' }, { campos: [
      { chave: 'edital.dataSessao', valorExtraido: '31/02/2026' },
    ] });
    expect(dados.numero).toBe('');
    expect(dados.documento.processoAdministrativo).toBe('');
    expect(dados.documento.dataRecebimento).toBe('');
    expect(dados.itens).toEqual([]);
  });
});
