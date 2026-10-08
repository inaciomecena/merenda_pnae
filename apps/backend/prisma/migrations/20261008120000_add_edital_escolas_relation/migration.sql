-- CreateTable
CREATE TABLE `pnae_edital_escolas` (
    `id` VARCHAR(191) NOT NULL,
    `editalId` VARCHAR(191) NOT NULL,
    `escolaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pnae_edital_escolas_editalId_escolaId_key`(`editalId`, `escolaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pnae_edital_escolas` ADD CONSTRAINT `pnae_edital_escolas_editalId_fkey` FOREIGN KEY (`editalId`) REFERENCES `pnae_editais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_edital_escolas` ADD CONSTRAINT `pnae_edital_escolas_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
