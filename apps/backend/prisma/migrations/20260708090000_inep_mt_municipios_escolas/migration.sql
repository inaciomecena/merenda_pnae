-- AlterTable
ALTER TABLE `municipios` ADD COLUMN `nomeNormalizado` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `municipios_uf_nomeNormalizado_idx` ON `municipios`(`uf`, `nomeNormalizado`);
