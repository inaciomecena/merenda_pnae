/**
 * Extração rastreável de editais históricos (Etapa 4).
 *
 * Reutiliza:
 *  - `pdf-parse` (mesma versão e API usada pelo backend);
 *  - `analisarTextoEdital` do domínio de engenharia reversa
 *    (`composicao-editais/application/domain/engenharia-reversa`) para seções,
 *    anexos e assinaturas.
 *
 * Diferencial deste extrator em relação ao `SearchablePdfEditalParserService`:
 *  - trabalho PÁGINA A PÁGINA (página física como proveniência de cada item);
 *  - valores monetários lidos em centavos, sem ponto flutuante;
 *  - valor bruto sempre preservado;
 *  - divergências entre total da fonte e quantidade × preço registradas, nunca
 *    corrigidas silenciosamente.
 */

import { PDFParse } from 'pdf-parse';
import { analisarTextoEdital, AnexoDetectado, PaginaTexto } from '../../composicao-editais/application/domain/engenharia-reversa';
import { AnexoExtraido, CampoRastreavel, IdentificacaoExtraida, ItemExtraido, MetodoExtracao } from '../dominio/tipos';
import { centavosParaDecimal, compararTotal, lerPossivel } from './apoio-extracao';

export { PaginaTexto };

/** Lê o PDF devolvendo texto por página física (1-based). */
export async function lerPaginasPdf(buffer: Buffer): Promise<PaginaTexto[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const resultado = await parser.getText();
    return (resultado.pages || []).map((pagina: { text?: string }, indice: number) => ({
      numero: indice + 1,
      texto: pagina.text || '',
    }));
  } finally {
    await parser.destroy();
  }
}

function limparLinha(linha: string): string {
  return linha.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Prepara a linha preservando o espaçamento INTERNO (colunas alinhadas por
 * 2+ espaços ou TABs), removendo apenas bordas. É a versão usada para detecção
 * de blocos/colunas; `limparLinha` continua para montagem de descrição.
 */
function prepararLinhaColuna(linha: string): string {
  // Tab é separador de coluna em alguns PDFs (ex.: DOC-0069) — vira 2+ espaços
  // para que a divisão por \s{2,} funcione.
  return linha.replace(/\t+/g, '  ').replace(/\s+$/, '').trimStart();
}

const UNIDADES =
  '(Quilograma|Quilogramas|Kg|kg|Kilo|Kilos|Quilo|Quilos|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade|Unidades|Un|un|Pacote|Pacotes|PCT|Caixa|Caixas|CX|Maço|Maços|Maco|Macos|MACO|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias|Fardo|Fardos|Saco|Sacos|Duzia|Peso)';

const LINHA_RESUMO = new RegExp(
  `^(.*?)(?:(?<unidade>${UNIDADES})\\s+)?(?<quantidade>\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?|\\d+(?:,\\d+)?)\\s+R\\$\\s*(?<preco>\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+,\\d{2})\\s+R\\$\\s*(?<total>\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+,\\d{2})\\s*$`,
  'i',
);

const ehNumeroColuna = (s: string): boolean => /^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/.test(s);

/**
 * Terceiro layout do pacote (ex.: DOC-0069, Primavera do Leste): os valores
 * vêm em uma linha SEPARADA, separados por TAB, e a unidade nas linhas
 * anteriores ("Quilogram" + "a"):
 *   "376 \t14,00 \t5.264,00"
 * A leitura é feita em texto e convertida em centavos — nunca float.
 */
function parseLinhaValoresSeparados(colunas: string[], indice: number): {
  quantidade: string;
  preco: string;
  total: string;
  unidade: string | null;
  prefixo: string;
} | null {
  const toks = colunas[indice].trim().split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);
  if (toks.length !== 3 || !toks.every(ehNumeroColuna)) return null;

  // Unidade: varre as linhas anteriores do mesmo bloco (a unidade vem antes
  // da linha de valores neste layout). Aceita unidade quebrada em duas linhas
  // ("Quilogram" + "a"), pulando linhas vazias.
  let unidade: string | null = null;
  const anteriores = colunas.slice(Math.max(0, indice - 6), indice);
  for (let j = 0; j < anteriores.length; j++) {
    const t = anteriores[j].trim();
    if (!t) continue;
    const ult = t.split(/\s{2,}/).pop()?.trim() ?? '';
    if (ehUnidadeConhecida(ult)) {
      unidade = ult;
      break;
    }
    if (ehPrefixoUnidade(ult)) {
      // Unidade quebrada: completa com o token da próxima linha não vazia
      // ("Quilogram" + "a" -> "QUILOGRAMA").
      for (let k = j + 1; k < Math.min(j + 3, anteriores.length); k++) {
        const prox = anteriores[k].trim();
        if (!prox) continue;
        const completada = tentarCompletarUnidade(ult, prox);
        if (completada) unidade = completada;
        break; // só considera a primeira linha não vazia seguinte
      }
      if (unidade) break;
    }
  }

  // Produto: primeira linha não vazia do bloco antes das linhas de unidade.
  let prefixo = '';
  for (let j = 0; j < indice; j++) {
    const t = colunas[j].trim();
    if (t && !ehUnidadeConhecida(t) && !ehPrefixoUnidade(t)) {
      prefixo = t;
      break;
    }
  }

  return { quantidade: toks[0], preco: toks[1], total: toks[2], unidade, prefixo };
}

