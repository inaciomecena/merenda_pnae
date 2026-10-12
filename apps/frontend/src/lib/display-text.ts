const labels: Record<string, string> = {
  ADMIN: 'Administrador',
  DRE: 'Diretoria Regional de Educação',
  ESCOLA: 'Escola',
  EXTENSIONISTA: 'Extensionista',
  REPRESENTANTE: 'Representante',
  PRODUTOR: 'Produtor',
  DESENVOLVIMENTO: 'Desenvolvimento',
  HOMOLOGACAO: 'Homologação',
  PRODUCAO: 'Produção',
  ERROR: 'Erro',
  LOGIN: 'Acesso',
  CRIAR: 'Criação',
  ALTERAR: 'Alteração',
  EXCLUIR: 'Exclusão',
  CONSULTAR: 'Consulta',
  PENDENTE_PROCESSAMENTO: 'Pendente de processamento',
  PROCESSANDO: 'Em processamento',
  PENDENTE_CONFERENCIA: 'Pendente de conferência',
  EM_CONFERENCIA: 'Em conferência',
  AGUARDANDO_ATESTO: 'Aguardando atesto',
  AGUARDANDO_ASSINATURA: 'Aguardando assinatura',
  PARCIALMENTE_RECEBIDA: 'Parcialmente recebida',
  CONCILIADA_COM_RESSALVAS: 'Conciliada com ressalvas',
  NAO_CONCILIADA: 'Não conciliada',
  MATCH_AUTOMATICO: 'Correspondência automática',
  SEM_MATCH: 'Sem correspondência',
  PROJETO_VENDA: 'Projeto de venda',
  CONTRATO_ASSINADO: 'Contrato assinado',
  COMPROVANTE_ENTREGA: 'Comprovante de entrega',
  NOTA_FISCAL: 'Nota fiscal',
  EVIDENCIA_FOTOGRAFICA: 'Evidência fotográfica',
  SOLICITADA_CORRECAO: 'Correção solicitada',
  LIQUIDADA_PARCIALMENTE: 'Liquidada parcialmente',
  PAGO_PARCIALMENTE: 'Pago parcialmente',
  PENDENTE_REVISAO: 'Pendente de revisão',
  EDITAL_PRINCIPAL: 'Edital principal',
  ANEXO_I: 'Anexo I', ANEXO_II: 'Anexo II', ANEXO_III: 'Anexo III',
  ANEXO_IV: 'Anexo IV', ANEXO_V: 'Anexo V', ANEXO_VI: 'Anexo VI', ANEXO_VII: 'Anexo VII',
};

const wordAccents: Record<string, string> = {
  acao: 'ação', acoes: 'ações', configuracao: 'configuração', configuracoes: 'configurações',
  conferencia: 'conferência', correcao: 'correção', descricao: 'descrição', evidencia: 'evidência',
  importacao: 'importação', importacoes: 'importações', liquidacao: 'liquidação', municipio: 'município',
  municipios: 'municípios', nao: 'não', numero: 'número', orgao: 'órgão', padrao: 'padrão',
  referencia: 'referência', revisao: 'revisão', usuario: 'usuário', usuarios: 'usuários',
  maximo: 'máximo', versao: 'versão',
};

const configLabels: Record<string, string> = {
  'sistema.nome': 'Nome do sistema',
  'sistema.versao': 'Versão do sistema',
  'orgao.nome': 'Nome do órgão',
  'orgao.secretaria': 'Secretaria responsável',
  'orgao.programa': 'Programa institucional',
  'documento.validade_padrao': 'Validade padrão do documento',
  'documento.prazo_entrega_padrao': 'Prazo padrão de entrega',
  'upload.tamanho_maximo_mb': 'Tamanho máximo do arquivo (MB)',
  'upload.tipos_permitidos': 'Tipos de arquivo permitidos',
};

/** Converte códigos técnicos em texto legível sem alterar o valor enviado à API. */
export function humanizeSystemValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Não informado';
  const raw = String(value).trim();
  const known = labels[raw] || labels[raw.toUpperCase()];
  if (known) return known;

  const words = raw.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean).map(word => {
    const lower = word.toLocaleLowerCase('pt-BR');
    return wordAccents[lower] || lower;
  });
  const sentence = words.join(' ');
  return sentence ? sentence.charAt(0).toLocaleUpperCase('pt-BR') + sentence.slice(1) : raw;
}

export function configKeyLabel(key: string): string {
  return configLabels[key] || humanizeSystemValue(key);
}
