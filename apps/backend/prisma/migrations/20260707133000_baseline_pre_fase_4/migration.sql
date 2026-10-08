-- CreateTable
CREATE TABLE `escolas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NULL,
    `municipioId` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `responsavel` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `escolas_codigo_key`(`codigo` ASC),
    INDEX `escolas_municipioId_fkey`(`municipioId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `municipios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `uf` VARCHAR(191) NOT NULL,
    `codigoIbge` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `municipios_codigoIbge_key`(`codigoIbge` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pnae_editais` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `status` ENUM('RASCUNHO', 'ATIVO', 'FECHADO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
    `escolaId` VARCHAR(191) NULL,
    `dataPublicacao` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_editais_escolaId_fkey`(`escolaId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pnae_edital_itens` (
    `id` VARCHAR(191) NOT NULL,
    `editalId` VARCHAR(191) NOT NULL,
    `produtoOriginal` VARCHAR(191) NOT NULL,
    `especificacao` VARCHAR(191) NULL,
    `quantidade` DECIMAL(10, 2) NULL,
    `unidade` VARCHAR(191) NULL,
    `precoUnitario` DECIMAL(10, 2) NULL,
    `valorTotal` DECIMAL(10, 2) NULL,
    `produtoReferenciaId` VARCHAR(191) NULL,
    `status` ENUM('PENDENTE', 'IMPORTADO', 'CONFIRMADO', 'PENDENTE_EDICAO') NOT NULL DEFAULT 'PENDENTE',
    `pendenteEdicao` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_edital_itens_editalId_fkey`(`editalId` ASC),
    INDEX `pnae_edital_itens_produtoReferenciaId_fkey`(`produtoReferenciaId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pnae_import_logs` (
    `id` VARCHAR(191) NOT NULL,
    `editalId` VARCHAR(191) NULL,
    `arquivoNome` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `resumo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_import_logs_editalId_fkey`(`editalId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pnae_matches` (
    `id` VARCHAR(191) NOT NULL,
    `editalItemId` VARCHAR(191) NOT NULL,
    `produtoReferenciaId` VARCHAR(191) NULL,
    `produtorId` VARCHAR(191) NULL,
    `escolaId` VARCHAR(191) NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDENTE', 'SUGERIDO', 'VINCULADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE',
    `observacao` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_matches_editalItemId_fkey`(`editalItemId` ASC),
    INDEX `pnae_matches_escolaId_fkey`(`escolaId` ASC),
    INDEX `pnae_matches_produtoReferenciaId_fkey`(`produtoReferenciaId` ASC),
    INDEX `pnae_matches_produtorId_fkey`(`produtorId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pnae_produtos_referencia` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `subcategoria` VARCHAR(191) NULL,
    `unidadePadrao` VARCHAR(191) NULL,
    `palavrasChave` VARCHAR(191) NULL,
    `sinonimos` VARCHAR(191) NULL,
    `agriculturaFamiliar` BOOLEAN NOT NULL DEFAULT true,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pnae_proposta_itens` (
    `id` VARCHAR(191) NOT NULL,
    `propostaId` VARCHAR(191) NOT NULL,
    `produto` VARCHAR(191) NOT NULL,
    `especificacao` VARCHAR(191) NULL,
    `quantidade` DECIMAL(10, 2) NULL,
    `unidade` VARCHAR(191) NULL,
    `precoUnitario` DECIMAL(10, 2) NULL,
    `valorTotal` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_proposta_itens_propostaId_fkey`(`propostaId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pnae_propostas` (
    `id` VARCHAR(191) NOT NULL,
    `editalId` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NULL,
    `status` ENUM('RASCUNHO', 'GERADA', 'ENVIADA', 'APROVADA', 'REJEITADA') NOT NULL DEFAULT 'RASCUNHO',
    `observacao` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_propostas_editalId_fkey`(`editalId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtor_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `produto` VARCHAR(191) NOT NULL,
    `capacidade` VARCHAR(191) NULL,
    `periodoProducao` VARCHAR(191) NULL,
    `precoSugerido` DECIMAL(10, 2) NULL,
    `unidade` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `produtor_produtos_produtorId_fkey`(`produtorId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtores` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cpfCnpj` VARCHAR(191) NULL,
    `municipioId` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `produtores_cpfCnpj_key`(`cpfCnpj` ASC),
    INDEX `produtores_municipioId_fkey`(`municipioId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'ESCOLA', 'EXTENSIONISTA') NOT NULL DEFAULT 'ADMIN',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `users_email_key`(`email` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `escolas` ADD CONSTRAINT `escolas_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_editais` ADD CONSTRAINT `pnae_editais_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_edital_itens` ADD CONSTRAINT `pnae_edital_itens_editalId_fkey` FOREIGN KEY (`editalId`) REFERENCES `pnae_editais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_edital_itens` ADD CONSTRAINT `pnae_edital_itens_produtoReferenciaId_fkey` FOREIGN KEY (`produtoReferenciaId`) REFERENCES `pnae_produtos_referencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_import_logs` ADD CONSTRAINT `pnae_import_logs_editalId_fkey` FOREIGN KEY (`editalId`) REFERENCES `pnae_editais`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_matches` ADD CONSTRAINT `pnae_matches_editalItemId_fkey` FOREIGN KEY (`editalItemId`) REFERENCES `pnae_edital_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_matches` ADD CONSTRAINT `pnae_matches_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_matches` ADD CONSTRAINT `pnae_matches_produtoReferenciaId_fkey` FOREIGN KEY (`produtoReferenciaId`) REFERENCES `pnae_produtos_referencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_matches` ADD CONSTRAINT `pnae_matches_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_proposta_itens` ADD CONSTRAINT `pnae_proposta_itens_propostaId_fkey` FOREIGN KEY (`propostaId`) REFERENCES `pnae_propostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pnae_propostas` ADD CONSTRAINT `pnae_propostas_editalId_fkey` FOREIGN KEY (`editalId`) REFERENCES `pnae_editais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtor_produtos` ADD CONSTRAINT `produtor_produtos_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtores` ADD CONSTRAINT `produtores_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

