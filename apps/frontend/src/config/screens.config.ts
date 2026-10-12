export interface ScreenDefinition {
  code: string;
  label: string;
  pattern: RegExp;
}

/** Registro único de telas. Rotas específicas devem vir antes das rotas genéricas. */
export const screenDefinitions: ScreenDefinition[] = [
  { code: 'PNAE-AUT-001', label: 'Acesso ao sistema', pattern: /^\/login\/?$/ },
  { code: 'PNAE-DSH-001', label: 'Painel geral', pattern: /^\/dashboard\/?$/ },
  { code: 'PNAE-PRD-010', label: 'Meu campo', pattern: /^\/meu-campo\/?$/ },
  { code: 'PNAE-GEO-001', label: 'Mapa de Mato Grosso', pattern: /^\/mapa\/?$/ },
  { code: 'PNAE-REL-001', label: 'Relatórios gerenciais', pattern: /^\/relatorios\/?$/ },
  { code: 'PNAE-MUN-001', label: 'Municípios', pattern: /^\/municipios\/?$/ },
  { code: 'PNAE-ESC-002', label: 'Detalhes da escola', pattern: /^\/escolas\/[^/]+\/?$/ },
  { code: 'PNAE-ESC-001', label: 'Escolas', pattern: /^\/escolas\/?$/ },
  { code: 'PNAE-EDT-003', label: 'Consulta do edital', pattern: /^\/editais\/[^/]+\/consulta\/?$/ },
  { code: 'PNAE-EDT-002', label: 'Composição do edital', pattern: /^\/editais\/[^/]+\/?$/ },
  { code: 'PNAE-EDT-001', label: 'Editais', pattern: /^\/editais\/?$/ },
  { code: 'PNAE-MOD-001', label: 'Modelos de documentos', pattern: /^\/templates-anexos\/?$/ },
  { code: 'PNAE-PRF-001', label: 'Produtos dos editais', pattern: /^\/produtos-referencia\/?$/ },
  { code: 'PNAE-PRD-001', label: 'Produtores', pattern: /^\/produtores\/?$/ },
  { code: 'PNAE-BAL-001', label: 'Balizamento', pattern: /^\/balizamento\/?$/ },
  { code: 'PNAE-PRP-001', label: 'Propostas', pattern: /^\/propostas\/?$/ },
  { code: 'PNAE-IMP-002', label: 'Importar edital', pattern: /^\/importacoes\/importar\/?$/ },
  { code: 'PNAE-IMP-005', label: 'Estrutura extraída', pattern: /^\/importacoes\/[^/]+\/estrutura\/?$/ },
  { code: 'PNAE-IMP-004', label: 'Conferência da importação', pattern: /^\/importacoes\/[^/]+\/conferencia\/?$/ },
  { code: 'PNAE-IMP-003', label: 'Detalhes da importação', pattern: /^\/importacoes\/[^/]+\/?$/ },
  { code: 'PNAE-IMP-001', label: 'Importações de editais', pattern: /^\/importacoes\/?$/ },
  { code: 'PNAE-ORG-002', label: 'Escolas da DRE', pattern: /^\/organizacao\/dres\/[^/]+\/escolas\/?$/ },
  { code: 'PNAE-ORG-001', label: 'Organização', pattern: /^\/organizacao\/?$/ },
  { code: 'PNAE-VIN-001', label: 'Vínculos e permissões', pattern: /^\/vinculos\/?$/ },
  { code: 'PNAE-USR-001', label: 'Usuários', pattern: /^\/usuarios\/?$/ },
  { code: 'PNAE-AUD-001', label: 'Auditoria', pattern: /^\/auditoria\/?$/ },
  { code: 'PNAE-CFG-001', label: 'Configurações', pattern: /^\/configuracoes\/?$/ },
  { code: 'PNAE-HML-001', label: 'Homologação técnica', pattern: /^\/homologacao\/?$/ },
  { code: 'PNAE-CTR-002', label: 'Novo contrato', pattern: /^\/contratos\/novo\/?$/ },
  { code: 'PNAE-CTR-005', label: 'Auditoria do contrato', pattern: /^\/contratos\/[^/]+\/auditoria\/?$/ },
  { code: 'PNAE-CTR-004', label: 'Editar contrato', pattern: /^\/contratos\/[^/]+\/editar\/?$/ },
  { code: 'PNAE-CTR-003', label: 'Detalhes do contrato', pattern: /^\/contratos\/[^/]+\/?$/ },
  { code: 'PNAE-CTR-001', label: 'Contratos', pattern: /^\/contratos\/?$/ },
  { code: 'PNAE-ENT-001', label: 'Entregas e recebimentos', pattern: /^\/entregas\/?$/ },
  { code: 'PNAE-NFS-002', label: 'Nova nota fiscal', pattern: /^\/notas-fiscais\/nova\/?$/ },
  { code: 'PNAE-NFS-003', label: 'Detalhes da nota fiscal', pattern: /^\/notas-fiscais\/[^/]+\/?$/ },
  { code: 'PNAE-NFS-001', label: 'Notas fiscais', pattern: /^\/notas-fiscais\/?$/ },
  { code: 'PNAE-CFD-001', label: 'Conferência documental', pattern: /^\/conferencia-fiscal\/?$/ },
  { code: 'PNAE-ATE-001', label: 'Atestos', pattern: /^\/atestos\/?$/ },
  { code: 'PNAE-LIQ-001', label: 'Liquidações', pattern: /^\/liquidacoes\/?$/ },
  { code: 'PNAE-PAG-001', label: 'Pagamentos', pattern: /^\/pagamentos\/?$/ },
  { code: 'PNAE-FIN-001', label: 'Painel financeiro', pattern: /^\/financeiro\/?$/ },
];

export const unknownScreen: ScreenDefinition = { code: 'PNAE-TEL-000', label: 'Tela não catalogada', pattern: /.*/ };

export function getScreenByPath(pathname: string): ScreenDefinition {
  return screenDefinitions.find(screen => screen.pattern.test(pathname)) ?? unknownScreen;
}