/**
 * Segundo layout encontrado no pacote: tabelas em COLUNAS alinhadas por
 * espaços duplos, SEM o símbolo "R$" (ex.: DOC-0016, Juína/Castanheira):
 *   "FARINHA DE MANDIOCA, do      Unidade de   191   13,33   2.545,39"
 * Os valores são lidos como texto e convertidos em centavos — nunca float.
 */
function parseColunasResumo(linha: string): {
  quantidade: string;
  preco: string;
  total: string;
  unidade: string | null;
  prefixo: string;
} | null {
  const toks = linha.trim().split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);
  if (toks.length < 4) return null;
  const fim = toks.slice(-3);
  if (!fim.every(ehNumeroColuna)) return null;
  const unidade = toks[toks.length - 4];
  const prefixo = toks.slice(0, toks.length - 4).join(' ');
  return { quantidade: fim[0], preco: fim[1], total: fim[2], unidade, prefixo };
}

const UNIDADES_SET = new Set(UNIDADES.split('|').map((u) => u.toUpperCase()));
const ehUnidadeConhecida = (tok: string): boolean => UNIDADES_SET.has(tok.toUpperCase());
const ehSufixoUnidade = (tok: string): boolean => /^\d+(?:[.,]\d+)?\s*(?:[KkGg][Gg]?|[Ll]|[Mm][Ll]|[Uu]n)$/i.test(tok);

/** "Quilogram" é prefixo de "Quilograma" (unidade quebrada em duas linhas). */
function ehPrefixoUnidade(tok: string): boolean {
  const t = tok.toLowerCase().trim();
  if (t.length < 4) return false;
  for (const u of UNIDADES_SET) {
    const ul = u.toLowerCase();
    if (ul.startsWith(t) && ul.length > t.length) return true;
  }
  return false;
}

/**
 * Decide se o token anterior às colunas numéricas pode ser a unidade.
 * Rejeita texto de descrição (contém vírgula/ponto ou é longo demais) para
 * NUNCA registrar o produto como se fosse unidade.
 */
function pareceUnidade(tok: string | null): boolean {
  if (!tok) return false;
  const t = tok.toLowerCase().trim();
  if (!t || t.length > 20) return false;
  if (t.includes(',') || t.includes('.')) return false;
  if (ehUnidadeConhecida(tok)) return true;
  if (/(?:de|do|da|em)$/.test(t)) return true;
  if (ehPrefixoUnidade(tok)) return true;
  if (/^[a-zç]{2,12}$/.test(t)) return true;
  return false;
}

