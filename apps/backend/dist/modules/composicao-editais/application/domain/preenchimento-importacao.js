"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepararDadosEdital = prepararDadosEdital;
function prepararDadosEdital(importacao, estrutura) {
    const origem = importacao.edital || {};
    const documento = origem.documento || {};
    const campos = estrutura?.campos || [];
    const valor = (chave) => {
        const campo = campos.find((item) => item.chave === chave);
        return campo?.valor ?? campo?.valorExtraido ?? '';
    };
    const documentoNovo = {
        origem: 'IMPORTACAO', arquivoFonte: importacao.arquivoCaminho, importacaoId: importacao.id,
        variaveis: [], anexos: [],
    };
    const mapeamento = {
        processoAdministrativo: 'edital.processoAdministrativo', localRecebimento: 'edital.localSessao',
        horarioRecebimento: 'edital.horarioSessao', comissao: 'edital.comissao',
        legislacaoAplicavel: 'edital.legislacaoAplicavel', prazoVigencia: 'edital.prazoVigencia',
        condicoesParticipacao: 'edital.condicoesParticipacao', criteriosHabilitacao: 'edital.criteriosHabilitacao',
        regrasEntrega: 'edital.regrasEntrega', formaPagamento: 'edital.formaPagamento', penalidades: 'edital.penalidades',
        foro: 'edital.foro', observacoesDocumento: 'edital.observacoes',
    };
    for (const [campo, chave] of Object.entries(mapeamento))
        documentoNovo[campo] = documento[campo] ?? valor(chave);
    documentoNovo.dataRecebimento = dataImportada(documento.dataRecebimento || valor('edital.dataSessao'));
    return {
        numero: origem.numero || importacao.numeroExtraido || valor('edital.numero'),
        ano: origem.ano || importacao.anoExtraido || Number(valor('edital.ano')) || new Date().getFullYear(),
        titulo: origem.titulo || importacao.tituloExtraido || valor('edital.titulo') || importacao.arquivoNome,
        objeto: origem.objeto || importacao.objeto || valor('edital.objeto'),
        descricao: origem.descricao || valor('edital.descricao'),
        observacoes: origem.observacoes || importacao.resumo || '',
        municipioId: origem.municipioId || '',
        dataPublicacao: dataImportada(origem.dataPublicacao || valor('edital.dataPublicacao')),
        escolasVinculadas: origem.escolasVinculadas?.length ? origem.escolasVinculadas : (origem.escolaId ? [{ escolaId: origem.escolaId }] : []),
        itens: (origem.itens || []).map((item) => ({
            numeroItem: item.numeroItem, produtoOriginal: item.produtoOriginal, especificacao: item.especificacao || '',
            quantidade: item.quantidade == null ? null : Number(item.quantidade), unidade: item.unidade || '',
            precoUnitario: item.precoUnitario == null ? null : Number(item.precoUnitario),
        })),
        documento: documentoNovo,
    };
}
function dataImportada(valor) {
    if (!valor)
        return '';
    if (valor instanceof Date)
        return valor.toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}/.test(valor))
        return valor.slice(0, 10);
    const numerica = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const extenso = valor.toLowerCase().match(/^(\d{1,2})\s+de\s+(\S+)\s+de\s+(\d{4})$/);
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const dia = Number(numerica?.[1] || extenso?.[1]);
    const mes = numerica ? Number(numerica[2]) : meses.indexOf(extenso?.[2]?.replace('marco', 'março') || '') + 1;
    const ano = Number(numerica?.[3] || extenso?.[3]);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia ? data.toISOString().slice(0, 10) : '';
}
//# sourceMappingURL=preenchimento-importacao.js.map