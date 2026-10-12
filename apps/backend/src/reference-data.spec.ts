import { DRES_SEDUC_MT, PRODUTOS_EDITAL_ALTO_PARAGUAI } from '../prisma/reference-data';
import { normalizeReference, normalizeSchoolReference } from '../prisma/seed-reference';

describe('dados oficiais de referência', () => {
  it('contém os 56 produtos extraídos do edital de Alto Paraguai', () => {
    expect(PRODUTOS_EDITAL_ALTO_PARAGUAI).toHaveLength(56);
    expect(PRODUTOS_EDITAL_ALTO_PARAGUAI.every((item) => item.nome && item.unidadePadrao)).toBe(true);
  });

  it('contém as 13 DREs publicadas pela SEDUC e códigos únicos', () => {
    expect(DRES_SEDUC_MT).toHaveLength(13);
    expect(new Set(DRES_SEDUC_MT.map((item) => item.codigo)).size).toBe(13);
    expect(DRES_SEDUC_MT.reduce((total, item) => total + item.escolas.length, 0)).toBe(624);
  });

  it('normaliza nomes oficiais e variações administrativas de escola', () => {
    expect(normalizeReference('Água Boa')).toBe('agua boa');
    expect(normalizeSchoolReference('EE Cívico-Militar Profª Alda Gawlinsk Scopel'))
      .toBe('prof alda gawlinsk scopel');
  });
});
