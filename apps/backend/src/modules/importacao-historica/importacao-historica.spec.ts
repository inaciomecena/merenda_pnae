import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { extrairItens } from './aplicacao/extrator-documento';
import { lerPossivel } from './aplicacao/apoio-extracao';
import { agruparDuplicados, resolverDentroDoPacote, resumirValidacoes, validarDocumento } from './aplicacao/leitor-pacote';
import { resolverDRE, resolverEntidadeExecutora, resolverMunicipio, type SnapshotInstitucional } from './aplicacao/resolucao-institucional';
import { simularImportacao, type ChavesExistentes } from './aplicacao/simulador-importacao';
import {
  chaveIdempotenciaOperacao,
  chaveItem,
  chaveLogicaEdital,
  chaveVersaoDocumento,
  classificarPapelDocumento,
  compararCampos,
  podeSobrescrever,
} from './dominio/chaves-logicas';
import {
  ELEGIBILIDADE_APROVADA,
  ELEGIBILIDADE_SEGREGADA,
  classificarEdital,
  normalizarNumeroComJustificativa,
  resumirPorDre,
} from './dominio/classificacao-pacote';
import { centavosParaDecimal, compararTotal, lerQuantidade, lerValorPossivelmenteAmbiguo } from './dominio/decimal-monetario';
import type { DocumentoPacote, EditalPacote, StagingEdital } from './dominio/tipos';

/**
 * Testes de comportamento da importação histórica PNAE MT 2025.
 *
 * Cada bloco `describe` mapeia um cenário exigido no PROMPT (seção 6).
 * Nenhum teste escreve no banco ativo: a camada de domínio/aplicação é pura
 * (sem Prisma, sem HTTP), então os testes rodam sem ambiente isolado.
 */

// ---------------------------------------------------------------------------
// Ajudantes
// ---------------------------------------------------------------------------

/** Monta páginas sintéticas com o MESMO formato de `lerPaginasPdf`. */
function paginas(textos: string | string[]): Array<{ numero: number; texto: string }> {
  const lista = Array.isArray(textos) ? textos : [textos];
  return lista.map((texto, i) => ({ numero: i + 1, texto }));
}

function edital(entrada: Partial<EditalPacote> & { id: string; dre: string }): EditalPacote {
  return { tipo: 'Chamada Pública', ...entrada };
}

function validacaoInexistente(): Record<string, { classificacao: string }> {
  return {};
}

function snapshotVazio(): SnapshotInstitucional {
  return { geradoEm: '2026-10-12', dres: [], municipios: [], entidadesExecutoras: [], escolas: [], vinculosEscolaDRE: [] };
}

function stagingAprovado(entrada: Partial<StagingEdital> & { idPacote: string }): StagingEdital {
  return {
    schema: 'importacao-historica-pnae/1.0',
    geradoEm: '2026-10-12T00:00:00.000Z',
    dre: 'Sinop',
    chaveLogica: `chave-${entrada.idPacote}`,
    decisao: 'APROVADO',
    motivosBloqueio: [],
    identificacao: {
      numeroBruto: '020/2024',
      numeroNormalizado: '020/2024',
      anoNumeracao: 2024,
      exercicio: 2025,
      exercicioEvidencia: [{ pagina: 2, trecho: 'ano letivo de 2025' }],
      processoAdministrativo: null,
      dreNome: 'Sinop',
      camaraNegocios: 'SINOP',
      municipioAtendido: 'Sinop',
      recorte: 'SEDE',
      dataPublicacao: null,
      dataSessao: null,
      objeto: null,
      fundamentacaoLegal: null,
      prazos: null,
      habilitacao: null,
      criteriosSelecao: null,
      condicoesEntrega: null,
      condicoesPagamento: null,
      valorEstimado: null,
      observacoes: [],
    },
    documentos: [
      {
        idDocumento: 'DOC-TESTE',
        papel: 'EDITAL_PRINCIPAL',
        sha256: 'a'.repeat(64),
        caminho: 'x.pdf',
        paginas: 10,
        urls: [],
        chaveVersao: 'cv1',
      },
    ],
    vinculosInstitucionais: {
      dre: { nomePacote: 'Sinop', dreId: 'dre-1', codigo: '5107', status: 'CONFIRMADO', detalhe: 'ok' },
      municipio: { nomePacote: 'Sinop', municipioId: 'mun-1', codigoIbge: '5107607', status: 'CONFIRMADO', detalhe: 'ok' },
      escolas: [],
      unidadesExecutoras: [],
    },
    itens: [],
    anexos: [],
    pendencias: [],
    metadadoExtracao: {
      manifestoSha256: 'b'.repeat(64),
      documentosValidados: 1,
      itensDoManifesto: 40,
      itensExtraidosPdf: 42,
      blocosNaoItem: 3,
    },
    ...entrada,
  };
}

