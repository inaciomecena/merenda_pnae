-- Registro imutável de estornos, sem alterar ou excluir entregas históricas.
CREATE TABLE `pnae_entrega_estornos` (
  `id` VARCHAR(191) NOT NULL,
  `entregaId` VARCHAR(191) NOT NULL,
  `motivo` TEXT NOT NULL,
  `itensJson` TEXT NOT NULL,
  `efetuadoPor` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `pnae_entrega_estornos_entregaId_key`(`entregaId`),
  CONSTRAINT `pnae_entrega_estornos_entregaId_fkey` FOREIGN KEY (`entregaId`) REFERENCES `pnae_entregas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
