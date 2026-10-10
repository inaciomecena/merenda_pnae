-- SDD-002: Modelo Organizacional - Entidade Executora, DRE e Vínculos

-- Tabela: EntidadeExecutora (EEx)
CREATE TABLE `entidades_executoras` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `cnpj` VARCHAR(18) UNIQUE,
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'PREFEITURA',
  `uf` VARCHAR(2) NOT NULL,
  `municipioId` VARCHAR(191),
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3),
  `createdBy` VARCHAR(191),
  `updatedBy` VARCHAR(191),
  PRIMARY KEY (`id`),
  INDEX `entidades_executoras_uf_idx`(`uf`),
  INDEX `entidades_executoras_municipioId_idx`(`municipioId`),
  CONSTRAINT `entidades_executoras_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela: DRE (Diretoria Regional de Ensino)
CREATE TABLE `dres` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `codigo` VARCHAR(50) UNIQUE,
  `entidadeExecutoraId` VARCHAR(191) NOT NULL,
  `municipioSede` VARCHAR(191),
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3),
  `createdBy` VARCHAR(191),
  `updatedBy` VARCHAR(191),
  PRIMARY KEY (`id`),
  INDEX `dres_entidadeExecutoraId_idx`(`entidadeExecutoraId`),
  CONSTRAINT `dres_entidadeExecutoraId_fkey` FOREIGN KEY (`entidadeExecutoraId`) REFERENCES `entidades_executoras`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela: VinculoEscolaDRE (escola->DRE com vigência)
CREATE TABLE `vinculo_escola_dre` (
  `id` VARCHAR(191) NOT NULL,
  `escolaId` VARCHAR(191) NOT NULL,
  `dreId` VARCHAR(191) NOT NULL,
  `vigenciaInicio` DATETIME(3) NOT NULL,
  `vigenciaFim` DATETIME(3),
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `createdBy` VARCHAR(191),
  `updatedBy` VARCHAR(191),
  PRIMARY KEY (`id`),
  INDEX `vinculo_escola_dre_escolaId_idx`(`escolaId`),
  INDEX `vinculo_escola_dre_dreId_idx`(`dreId`),
  INDEX `vinculo_escola_dre_vigencia_idx`(`vigenciaInicio`, `vigenciaFim`),
  CONSTRAINT `vinculo_escola_dre_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vinculo_escola_dre_dreId_fkey` FOREIGN KEY (`dreId`) REFERENCES `dres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela: VinculoUsuario (usuário->função->unidade, com vigência)
CREATE TABLE `vinculos_usuario` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `funcao` ENUM('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA') NOT NULL,
  `dreId` VARCHAR(191),
  `escolaId` VARCHAR(191),
  `municipioId` VARCHAR(191),
  `vigenciaInicio` DATETIME(3) NOT NULL,
  `vigenciaFim` DATETIME(3),
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `createdBy` VARCHAR(191),
  `updatedBy` VARCHAR(191),
  PRIMARY KEY (`id`),
  INDEX `vinculos_usuario_userId_idx`(`userId`),
  INDEX `vinculos_usuario_dreId_idx`(`dreId`),
  INDEX `vinculos_usuario_escolaId_idx`(`escolaId`),
  INDEX `vinculos_usuario_vigencia_idx`(`vigenciaInicio`, `vigenciaFim`),
  CONSTRAINT `vinculos_usuario_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vinculos_usuario_dreId_fkey` FOREIGN KEY (`dreId`) REFERENCES `dres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vinculos_usuario_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vinculos_usuario_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela: RepresentacaoFornecedor (representante->fornecedor com autorização e vigência)
CREATE TABLE `representacoes_fornecedor` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `produtorId` VARCHAR(191) NOT NULL,
  `tipoRepresentacao` VARCHAR(50) NOT NULL DEFAULT 'REPRESENTANTE',
  `autorizacaoDocumento` VARCHAR(500),
  `vigenciaInicio` DATETIME(3) NOT NULL,
  `vigenciaFim` DATETIME(3),
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `revogadoEm` DATETIME(3),
  `revogadoPor` VARCHAR(191),
  `motivoRevogacao` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `createdBy` VARCHAR(191),
  `updatedBy` VARCHAR(191),
  PRIMARY KEY (`id`),
  INDEX `representacoes_fornecedor_userId_idx`(`userId`),
  INDEX `representacoes_fornecedor_produtorId_idx`(`produtorId`),
  INDEX `representacoes_fornecedor_vigencia_idx`(`vigenciaInicio`, `vigenciaFim`),
  CONSTRAINT `representacoes_fornecedor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `representacoes_fornecedor_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