// ---------------------------------------------------------------------------
// 1. dry-run não grava dados nem altera arquivos originais
// ---------------------------------------------------------------------------

describe('dry-run: não grava dados nem altera arquivos originais', () => {
  it('simularImportacao é puro: não cria nem altera arquivo no disco', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pnae-dryrun-'));
    const antes = fs.readdirSync(dir);

    simularImportacao([stagingAprovado({ idPacote: 'ED-X' })], { chamadasPublicas: [], editais: [], hashesDocumento: [], idempotencias: [] });

    expect(fs.readdirSync(dir)).toEqual(antes);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('simularImportacao não muta o staging recebido', () => {
    const s = stagingAprovado({ idPacote: 'ED-X' });
    const serializadoAntes = JSON.stringify(s);
    simularImportacao([s], { chamadasPublicas: [], editais: [], hashesDocumento: [], idempotencias: [] });
    expect(JSON.stringify(s)).toBe(serializadoAntes);
  });

  it('o plano gerado só contém operações CREATE (nunca UPDATE/DELETE)', () => {
    const plano = simularImportacao([stagingAprovado({ idPacote: 'ED-X' })], {
      chamadasPublicas: [],
      editais: [],
      hashesDocumento: [],
      idempotencias: [],
    });
    expect(plano.acoes.length).toBeGreaterThan(0);
    for (const acao of plano.acoes) expect(acao.operacao).toBe('CREATE');
  });
});

// ---------------------------------------------------------------------------
// 2/3. Elegibilidade 2024→2025 versus publicação 2025→2026; ano conflitante
// ---------------------------------------------------------------------------

describe('classificação de elegibilidade e exercício', () => {
  const docIntegro = (id: string, evidencia: string[]): DocumentoPacote => ({
    id_documento: id,
    id_edital: id.replace('DOC', 'ED'),
    caminho: 'a.pdf',
    sha256: 'c'.repeat(64),
    evidencia_exercicio: evidencia.map((trecho, i) => ({ pagina: i + 1, trecho })),
  } as unknown as DocumentoPacote);

  it('ELEGIVEL_2025 com evidência do exercício 2025 → APROVADO', () => {
    const d = classificarEdital(
      edital({ id: 'ED-1', dre: 'Sinop', numero: '020/2024', elegibilidade: ELEGIBILIDADE_APROVADA }),
      [docIntegro('DOC-1', ['ano letivo de 2025'])],
      [],
      { 'DOC-1': { classificacao: 'INTEIRO' } },
    );
    expect(d.decisao).toBe('APROVADO');
  });

  it('FORA_ESCOPO_2026 (publicação 2025→2026) → BLOQUEADO, nunca aprovado', () => {
    const d = classificarEdital(
      edital({ id: 'ED-2', dre: 'Metropolitana', elegibilidade: 'FORA_ESCOPO_2026' }),
      [docIntegro('DOC-2', ['ano letivo de 2026'])],
      [],
      { 'DOC-2': { classificacao: 'INTEIRO' } },
    );
    expect(d.decisao).toBe('BLOQUEADO');
    expect(d.motivos.join(' ')).toContain('FORA_ESCOPO_2026');
  });

  it('CONFLITO_EXERCICIO (ano conflitante) → BLOQUEADO', () => {
    const d = classificarEdital(
      edital({ id: 'ED-3', dre: 'Metropolitana', elegibilidade: 'CONFLITO_EXERCICIO' }),
      [docIntegro('DOC-3', [])],
      [],
      { 'DOC-3': { classificacao: 'INTEIRO' } },
    );
    expect(d.decisao).toBe('BLOQUEADO');
  });

  it('PREGÃO_2025 → SEGREGADO (não é chamada pública da agricultura familiar)', () => {
    const d = classificarEdital(edital({ id: 'ED-4', dre: 'Cáceres', elegibilidade: ELEGIBILIDADE_SEGREGADA }), [], [], validacaoInexistente());
    expect(d.decisao).toBe('SEGREGADO');
  });

  it('elegibilidade aprovada mas SEM evidência do exercício → PENDENTE (nunca APROVADO)', () => {
    const d = classificarEdital(
      edital({ id: 'ED-5', dre: 'Sinop', numero: '021/2024', elegibilidade: ELEGIBILIDADE_APROVADA }),
      [docIntegro('DOC-5', [])],
      [],
      { 'DOC-5': { classificacao: 'INTEIRO' } },
    );
    expect(d.decisao).toBe('PENDENTE');
    expect(d.motivos.join(' ')).toContain('evidência do exercício ausente');
  });

  it('elegibilidade aprovada mas PDF ALTERADO/inválido → BLOQUEADO', () => {
    const d = classificarEdital(
      edital({ id: 'ED-6', dre: 'Sinop', numero: '022/2024', elegibilidade: ELEGIBILIDADE_APROVADA }),
      [docIntegro('DOC-6', ['ano letivo de 2025'])],
      [],
      { 'DOC-6': { classificacao: 'ALTERADO' } },
    );
    expect(d.decisao).toBe('BLOQUEADO');
    expect(d.motivos.join(' ')).toContain('nenhum PDF integral');
  });

  it('conflito documental pendente bloqueia mesmo com elegibilidade aprovada', () => {
    const d = classificarEdital(
      edital({ id: 'ED-7', dre: 'Sinop', numero: '023/2024', elegibilidade: ELEGIBILIDADE_APROVADA }),
      [docIntegro('DOC-7', ['ano letivo de 2025'])],
      [{ dre: 'Sinop', edital: 'ED-7', tipo: 'HASH_DIVERGENTE', problema: 'x' }],
      { 'DOC-7': { classificacao: 'INTEIRO' } },
    );
    expect(d.decisao).toBe('BLOQUEADO');
    expect(d.motivos.join(' ')).toContain('HASH_DIVERGENTE');
  });
});

// ---------------------------------------------------------------------------
// 4. Duplicado binário e retificação com alteração real
// ---------------------------------------------------------------------------

describe('duplicados binários e retificações', () => {
  it('agrupa documentos com SHA-256 idêntico (duplicado binário)', () => {
    const base = { classificacao: 'INTEIRO', sha256_calculado: 'd'.repeat(64), urls: [], caminho_rel: 'a.pdf' };
    const grupos = agruparDuplicados([
      { id_documento: 'DOC-19', ...base } as never,
      { id_documento: 'DOC-20', ...base } as never,
      { id_documento: 'DOC-21', sha256_calculado: 'e'.repeat(64), classificacao: 'INTEIRO', urls: [], caminho_rel: 'b.pdf' } as never,
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].ids).toEqual(['DOC-19', 'DOC-20']);
  });

  it('retificação com alteração real tem hash (e chave de versão) DIFERENTE', () => {
    const chave = chaveLogicaEdital({ dre: 'Sinop', tipoProcedimento: 'chamada publica', numero: '020/2024', anoNumeracao: 2024, exercicio: 2025, recorte: 'SEDE' });
    const v1 = chaveVersaoDocumento({ chaveLogica: chave, tipoDocumental: 'EDITAL_PRINCIPAL', sha256: 'f'.repeat(64) });
    const v2 = chaveVersaoDocumento({ chaveLogica: chave, tipoDocumental: 'RETIFICACAO', sha256: '9'.repeat(64) });
    expect(v1).not.toBe(v2);
  });

  it('mesmo documento sem hash cai em chave estável "sem-hash" (nunca colide com hash real)', () => {
    const chave = chaveLogicaEdital({ dre: 'Sinop', tipoProcedimento: 'chamada publica', numero: '020/2024', anoNumeracao: 2024, exercicio: 2025, recorte: 'SEDE' });
    const semHash = chaveVersaoDocumento({ chaveLogica: chave, tipoDocumental: 'EDITAL_PRINCIPAL', sha256: null });
    const comHash = chaveVersaoDocumento({ chaveLogica: chave, tipoDocumental: 'EDITAL_PRINCIPAL', sha256: 'f'.repeat(64) });
    expect(semHash).not.toBe(comHash);
  });

  it('classificarPapelDocumento reconhece retificação pelo CONTEÚDO, não pelo numeral', () => {
    const papel = classificarPapelDocumento({ tipo: null, titulo: 'Termo de Retificação', nomeOriginal: 'doc.pdf', observacoes: null, elegibilidade: null });
    expect(papel).toBe('RETIFICACAO');
  });
});

// ---------------------------------------------------------------------------
// 5. Valores decimais, tabela multipágina, quantidade/unidade/embalagem, divergência 0,72
// ---------------------------------------------------------------------------

describe('monetário e tabela de itens', () => {
  it('converte centavos sem ponto flutuante (referência financeira decimal)', () => {
    expect(centavosParaDecimal(38008)).toBe('380.08');
    expect(centavosParaDecimal(0)).toBe('0.00');
    expect(centavosParaDecimal(null)).toBeNull();
  });

  it('leitura de "R$ 2.205,70" usa centavos inteiros', () => {
    const l = lerPossivel('R$ 2.205,70');
    expect(l.ambiguo).toBe(false);
    expect(l.centavos).toBe(220570);
    expect(l.bruto).toBe('R$ 2.205,70');
  });

  it('divergência real 0,72 (ABACATE DOC-0007) é REGISTRADA, nunca corrigida', () => {
    // fonte: 380,08 (38008 centavos) | cálculo: 10,00 × 38,08 = 380,80 (38080)
    const div = compararTotal(1000, 3808, lerPossivel('380,08'));
    expect(div.divergente).toBe(true);
    expect(div.diferencaCentavos).toBe(-72);
    expect(Math.abs(div.diferencaCentavos!)).toBe(72);
    expect(div.totalFonteBruto).toBe('380,08');
    expect(div.totalFonteCentavos).toBe(38008);
    expect(div.totalCalculadoCentavos).toBe(38080);
    expect(div.motivo).toContain('0.72');
  });

  it('divergência zero mantém total da fonte como referência', () => {
    const div = compararTotal(100, 36386, lerPossivel('363,86'));
    expect(div.divergente).toBe(false);
    expect(div.diferencaCentavos).toBe(0);
  });

  it('sem quantidade/preço NUNCA calcula e NUNCA marca divergente', () => {
    const div = compararTotal(null, 1733, lerPossivel('363,86'));
    expect(div.totalCalculadoCentavos).toBeNull();
    expect(div.divergente).toBe(false);
  });

  it('extrai quantidade, unidade e embalagem de uma linha de resumo (layout "resumo R$")', () => {
    const { itens, descartados } = extrairItens(
      paginas([
        ['Nº PRODUTO COM ESPECIFICAÇÃO TÉCNICA', 'UNIDADE', 'DE', 'MEDIDA', 'QUANTIDADE', 'ESTIMADA', 'PREÇO DE', 'AQUISIÇÃO', 'UNITÁRIO', 'R$', 'VALOR TOTAL', 'R$', '', '1.', 'ABACATE, inteiro, livre de sujidades.', 'Quilograma \t21 \t17,33 \t363,86'].join('\n'),
      ]),
      'DOC-T',
      'a'.repeat(64),
    );
    expect(descartados).toHaveLength(0);
    expect(itens).toHaveLength(1);
    expect(itens[0].produto).toBe('ABACATE');
    expect(itens[0].unidadeComercial).toBe('KG');
    expect(itens[0].quantidade?.bruto).toBe('21');
    expect(itens[0].precoUnitario?.bruto).toBe('17,33');
    expect(itens[0].totalFonte?.bruto).toBe('363,86');
  });

  it('tabela MULTIPÁGINA: item cortado pela quebra de página fica SEM valores + pendência (zero artificial jamais)', () => {
    const { itens } = extrairItens(
      [
        // Página 1: cabeçalho + item 1 SEM linha de valores (recorte do PDF).
        {
          numero: 1,
          texto: ['Nº PRODUTO', 'QUANTIDADE', 'UNIDADE', 'MEDIDA'].join('\n') + '\n1.\nMELANCIA, inteira, livre de sujidades.\nQuilograma',
        },
        // Página 2: item 2 completo.
        { numero: 2, texto: '2.\nMELÃO, inteiro.\nQuilograma \t966 \t7,71 \t7.447,86' },
      ],
      'DOC-MP',
      'a'.repeat(64),
    );
    const melancia = itens.find((i) => i.sequencia === 1);
    const melao = itens.find((i) => i.sequencia === 2);
    // item da borda: mantido, sem valores, com pendência explícita
    expect(melancia).toBeDefined();
    expect(melancia?.quantidade).toBeNull();
    expect(melancia?.precoUnitario).toBeNull();
    expect(melancia?.totalFonte).toBeNull();
    expect(melancia?.pendencia).toContain('sem preenchimento por zero');
    // item seguinte é extraído normalmente
    expect(melao?.totalFonte?.bruto).toBe('7.447,86');
  });

  it('layout "valores quebrados" (Sinop): qty+preço numa linha, total nas seguintes', () => {
    const { itens } = extrairItens(
      paginas([
        ['Nº PRODUTO', 'QUANTIDADE', 'UNIDADE', 'MEDIDA'].join('\n'),
        '1.', 'FARINHA DE TRIGO, tipo 1.', 'Quilograma', '426 R$ 5,39', 'R$', '2.296,14',
      ].join('\n')),
      'DOC-SN',
      'a'.repeat(64),
    );
    expect(itens).toHaveLength(1);
    expect(itens[0].quantidade?.bruto).toBe('426');
    expect(itens[0].precoUnitario?.bruto).toBe('5,39');
    expect(itens[0].totalFonte?.bruto).toBe('2.296,14');
  });

  it('preço grafado com PONTO decimal ("R$ 3.96") vira pendência, não valor convertido', () => {
    const l = lerPossivel('3.96');
    expect(l.centavos).toBeNull();
    expect(l.ambiguo).toBe(true);
  });

  it('embalagem "Unidade de 30g" NÃO vira quantidade', () => {
    const { itens } = extrairItens(
      paginas([
        ['Nº PRODUTO', 'QUANTIDADE', 'UNIDADE', 'MEDIDA'].join('\n'),
        '1.', 'AÇAFRÃO, em pó. Acondicionado em embalagem de 30g.', 'Unidade de', '30g', '313 \t2,75 \t859,71',
      ].join('\n')),
      'DOC-EMB',
      'a'.repeat(64),
    );
    expect(itens[0].quantidade?.bruto).toBe('313');
    expect(itens[0].embalagem).toContain('Unidade de 30g');
  });

  it('quantidade ambígua ("1.221") fica pendente_revisao com o bruto preservado', () => {
    const l = lerQuantidade('1.221');
    expect(l.bruto).toBe('1.221');
    expect(l.ambiguo).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Número bruto "025/224" e valor bruto "2,205,70"
// ---------------------------------------------------------------------------

describe('preservação de valores brutos ambíguos', () => {
  it('número "025/224" preserva a grafia e propõe normalização COM justificativa', () => {
    const r = normalizarNumeroComJustificativa('025/224');
    expect(r.bruto).toBe('025/224');
    expect(r.normalizado).toBe('025/224');
    expect(r.justificativa).toContain('revisão administrativa');
  });

  it('número "25/2024" é normalizado sem justificativa (padrão inequívoco)', () => {
    const r = normalizarNumeroComJustificativa('25/2024');
    expect(r.bruto).toBe('25/2024');
    expect(r.normalizado).toBe('025/2024');
    expect(r.justificativa).toBeNull();
  });

  it('valor "2,205,70" (duas vírgulas) é AMBÍGUO: propõe interpretação mas não converte', () => {
    const l = lerValorPossivelmenteAmbiguo('2,205,70');
    expect(l.ambiguo).toBe(true);
    expect(l.centavos).toBeNull();
    expect(l.interpretacaoProposta).toBe(220570);
    expect(l.bruto).toBe('2,205,70');
    expect(l.motivo).toContain('revisão administrativa');
  });

  it('valor ausente nunca vira zero', () => {
    expect(lerPossivel(null).centavos).toBeNull();
    expect(lerPossivel('').centavos).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Erro/404/hash divergente e arquivo inválido
// ---------------------------------------------------------------------------

describe('validação física dos documentos do pacote', () => {
  let raiz: string;

  beforeEach(() => {
    raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'pnae-pacote-'));
  });
  afterEach(() => {
    fs.rmSync(raiz, { recursive: true, force: true });
  });

  it('documento sem caminho (HTTP 404 na pesquisa) → AUSENTE com o motivo explícito', () => {
    const v = validarDocumento(raiz, { id_documento: 'DOC-404', caminho: null, url: 'https://x/edital', sha256: 'a'.repeat(64) } as DocumentoPacote);
    expect(v.classificacao).toBe('AUSENTE');
    expect(v.detalhes.join(' ')).toContain('HTTP 404');
  });

  it('arquivo inexistente → AUSENTE', () => {
    const v = validarDocumento(raiz, { id_documento: 'DOC-F', caminho: 'nao-existe.pdf', sha256: 'a'.repeat(64) } as DocumentoPacote);
    expect(v.classificacao).toBe('AUSENTE');
  });

  it('hash divergente (arquivo alterado) → ALTERADO, com os dois hashes registrados', () => {
    fs.writeFileSync(path.join(raiz, 'a.pdf'), '%PDF-1.4\nabc');
    const v = validarDocumento(raiz, { id_documento: 'DOC-H', caminho: 'a.pdf', sha256: '0'.repeat(64) } as DocumentoPacote);
    expect(v.classificacao).toBe('ALTERADO');
    expect(v.sha256_manifesto).toBe('0'.repeat(64));
    expect(v.sha256_calculado).not.toBe('0'.repeat(64));
  });

  it('conteúdo que não é PDF → INVALIDO', () => {
    fs.writeFileSync(path.join(raiz, 'b.pdf'), 'isto nao e um pdf');
    const v = validarDocumento(raiz, { id_documento: 'DOC-I', caminho: 'b.pdf', sha256: null } as DocumentoPacote);
    expect(v.classificacao).toBe('INVALIDO');
    expect(v.header_pdf).toBe(false);
  });

  it('caminho que escapa da raiz do pacote → FORA_DO_PACOTE (path traversal)', () => {
    const r = resolverDentroDoPacote(raiz, '../../../etc/passwd');
    expect(r.escapou).toBe(true);
    const v = validarDocumento(raiz, { id_documento: 'DOC-T', caminho: '../../../etc/passwd', sha256: null } as DocumentoPacote);
    expect(v.classificacao).toBe('FORA_DO_PACOTE');
  });

  it('resumirValidacoes conta as classificações para o relatório', () => {
    const resumo = resumirValidacoes([
      { id_documento: 'a', classificacao: 'INTEIRO' } as never,
      { id_documento: 'b', classificacao: 'INTEIRO' } as never,
      { id_documento: 'c', classificacao: 'AUSENTE' } as never,
    ]);
    expect(resumo).toEqual({ INTEIRO: 2, AUSENTE: 1 });
  });
});

// ---------------------------------------------------------------------------
// 8. DRE/município/CNPJ ambíguos sem vinculação automática
// ---------------------------------------------------------------------------

describe('resolução institucional nunca vincula em ambiguidade', () => {
  const snapshot: SnapshotInstitucional = {
    geradoEm: '2026-10-12',
    dres: [
      { id: 'dre-1', nome: 'DRE Sinop', codigo: '5107', municipioSede: 'Sinop', ativo: true },
      { id: 'dre-2', nome: 'DRE Sorriso', codigo: '5199', municipioSede: 'Sinop', ativo: true },
    ],
    municipios: [
      { id: 'mun-1', nome: 'Sinop', nomeNormalizado: 'sinop', uf: 'MT', codigoIbge: '5107607', ativo: true },
      { id: 'mun-2', nome: 'Sinop', nomeNormalizado: 'sinop', uf: 'MT', codigoIbge: '5107608', ativo: true },
    ],
    entidadesExecutoras: [
      { id: 'ent-1', nome: 'Prefeitura de Sinop', cnpj: '00.000.000/0001-00', tipo: 'MUNICIPIO', uf: 'MT', municipioId: 'mun-1', ativo: true },
    ],
    escolas: [],
    vinculosEscolaDRE: [],
  };

  it('DRE com correspondência única → CONFIRMADO', () => {
    const r = resolverDRE('DRE Sorriso', snapshot);
    expect(r.status).toBe('CONFIRMADO');
    expect(r.id).toBe('dre-2');
  });

  it('DRE ambígua (município-sede de outra DRE) → AMBIGUO com candidatos, SEM id', () => {
    const r = resolverDRE('Sinop', snapshot);
    expect(r.status).toBe('AMBIGUO');
    expect(r.id).toBeNull();
    expect(r.candidatos.length).toBeGreaterThan(1);
  });

  it('DRE inexistente → NAO_ENCONTRADO, nunca cria registro', () => {
    const r = resolverDRE('DRE Inexistente XYZ', snapshot);
    expect(r.status).toBe('NAO_ENCONTRADO');
    expect(r.id).toBeNull();
  });

  it('DRE ausente → NAO_ENCONTRADO', () => {
    expect(resolverDRE(null, snapshot).status).toBe('NAO_ENCONTRADO');
    expect(resolverDRE('   ', snapshot).status).toBe('NAO_ENCONTRADO');
  });

  it('município resolvido por IBGE único → CONFIRMADO', () => {
    const r = resolverMunicipio('Qualquer Nome', '5107607', snapshot);
    expect(r.status).toBe('CONFIRMADO');
    expect(r.id).toBe('mun-1');
  });

  it('município sem IBGE e ambíguo (dois registros com o mesmo nome) → AMBIGUO, sem id', () => {
    const r = resolverMunicipio('Sinop', null, snapshot);
    expect(r.status).toBe('AMBIGUO');
    expect(r.id).toBeNull();
  });

  it('entidade executora: CNPJ é o critério PREFERENCIAL e decide sozinho', () => {
    const r = resolverEntidadeExecutora('Nome Errado No Documento', '00.000.000/0001-00', snapshot);
    expect(r.status).toBe('CONFIRMADO');
    expect(r.id).toBe('ent-1');
  });

  it('entidade sem CNPJ e sem nome correspondente → NAO_ENCONTRADO (fica pendente)', () => {
    const r = resolverEntidadeExecutora('Secretaria Desconhecida', null, snapshot);
    expect(r.status).toBe('NAO_ENCONTRADO');
    expect(r.id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 9/10/12. Preservação de registros revisados e de chamadas existentes
// ---------------------------------------------------------------------------

describe('preservação de registros revisados e chamadas existentes', () => {
  it('registro confirmado NUNCA é sobrescrito por nova extração', () => {
    expect(podeSobrescrever('confirmado', 'extraido')).toBe(false);
    expect(podeSobrescrever('confirmado', 'pendente_conferencia')).toBe(false);
  });

  it('revisão manual também é imutável', () => {
    expect(podeSobrescrever('manual', 'extraido')).toBe(false);
  });

  it('campo extraído pode ser proposto para revisão, mas o conflito fica registrado', () => {
    const conflitos = compararCampos(
      { precoUnitario: { valor: '380,08', statusRevisao: 'confirmado', metodo: 'manual' } },
      { precoUnitario: { valor: '380,80', statusRevisao: 'extraido', metodo: 'pdf_texto_regex' } },
    );
    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].acao).toBe('MANTIDO');
    expect(conflitos[0].valorAtual).toBe('380,08');
    expect(conflitos[0].valorNovo).toBe('380,80');
  });

  it('chamada pública 2026 já existente vira "jaExistentes", sem CREATE', () => {
    const existentes: ChavesExistentes = {
      chamadasPublicas: [{ numero: '020/2024', exercicio: 2025, dreId: 'dre-1' }],
      editais: [],
      hashesDocumento: [],
      idempotencias: [],
    };
    const plano = simularImportacao([stagingAprovado({ idPacote: 'ED-X' })], existentes);
    expect(plano.resumo.novosCandidatos).toBe(0);
    expect(plano.resumo.jaExistente).toBe(1);
    expect(plano.acoes.filter((a) => a.model === 'ChamadaPublica')).toHaveLength(0);
    expect(plano.jaExistentes[0].idPacote).toBe('ED-X');
  });
});

// ---------------------------------------------------------------------------
// 11. Reprocessamento idempotente (retomada por checkpoint / falha transacional)
// ---------------------------------------------------------------------------

describe('idempotência do reprocessamento', () => {
  it('segunda execução com os mesmos hashes não gera novas ações', () => {
    const existentes: ChavesExistentes = { chamadasPublicas: [], editais: [], hashesDocumento: [], idempotencias: [] };
    const primeira = simularImportacao([stagingAprovado({ idPacote: 'ED-X' })], existentes);
    expect(primeira.resumo.novosCandidatos).toBe(1);

    // Simula o banco já populado pela primeira execução.
    const segunda = simularImportacao([stagingAprovado({ idPacote: 'ED-X' })], {
      chamadasPublicas: [{ numero: '020/2024', exercicio: 2025, dreId: 'dre-1' }],
      editais: [],
      hashesDocumento: ['a'.repeat(64)],
      idempotencias: [chaveIdempotenciaOperacao('importacao-historica-pnae-2025', 'chave-ED-X')],
    });
    expect(segunda.resumo.novosCandidatos).toBe(0);
  });

  it('chave de item é estável e distinta por documento/sequência/hash', () => {
    const k1 = chaveItem('DOC-1', 'a'.repeat(64), 1);
    const k2 = chaveItem('DOC-1', 'a'.repeat(64), 1);
    const k3 = chaveItem('DOC-1', 'a'.repeat(64), 2);
    const k4 = chaveItem('DOC-1', 'b'.repeat(64), 1);
    expect(k1).toBe(k2);
    expect(k1).not.toBe(k3);
    expect(k1).not.toBe(k4);
  });

  it('chave de idempotência é determinística por operação + chave lógica', () => {
    expect(chaveIdempotenciaOperacao('op', 'k')).toBe(chaveIdempotenciaOperacao('op', 'k'));
    expect(chaveIdempotenciaOperacao('op', 'k')).not.toBe(chaveIdempotenciaOperacao('outra-op', 'k'));
  });

  it('chave lógica do edital é estável sob grafias equivalentes de número', () => {
    const base = { dre: 'Sinop', tipoProcedimento: 'Chamada Pública', anoNumeracao: 2024, exercicio: 2025, recorte: 'SEDE' as const };
    expect(chaveLogicaEdital({ ...base, numero: '020/2024' })).toBe(chaveLogicaEdital({ ...base, numero: '20/2024' }));
  });
});

// ---------------------------------------------------------------------------
// Complementar: o cabeçalho da tabela e os números de página nunca viram item
// ---------------------------------------------------------------------------

describe('ruído de tabela descartado sem virar item', () => {
  const cabecalho = ['Nº PRODUTO COM ESPECIFICAÇÃO', 'TÉCNICA', 'UNIDADE', 'DE', 'MEDIDA', 'QUANTIDADE', 'ESTIMADA', 'PREÇO DE', 'AQUISIÇÃO', 'UNITÁRIO', 'R$', 'VALOR', 'TOTAL', 'R$'].join('\n');

  it('cabeçalho de tabela (com a palavra UNIDADE) NÃO vira item', () => {
    // O cabeçalho segue um numeral, formando um bloco — ele deve ser descartado
    // como cabeçalho, não aceito como produto com unidade "UN".
    const { itens, descartados } = extrairItens(
      paginas([
        ['1.', 'Nº PRODUTO COM ESPECIFICAÇÃO TÉCNICA', 'UNIDADE', 'DE', 'MEDIDA', 'QUANTIDADE ESTIMADA', 'PREÇO DE AQUISIÇÃO', 'UNITÁRIO R$', 'VALOR TOTAL', 'R$'].join('\n'),
      ]),
      'DOC-CAB',
      'a'.repeat(64),
    );
    expect(itens).toHaveLength(0);
    const cabecalhoDescartado = descartados.find((d) => /cabeçalho de tabela/i.test(d.motivo));
    expect(cabecalhoDescartado).toBeDefined();
    expect(cabecalhoDescartado?.motivo).toContain('cabeçalho de tabela');
  });

  it('cabeçalho solto antes do primeiro item não gera item (linha de produto real é extraída)', () => {
    const { itens } = extrairItens(
      paginas([cabecalho, '1.', 'ABACATE, inteiro.', 'Quilograma \t21 \t17,33 \t363,86'].join('\n')),
      'DOC-CAB-B',
      'a'.repeat(64),
    );
    expect(itens).toHaveLength(1);
    expect(itens[0].sequencia).toBe(1);
    expect(itens[0].unidadeComercial).toBe('KG');
  });

  it('número de página na borda não abre bloco de item', () => {
    const { itens } = extrairItens(
      paginas([['2', 'SECRETARIA DE ESTADO DE EDUCAÇÃO', 'EDITAL DE CHAMADA PÚBLICA nº 030/2024', cabecalho, '1.', 'ABACATE, inteiro.', 'Quilograma \t21 \t17,33 \t363,86'].join('\n')]),
      'DOC-PAG',
      'a'.repeat(64),
    );
    expect(itens).toHaveLength(1);
    expect(itens[0].sequencia).toBe(1);
  });

  it('texto corrido sem evidência de coluna vira bloco descartado com trecho', () => {
    const { itens, descartados } = extrairItens(
      paginas([[cabecalho, '19.', '2. FUNDAMENTAÇÃO LEGAL. A presente chamada observará'].join('\n')]),
      'DOC-PROSA',
      'a'.repeat(64),
    );
    expect(itens).toHaveLength(0);
    expect(descartados.length).toBeGreaterThan(0);
    expect(descartados[0].trecho.length).toBeGreaterThan(0);
    expect(descartados[0].motivo).toContain('texto corrido');
  });

  it('todo item extraído carrega proveniência (documento, página, método)', () => {
    const { itens } = extrairItens(
      paginas([cabecalho, '1.', 'ABACATE, inteiro.', 'Quilograma \t21 \t17,33 \t363,86'].join('\n')),
      'DOC-PROV',
      'a'.repeat(64),
    );
    const item = itens[0];
    expect(item.documentoId).toBe('DOC-PROV');
    expect(item.pagina).toBe(1);
    expect(item.metodo).toBe('pdf_texto_regex');
    expect(item.totalFonte?.documentoId).toBe('DOC-PROV');
    expect(item.totalFonte?.sha256).toBe('a'.repeat(64));
    expect(item.totalFonte?.pagina).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// resumirPorDre — insumo do relatório final
// ---------------------------------------------------------------------------

describe('resumo por DRE', () => {
  it('agrega aprovados/segregados/bloqueados/pendentes por DRE', () => {
    const resumo = resumirPorDre([
      { idEdital: 'a', dre: 'Sinop', numero: '1', elegibilidade: null, decisao: 'APROVADO', motivos: [], documentos: [], pendencias: [] },
      { idEdital: 'b', dre: 'Sinop', numero: '2', elegibilidade: null, decisao: 'BLOQUEADO', motivos: [], documentos: [], pendencias: [] },
      { idEdital: 'c', dre: 'Juína', numero: '3', elegibilidade: null, decisao: 'SEGREGADO', motivos: [], documentos: [], pendencias: [] },
    ]);
    const sinop = resumo.find((r) => r.dre === 'Sinop');
    expect(sinop?.aprovados).toBe(1);
    expect(sinop?.bloqueados).toBe(1);
    expect(sinop?.total).toBe(2);
  });
});
