-- AlterTable
ALTER TABLE `produtor_produtos` ADD COLUMN `produtoReferenciaId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    ADD COLUMN `unidadeProdutivaId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `sdd010_unidades_produtivas` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `municipioId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `comunidade` VARCHAR(191) NULL,
    `descricao` TEXT NULL,
    `areaHectares` DECIMAL(12, 4) NULL,
    `latitude` DECIMAL(12, 8) NULL,
    `longitude` DECIMAL(12, 8) NULL,
    `status` ENUM('ATIVA', 'INATIVA') NOT NULL DEFAULT 'ATIVA',
    `versao` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_unidades_produtivas_produtorId_status_idx`(`produtorId`, `status`),
    INDEX `sdd010_unidades_produtivas_municipioId_idx`(`municipioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_safras_producao` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `unidadeProdutivaId` VARCHAR(191) NULL,
    `produtoProdutorId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `inicio` DATETIME(3) NOT NULL,
    `fim` DATETIME(3) NOT NULL,
    `quantidadePrevista` DECIMAL(14, 4) NOT NULL,
    `quantidadeColhida` DECIMAL(14, 4) NOT NULL DEFAULT 0,
    `perdas` DECIMAL(14, 4) NOT NULL DEFAULT 0,
    `quantidadeReservada` DECIMAL(14, 4) NOT NULL DEFAULT 0,
    `quantidadeComprometida` DECIMAL(14, 4) NOT NULL DEFAULT 0,
    `unidade` VARCHAR(191) NOT NULL,
    `status` ENUM('PLANEJADA', 'EM_PRODUCAO', 'EM_COLHEITA', 'COLHIDA', 'ENCERRADA', 'CANCELADA') NOT NULL DEFAULT 'PLANEJADA',
    `versao` INTEGER NOT NULL DEFAULT 1,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_safras_producao_produtorId_status_idx`(`produtorId`, `status`),
    INDEX `sdd010_safras_producao_produtoProdutorId_inicio_fim_idx`(`produtoProdutorId`, `inicio`, `fim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_sazonalidade_producao` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `safraProducaoId` VARCHAR(191) NULL,
    `produtoProdutorId` VARCHAR(191) NOT NULL,
    `mes` INTEGER NOT NULL,
    `quantidadePrevista` DECIMAL(14, 4) NOT NULL,
    `unidade` VARCHAR(191) NOT NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_sazonalidade_producao_produtorId_mes_idx`(`produtorId`, `mes`),
    UNIQUE INDEX `sdd010_sazonalidade_producao_produtorId_produtoProdutorId_me_key`(`produtorId`, `produtoProdutorId`, `mes`, `safraProducaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_disponibilidades_producao` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `safraProducaoId` VARCHAR(191) NOT NULL,
    `produtoProdutorId` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(14, 4) NOT NULL,
    `unidade` VARCHAR(191) NOT NULL,
    `status` ENUM('PREVISTA', 'CONFIRMADA', 'COMPROMETIDA', 'ENCERRADA') NOT NULL DEFAULT 'PREVISTA',
    `origem` VARCHAR(191) NOT NULL,
    `origemId` VARCHAR(191) NULL,
    `periodoInicio` DATETIME(3) NULL,
    `periodoFim` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_disponibilidades_producao_produtorId_status_idx`(`produtorId`, `status`),
    INDEX `sdd010_disponibilidades_producao_safraProducaoId_idx`(`safraProducaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_logistica_produtor` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `modalidade` VARCHAR(191) NOT NULL,
    `municipiosAtendidos` TEXT NULL,
    `capacidadeDiaria` DECIMAL(14, 4) NULL,
    `unidadeCapacidade` VARCHAR(191) NULL,
    `raioKm` DECIMAL(10, 2) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `observacoes` TEXT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_logistica_produtor_produtorId_ativo_idx`(`produtorId`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_informacoes_nutricionais` (
    `id` VARCHAR(191) NOT NULL,
    `produtoReferenciaId` VARCHAR(191) NOT NULL,
    `fonte` VARCHAR(191) NOT NULL,
    `versaoFonte` VARCHAR(191) NULL,
    `estadoAlimento` VARCHAR(191) NULL,
    `porcao` VARCHAR(191) NULL,
    `energiaKcal` DECIMAL(12, 4) NULL,
    `proteinaG` DECIMAL(12, 4) NULL,
    `carboidratoG` DECIMAL(12, 4) NULL,
    `lipidiosG` DECIMAL(12, 4) NULL,
    `fibraG` DECIMAL(12, 4) NULL,
    `sodioMg` DECIMAL(12, 4) NULL,
    `status` ENUM('PENDENTE_VALIDACAO', 'VALIDADA', 'INATIVA') NOT NULL DEFAULT 'PENDENTE_VALIDACAO',
    `validadoPor` VARCHAR(191) NULL,
    `validadoEm` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_informacoes_nutricionais_produtoReferenciaId_status_idx`(`produtoReferenciaId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_assistencia_tecnica` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `extensionistaId` VARCHAR(191) NOT NULL,
    `escopo` VARCHAR(191) NULL,
    `vigenciaInicio` DATETIME(3) NOT NULL,
    `vigenciaFim` DATETIME(3) NULL,
    `status` ENUM('PENDENTE', 'ATIVA', 'SUSPENSA', 'ENCERRADA') NOT NULL DEFAULT 'PENDENTE',
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_assistencia_tecnica_produtorId_status_idx`(`produtorId`, `status`),
    INDEX `sdd010_assistencia_tecnica_extensionistaId_status_idx`(`extensionistaId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_mapeamentos_produto_edital` (
    `id` VARCHAR(191) NOT NULL,
    `produtorId` VARCHAR(191) NOT NULL,
    `produtoProdutorId` VARCHAR(191) NOT NULL,
    `produtoReferenciaId` VARCHAR(191) NULL,
    `editalItemId` VARCHAR(191) NOT NULL,
    `compatibilidade` DECIMAL(5, 2) NULL,
    `justificativa` TEXT NULL,
    `revisaoStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE_REVISAO',
    `revisadoPor` VARCHAR(191) NULL,
    `revisadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `sdd010_mapeamentos_produto_edital_produtorId_revisaoStatus_idx`(`produtorId`, `revisaoStatus`),
    UNIQUE INDEX `sdd010_mapeamentos_produto_edital_produtoProdutorId_editalIt_key`(`produtoProdutorId`, `editalItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdd010_solicitacoes_catalogo` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `unidadePadrao` VARCHAR(191) NULL,
    `justificativa` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `solicitanteId` VARCHAR(191) NOT NULL,
    `analisadoPor` VARCHAR(191) NULL,
    `analisadoEm` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sdd010_solicitacoes_catalogo_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `produtor_produtos` ADD CONSTRAINT `produtor_produtos_produtoReferenciaId_fkey` FOREIGN KEY (`produtoReferenciaId`) REFERENCES `pnae_produtos_referencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `produtor_produtos` ADD CONSTRAINT `produtor_produtos_unidadeProdutivaId_fkey` FOREIGN KEY (`unidadeProdutivaId`) REFERENCES `sdd010_unidades_produtivas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_unidades_produtivas` ADD CONSTRAINT `sdd010_unidades_produtivas_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_unidades_produtivas` ADD CONSTRAINT `sdd010_unidades_produtivas_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_safras_producao` ADD CONSTRAINT `sdd010_safras_producao_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_safras_producao` ADD CONSTRAINT `sdd010_safras_producao_unidadeProdutivaId_fkey` FOREIGN KEY (`unidadeProdutivaId`) REFERENCES `sdd010_unidades_produtivas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_safras_producao` ADD CONSTRAINT `sdd010_safras_producao_produtoProdutorId_fkey` FOREIGN KEY (`produtoProdutorId`) REFERENCES `produtor_produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_sazonalidade_producao` ADD CONSTRAINT `sdd010_sazonalidade_producao_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_sazonalidade_producao` ADD CONSTRAINT `sdd010_sazonalidade_producao_safraProducaoId_fkey` FOREIGN KEY (`safraProducaoId`) REFERENCES `sdd010_safras_producao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_sazonalidade_producao` ADD CONSTRAINT `sdd010_sazonalidade_producao_produtoProdutorId_fkey` FOREIGN KEY (`produtoProdutorId`) REFERENCES `produtor_produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_disponibilidades_producao` ADD CONSTRAINT `sdd010_disponibilidades_producao_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_disponibilidades_producao` ADD CONSTRAINT `sdd010_disponibilidades_producao_safraProducaoId_fkey` FOREIGN KEY (`safraProducaoId`) REFERENCES `sdd010_safras_producao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_disponibilidades_producao` ADD CONSTRAINT `sdd010_disponibilidades_producao_produtoProdutorId_fkey` FOREIGN KEY (`produtoProdutorId`) REFERENCES `produtor_produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_logistica_produtor` ADD CONSTRAINT `sdd010_logistica_produtor_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_informacoes_nutricionais` ADD CONSTRAINT `sdd010_informacoes_nutricionais_produtoReferenciaId_fkey` FOREIGN KEY (`produtoReferenciaId`) REFERENCES `pnae_produtos_referencia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_assistencia_tecnica` ADD CONSTRAINT `sdd010_assistencia_tecnica_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_assistencia_tecnica` ADD CONSTRAINT `sdd010_assistencia_tecnica_extensionistaId_fkey` FOREIGN KEY (`extensionistaId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_mapeamentos_produto_edital` ADD CONSTRAINT `sdd010_mapeamentos_produto_edital_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_mapeamentos_produto_edital` ADD CONSTRAINT `sdd010_mapeamentos_produto_edital_produtoProdutorId_fkey` FOREIGN KEY (`produtoProdutorId`) REFERENCES `produtor_produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_mapeamentos_produto_edital` ADD CONSTRAINT `sdd010_mapeamentos_produto_edital_produtoReferenciaId_fkey` FOREIGN KEY (`produtoReferenciaId`) REFERENCES `pnae_produtos_referencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_mapeamentos_produto_edital` ADD CONSTRAINT `sdd010_mapeamentos_produto_edital_editalItemId_fkey` FOREIGN KEY (`editalItemId`) REFERENCES `pnae_edital_itens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

 -- AddForeignKey
ALTER TABLE `sdd010_solicitacoes_catalogo` ADD CONSTRAINT `sdd010_solicitacoes_catalogo_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