/** Completa "Quilogram" com o sufixo da linha seguinte quando é inequívoco. */
function tentarCompletarUnidade(atual: string, proximo: string): string | null {
  const a = atual.toLowerCase().trim();
  const p = proximo.toLowerCase().trim();
  if (!p || p.length > 4) return null;
  for (const u of UNIDADES_SET) {
    const ul = u.toLowerCase();
    if (ul.startsWith(a) && ul.endsWith(p) && ul.length === a.length + p.length) return u;
  }
  return null;
}

/**
 * Unidade que aparece deslocada para outra linha do mesmo bloco (ex.:
 * DOC-0069 item 3, onde "Quilograma" vem após várias linhas de descrição).
 * Limita a varredura às primeiras linhas do bloco para evitar falsos positivos.
 */
function buscarUnidadeDeslocada(colunas: string[], ignorar: number): string | null {
  const limite = Math.min(colunas.length, 10);
  for (let i = 0; i < limite; i++) {
    if (i === ignorar) continue;
    const toks = colunas[i].trim().split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
    if (!toks.length) continue;
    const ult = toks[toks.length - 1];
    if (ehUnidadeConhecida(ult)) return normalizarUnidade(ult);
    if (ehPrefixoUnidade(ult)) {
      const prox = colunas[i + 1]?.trim().split(/\s{2,}/).pop()?.trim() ?? '';
      const completada = tentarCompletarUnidade(ult, prox);
      if (completada) return normalizarUnidade(completada);
    }
  }
  return null;
}

const INICIO_ITEM_INLINE = /^(\d{1,3})\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])/;
const INICIO_ITEM_SOZINHO = /^(\d{1,3})\.?\s*$/;

interface BlocoItem {
  sequencia: number;
  paginaInicio: number;
  linhas: string[];
}

function blocosDePagina(linhas: string[], pagina: number, atual: BlocoItem | null): { blocos: BlocoItem[]; atual: BlocoItem | null } {
  const blocos: BlocoItem[] = [];
  let corrente = atual;

  for (const linha of linhas) {
    const inline = linha.match(INICIO_ITEM_INLINE);
    const sozinho = linha.match(INICIO_ITEM_SOZINHO);

    if (inline && !/R\$\s*\d/.test(inline[2])) {
      if (corrente) blocos.push(corrente);
      corrente = { sequencia: Number(inline[1]), paginaInicio: pagina, linhas: [linha] };
      continue;
    }
    if (sozinho) {
      if (corrente) blocos.push(corrente);
      corrente = { sequencia: Number(sozinho[1]), paginaInicio: pagina, linhas: [linha] };
      continue;
    }
    if (corrente) corrente.linhas.push(linha);
  }

  return { blocos, atual: corrente };
}

