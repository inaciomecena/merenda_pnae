ALTER TABLE `users` MODIFY `role` ENUM('ADMIN','ESCOLA','EXTENSIONISTA','DRE','PRODUTOR','REPRESENTANTE') NOT NULL DEFAULT 'ADMIN';
ALTER TABLE `vinculos_usuario` MODIFY `funcao` ENUM('ADMIN','ESCOLA','EXTENSIONISTA','DRE','PRODUTOR','REPRESENTANTE') NOT NULL;
ALTER TABLE `vinculos_usuario` ADD COLUMN `produtorId` VARCHAR(191) NULL;
CREATE INDEX `vinculos_usuario_produtorId_idx` ON `vinculos_usuario`(`produtorId`);
ALTER TABLE `vinculos_usuario` ADD CONSTRAINT `vinculos_usuario_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `representacoes_fornecedor` ADD COLUMN `permissoes` VARCHAR(191) NOT NULL DEFAULT 'CONSULTAR';
