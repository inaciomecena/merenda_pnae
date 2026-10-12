export type PapelContrato = 'ADMIN' | 'ESCOLA' | 'EXTENSIONISTA' | 'DRE' | 'PRODUTOR' | 'REPRESENTANTE';

export type AcaoContrato =
  | 'CONSULTAR'
  | 'CRIAR'
  | 'EDITAR'
  | 'CONFERIR'
  | 'FORMALIZAR'
  | 'DOCUMENTO_LER'
  | 'DOCUMENTO_GRAVAR'
  | 'ADITIVO'
  | 'AUDITORIA';

const ACOES: Record<PapelContrato, readonly AcaoContrato[]> = {
  ADMIN: ['CONSULTAR', 'CRIAR', 'EDITAR', 'CONFERIR', 'FORMALIZAR', 'DOCUMENTO_LER', 'DOCUMENTO_GRAVAR', 'ADITIVO', 'AUDITORIA'],
  DRE: ['CONSULTAR', 'CRIAR', 'EDITAR', 'CONFERIR', 'FORMALIZAR', 'DOCUMENTO_LER', 'DOCUMENTO_GRAVAR', 'ADITIVO'],
  ESCOLA: ['CONSULTAR', 'DOCUMENTO_LER'],
  PRODUTOR: ['CONSULTAR', 'DOCUMENTO_LER'],
  REPRESENTANTE: ['CONSULTAR', 'DOCUMENTO_LER'],
  EXTENSIONISTA: ['CONSULTAR', 'DOCUMENTO_LER'],
};

export function podeOperar(papel: string, acao: AcaoContrato): boolean {
  return (ACOES[papel as PapelContrato] || []).includes(acao);
}

export function filtroEscopo(papel: string, ids: { dres: string[]; escolas: string[]; produtores: string[] }): Record<string, unknown> {
  if (papel === 'ADMIN') return {};
  if (papel === 'DRE') return { dreId: { in: ids.dres } };
  if (papel === 'ESCOLA') return { escolaId: { in: ids.escolas } };
  if (papel === 'PRODUTOR' || papel === 'REPRESENTANTE' || papel === 'EXTENSIONISTA') {
    return { produtorId: { in: ids.produtores } };
  }
  return { id: { in: [] } };
}