function finalizarBloco(bloco: BlocoItem, documentoId: string, sha256: string | null): ItemExtraido {
  // `texto` colapsa espaços (descrição); `colunas` preserva o espaçamento
  // interno para o parser de colunas alinhadas.
  const texto = bloco.linhas.map(limparLinha).filter(Boolean);
  const colunas = bloco.linhas.map(prepararLinhaColuna).filter(Boolean);
  const indiceResumo = texto.findIndex((linha) => LINHA_RESUMO.test(linha) && /R\$/.test(linha));

  let quantidadeBruta: string | null = null;
  let precoBruto: string | null = null;
  let totalBruto: string | null = null;
  let unidade: string | null = null;
  let prefixoResumo = '';
  let layout: 'resumo_r$' | 'colunas' | 'valores_separados' | 'nenhum' = 'nenhum';

  if (indiceResumo >= 0) {
    const m = texto[indiceResumo].match(LINHA_RESUMO);
    const g = m?.groups || {};
    quantidadeBruta = g.quantidade ?? null;
    precoBruto = g.preco ?? null;
    totalBruto = g.total ?? null;
    unidade = g.unidade ? normalizarUnidade(g.unidade) : null;
    prefixoResumo = (m?.[1] || '').trim();
    layout = 'resumo_r$';
  } else {
    // Fallback: layout de colunas alinhadas por espaços duplos, sem "R$"
    // (ex. real: DOC-0016, Juína/Castanheira).
    for (let i = 0; i < colunas.length; i++) {
      const col = parseColunasResumo(colunas[i]);
      if (!col) continue;
      quantidadeBruta = col.quantidade;
      precoBruto = col.preco;
      totalBruto = col.total;
      prefixoResumo = col.prefixo;
      // Unidade pode vir quebrada em duas linhas ("Unidade de" + "1Kg" ou
      // "Quilogram" + "a"); reconstitui apenas quando o sufixo é inequívoco.
      // Se o token parece texto de descrição (não unidade), descarta-o para
      // não registrar produto como unidade — vira pendência explícita.
      let unidadeBruta = col.unidade;
      const incompleta = unidadeBruta && /(?:de|do|da|em)$/i.test(unidadeBruta);
      if (incompleta) {
        for (let j = i + 1; j < Math.min(i + 4, colunas.length); j++) {
          const sufixo = colunas[j].trim().split(/\s{2,}/).pop()?.trim() ?? '';
          if (sufixo && ehSufixoUnidade(sufixo)) {
            unidadeBruta = `${unidadeBruta} ${sufixo}`;
            break;
          }
        }
      }
      if (unidadeBruta && !ehUnidadeConhecida(unidadeBruta) && ehPrefixoUnidade(unidadeBruta)) {
        // Unidade truncada por quebra de linha ("Quilogram" -> "Quilograma").
        for (let j = i + 1; j < Math.min(i + 3, colunas.length); j++) {
          const sufixo = colunas[j].trim().split(/\s{2,}/).pop()?.trim() ?? '';
          const completada = sufixo ? tentarCompletarUnidade(unidadeBruta, sufixo) : null;
          if (completada) {
            unidadeBruta = completada;
            break;
          }
        }
      }
      if (unidadeBruta && !ehUnidadeConhecida(unidadeBruta) && !ehPrefixoUnidade(unidadeBruta) && !/^(?:de|do|da|em)\s+\S+$/i.test(unidadeBruta)) {
        // Provável texto de descrição na coluna de unidade: não usar.
        unidadeBruta = null;
      }
      unidade = unidadeBruta ? normalizarUnidade(unidadeBruta) : null;
      if (!unidade) {
        // Unidade deslocada para outra linha do mesmo bloco (ex.: DOC-0069).
        unidade = buscarUnidadeDeslocada(colunas, i);
      }
      layout = 'colunas';
      break;
    }

    if (layout === 'nenhum') {
      // Terceiro layout: valores em linha SEPARADA separados por TAB
      // (ex. real: DOC-0069, Primavera do Leste/Gaúcha do Norte).
      for (let i = 0; i < colunas.length; i++) {
        const col = parseLinhaValoresSeparados(colunas, i);
        if (!col) continue;
        quantidadeBruta = col.quantidade;
        precoBruto = col.preco;
        totalBruto = col.total;
        prefixoResumo = col.prefixo;
        unidade = col.unidade ? normalizarUnidade(col.unidade) : null;
        layout = 'valores_separados';
        break;
      }
    }
  }

  const semResumo = texto.filter((_, i) => i !== indiceResumo);
  const cabecalho = semResumo.slice(0, 6).join(' ').trim();
  const descricaoCompleta = [cabecalho, prefixoResumo].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

  const produto = extrairProduto(descricaoCompleta);
  const embalagem = extrairEmbalagem(descricaoCompleta);

  if (!unidade) {
    const unidadeLinha = texto.find((linha) => new RegExp(`^${UNIDADES}\\s+\\d`, 'i').test(linha));
    if (unidadeLinha) unidade = normalizarUnidade(unidadeLinha.split(/\s+/)[0]);
  }

  const leituraQuantidade = lerPossivel(quantidadeBruta);
  const leituraPreco = lerPossivel(precoBruto);
  const leituraTotal = lerPossivel(totalBruto);
  const divergencia = compararTotal(leituraQuantidade.centavos, leituraPreco.centavos, leituraTotal);

  const pendencias: string[] = [];
  if (layout === 'nenhum') pendencias.push('linha de valores não reconhecida nos dois layouts suportados (resumo R$ / colunas alinhadas); item mantido sem valores, sem preenchimento por zero');
  if (leituraQuantidade.ambiguo && quantidadeBruta) pendencias.push(`quantidade ambígua: "${quantidadeBruta}"`);
  if (leituraPreco.ambiguo && precoBruto) pendencias.push(`preço unitário ambíguo: "${precoBruto}"`);
  if (leituraTotal.ambiguo && totalBruto) pendencias.push(`total ambíguo: "${totalBruto}"`);
  if (!unidade) pendencias.push('unidade comercial não identificada');
  if (!produto) pendencias.push('produto não identificado');
  if (divergencia.divergente) pendencias.push(divergencia.motivo || 'divergência entre total da fonte e cálculo');

  const metodo: MetodoExtracao = 'pdf_texto_regex';

  const campo = (leitura: typeof leituraTotal, bruto: string | null): CampoRastreavel<string> | null => {
    if (!bruto) return null;
    return {
      bruto,
      normalizado: centavosParaDecimal(leitura.centavos),
      pagina: bloco.paginaInicio,
      documentoId,
      sha256,
      metodo,
      statusRevisao: leitura.ambiguo ? 'pendente_revisao' : 'extraido',
      pendencia: leitura.motivo || undefined,
    };
  };

  return {
    sequencia: bloco.sequencia,
    produto,
    descricaoCompleta: descricaoCompleta || null,
    unidadeComercial: unidade,
    embalagem,
    quantidade: campo(leituraQuantidade, quantidadeBruta),
    precoUnitario: campo(leituraPreco, precoBruto),
    totalFonte: campo(leituraTotal, totalBruto),
    totalCalculado: divergencia.totalCalculadoCentavos === null ? null : centavosParaDecimal(divergencia.totalCalculadoCentavos),
    divergencia: divergencia.diferencaCentavos === null ? null : centavosParaDecimal(divergencia.diferencaCentavos),
    pagina: bloco.paginaInicio,
    documentoId,
    metodo,
    statusRevisao: pendencias.length > 0 ? 'pendente_conferencia' : 'extraido',
    pendencia: pendencias.length > 0 ? pendencias.join(' | ') : null,
  };
}

