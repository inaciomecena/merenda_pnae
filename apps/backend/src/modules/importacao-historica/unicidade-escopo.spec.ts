import { chaveChamada, simularImportacao, type ChavesExistentes } from './aplicacao/simulador-importacao';
import type { StagingEdital } from './dominio/tipos';

/**
 * Cenários A–E e H (escopo) da homologação de unicidade, na camada de plano:
 * uma chamada da DRE Sinop NÃO é duplicada de uma da DRE Alta Floresta apenas
 * por mesmo número/exercicio; a segunda importação da mesma chamada não gera
 * novo CREATE; o escopo estadual (dreId nulo) tem chave própria (SEM_DRE) e
 * nunca se infere por DRE nomeada não resolvida.
 *
 * Biblioteca pura: nenhum teste toca em banco.
 */

function existentesBase(over: Partial<ChavesExistentes> = {}): ChavesExistentes {
  return { chamadasPublicas: [], editais: [], hashesDocumento: [], idempotencias: [], ...over };
}

function stagingCom(over: {
  idPacote: string;
  numero?: string;
  exercicio?: number;
  dre?: { nomePacote: string; dreId: string | null; codigo?: string | null; status: string; detalhe: string };
}): StagingEdital {
  const numero = over.numero ?? '020/2024';
  const exercicio = over.exercicio ?? 2025;
  return {
    schema: 'importacao-historica-pnae/1.0',
    geradoEm: '2026-10-12T00:00:00.000Z',
    idPacote: over.idPacote,
    dre: over.dre?.nomePacote || 'Sinop',
    chaveLogica: `chave-${over.idPacote}`,
    decisao: 'APROVADO',
    motivosBloqueio: [],
    identificacao: {
      numeroBruto: numero,
      numeroNormalizado: numero,
      anoNumeracao: 2024,
      exercicio,
      exercicioEvidencia: [],
      processoAdministrativo: null,
      dreNome: over.dre?.nomePacote || 'Sinop',
      camaraNegocios: null,
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
        idDocumento: `DOC-${over.idPacote}`,
        papel: 'EDITAL_PRINCIPAL',
        sha256: 'a'.repeat(64),
        caminho: 'x.pdf',
        paginas: 10,
        urls: [],
        chaveVersao: `cv-${over.idPacote}`,
      },
    ],
    vinculosInstitucionais: {
      dre: {
        nomePacote: over.dre?.nomePacote ?? 'Sinop',
        // `??` NÃO aqui: null explícito = escopo estadual (não pode virar 'dre-1')
        dreId: over.dre ? over.dre.dreId : 'dre-1',
        codigo: over.dre?.codigo ?? '5107',
        status: (over.dre?.status ?? 'CONFIRMADO') as any,
        detalhe: over.dre?.detalhe ?? 'ok',
      },
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
      itensDoManifesto: 0,
      itensExtraidosPdf: 0,
      blocosNaoItem: 0,
    },
  } as StagingEdital;
}

function acoesChamada(plano: ReturnType<typeof simularImportacao>) {
  return plano.acoes.filter((a) => a.model === 'ChamadaPublica');
}

describe('chaveChamada — identidade lógica por escopo', () => {
  it('mesmo numero/exercicio na MESMA DRE produz a mesma chave (idempotência)', () => {
    expect(chaveChamada('001/2025', 2025, 'dre-a')).toBe(chaveChamada('001/2025', 2025, 'dre-a'));
  });

  it('mesmo numero/exercicio em DREs DIFERENTES produz chaves DIFERENTES (cenário A)', () => {
    expect(chaveChamada('001/2025', 2025, 'dre-alta-floresta')).not.toBe(chaveChamada('001/2025', 2025, 'dre-sinop'));
  });

  it('exercícios diferentes na mesma DRE produz chaves diferentes (cenário C)', () => {
    expect(chaveChamada('001/2025', 2025, 'dre-a')).not.toBe(chaveChamada('001/2025', 2026, 'dre-a'));
  });

  it('dreId nulo usa o marcador SEM_DRE (escopo estadual próprio)', () => {
    expect(chaveChamada('001/2025', 2025, null)).toBe('SEM_DRE|001/2025|2025');
    expect(chaveChamada('001/2025', 2025, null)).not.toBe(chaveChamada('001/2025', 2025, 'dre-a'));
  });

  it('estadual x estadual: mesmo numero/exercicio = mesma chave (duplicidade detectada)', () => {
    expect(chaveChamada('001/2025', 2025, null)).toBe(chaveChamada('001/2025', 2025, undefined));
  });

  it('normalização: trim e caixa não alteram a chave (sem correção de numeração)', () => {
    expect(chaveChamada('  001/2025 ', 2025, ' dre-a ')).toBe(chaveChamada('001/2025', 2025, 'dre-a'));
    expect(chaveChamada('e2e-1', 2026, null)).toBe(chaveChamada('E2E-1', 2026, null));
    expect(chaveChamada('025/224', 2025, 'dre-a')).not.toBe(chaveChamada('025/2024', 2025, 'dre-a'));
  });
});

