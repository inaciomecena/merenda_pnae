const DATA = /^\d{4}-\d{2}-\d{2}$/;

export function dataInstitucional(valor: string): Date {
  if (!DATA.test(valor)) throw new Error('Data inválida. Use AAAA-MM-DD.');
  const data = new Date(`${valor}T12:00:00.000Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) {
    throw new Error('Data inválida.');
  }
  return data;
}

export function calendarioArmazenado(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function hojeInstitucional(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}

export function vigenciaPermiteAtivacao(inicio: Date, fim: Date, agora = new Date()): { ok: boolean; motivo?: string } {
  const ini = calendarioArmazenado(inicio);
  const end = calendarioArmazenado(fim);
  const hoje = hojeInstitucional(agora);
  if (ini > end) return { ok: false, motivo: 'O fim da vigência é anterior ao início.' };
  if (ini > hoje) return { ok: false, motivo: 'A vigência ainda não iniciou. O registro da assinatura não ativa contrato futuro.' };
  if (end < hoje) return { ok: false, motivo: 'A vigência informada já está encerrada.' };
  return { ok: true };
}