/** Extrai a tabela de itens de um PDF com proveniência por página. */
export function extrairItens(paginas: PaginaTexto[], documentoId: string, sha256: string | null): ItemExtraido[] {
  const itens: ItemExtraido[] = [];
  let blocoCorrente: BlocoItem | null = null;
  let dentroDaTabela = false;

  for (const pagina of paginas) {
    // Preserva o espaçamento interno (colunas alinhadas por 2+ espaços);
    // a normalização para descrição acontece dentro de finalizarBloco.
    const linhas = (pagina.texto || '')
      .split(/\r?\n/)
      .map(prepararLinhaColuna)
      .filter(Boolean);

    if (!dentroDaTabela) {
      const inicioTabela = linhas.some((linha) => /PRODUTO|ESPECIFICA|QUANTIDADE|UNIDADE/i.test(linha) && /QUANTIDADE|MEDIDA|PRODUTO/i.test(linha));
      if (inicioTabela) dentroDaTabela = true;
    }
    if (!dentroDaTabela) continue;

    // Um bloco sem linha-resumo que se esgota marca o fim da tabela.
    const { blocos, atual } = blocosDePagina(linhas, pagina.numero, blocoCorrente);
    for (const bloco of blocos) {
      const finalizado = finalizarBloco(bloco, documentoId, sha256);
      if (finalizado.totalFonte || finalizado.quantidade) itens.push(finalizado);
    }
    if (atual && atual.linhas.length > 40) {
      // Segurança: evita arrastar texto corrido como item eterno.
      itens.push(finalizarBloco(atual, documentoId, sha256));
      blocoCorrente = null;
    } else {
      blocoCorrente = atual;
    }

    if (blocoCorrente && new RegExp(`^\\d{1,3}\\s+[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ].*R\\$`).test(blocoCorrente.linhas.join(' '))) {
      itens.push(finalizarBloco(blocoCorrente, documentoId, sha256));
      blocoCorrente = null;
    }
  }

  if (blocoCorrente) {
    const finalizado = finalizarBloco(blocoCorrente, documentoId, sha256);
    if (finalizado.totalFonte || finalizado.quantidade) itens.push(finalizado);
  }

  return itens;
}