describe('simulador — cenários de escopo no plano de importação', () => {
  it('cenário A: duas DREs com mesmo numero/exercicio geram DOIS CREATE (nenhuma é duplicada da outra)', () => {
    const c1 = stagingCom({ idPacote: 'AF-1', dre: { nomePacote: 'Alta Floresta', dreId: 'dre-af', status: 'CONFIRMADO', detalhe: 'ok' } });
    const c2 = stagingCom({ idPacote: 'SN-1', dre: { nomePacote: 'Sinop', dreId: 'dre-sn', status: 'CONFIRMADO', detalhe: 'ok' } });

    const plano = simularImportacao([c1, c2], existentesBase());
    expect(acoesChamada(plano)).toHaveLength(2);
    expect(plano.resumo.jaExistente).toBe(0);
    expect(plano.resumo.novosCandidatos).toBe(2);
  });

  it('cenário B: mesmo numero/exercicio na MESMA DRE já existente vira jaExistentes (sem CREATE)', () => {
    const c1 = stagingCom({ idPacote: 'AF-1', dre: { nomePacote: 'Alta Floresta', dreId: 'dre-af', status: 'CONFIRMADO', detalhe: 'ok' } });
    const plano = simularImportacao([c1], existentesBase({ chamadasPublicas: [{ numero: '020/2024', exercicio: 2025, dreId: 'dre-af' }] }));

    expect(acoesChamada(plano)).toHaveLength(0);
    expect(plano.jaExistentes.some((j) => j.motivo.includes('ChamadaPublica'))).toBe(true);
  });

  it('cenário C: mesmo numero/DRE com exercicio DIFERENTE do existente continua CREATE', () => {
    const c1 = stagingCom({ idPacote: 'AF-1', exercicio: 2025, dre: { nomePacote: 'Alta Floresta', dreId: 'dre-af', status: 'CONFIRMADO', detalhe: 'ok' } });
    const plano = simularImportacao([c1], existentesBase({ chamadasPublicas: [{ numero: '020/2024', exercicio: 2026, dreId: 'dre-af' }] }));
    expect(acoesChamada(plano)).toHaveLength(1);
  });

  it('cenário D: candidato ESTADUAL duplicado (mesmo numero/exercicio sem DRE) vira jaExistentes', () => {
    const estadual = stagingCom({
      idPacote: 'UF-1',
      dre: { nomePacote: '', dreId: null, status: 'NAO_ENCONTRADO', detalhe: 'sem DRE no documento' },
    });
    const plano = simularImportacao([estadual], existentesBase({ chamadasPublicas: [{ numero: '020/2024', exercicio: 2025, dreId: null }] }));

    expect(acoesChamada(plano)).toHaveLength(0);
    expect(plano.jaExistentes.some((j) => j.chave.startsWith('SEM_DRE|'))).toBe(true);
  });

  it('cenário E: existindo estadual com mesmo numero/exercicio, o candidato de DRE AINDA é CREATE (escopos distintos)', () => {
    const c1 = stagingCom({ idPacote: 'AF-1', dre: { nomePacote: 'Alta Floresta', dreId: 'dre-af', status: 'CONFIRMADO', detalhe: 'ok' } });
    const plano = simularImportacao([c1], existentesBase({ chamadasPublicas: [{ numero: '020/2024', exercicio: 2025, dreId: null }] }));
    expect(acoesChamada(plano)).toHaveLength(1);
  });

  it('escopo estadual planejado com dreId null e resumo explícito (sem inferência de DRE)', () => {
    const estadual = stagingCom({
      idPacote: 'UF-2',
      dre: { nomePacote: '', dreId: null, status: 'NAO_ENCONTRADO', detalhe: 'sem DRE no documento' },
    });
    const plano = simularImportacao([estadual], existentesBase());
    const acao = acoesChamada(plano)[0];
    expect(acao).toBeDefined();
    expect(acao.payload.dreId).toBeNull();
    expect(acao.resumo).toContain('ESTADUAL');
  });

  it('DRE nomeada porém não resolvida NUNCA vira estadual: permanece bloqueada', () => {
    const naoResolvida = stagingCom({
      idPacote: 'XX-1',
      dre: { nomePacote: 'DRE Inexistente', dreId: null, status: 'NAO_ENCONTRADO', detalhe: 'DRE não resolvida: nenhum match' },
    });
    const plano = simularImportacao([naoResolvida], existentesBase());
    expect(acoesChamada(plano)).toHaveLength(0);
    expect(plano.bloqueios.some((b) => b.motivos.some((m) => m.includes('DRE não resolvida')))).toBe(true);
  });

  it('cenário H: segunda execução do plano com as chaves produzidas não gera novos CREATE (idempotência por escopo)', () => {
    const c1 = stagingCom({ idPacote: 'AF-1', dre: { nomePacote: 'Alta Floresta', dreId: 'dre-af', status: 'CONFIRMADO', detalhe: 'ok' } });
    const c2 = stagingCom({ idPacote: 'SN-1', dre: { nomePacote: 'Sinop', dreId: 'dre-sn', status: 'CONFIRMADO', detalhe: 'ok' } });
    const c3 = stagingCom({
      idPacote: 'UF-1',
      dre: { nomePacote: '', dreId: null, status: 'NAO_ENCONTRADO', detalhe: 'sem DRE no documento' },
    });
    const staging = [c1, c2, c3];

    const primeira = simularImportacao(staging, existentesBase());
    expect(acoesChamada(primeira)).toHaveLength(3);

    // realimenta o plano com o que ele próprio criaria (estado pós-importação)
    const geradas = acoesChamada(primeira).map((a) => ({
      numero: String(a.payload.numero),
      exercicio: Number(a.payload.exercicio),
      dreId: (a.payload.dreId ?? null) as string | null,
    }));
    const segunda = simularImportacao(staging, existentesBase({ chamadasPublicas: geradas }));

    expect(acoesChamada(segunda)).toHaveLength(0);
    expect(segunda.jaExistentes.filter((j) => j.motivo.includes('ChamadaPublica'))).toHaveLength(3);
    expect(segunda.resumo.novosCandidatos).toBe(0);
  });
});
