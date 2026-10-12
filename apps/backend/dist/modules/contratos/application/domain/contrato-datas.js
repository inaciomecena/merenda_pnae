"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataInstitucional = dataInstitucional;
exports.calendarioArmazenado = calendarioArmazenado;
exports.hojeInstitucional = hojeInstitucional;
exports.vigenciaPermiteAtivacao = vigenciaPermiteAtivacao;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
function dataInstitucional(valor) {
    if (!DATA.test(valor))
        throw new Error('Data inválida. Use AAAA-MM-DD.');
    const data = new Date(`${valor}T12:00:00.000Z`);
    if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) {
        throw new Error('Data inválida.');
    }
    return data;
}
function calendarioArmazenado(data) {
    return data.toISOString().slice(0, 10);
}
function hojeInstitucional(agora = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}
function vigenciaPermiteAtivacao(inicio, fim, agora = new Date()) {
    const ini = calendarioArmazenado(inicio);
    const end = calendarioArmazenado(fim);
    const hoje = hojeInstitucional(agora);
    if (ini > end)
        return { ok: false, motivo: 'O fim da vigência é anterior ao início.' };
    if (ini > hoje)
        return { ok: false, motivo: 'A vigência ainda não iniciou. O registro da assinatura não ativa contrato futuro.' };
    if (end < hoje)
        return { ok: false, motivo: 'A vigência informada já está encerrada.' };
    return { ok: true };
}
//# sourceMappingURL=contrato-datas.js.map