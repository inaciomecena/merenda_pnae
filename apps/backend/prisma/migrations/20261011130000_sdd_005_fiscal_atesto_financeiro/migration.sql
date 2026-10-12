-- SDD-005: Gestão Fiscal, Atesto, Liquidação e Acompanhamento Financeiro
-- Migração estritamente aditiva - NÃO altera tabelas ou dados existentes
-- Data: 2026-10-11

-- =====================================================
-- TABELA: pnae_notas_fiscais
-- =====================================================
CREATE TABLE `pnae_notas_fiscais` (
    `id` VARCHAR(191) NOT NULL,
    `fornecedorId` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `serie` VARCHAR(191) NULL,
    `modelo` VARCHAR(191) NULL,
    `chaveAcesso` VARCHAR(191) NULL,
    `dataEmissao` DATETIME(3) NOT NULL,
    `dataRecebimento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cnpjEmitente` VARCHAR(191) NULL,
    `cpfEmitente` VARCHAR(191) NULL,
    `documentoDestinatario` VARCHAR(191) NULL,
    `valorProdutos` DECIMAL(14, 2) NOT NULL,
    `valorTotal` DECIMAL(14, 2) NOT NULL,
    `valorDesconto` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `valorFrete` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `valorOutrasDespesas` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDENTE_PROCESSAMENTO', 'PROCESSADA', 'PENDENTE_CONFERENCIA', 'EM_CONFERENCIA', 'CONFERIDA', 'AGUARDANDO_ATESTO', 'ATESTADA', 'REJEITADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE_PROCESSAMENTO',
    `resultadoConciliacao` ENUM('CONCILIADA', 'CONCILIADA_COM_RESSALVAS', 'DIVERGENTE', 'PENDENTE', 'NAO_CONCILIADA') NULL,
    `xmlDocumentoId` VARCHAR(191) NULL,
    `pdfDocumentoId` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `pnae_notas_fiscais_chaveAcesso_key`(`chaveAcesso`),
    INDEX `pnae_notas_fiscais_fornecedorId_idx`(`fornecedorId`),
    INDEX `pnae_notas_fiscais_contratoId_idx`(`contratoId`),
    INDEX `pnae_notas_fiscais_status_idx`(`status`),
    INDEX `pnae_notas_fiscais_dataEmissao_idx`(`dataEmissao`),
    INDEX `pnae_notas_fiscais_resultadoConciliacao_idx`(`resultadoConciliacao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_nota_fiscal_itens
-- =====================================================
CREATE TABLE `pnae_nota_fiscal_itens` (
    `id` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NOT NULL,
    `numeroItem` INTEGER NOT NULL,
    `codigoProduto` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `ncm` VARCHAR(191) NULL,
    `cfop` VARCHAR(191) NULL,
    `unidadeComercial` VARCHAR(191) NULL,
    `quantidade` DECIMAL(14, 4) NOT NULL,
    `valorUnitario` DECIMAL(14, 4) NOT NULL,
    `valorTotal` DECIMAL(14, 2) NOT NULL,
    `contratoItemId` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pnae_nota_fiscal_itens_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_nota_fiscal_itens_contratoItemId_idx`(`contratoItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_nota_fiscal_documentos
-- =====================================================
CREATE TABLE `pnae_nota_fiscal_documentos` (
    `id` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `titulo` VARCHAR(191) NOT NULL,
    `arquivoPath` VARCHAR(191) NOT NULL,
    `arquivoNome` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `tamanhoBytes` INTEGER NOT NULL,
    `hashSha256` VARCHAR(191) NOT NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    INDEX `pnae_nota_fiscal_documentos_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_nota_fiscal_documentos_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_vinculo_recebimento_fiscal
-- =====================================================
CREATE TABLE `pnae_vinculo_recebimento_fiscal` (
    `id` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NOT NULL,
    `notaFiscalItemId` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `contratoItemId` VARCHAR(191) NOT NULL,
    `entregaId` VARCHAR(191) NOT NULL,
    `entregaItemId` VARCHAR(191) NOT NULL,
    `quantidadeVinculada` DECIMAL(14, 4) NOT NULL,
    `valorUnitarioFiscal` DECIMAL(14, 4) NOT NULL,
    `valorTotalVinculado` DECIMAL(14, 2) NOT NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    INDEX `pnae_vinculo_recebimento_fiscal_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_vinculo_recebimento_fiscal_notaFiscalItemId_idx`(`notaFiscalItemId`),
    INDEX `pnae_vinculo_recebimento_fiscal_contratoId_idx`(`contratoId`),
    INDEX `pnae_vinculo_recebimento_fiscal_entregaId_idx`(`entregaId`),
    INDEX `pnae_vinculo_recebimento_fiscal_entregaItemId_idx`(`entregaItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_divergencias_fiscais
-- =====================================================
CREATE TABLE `pnae_divergencias_fiscais` (
    `id` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NOT NULL,
    `notaFiscalItemId` VARCHAR(191) NULL,
    `tipo` ENUM('CPF_CNPJ_INCOMPATIVEL', 'PRODUTO_DIVERGENTE', 'QUANTIDADE_ACIMA_ACEITA', 'VALOR_UNITARIO_DIVERGENTE', 'VALOR_TOTAL_DIVERGENTE', 'NOTA_DUPLICADA', 'DOCUMENTO_AUSENTE', 'RECEBIMENTO_NAO_CONFIRMADO', 'CONTRATO_INCOMPATIVEL', 'UNIDADE_MEDIDA_INCOMPATIVEL', 'DESTINATARIO_INCOMPATIVEL', 'OUTRA') NOT NULL,
    `severidade` ENUM('BAIXA', 'MEDIA', 'ALTA', 'IMPEDITIVA') NOT NULL DEFAULT 'MEDIA',
    `descricao` TEXT NOT NULL,
    `valorEsperado` TEXT NULL,
    `valorEncontrado` TEXT NULL,
    `status` ENUM('ABERTA', 'EM_ANALISE', 'CORRIGIDA', 'JUSTIFICADA', 'REJEITADA', 'ENCERRADA') NOT NULL DEFAULT 'ABERTA',
    `responsavelId` VARCHAR(191) NULL,
    `justificativa` TEXT NULL,
    `evidenciaPath` VARCHAR(191) NULL,
    `dataResolucao` DATETIME(3) NULL,
    `resolvidoPor` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_divergencias_fiscais_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_divergencias_fiscais_notaFiscalItemId_idx`(`notaFiscalItemId`),
    INDEX `pnae_divergencias_fiscais_tipo_idx`(`tipo`),
    INDEX `pnae_divergencias_fiscais_severidade_idx`(`severidade`),
    INDEX `pnae_divergencias_fiscais_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_conferencias_fiscais
-- =====================================================
CREATE TABLE `pnae_conferencias_fiscais` (
    `id` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NOT NULL,
    `responsavelId` VARCHAR(191) NOT NULL,
    `responsavelNome` VARCHAR(191) NULL,
    `dataConferencia` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('APROVADA', 'REJEITADA', 'PENDENTE_CORRECAO', 'COM_RESSALVAS') NOT NULL,
    `observacoes` TEXT NULL,
    `divergenciasJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    INDEX `pnae_conferencias_fiscais_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_conferencias_fiscais_responsavelId_idx`(`responsavelId`),
    INDEX `pnae_conferencias_fiscais_status_idx`(`status`),
    INDEX `pnae_conferencias_fiscais_dataConferencia_idx`(`dataConferencia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_atestos
-- =====================================================
CREATE TABLE `pnae_atestos` (
    `id` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `responsavelId` VARCHAR(191) NOT NULL,
    `dataAtesto` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valorAtestado` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('RASCUNHO', 'AGUARDANDO_VALIDACAO', 'ATESTADO', 'RETIFICADO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
    `justificativa` TEXT NULL,
    `documentoId` VARCHAR(191) NULL,
    `documentoPath` VARCHAR(191) NULL,
    `hashSha256` VARCHAR(191) NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `atestoAnteriorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_atestos_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_atestos_contratoId_idx`(`contratoId`),
    INDEX `pnae_atestos_responsavelId_idx`(`responsavelId`),
    INDEX `pnae_atestos_status_idx`(`status`),
    INDEX `pnae_atestos_dataAtesto_idx`(`dataAtesto`),
    INDEX `pnae_atestos_atestoAnteriorId_idx`(`atestoAnteriorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_liquidacoes
-- =====================================================
CREATE TABLE `pnae_liquidacoes` (
    `id` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NULL,
    `numeroProcesso` VARCHAR(191) NULL,
    `numeroLiquidacao` VARCHAR(191) NULL,
    `dataLiquidacao` DATETIME(3) NOT NULL,
    `valorLiquidado` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('REGISTRADA', 'CONFIRMADA', 'RETIFICADA', 'CANCELADA') NOT NULL DEFAULT 'REGISTRADA',
    `sistemaOrigem` VARCHAR(191) NULL,
    `referenciaExterna` VARCHAR(191) NULL,
    `documentoComprobatorioId` VARCHAR(191) NULL,
    `documentoPath` VARCHAR(191) NULL,
    `hashSha256` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `registradoPor` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_liquidacoes_contratoId_idx`(`contratoId`),
    INDEX `pnae_liquidacoes_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_liquidacoes_numeroLiquidacao_idx`(`numeroLiquidacao`),
    INDEX `pnae_liquidacoes_dataLiquidacao_idx`(`dataLiquidacao`),
    INDEX `pnae_liquidacoes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pnae_pagamentos
-- =====================================================
CREATE TABLE `pnae_pagamentos` (
    `id` VARCHAR(191) NOT NULL,
    `contratoId` VARCHAR(191) NOT NULL,
    `liquidacaoId` VARCHAR(191) NOT NULL,
    `notaFiscalId` VARCHAR(191) NULL,
    `numeroOrdemPagamento` VARCHAR(191) NULL,
    `dataPagamento` DATETIME(3) NOT NULL,
    `valorPago` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('REGISTRADO', 'CONFIRMADO', 'PARCIAL', 'ESTORNADO', 'CANCELADO') NOT NULL DEFAULT 'REGISTRADO',
    `referenciaExterna` VARCHAR(191) NULL,
    `sistemaOrigem` VARCHAR(191) NULL,
    `comprovanteId` VARCHAR(191) NULL,
    `comprovantePath` VARCHAR(191) NULL,
    `hashSha256` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `registradoPor` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `pnae_pagamentos_contratoId_idx`(`contratoId`),
    INDEX `pnae_pagamentos_liquidacaoId_idx`(`liquidacaoId`),
    INDEX `pnae_pagamentos_notaFiscalId_idx`(`notaFiscalId`),
    INDEX `pnae_pagamentos_numeroOrdemPagamento_idx`(`numeroOrdemPagamento`),
    INDEX `pnae_pagamentos_dataPagamento_idx`(`dataPagamento`),
    INDEX `pnae_pagamentos_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- FOREIGN KEYS (aditivas, sem alterar tabelas existentes)
-- =====================================================

-- NotaFiscal -> Produtor
ALTER TABLE `pnae_notas_fiscais` ADD CONSTRAINT `pnae_notas_fiscais_fornecedorId_fkey` FOREIGN KEY (`fornecedorId`) REFERENCES `produtores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- NotaFiscal -> Contrato
ALTER TABLE `pnae_notas_fiscais` ADD CONSTRAINT `pnae_notas_fiscais_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `pnae_contratos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- NotaFiscal -> NotaFiscalDocumento (XML)
ALTER TABLE `pnae_notas_fiscais` ADD CONSTRAINT `pnae_notas_fiscais_xmlDocumentoId_fkey` FOREIGN KEY (`xmlDocumentoId`) REFERENCES `pnae_nota_fiscal_documentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- NotaFiscal -> NotaFiscalDocumento (PDF)
ALTER TABLE `pnae_notas_fiscais` ADD CONSTRAINT `pnae_notas_fiscais_pdfDocumentoId_fkey` FOREIGN KEY (`pdfDocumentoId`) REFERENCES `pnae_nota_fiscal_documentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- NotaFiscalItem -> NotaFiscal
ALTER TABLE `pnae_nota_fiscal_itens` ADD CONSTRAINT `pnae_nota_fiscal_itens_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- NotaFiscalItem -> ContratoItem
ALTER TABLE `pnae_nota_fiscal_itens` ADD CONSTRAINT `pnae_nota_fiscal_itens_contratoItemId_fkey` FOREIGN KEY (`contratoItemId`) REFERENCES `pnae_contrato_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- NotaFiscalDocumento -> NotaFiscal
ALTER TABLE `pnae_nota_fiscal_documentos` ADD CONSTRAINT `pnae_nota_fiscal_documentos_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- VinculoRecebimentoFiscal -> NotaFiscal
ALTER TABLE `pnae_vinculo_recebimento_fiscal` ADD CONSTRAINT `pnae_vinculo_recebimento_fiscal_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- VinculoRecebimentoFiscal -> NotaFiscalItem
ALTER TABLE `pnae_vinculo_recebimento_fiscal` ADD CONSTRAINT `pnae_vinculo_recebimento_fiscal_notaFiscalItemId_fkey` FOREIGN KEY (`notaFiscalItemId`) REFERENCES `pnae_nota_fiscal_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- VinculoRecebimentoFiscal -> Contrato
ALTER TABLE `pnae_vinculo_recebimento_fiscal` ADD CONSTRAINT `pnae_vinculo_recebimento_fiscal_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `pnae_contratos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- VinculoRecebimentoFiscal -> ContratoItem
ALTER TABLE `pnae_vinculo_recebimento_fiscal` ADD CONSTRAINT `pnae_vinculo_recebimento_fiscal_contratoItemId_fkey` FOREIGN KEY (`contratoItemId`) REFERENCES `pnae_contrato_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- VinculoRecebimentoFiscal -> Entrega
ALTER TABLE `pnae_vinculo_recebimento_fiscal` ADD CONSTRAINT `pnae_vinculo_recebimento_fiscal_entregaId_fkey` FOREIGN KEY (`entregaId`) REFERENCES `pnae_entregas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- VinculoRecebimentoFiscal -> EntregaItem
ALTER TABLE `pnae_vinculo_recebimento_fiscal` ADD CONSTRAINT `pnae_vinculo_recebimento_fiscal_entregaItemId_fkey` FOREIGN KEY (`entregaItemId`) REFERENCES `pnae_entrega_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- DivergenciaFiscal -> NotaFiscal
ALTER TABLE `pnae_divergencias_fiscais` ADD CONSTRAINT `pnae_divergencias_fiscais_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- DivergenciaFiscal -> NotaFiscalItem
ALTER TABLE `pnae_divergencias_fiscais` ADD CONSTRAINT `pnae_divergencias_fiscais_notaFiscalItemId_fkey` FOREIGN KEY (`notaFiscalItemId`) REFERENCES `pnae_nota_fiscal_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ConferenciaFiscal -> NotaFiscal
ALTER TABLE `pnae_conferencias_fiscais` ADD CONSTRAINT `pnae_conferencias_fiscais_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Atesto -> NotaFiscal
ALTER TABLE `pnae_atestos` ADD CONSTRAINT `pnae_atestos_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Atesto -> Contrato
ALTER TABLE `pnae_atestos` ADD CONSTRAINT `pnae_atestos_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `pnae_contratos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Atesto -> Atesto (auto-referência para retificação)
ALTER TABLE `pnae_atestos` ADD CONSTRAINT `pnae_atestos_atestoAnteriorId_fkey` FOREIGN KEY (`atestoAnteriorId`) REFERENCES `pnae_atestos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Liquidacao -> Contrato
ALTER TABLE `pnae_liquidacoes` ADD CONSTRAINT `pnae_liquidacoes_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `pnae_contratos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Liquidacao -> NotaFiscal
ALTER TABLE `pnae_liquidacoes` ADD CONSTRAINT `pnae_liquidacoes_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Pagamento -> Contrato
ALTER TABLE `pnae_pagamentos` ADD CONSTRAINT `pnae_pagamentos_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `pnae_contratos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Pagamento -> Liquidacao
ALTER TABLE `pnae_pagamentos` ADD CONSTRAINT `pnae_pagamentos_liquidacaoId_fkey` FOREIGN KEY (`liquidacaoId`) REFERENCES `pnae_liquidacoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Pagamento -> NotaFiscal
ALTER TABLE `pnae_pagamentos` ADD CONSTRAINT `pnae_pagamentos_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `pnae_notas_fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
