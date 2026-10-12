"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarProgramacao = validarProgramacao;
exports.bloqueiaConfirmacao = bloqueiaConfirmacao;
exports.validarEntrega = validarEntrega;
exports.bloqueiaConferencia = bloqueiaConferencia;
exports.bloqueiaAceite = bloqueiaAceite;
function validarProgramacao(dados) {
    const pendencias = [];
    const add = (codigo, mensagem, bloqueia = true) => {
        pendencias.push({ codigo, mensagem, bloqueiaConfirmacao: bloqueia });
    };
    if (dados.contratoStatus !== 'VIGENTE') {
        add('CONTRATO_STATUS', `Contrato deve estar VIGENTE para programar entregas. Status atual: ${dados.contratoStatus}.`);
    }
    if (!dados.dataPrevista) {
        add('DATA_PREVISTA', 'Data prevista é obrigatória.');
    }
    if (dados.itensValidos === 0) {
        add('ITENS', 'Nenhum item válido selecionado para programação.');
    }
    if (!dados.saldosSuficientes) {
        for (const bloqueio of dados.bloqueiosSaldos) {
            add('SALDO_INSUFICIENTE', bloqueio);
        }
    }
    for (const item of dados.itens) {
        if (!item.contratoItemId) {
            add('ITEM_CONTRATO', 'Item não vinculado a item de contrato válido.');
        }
        if (!item.quantidadeProgramada || Number(item.quantidadeProgramada) <= 0) {
            add('QUANTIDADE', `Quantidade deve ser maior que zero para item ${item.contratoItemId}.`);
        }
    }
    return pendencias;
}
function bloqueiaConfirmacao(pendencias) {
    return pendencias.filter((p) => p.bloqueiaConfirmacao).map((p) => p.mensagem);
}
function validarEntrega(dados) {
    const pendencias = [];
    const add = (codigo, mensagem, conferencia = true, aceite = true) => {
        pendencias.push({ codigo, mensagem, bloqueiaConferencia: conferencia, bloqueiaAceite: aceite });
    };
    if (!['CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'].includes(dados.programacaoStatus)) {
        add('PROGRAMACAO_STATUS', `Programação deve estar CONFIRMADA, EM_ENTREGA ou PARCIALMENTE_RECEBIDA. Status: ${dados.programacaoStatus}.`, false, true);
    }
    if (!dados.dataEntrega) {
        add('DATA_ENTREGA', 'Data da entrega é obrigatória.', true, true);
    }
    if (dados.itensValidos === 0) {
        add('ITENS', 'Nenhum item informado na entrega.', true, true);
    }
    if (!dados.somaAceitaIgualInformada) {
        add('SOMA_QUANTIDADES', 'A soma de aceita + rejeitada deve ser igual à quantidade informada para cada item.', true, true);
    }
    if (!dados.naoExcedeProgramado) {
        add('EXCEDE_PROGRAMADO', 'Quantidade aceita não pode exceder a quantidade programada pendente.', false, true);
    }
    for (const bloqueio of dados.bloqueios) {
        add('BLOQUEIO', bloqueio, true, true);
    }
    return pendencias;
}
function bloqueiaConferencia(pendencias) {
    return pendencias.filter((p) => p.bloqueiaConferencia).map((p) => p.mensagem);
}
function bloqueiaAceite(pendencias) {
    return pendencias.filter((p) => p.bloqueiaAceite).map((p) => p.mensagem);
}
//# sourceMappingURL=entrega-validacao.js.map