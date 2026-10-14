-- Renomeia tabelas legadas sem alterar linhas, colunas ou chaves.
-- MariaDB atualiza as referencias de FK quando a tabela referenciada muda de nome.
RENAME TABLE
  `sdd010_unidades_produtivas` TO `pnae_unidades_produtivas`,
  `sdd010_safras_producao` TO `pnae_safras_producao`,
  `sdd010_sazonalidade_producao` TO `pnae_sazonalidade_producao`,
  `sdd010_disponibilidades_producao` TO `pnae_disponibilidades_producao`,
  `sdd010_logistica_produtor` TO `pnae_logistica_produtores`,
  `sdd010_informacoes_nutricionais` TO `pnae_informacoes_nutricionais`,
  `sdd010_assistencia_tecnica` TO `pnae_assistencias_tecnicas`,
  `sdd010_mapeamentos_produto_edital` TO `pnae_mapeamentos_produto_edital`,
  `sdd011_interesses_oportunidade` TO `pnae_interesses_oportunidades`,
  `sdd010_solicitacoes_catalogo` TO `pnae_solicitacoes_catalogo`,
  `pnae_system_config` TO `pnae_configuracoes_sistema`;
