import { aplicarPlaceholders, podeAlterarDocumentoPublicado, validarPlaceholders, variaveisObrigatoriasNaoPreenchidas } from './placeholders';

describe('placeholders', () => {
  it('separa placeholders válidos e inválidos', () => {
    const resultado = validarPlaceholders('Edital {{edital.numero}}/{{edital.ano}} {{edital.inexistente}}');
    expect(resultado.validos).toEqual(['edital.numero', 'edital.ano']);
    expect(resultado.invalidos).toEqual(['edital.inexistente']);
  });

  it('não substitui variável vazia e preserva tabelas especiais', () => {
    const resultado = aplicarPlaceholders('nº {{edital.numero}} {{itens}}', { 'edital.numero': '' });
    expect(resultado.texto).toContain('{{edital.numero}}');
    expect(resultado.texto).toContain('{{itens}}');
    expect(resultado.pendentes).toEqual(['edital.numero']);
  });

  it('aponta obrigatórias não preenchidas', () => {
    const faltantes = variaveisObrigatoriasNaoPreenchidas(['edital.numero', 'edital.objeto'], { 'edital.numero': '001' });
    expect(faltantes).toContain('edital.objeto');
    expect(faltantes).not.toContain('edital.numero');
  });

  it('impede alteração direta de documento publicado', () => {
    expect(podeAlterarDocumentoPublicado('PUBLICADO')).toBe(false);
    expect(podeAlterarDocumentoPublicado('RASCUNHO')).toBe(true);
  });
});
