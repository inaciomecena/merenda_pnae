CREATE TABLE `pnae_prestacoes_contas` (
  `id` VARCHAR(191) NOT NULL,
  `exercicio` INTEGER NOT NULL,
  `periodoInicio` DATETIME(3) NOT NULL,
  `periodoFim` DATETIME(3) NOT NULL,
  `dreId` VARCHAR(191) NULL,
  `escolaId` VARCHAR(191) NULL,
  `observacoes` TEXT NULL,
  `status` ENUM('RASCUNHO','EM_CONFERENCIA','ENVIADA','EM_ANALISE','DEVOLVIDA','APROVADA','CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
  `versao` INTEGER NOT NULL DEFAULT 1,
  `enviadoEm` DATETIME(3) NULL,
  `analisadoEm` DATETIME(3) NULL,
  `aprovadoEm` DATETIME(3) NULL,
  `devolvidoEm` DATETIME(3) NULL,
  `justificativa` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `createdBy` VARCHAR(191) NOT NULL,
  `updatedBy` VARCHAR(191) NULL,
  INDEX `pnae_prestacoes_contas_exercicio_periodoInicio_periodoFim_idx` (`exercicio`,`periodoInicio`,`periodoFim`),
  INDEX `pnae_prestacoes_contas_dreId_idx` (`dreId`),
  INDEX `pnae_prestacoes_contas_escolaId_idx` (`escolaId`),
  INDEX `pnae_prestacoes_contas_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_prestacoes_contas_documentos` (
  `id` VARCHAR(191) NOT NULL,
  `prestacaoContasId` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `arquivoPath` VARCHAR(191) NOT NULL,
  `arquivoNome` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `tamanhoBytes` INTEGER NOT NULL,
  `hashSha256` VARCHAR(64) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(191) NOT NULL,
  INDEX `pnae_prestacoes_contas_documentos_prestacaoContasId_idx` (`prestacaoContasId`),
  INDEX `pnae_prestacoes_contas_documentos_tipo_idx` (`tipo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pnae_prestacoes_contas` ADD CONSTRAINT `pnae_prestacoes_contas_dreId_fkey` FOREIGN KEY (`dreId`) REFERENCES `dres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_prestacoes_contas` ADD CONSTRAINT `pnae_prestacoes_contas_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_prestacoes_contas_documentos` ADD CONSTRAINT `pnae_prestacoes_contas_documentos_prestacaoContasId_fkey` FOREIGN KEY (`prestacaoContasId`) REFERENCES `pnae_prestacoes_contas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