function normalizarUnidade(valor: string): string {
  const chave = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const mapa: Record<string, string> = {
    kg: 'KG', quilo: 'KG', quilos: 'KG', kilo: 'KG', kilos: 'KG', quilograma: 'KG', quilogramas: 'KG',
    l: 'L', litro: 'L', litros: 'L', ml: 'ML', mililitro: 'ML', mililitros: 'ML',
    un: 'UN', unidade: 'UN', unidades: 'UN',
    pacote: 'PCT', pacotes: 'PCT', pct: 'PCT',
    caixa: 'CX', caixas: 'CX', cx: 'CX',
    maço: 'MACO', maco: 'MACO', maços: 'MACO', macos: 'MACO',
    bandeja: 'BDJ', bandejas: 'BDJ',
    dúzia: 'DZ', duzia: 'DZ', dúzias: 'DZ', duzias: 'DZ',
    fardo: 'FARD', fardos: 'FARD', saco: 'SACO', sacos: 'SACO',
  };
  return mapa[chave] || valor.toUpperCase();
}

function extrairProduto(descricao: string): string | null {
  if (!descricao) return null;
  const antesVirgula = descricao.split(',')[0].trim();
  // Remove o prefixo de sequência tanto "2 PRODUTO" quanto "2. PRODUTO".
  const candidato = antesVirgula.replace(/^\d{1,3}\.?\s+/, '').trim();
  if (!candidato || candidato.length > 80) return null;
  if (!/[A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ]/.test(candidato)) return null;
  return candidato.toUpperCase();
}

/** Detecta "Unidade de 900g" e afins: a embalagem NÃO vira quantidade. */
function extrairEmbalagem(descricao: string): string | null {
  const m = descricao.match(/(Unidade|Pacote|Caixa|Fardo|Saco|Maço|Bandeja)\s+de\s+\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|L|un)?/i);
  return m ? m[0] : null;
}

