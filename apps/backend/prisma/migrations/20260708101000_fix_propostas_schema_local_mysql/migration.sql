-- Align proposal tables with the current Prisma schema used by the application.
-- This migration is additive and keeps existing proposal rows.

ALTER TABLE `pnae_propostas`
  MODIFY `status` ENUM('RASCUNHO', 'GERADA', 'FINALIZADA', 'CANCELADA', 'ENVIADA', 'APROVADA', 'REJEITADA') NOT NULL DEFAULT 'RASCUNHO';

UPDATE `pnae_propostas` SET `status` = 'GERADA' WHERE `status` = 'ENVIADA';
UPDATE `pnae_propostas` SET `status` = 'FINALIZADA' WHERE `status` = 'APROVADA';
UPDATE `pnae_propostas` SET `status` = 'CANCELADA' WHERE `status` = 'REJEITADA';

ALTER TABLE `pnae_propostas`
  ADD COLUMN `produtorId` VARCHAR(191) NULL,
  ADD COLUMN `tipoDocumento` ENUM('ANEXO_III', 'PROJETO_VENDA') NOT NULL DEFAULT 'ANEXO_III',
  ADD COLUMN `validadeDias` INT NOT NULL DEFAULT 30,
  ADD COLUMN `prazoEntrega` INT NOT NULL DEFAULT 15,
  ADD COLUMN `valorTotal` DECIMAL(12, 2) NULL,
  ADD COLUMN `arquivoPdfPath` VARCHAR(191) NULL,
  ADD COLUMN `arquivoDocxPath` VARCHAR(191) NULL,
  MODIFY `status` ENUM('RASCUNHO', 'GERADA', 'FINALIZADA', 'CANCELADA') NOT NULL DEFAULT 'RASCUNHO';

CREATE INDEX `pnae_propostas_produtorId_fkey` ON `pnae_propostas`(`produtorId`);

ALTER TABLE `pnae_propostas`
  ADD CONSTRAINT `pnae_propostas_produtorId_fkey`
  FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `pnae_proposta_itens`
  ADD COLUMN `matchId` VARCHAR(191) NULL,
  ADD COLUMN `marca` VARCHAR(191) NULL;

CREATE INDEX `pnae_proposta_itens_matchId_fkey` ON `pnae_proposta_itens`(`matchId`);

ALTER TABLE `pnae_proposta_itens`
  ADD CONSTRAINT `pnae_proposta_itens_matchId_fkey`
  FOREIGN KEY (`matchId`) REFERENCES `pnae_matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
