ALTER TABLE `users` ADD COLUMN `escolaId` VARCHAR(191) NULL,
  ADD COLUMN `municipioId` VARCHAR(191) NULL;

CREATE INDEX `users_escolaId_idx` ON `users`(`escolaId`);
CREATE INDEX `users_municipioId_idx` ON `users`(`municipioId`);

ALTER TABLE `users` ADD CONSTRAINT `users_escolaId_fkey`
  FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_municipioId_fkey`
  FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