/** Extrai identificação e conteúdo do edital, com páginas de origem. */
export function extrairIdentificacao(
  paginas: PaginaTexto[],
  contexto: { numeroManifesto: string | null; municipioManifesto: string | null; dreManifesto: string | null; exercicioManifesto: number | null },
): IdentificacaoExtraida {
  const corpo = paginas.map((p) => p.texto).join('\n');
  const cabecalho = paginas.slice(0, 5).map((p) => p.texto).join('\n');

  const achar = (regex: RegExp, alvo: string = corpo): { valor: string; pagina: number } | null => {
    for (const pagina of paginas) {
      const m = (pagina.texto || '').match(regex);
      if (m) return { valor: m[1] ? m[1].replace(/\s+/g, ' ').trim() : m[0].trim(), pagina: pagina.numero };
    }
    const mGeral = alvo.match(regex);
    return mGeral ? { valor: mGeral[1] ? mGeral[1].replace(/\s+/g, ' ').trim() : mGolar(mGeral), pagina: null as unknown as number } : null;
  };

  // Número: preferir ocorrência em contexto de edital/chamada (não o primeiro
  // número do documento — PDFs de Alta Floresta começam com Diário Oficial).
  let numero: { valor: string; pagina: number } | null = null;
  const reNumero = /(?:EDITAL\s+DE\s+CHAMADA\s+[ÚU]BLICA|AVISO\s+DE\s+CHAMADA\s+[ÚU]BLICA|Chamada\s+[Pp][úu]blica)\s*(?:N[ºO°]\.?\s*|N\.º\s*)?(\d{1,4}\s*[/-]\s*\d{2,4})/g;
  for (const pagina of paginas) {
    // exec (e não .match com /g) para preservar o grupo de captura do número.
    reNumero.lastIndex = 0;
    const m = reNumero.exec(pagina.texto || '');
    if (m && typeof m[1] === 'string') {
      numero = { valor: m[1].replace(/\s+/g, ''), pagina: pagina.numero };
      break;
    }
  }
  if (!numero && contexto.numeroManifesto) {
    for (const pagina of paginas) {
      if ((pagina.texto || '').includes(contexto.numeroManifesto)) {
        numero = { valor: contexto.numeroManifesto, pagina: pagina.numero };
        break;
      }
    }
  }

  const processo = achar(/PROCESSO\s+ADMINISTRATIVO\s*N[ºO°]?\s*([A-Z0-9][A-Z0-9\-./]*\d)\b/i);
  const camara = achar(/C[ÂA]MARA\s+DE\s+NEG[ÓO]CIOS\s+DA?\s+ALIMENTA[ÇC][ÃA]O?\s+ESCOLAR\s*(?:DO|DE)\s+MUNIC[ÍI]PIO\s+DE\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ\s]+?)(?:\/MT|\.|,|\n)/i);
  const municipio = achar(/(?:atendimento\s+dos?\s+alunos|no\s+Munic[íi]pio\s+de|munic[íi]pio\s+de)\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ][A-ZÁÀÃÂÉÊÍÓÔÕÚÇ\s]+?)(?:\/MT|-MT|, MT|, no|, para| em atendimento| no ano|, conforme|\.)/);
  const objeto = achar(/OBJETO:\s*(.+?)(?:\n\n|Processo|CRIT[ÉE]RIO|DA[ S])/i);
  const processoSessao = achar(/Classifica[çc][ãa]o\s+e\s+Julgamento:?\s*(?:dia\s+)?(\d{1,2}\s+de\s+[a-zçç]+(?:\s+de\s+\d{4})?)/i);
  const publicacao = achar(/publica[çc][ãa]o\s+do\s+edital|data\s+de\s+publica[çc][ãa]o/i);
  const valorEstimado = achar(/valor\s+estimado\s*(?:de|em|:)?\s*R\$\s*([\d.,]+)/i);
  const fundamentacao = achar(/(Lei\s+n[ºo°\.]?\s*11\.947[^,.;]*|Resolu[çc][ãa]o\s*\/?\s*FNDE[^,.;]*|IN\s+n[ºo°\.]?\s*\d{3}\/\d{4}[^,.;]*)/i);

  const evidenciasExercicio: Array<{ pagina: number; trecho: string }> = [];
  for (const pagina of paginas) {
    const m = (pagina.texto || '').match(/ano\s+letivo\s+de\s+(20\d{2})/gi);
    if (m) {
      for (const trecho of m) evidenciasExercicio.push({ pagina: pagina.numero, trecho: trecho.trim() });
    }
  }
  const exercicio = evidenciasExercicio.length > 0
    ? Number(evidenciasExercicio[0].trecho.match(/(20\d{2})/)?.[1] ?? contexto.exercicioManifesto ?? NaN)
    : contexto.exercicioManifesto ?? null;

  const observacoes: string[] = [];
  if (numero && contexto.numeroManifesto) {
    const normalizadoBruto = numero.valor.replace(/\s+/g, '');
    const manifesto = contexto.numeroManifesto.replace(/\s+/g, '');
    if (normalizadoBruto !== manifesto) {
      observacoes.push(
        `número lido no PDF ("${normalizadoBruto}", página ${numero.pagina}) difere do manifesto ("${manifesto}"); grafia original preservada`,
      );
    }
  }

  return {
    numeroBruto: numero?.valor ?? null,
    numeroNormalizado: numero?.valor ?? contexto.numeroManifesto ?? null,
    anoNumeracao: extrairAno(numero?.valor ?? contexto.numeroManifesto),
    exercicio: Number.isFinite(exercicio as number) ? (exercicio as number) : null,
    exercicioEvidencia: evidenciasExercicio.slice(0, 10),
    processoAdministrativo: processo?.valor ?? null,
    dreNome: contexto.dreManifesto ?? null,
    camaraNegocios: camara?.valor ?? null,
    municipioAtendido: municipio?.valor ?? contexto.municipioManifesto ?? null,
    recorte: 'NAO_IDENTIFICADO',
    dataPublicacao: null,
    dataSessao: processoSessao?.valor ?? null,
    objeto: objeto?.valor ?? null,
    fundamentacaoLegal: fundamentacao?.valor ?? null,
    prazos: null,
    habilitacao: null,
    criteriosSelecao: null,
    condicoesEntrega: null,
    condicoesPagamento: null,
    valorEstimado: valorEstimado?.valor ?? null,
    observacoes,
  };
}

