"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIME_TYPES_FISCAIS = void 0;
exports.presentNotaFiscalList = presentNotaFiscalList;
exports.presentNotaFiscalDetail = presentNotaFiscalDetail;
exports.MIME_TYPES_FISCAIS = {
    'application/xml': 'xml',
    'text/xml': 'xml',
    'application/pdf': 'pdf',
};
function removerCamposSensives(registro) {
    const camposSensives = ['documentoDestinatario', 'cpfEmitente', 'cpfDestinatario', 'hashSha256', 'arquivoPath'];
    const resultado = {};
    for (const chave of Object.keys(registro)) {
        if (!camposSensives.includes(chave)) {
            resultado[chave] = registro[chave];
        }
    }
    return resultado;
}
function formatarItem(item) {
    const ci = item.contratoItem;
    return {
        id: item.id,
        numeroItem: item.numeroItem,
        codigoProduto: item.codigoProduto,
        descricao: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidadeComercial: item.unidadeComercial,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
        contratoItemId: item.contratoItemId,
        contratoItemProduto: ci?.produto ?? null,
        contratoItemUnidade: ci?.unidade ?? null,
    };
}
function formatarDocumento(doc) {
    return {
        id: doc.id,
        tipo: doc.tipo,
        versao: doc.versao,
        titulo: doc.titulo,
        arquivoNome: doc.arquivoNome,
        mimeType: doc.mimeType,
        tamanhoBytes: doc.tamanhoBytes,
        hashSha256: doc.hashSha256,
        createdAt: doc.createdAt,
    };
}
function formatarDivergencia(div) {
    return {
        id: div.id,
        tipo: div.tipo,
        severidade: div.severidade,
        descricao: div.descricao,
        status: div.status,
        notaFiscalItemId: div.notaFiscalItemId,
    };
}
function formatarVinculo(vinculo) {
    const entrega = vinculo.entrega;
    return {
        id: vinculo.id,
        notaFiscalItemId: vinculo.notaFiscalItemId ?? '',
        entregaId: vinculo.entregaId ?? entrega?.id ?? '',
        entregaNumero: entrega?.numero ?? '',
        entregaStatus: entrega?.status ?? '',
        entregaItemId: vinculo.entregaItemId ?? '',
        contratoItemId: vinculo.contratoItemId ?? '',
        quantidadeVinculada: vinculo.quantidadeVinculada,
        valorUnitarioFiscal: vinculo.valorUnitarioFiscal,
        valorTotalVinculado: vinculo.valorTotalVinculado,
        observacoes: vinculo.observacoes ?? null,
    };
}
function extrairDadosConferencia(json) {
    if (!json)
        return { justificativa: null, ressalvas: null, checklist: [] };
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) || parsed === null || typeof parsed !== 'object') {
            return { justificativa: null, ressalvas: null, checklist: [] };
        }
        return {
            justificativa: parsed.justificativa ?? null,
            ressalvas: parsed.ressalvas ?? null,
            checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [],
        };
    }
    catch {
        return { justificativa: null, ressalvas: null, checklist: [] };
    }
}
function formatarConferencia(conf) {
    const extra = extrairDadosConferencia(conf.divergenciasJson);
    const conferente = conf.responsavelNome ?? null;
    return {
        id: conf.id,
        status: conf.status,
        responsavelNome: conferente,
        conferente,
        dataConferencia: conf.dataConferencia ?? conf.createdAt,
        observacoes: conf.observacoes,
        justificativa: extra.justificativa,
        ressalvas: extra.ressalvas,
        checklist: extra.checklist,
    };
}
function formatarAtesto(atesto, valorTotalNota) {
    const valor = atesto.valorAtestado;
    const notaTotal = valorTotalNota ?? atesto.notaFiscal?.valorTotal;
    const integril = notaTotal ? valor.gte(notaTotal) : false;
    const hash = atesto.hashSha256;
    return {
        id: atesto.id,
        notaFiscalId: atesto.notaFiscalId ?? '',
        status: atesto.status,
        tipo: integril ? 'INTEGRAL' : 'PARCIAL',
        valorAtestado: valor,
        dataAtesto: atesto.dataAtesto,
        responsavelId: atesto.responsavelId,
        justificativa: atesto.justificativa,
        comprovante: hash
            ? { id: atesto.id, titulo: 'Comprovante de atesto', versao: atesto.versao ?? 1 }
            : null,
    };
}
function presentNotaFiscalList(nf) {
    const fornecedor = nf.fornecedor;
    const contrato = nf.contrato;
    const resultado = {
        id: nf.id,
        numero: nf.numero,
        serie: nf.serie,
        modelo: nf.modelo,
        chaveAcesso: nf.chaveAcesso,
        dataEmissao: nf.dataEmissao,
        dataRecebimento: nf.dataRecebimento,
        cnpjEmitente: nf.cnpjEmitente,
        nomeEmitente: nf.nomeEmitente ?? fornecedor?.nome ?? '',
        cnpjDestinatario: nf.documentoDestinatario,
        valorProdutos: nf.valorProdutos,
        valorTotal: nf.valorTotal,
        valorDesconto: nf.valorDesconto,
        valorFrete: nf.valorFrete,
        status: nf.status,
        resultadoConciliacao: nf.resultadoConciliacao,
        fornecedorId: nf.fornecedorId,
        fornecedorNome: fornecedor?.nome ?? '',
        fornecedorCpfCnpj: fornecedor?.cpfCnpj ?? null,
        contratoId: nf.contratoId,
        contratoNumero: contrato?.numero ?? '',
        contratoExercicio: contrato?.exercicio ?? 0,
        xmlDocumentoId: nf.xmlDocumentoId,
        pdfDocumentoId: nf.pdfDocumentoId,
        createdAt: nf.createdAt,
        fornecedor: {
            id: fornecedor?.id ?? nf.fornecedorId ?? '',
            nome: fornecedor?.nome ?? '',
            cpfCnpj: fornecedor?.cpfCnpj ?? null,
        },
        contrato: {
            id: contrato?.id ?? nf.contratoId ?? '',
            numero: contrato?.numero ?? '',
            exercicio: contrato?.exercicio ?? 0,
        },
        itens: (nf.itens ?? []).map(formatarItem),
        divergencias: (nf.divergencias ?? []).map(formatarDivergencia),
        conferencias: (nf.conferencias ?? []).map(formatarConferencia),
        atestos: (nf.atestos ?? []).map((a) => formatarAtesto(a, nf.valorTotal)),
    };
    return removerCamposSensives(resultado);
}
function presentNotaFiscalDetail(nf) {
    const base = presentNotaFiscalList(nf);
    const divergencias = (nf.divergencias ?? []).map(formatarDivergencia);
    const recebimentos = (nf.vinculosRecebimento ?? [])
        .map((vinculo) => {
        const entrega = vinculo.entrega;
        if (!entrega)
            return null;
        return {
            id: entrega.id,
            numero: entrega.numero ?? '',
            status: entrega.status ?? '',
            dataRecebimento: entrega.dataEntrega ?? entrega.aceitaEm ?? null,
        };
    })
        .filter((recebimento) => recebimento !== null);
    const resultadoConciliacao = nf.resultadoConciliacao;
    return {
        ...base,
        valorOutrasDespesas: nf.valorOutrasDespesas,
        documentoDestinatario: nf.documentoDestinatario,
        observacoes: nf.observacoes,
        documentos: (nf.documentos ?? []).map(formatarDocumento),
        divergencias,
        recebimentos,
        vinculos: (nf.vinculosRecebimento ?? [])
            .filter((vinculo) => vinculo && vinculo.id)
            .map(formatarVinculo),
        conciliacao: resultadoConciliacao ? { status: resultadoConciliacao, divergencias } : null,
    };
}
//# sourceMappingURL=fiscal-presenter.js.map