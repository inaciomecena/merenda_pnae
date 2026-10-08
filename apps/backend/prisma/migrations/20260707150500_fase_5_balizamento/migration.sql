-- AlterTable
ALTER TABLE `pnae_matches`
  ADD COLUMN `editalId` VARCHAR(191) NULL,
  ADD COLUMN `produtorProdutoId` VARCHAR(191) NULL,
  ADD COLUMN `origemMatch` ENUM('AUTOMATICO', 'MANUAL') NOT NULL DEFAULT 'AUTOMATICO',
  ADD COLUMN `motivoScore` TEXT NULL,
  MODIFY `observacao` TEXT NULL,
  MODIFY `status` ENUM('MATCH_AUTOMATICO', 'SUGESTAO', 'PENDENTE', 'SEM_MATCH', 'APROVADO', 'REJEITADO', 'SUGERIDO', 'VINCULADO') NOT NULL DEFAULT 'PENDENTE';

-- DataMigration
UPDATE `pnae_matches`
SET `status` = 'SUGESTAO'
WHERE `status` = 'SUGERIDO';

UPDATE `pnae_matches`
SET `status` = 'APROVADO'
WHERE `status` = 'VINCULADO';

UPDATE `pnae_matches` `m`
INNER JOIN `pnae_edital_itens` `i` ON `i`.`id` = `m`.`editalItemId`
SET `m`.`editalId` = `i`.`editalId`
WHERE `m`.`editalId` IS NULL;

-- AlterTable
ALTER TABLE `pnae_matches`
  MODIFY `status` ENUM('MATCH_AUTOMATICO', 'SUGESTAO', 'PENDENTE', 'SEM_MATCH', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE INDEX `pnae_matches_editalId_fkey` ON `pnae_matches`(`editalId`);

-- CreateIndex
CREATE INDEX `pnae_matches_produtorProdutoId_fkey` ON `pnae_matches`(`produtorProdutoId`);

-- AddForeignKey
ALTER TABLE `pnae_matches` ADD CONSTRAINT `pnae_matches_editalId_fkey` FOREIGN KEY (`editalId`) REFERENCES `pnae_editais`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_matches` ADD CONSTRAINT `pnae_matches_produtorProdutoId_fkey` FOREIGN KEY (`produtorProdutoId`) REFERENCES `produtor_produtos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
