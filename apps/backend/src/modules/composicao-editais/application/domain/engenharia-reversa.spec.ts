import * as fs from 'fs';
import * as path from 'path';
import { analisarTextoEdital, parametrizarTexto } from './engenharia-reversa';

const AMOSTRA = `
SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO
Edital de chamada pública nº 001/2025 para aquisição de gêneros alimentícios.
Processo administrativo n. 170376/2025
A SECRETARIA, através da Câmara de Negócios do Município de Diamantino-MT, realiza o processo de chamada pública, para aquisição de gêneros alimentícios da agricultura familiar.
Os interessados devem apresentar a documentação no dia 14 de janeiro de 2026, na Escola Estadual Dr. Arnaldo Estevão De Figueiredo, situada à Avenida Major Simão, 229 CENTRO, Alto Paraguai - MT, às 09h:00min.
Conforme a Lei Federal n. 11.947/2009 e a Resolução CD/FNDE n. 06/2020.
1.1 O objeto desta chamada é o fornecimento de gêneros.
Anexo I – Modelo de Projeto de Venda para Grupos Formais
Anexo V – Relação das unidades escolares contempladas
Anexo VII – Minuta de Contrato
O foro para dirimir questões será o da Justiça de Alto Paraguai.
CONTRATANTE:
TESTEMUNHAS:
`;

describe('engenharia reversa', () => {
  const analise = analisarTextoEdital(AMOSTRA);

  it('extrai número, processo, escola e anexos e marca dados sensíveis como pendentes', () => {
    const numero = analise.campos.find((campo) => campo.chave === 'edital.numero');
    const processo = analise.campos.find((campo) => campo.chave === 'edital.processoAdministrativo');
    const escola = analise.campos.find((campo) => campo.chave === 'escolas');
    expect(numero?.valorExtraido).toBe('001');
    expect(numero?.sensivel).toBe(true);
    expect(numero?.statusRevisao).toBe('pendente_revisao');
    expect(numero?.valor).toBeNull();
    expect(processo?.valorExtraido).toBe('170376/2025');
    expect(escola?.valorExtraido).toMatch(/Escola Estadual/i);
    expect(analise.anexos.map((anexo) => anexo.tipo)).toEqual(expect.arrayContaining(['ANEXO_I', 'ANEXO_V', 'ANEXO_VII']));
    expect(analise.secoes.length).toBeGreaterThan(0);
    expect(analise.assinaturas.length).toBeGreaterThan(0);
    expect(analise.alertas.join(' ')).toMatch(/município|legislação/i);
  });

  it('não copia cegamente processo e legislação para o texto parametrizado', () => {
    expect(analise.parametrizado).not.toContain('170376/2025');
    expect(analise.parametrizado).toContain('{{edital.processoAdministrativo}}');
    expect(parametrizarTexto('Processo 999999/2024 permanece', [])).toContain('999999/2024');
  });
});

describe('engenharia reversa dos PDFs em docs/dre', () => {
  const arquivo = path.resolve(__dirname, '../../../../../../docs/dre/01_Edital_Principal.pdf');

  it('lê o edital histórico e identifica metadados, cláusulas e anexos', async () => {
    if (!fs.existsSync(arquivo)) {
      return;
    }
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: fs.readFileSync(arquivo) });
    try {
      const result = await parser.getText();
      const analise = analisarTextoEdital(result.text || '', (result.pages || []).map((pagina: { text?: string }, index: number) => ({
        numero: index + 1,
        texto: pagina.text || '',
      })));
      expect(analise.campos.find((campo) => campo.chave === 'edital.numero')?.valorExtraido).toBe('001');
      expect(analise.campos.find((campo) => campo.chave === 'edital.processoAdministrativo')?.valorExtraido).toContain('170376');
      expect(analise.anexos).toHaveLength(7);
      expect(analise.secoes.length).toBeGreaterThan(5);
      expect(analise.campos.every((campo) => campo.paginaOrigem == null || campo.paginaOrigem > 0)).toBe(true);
    } finally {
      await parser.destroy();
    }
  }, 30000);
});
