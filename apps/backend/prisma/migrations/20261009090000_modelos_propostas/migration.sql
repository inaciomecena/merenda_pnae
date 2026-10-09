ALTER TABLE `pnae_templates_documento`
  ADD COLUMN `finalidade` VARCHAR(191) NOT NULL DEFAULT 'EDITAL',
  ADD COLUMN `perfilFornecedor` VARCHAR(191) NULL;

ALTER TABLE `pnae_propostas` ADD COLUMN `documentosJson` LONGTEXT NULL;
