ALTER TABLE `produtores` ADD COLUMN `dadosDocumentais` JSON NULL;
ALTER TABLE `pnae_templates_documento` ADD COLUMN `codigoModelo` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `pnae_templates_documento_codigoModelo_key` ON `pnae_templates_documento`(`codigoModelo`);