function mGolar(m: RegExpMatchArray): string {
  return m[0].trim();
}

function extrairAno(numero: string | null): number | null {
  if (!numero) return null;
  const m = numero.match(/(\d{3,4})\s*$/);
  if (!m) return null;
  const ano = Number(m[1]);
  return Number.isFinite(ano) ? ano : null;
}

/** Classifica anexos por TÍTULO/CONTEÚDO (nunca apenas pelo numeral). */
export function extrairAnexos(paginas: PaginaTexto[], documentoId: string): AnexoExtraido[] {
  const texto = paginas.map((p) => p.texto).join('\n');
  const estrutura = analisarTextoEdital(texto, paginas);
  const assinaturas = estrutura.assinaturas.map((a) => a.trecho);

  const detectados: AnexoDetectado[] = estrutura.anexos || [];
  const vistos = new Set<string>();

  return detectados
    .filter((anexo) => {
      const chave = `${anexo.tipo}|${anexo.titulo}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .map((anexo, indice) => ({
      numeralOriginal: extrairNumeral(anexo.titulo),
      titulo: anexo.titulo,
      tipoClassificado: anexo.tipo,
      ordem: indice + 1,
      paginas: anexo.pagina ? [anexo.pagina] : [],
      camposEditaveis: detectarCamposEditaveis(texto, anexo),
      assinaturas: assinaturas.slice(0, 3),
      estruturaReutilizavel: Boolean(anexo.pagina),
      documentoId,
    }));
}

function extrairNumeral(titulo: string): string | null {
  const m = titulo.match(/ANEXO\s+([IVXLCDM]+)/i);
  return m ? m[1].toUpperCase() : null;
}

function detectarCamposEditaveis(texto: string, anexo: AnexoDetectado): string[] {
  const campos = new Set<string>();
  const trecho = anexo.pagina ? texto.slice(Math.max(0, texto.indexOf(anexo.titulo)), texto.indexOf(anexo.titulo) + 3000) : texto;
  if (/Raz[ãa]o\s+Social|CNPJ|CPF/i.test(trecho)) campos.add('identificacao_fornecedor');
  if (/Produto|Quantidade|Valor\s+Unit[áa]rio|Valor\s+Total/i.test(trecho)) campos.add('tabela_produtos');
  if (/Data|Prazo|Entrega/i.test(trecho)) campos.add('datas_prazos');
  if (/Assinatura|Declarante|Representante/i.test(trecho)) campos.add('assinaturas');
  return [...campos];
}
