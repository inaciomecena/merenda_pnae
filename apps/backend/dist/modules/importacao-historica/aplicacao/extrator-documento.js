"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lerPaginasPdf = lerPaginasPdf;
exports.extrairItens = extrairItens;
exports.extrairIdentificacao = extrairIdentificacao;
exports.extrairAnexos = extrairAnexos;
const pdf_parse_1 = require("pdf-parse");
const engenharia_reversa_1 = require("../../composicao-editais/application/domain/engenharia-reversa");
const apoio_extracao_1 = require("./apoio-extracao");
async function lerPaginasPdf(buffer) {
    const parser = new pdf_parse_1.PDFParse({ data: buffer });
    try {
        const resultado = await parser.getText();
        return (resultado.pages || []).map((pagina, indice) => ({
            numero: indice + 1,
            texto: pagina.text || '',
        }));
    }
    finally {
        await parser.destroy();
    }
}
function limparLinha(linha) {
    return linha.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim();
}
function prepararLinhaColuna(linha) {
    return linha.replace(/\t+/g, '  ').replace(/\s+$/, '').trimStart();
}
const UNIDADES = '(Quilograma|Quilogramas|Kg|kg|Kilo|Kilos|Quilo|Quilos|Litro|Litros|L|l|Mililitro|Mililitros|ML|ml|Unidade|Unidades|Un|un|Pacote|Pacotes|PCT|Caixa|Caixas|CX|Maço|Maços|Maco|Macos|MACO|Bandeja|Bandejas|Duzia|Dúzia|Duzias|Dúzias|Fardo|Fardos|Saco|Sacos|Duzia|Peso)';
const LINHA_RESUMO = new RegExp(`^(.*?)(?:(?<unidade>${UNIDADES})\\s+)?(?<quantidade>\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?|\\d+(?:,\\d+)?)\\s+R\\$\\s*(?<preco>\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+,\\d{2})\\s+R\\$\\s*(?<total>\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+,\\d{2})\\s*$`, 'i');
const ehNumeroColuna = (s) => /^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/.test(s);
function parseLinhaValoresSeparados(colunas, indice) {
    const toks = colunas[indice].trim().split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);
    if (toks.length !== 3 || !toks.every(ehNumeroColuna))
        return null;
    let unidade = null;
    const anteriores = colunas.slice(Math.max(0, indice - 6), indice);
    for (let j = 0; j < anteriores.length; j++) {
        const t = anteriores[j].trim();
        if (!t)
            continue;
        const ult = t.split(/\s{2,}/).pop()?.trim() ?? '';
        if (ehUnidadeConhecida(ult)) {
            unidade = ult;
            break;
        }
        if (ehPrefixoUnidade(ult)) {
            for (let k = j + 1; k < Math.min(j + 3, anteriores.length); k++) {
                const prox = anteriores[k].trim();
                if (!prox)
                    continue;
                const completada = tentarCompletarUnidade(ult, prox);
                if (completada)
                    unidade = completada;
                break;
            }
            if (unidade)
                break;
        }
    }
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
function parseColunasResumo(linha) {
    const toks = linha.trim().split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);
    if (toks.length < 4)
        return null;
    const fim = toks.slice(-3);
    if (!fim.every(ehNumeroColuna))
        return null;
    const unidade = toks[toks.length - 4];
    const prefixo = toks.slice(0, toks.length - 4).join(' ');
    return { quantidade: fim[0], preco: fim[1], total: fim[2], unidade, prefixo };
}
const UNIDADES_SET = new Set(UNIDADES.split('|').map((u) => u.toUpperCase()));
const ehUnidadeConhecida = (tok) => UNIDADES_SET.has(tok.toUpperCase());
const ehSufixoUnidade = (tok) => /^\d+(?:[.,]\d+)?\s*(?:[KkGg][Gg]?|[Ll]|[Mm][Ll]|[Uu]n)$/i.test(tok);
function ehPrefixoUnidade(tok) {
    const t = tok.toLowerCase().trim();
    if (t.length < 4)
        return false;
    for (const u of UNIDADES_SET) {
        const ul = u.toLowerCase();
        if (ul.startsWith(t) && ul.length > t.length)
            return true;
    }
    return false;
}
function pareceUnidade(tok) {
    if (!tok)
        return false;
    const t = tok.toLowerCase().trim();
    if (!t || t.length > 20)
        return false;
    if (t.includes(',') || t.includes('.'))
        return false;
    if (ehUnidadeConhecida(tok))
        return true;
    if (/(?:de|do|da|em)$/.test(t))
        return true;
    if (ehPrefixoUnidade(tok))
        return true;
    if (/^[a-zç]{2,12}$/.test(t))
        return true;
    return false;
}
function tentarCompletarUnidade(atual, proximo) {
    const a = atual.toLowerCase().trim();
    const p = proximo.toLowerCase().trim();
    if (!p || p.length > 4)
        return null;
    for (const u of UNIDADES_SET) {
        const ul = u.toLowerCase();
        if (ul.startsWith(a) && ul.endsWith(p) && ul.length === a.length + p.length)
            return u;
    }
    return null;
}
function buscarUnidadeDeslocada(colunas, ignorar) {
    const limite = Math.min(colunas.length, 10);
    for (let i = 0; i < limite; i++) {
        if (i === ignorar)
            continue;
        const toks = colunas[i].trim().split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
        if (!toks.length)
            continue;
        const ult = toks[toks.length - 1];
        if (ehUnidadeConhecida(ult))
            return normalizarUnidade(ult);
        if (ehPrefixoUnidade(ult)) {
            const prox = colunas[i + 1]?.trim().split(/\s{2,}/).pop()?.trim() ?? '';
            const completada = tentarCompletarUnidade(ult, prox);
            if (completada)
                return normalizarUnidade(completada);
        }
    }
    return null;
}
const INICIO_ITEM_INLINE = /^(\d{1,3})\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])/;
const INICIO_ITEM_SOZINHO = /^(\d{1,3})\.?\s*$/;
function blocosDePagina(linhas, pagina, atual) {
    const blocos = [];
    let corrente = atual;
    for (const linha of linhas) {
        const inline = linha.match(INICIO_ITEM_INLINE);
        const sozinho = linha.match(INICIO_ITEM_SOZINHO);
        if (inline && !/R\$\s*\d/.test(inline[2])) {
            if (corrente)
                blocos.push(corrente);
            corrente = { sequencia: Number(inline[1]), paginaInicio: pagina, linhas: [linha] };
            continue;
        }
        if (sozinho) {
            if (corrente)
                blocos.push(corrente);
            corrente = { sequencia: Number(sozinho[1]), paginaInicio: pagina, linhas: [linha] };
            continue;
        }
        if (corrente)
            corrente.linhas.push(linha);
    }
    return { blocos, atual: corrente };
}
function finalizarBloco(bloco, documentoId, sha256) {
    const texto = bloco.linhas.map(limparLinha).filter(Boolean);
    const colunas = bloco.linhas.map(prepararLinhaColuna).filter(Boolean);
    const indiceResumo = texto.findIndex((linha) => LINHA_RESUMO.test(linha) && /R\$/.test(linha));
    let quantidadeBruta = null;
    let precoBruto = null;
    let totalBruto = null;
    let unidade = null;
    let prefixoResumo = '';
    let layout = 'nenhum';
    if (indiceResumo >= 0) {
        const m = texto[indiceResumo].match(LINHA_RESUMO);
        const g = m?.groups || {};
        quantidadeBruta = g.quantidade ?? null;
        precoBruto = g.preco ?? null;
        totalBruto = g.total ?? null;
        unidade = g.unidade ? normalizarUnidade(g.unidade) : null;
        prefixoResumo = (m?.[1] || '').trim();
        layout = 'resumo_r$';
    }
    else {
        for (let i = 0; i < colunas.length; i++) {
            const col = parseColunasResumo(colunas[i]);
            if (!col)
                continue;
            quantidadeBruta = col.quantidade;
            precoBruto = col.preco;
            totalBruto = col.total;
            prefixoResumo = col.prefixo;
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
                unidadeBruta = null;
            }
            unidade = unidadeBruta ? normalizarUnidade(unidadeBruta) : null;
            if (!unidade) {
                unidade = buscarUnidadeDeslocada(colunas, i);
            }
            layout = 'colunas';
            break;
        }
        if (layout === 'nenhum') {
            for (let i = 0; i < colunas.length; i++) {
                const col = parseLinhaValoresSeparados(colunas, i);
                if (!col)
                    continue;
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
        if (unidadeLinha)
            unidade = normalizarUnidade(unidadeLinha.split(/\s+/)[0]);
    }
    const leituraQuantidade = (0, apoio_extracao_1.lerPossivel)(quantidadeBruta);
    const leituraPreco = (0, apoio_extracao_1.lerPossivel)(precoBruto);
    const leituraTotal = (0, apoio_extracao_1.lerPossivel)(totalBruto);
    const divergencia = (0, apoio_extracao_1.compararTotal)(leituraQuantidade.centavos, leituraPreco.centavos, leituraTotal);
    const pendencias = [];
    if (layout === 'nenhum')
        pendencias.push('linha de valores não reconhecida nos dois layouts suportados (resumo R$ / colunas alinhadas); item mantido sem valores, sem preenchimento por zero');
    if (leituraQuantidade.ambiguo && quantidadeBruta)
        pendencias.push(`quantidade ambígua: "${quantidadeBruta}"`);
    if (leituraPreco.ambiguo && precoBruto)
        pendencias.push(`preço unitário ambíguo: "${precoBruto}"`);
    if (leituraTotal.ambiguo && totalBruto)
        pendencias.push(`total ambíguo: "${totalBruto}"`);
    if (!unidade)
        pendencias.push('unidade comercial não identificada');
    if (!produto)
        pendencias.push('produto não identificado');
    if (divergencia.divergente)
        pendencias.push(divergencia.motivo || 'divergência entre total da fonte e cálculo');
    const metodo = 'pdf_texto_regex';
    const campo = (leitura, bruto) => {
        if (!bruto)
            return null;
        return {
            bruto,
            normalizado: (0, apoio_extracao_1.centavosParaDecimal)(leitura.centavos),
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
        totalCalculado: divergencia.totalCalculadoCentavos === null ? null : (0, apoio_extracao_1.centavosParaDecimal)(divergencia.totalCalculadoCentavos),
        divergencia: divergencia.diferencaCentavos === null ? null : (0, apoio_extracao_1.centavosParaDecimal)(divergencia.diferencaCentavos),
        pagina: bloco.paginaInicio,
        documentoId,
        metodo,
        statusRevisao: pendencias.length > 0 ? 'pendente_conferencia' : 'extraido',
        pendencia: pendencias.length > 0 ? pendencias.join(' | ') : null,
    };
}
function extrairItens(paginas, documentoId, sha256) {
    const itens = [];
    let blocoCorrente = null;
    let dentroDaTabela = false;
    for (const pagina of paginas) {
        const linhas = (pagina.texto || '')
            .split(/\r?\n/)
            .map(prepararLinhaColuna)
            .filter(Boolean);
        if (!dentroDaTabela) {
            const inicioTabela = linhas.some((linha) => /PRODUTO|ESPECIFICA|QUANTIDADE|UNIDADE/i.test(linha) && /QUANTIDADE|MEDIDA|PRODUTO/i.test(linha));
            if (inicioTabela)
                dentroDaTabela = true;
        }
        if (!dentroDaTabela)
            continue;
        const { blocos, atual } = blocosDePagina(linhas, pagina.numero, blocoCorrente);
        for (const bloco of blocos) {
            const finalizado = finalizarBloco(bloco, documentoId, sha256);
            if (finalizado.totalFonte || finalizado.quantidade)
                itens.push(finalizado);
        }
        if (atual && atual.linhas.length > 40) {
            itens.push(finalizarBloco(atual, documentoId, sha256));
            blocoCorrente = null;
        }
        else {
            blocoCorrente = atual;
        }
        if (blocoCorrente && new RegExp(`^\\d{1,3}\\s+[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ].*R\\$`).test(blocoCorrente.linhas.join(' '))) {
            itens.push(finalizarBloco(blocoCorrente, documentoId, sha256));
            blocoCorrente = null;
        }
    }
    if (blocoCorrente) {
        const finalizado = finalizarBloco(blocoCorrente, documentoId, sha256);
        if (finalizado.totalFonte || finalizado.quantidade)
            itens.push(finalizado);
    }
    return itens;
}
function normalizarUnidade(valor) {
    const chave = valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const mapa = {
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
function extrairProduto(descricao) {
    if (!descricao)
        return null;
    const antesVirgula = descricao.split(',')[0].trim();
    const candidato = antesVirgula.replace(/^\d{1,3}\.?\s+/, '').trim();
    if (!candidato || candidato.length > 80)
        return null;
    if (!/[A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ]/.test(candidato))
        return null;
    return candidato.toUpperCase();
}
function extrairEmbalagem(descricao) {
    const m = descricao.match(/(Unidade|Pacote|Caixa|Fardo|Saco|Maço|Bandeja)\s+de\s+\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|L|un)?/i);
    return m ? m[0] : null;
}
function extrairIdentificacao(paginas, contexto) {
    const corpo = paginas.map((p) => p.texto).join('\n');
    const cabecalho = paginas.slice(0, 5).map((p) => p.texto).join('\n');
    const achar = (regex, alvo = corpo) => {
        for (const pagina of paginas) {
            const m = (pagina.texto || '').match(regex);
            if (m)
                return { valor: m[1] ? m[1].replace(/\s+/g, ' ').trim() : m[0].trim(), pagina: pagina.numero };
        }
        const mGeral = alvo.match(regex);
        return mGeral ? { valor: mGeral[1] ? mGeral[1].replace(/\s+/g, ' ').trim() : mGolar(mGeral), pagina: null } : null;
    };
    let numero = null;
    const reNumero = /(?:EDITAL\s+DE\s+CHAMADA\s+[ÚU]BLICA|AVISO\s+DE\s+CHAMADA\s+[ÚU]BLICA|Chamada\s+[Pp][úu]blica)\s*(?:N[ºO°]\.?\s*|N\.º\s*)?(\d{1,4}\s*[/-]\s*\d{2,4})/g;
    for (const pagina of paginas) {
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
    const evidenciasExercicio = [];
    for (const pagina of paginas) {
        const m = (pagina.texto || '').match(/ano\s+letivo\s+de\s+(20\d{2})/gi);
        if (m) {
            for (const trecho of m)
                evidenciasExercicio.push({ pagina: pagina.numero, trecho: trecho.trim() });
        }
    }
    const exercicio = evidenciasExercicio.length > 0
        ? Number(evidenciasExercicio[0].trecho.match(/(20\d{2})/)?.[1] ?? contexto.exercicioManifesto ?? NaN)
        : contexto.exercicioManifesto ?? null;
    const observacoes = [];
    if (numero && contexto.numeroManifesto) {
        const normalizadoBruto = numero.valor.replace(/\s+/g, '');
        const manifesto = contexto.numeroManifesto.replace(/\s+/g, '');
        if (normalizadoBruto !== manifesto) {
            observacoes.push(`número lido no PDF ("${normalizadoBruto}", página ${numero.pagina}) difere do manifesto ("${manifesto}"); grafia original preservada`);
        }
    }
    return {
        numeroBruto: numero?.valor ?? null,
        numeroNormalizado: numero?.valor ?? contexto.numeroManifesto ?? null,
        anoNumeracao: extrairAno(numero?.valor ?? contexto.numeroManifesto),
        exercicio: Number.isFinite(exercicio) ? exercicio : null,
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
function mGolar(m) {
    return m[0].trim();
}
function extrairAno(numero) {
    if (!numero)
        return null;
    const m = numero.match(/(\d{3,4})\s*$/);
    if (!m)
        return null;
    const ano = Number(m[1]);
    return Number.isFinite(ano) ? ano : null;
}
function extrairAnexos(paginas, documentoId) {
    const texto = paginas.map((p) => p.texto).join('\n');
    const estrutura = (0, engenharia_reversa_1.analisarTextoEdital)(texto, paginas);
    const assinaturas = estrutura.assinaturas.map((a) => a.trecho);
    const detectados = estrutura.anexos || [];
    const vistos = new Set();
    return detectados
        .filter((anexo) => {
        const chave = `${anexo.tipo}|${anexo.titulo}`;
        if (vistos.has(chave))
            return false;
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
function extrairNumeral(titulo) {
    const m = titulo.match(/ANEXO\s+([IVXLCDM]+)/i);
    return m ? m[1].toUpperCase() : null;
}
function detectarCamposEditaveis(texto, anexo) {
    const campos = new Set();
    const trecho = anexo.pagina ? texto.slice(Math.max(0, texto.indexOf(anexo.titulo)), texto.indexOf(anexo.titulo) + 3000) : texto;
    if (/Raz[ãa]o\s+Social|CNPJ|CPF/i.test(trecho))
        campos.add('identificacao_fornecedor');
    if (/Produto|Quantidade|Valor\s+Unit[áa]rio|Valor\s+Total/i.test(trecho))
        campos.add('tabela_produtos');
    if (/Data|Prazo|Entrega/i.test(trecho))
        campos.add('datas_prazos');
    if (/Assinatura|Declarante|Representante/i.test(trecho))
        campos.add('assinaturas');
    return [...campos];
}
//# sourceMappingURL=extrator-documento.js.map