-- Decisão: não existia role DRE. O painel da DRE usa o enum Role e o guard @Roles já existentes.
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'ESCOLA', 'EXTENSIONISTA', 'DRE') NOT NULL DEFAULT 'ADMIN';

CREATE TABLE `pnae_templates_documento` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('EDITAL_PRINCIPAL', 'ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V', 'ANEXO_VI', 'ANEXO_VII') NOT NULL,
    `numeroAnexo` INTEGER NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `formato` ENUM('HTML', 'DOCX', 'TEXTO') NOT NULL DEFAULT 'HTML',
    `vigenciaInicio` DATETIME(3) NULL,
    `vigenciaFim` DATETIME(3) NULL,
    `arquivoBase` VARCHAR(191) NULL,
    `conteudo` LONGTEXT NULL,
    `versaoAtual` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    INDEX `pnae_templates_documento_tipo_ativo_idx`(`tipo`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_template_versoes` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `conteudo` LONGTEXT NULL,
    `formato` ENUM('HTML', 'DOCX', 'TEXTO') NOT NULL,
    `arquivoBase` VARCHAR(191) NULL,
    `vigenciaInicio` DATETIME(3) NULL,
    `vigenciaFim` DATETIME(3) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    UNIQUE INDEX `pnae_template_versoes_templateId_numero_key`(`templateId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_campos_template` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `rotulo` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'texto',
    `obrigatorio` BOOLEAN NOT NULL DEFAULT false,
    `valorPadrao` TEXT NULL,
    `repetitivo` BOOLEAN NOT NULL DEFAULT false,
    `anexoTipo` ENUM('EDITAL_PRINCIPAL', 'ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V', 'ANEXO_VI', 'ANEXO_VII') NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `pnae_campos_template_templateId_chave_idx`(`templateId`, `chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_edital_documentos` (
    `id` VARCHAR(191) NOT NULL,
    `editalId` VARCHAR(191) NOT NULL,
    `statusComposicao` ENUM('RASCUNHO', 'EM_CONFERENCIA', 'PRONTO_PARA_GERAR', 'GERADO', 'PUBLICADO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
    `processoAdministrativo` VARCHAR(191) NULL,
    `localRecebimento` TEXT NULL,
    `dataRecebimento` DATETIME(3) NULL,
    `horarioRecebimento` VARCHAR(191) NULL,
    `comissao` TEXT NULL,
    `legislacaoAplicavel` TEXT NULL,
    `prazoVigencia` VARCHAR(191) NULL,
    `condicoesParticipacao` LONGTEXT NULL,
    `criteriosHabilitacao` LONGTEXT NULL,
    `regrasEntrega` TEXT NULL,
    `formaPagamento` TEXT NULL,
    `penalidades` TEXT NULL,
    `foro` VARCHAR(191) NULL,
    `observacoesDocumento` TEXT NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `arquivoFonte` VARCHAR(191) NULL,
    `importacaoId` VARCHAR(191) NULL,
    `conteudoManual` LONGTEXT NULL,
    `versaoAtual` INTEGER NOT NULL DEFAULT 1,
    `publicadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    UNIQUE INDEX `pnae_edital_documentos_editalId_key`(`editalId`),
    INDEX `pnae_edital_documentos_statusComposicao_idx`(`statusComposicao`),
    INDEX `pnae_edital_documentos_importacaoId_idx`(`importacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_edital_versoes` (
    `id` VARCHAR(191) NOT NULL,
    `documentoId` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `statusComposicao` ENUM('RASCUNHO', 'EM_CONFERENCIA', 'PRONTO_PARA_GERAR', 'GERADO', 'PUBLICADO', 'CANCELADO') NOT NULL,
    `snapshot` LONGTEXT NOT NULL,
    `motivo` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    UNIQUE INDEX `pnae_edital_versoes_documentoId_numero_key`(`documentoId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_edital_anexos` (
    `id` VARCHAR(191) NOT NULL,
    `documentoId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `templateVersaoId` VARCHAR(191) NULL,
    `tipo` ENUM('EDITAL_PRINCIPAL', 'ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V', 'ANEXO_VI', 'ANEXO_VII') NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `titulo` VARCHAR(191) NOT NULL,
    `incluido` BOOLEAN NOT NULL DEFAULT true,
    `conteudoManual` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `pnae_edital_anexos_documentoId_ordem_idx`(`documentoId`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_edital_variaveis` (
    `id` VARCHAR(191) NOT NULL,
    `documentoId` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `valor` LONGTEXT NULL,
    `valorExtraido` LONGTEXT NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `confianca` VARCHAR(191) NULL,
    `paginaOrigem` INTEGER NULL,
    `obrigatorio` BOOLEAN NOT NULL DEFAULT false,
    `sensivel` BOOLEAN NOT NULL DEFAULT false,
    `escopo` VARCHAR(191) NOT NULL DEFAULT '',
    `statusRevisao` VARCHAR(191) NOT NULL DEFAULT 'confirmado',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `pnae_edital_variaveis_documentoId_chave_escopo_key`(`documentoId`, `chave`, `escopo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_importacao_estruturas` (
    `id` VARCHAR(191) NOT NULL,
    `importLogId` VARCHAR(191) NOT NULL,
    `editalId` VARCHAR(191) NULL,
    `textoExtraido` LONGTEXT NULL,
    `secoesJson` LONGTEXT NULL,
    `anexosJson` LONGTEXT NULL,
    `tabelasJson` LONGTEXT NULL,
    `assinaturasJson` LONGTEXT NULL,
    `confiancaGeral` VARCHAR(191) NULL,
    `parametrizado` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `pnae_importacao_estruturas_importLogId_key`(`importLogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_importacao_campos` (
    `id` VARCHAR(191) NOT NULL,
    `estruturaId` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `rotulo` VARCHAR(191) NOT NULL,
    `valor` TEXT NULL,
    `valorExtraido` TEXT NULL,
    `trecho` TEXT NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'extraido_automaticamente',
    `confianca` VARCHAR(191) NULL,
    `paginaOrigem` INTEGER NULL,
    `secao` VARCHAR(191) NULL,
    `editavel` BOOLEAN NOT NULL DEFAULT true,
    `sensivel` BOOLEAN NOT NULL DEFAULT false,
    `statusRevisao` VARCHAR(191) NOT NULL DEFAULT 'pendente_revisao',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `pnae_importacao_campos_estruturaId_chave_idx`(`estruturaId`, `chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_historico_geracao_documento` (
    `id` VARCHAR(191) NOT NULL,
    `documentoId` VARCHAR(191) NOT NULL,
    `editalId` VARCHAR(191) NOT NULL,
    `versaoId` VARCHAR(191) NULL,
    `versaoNumero` INTEGER NOT NULL,
    `usuarioId` VARCHAR(191) NULL,
    `usuarioNome` VARCHAR(191) NULL,
    `formato` VARCHAR(191) NOT NULL,
    `arquivoPath` VARCHAR(191) NULL,
    `status` ENUM('SUCESSO', 'ERRO', 'VALIDACAO') NOT NULL,
    `mensagem` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `pnae_historico_geracao_documento_editalId_createdAt_idx`(`editalId`, `createdAt`),
    INDEX `pnae_historico_geracao_documento_documentoId_idx`(`documentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pnae_template_versoes` ADD CONSTRAINT `pnae_template_versoes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `pnae_templates_documento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_campos_template` ADD CONSTRAINT `pnae_campos_template_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `pnae_templates_documento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_edital_documentos` ADD CONSTRAINT `pnae_edital_documentos_editalId_fkey` FOREIGN KEY (`editalId`) REFERENCES `pnae_editais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_edital_versoes` ADD CONSTRAINT `pnae_edital_versoes_documentoId_fkey` FOREIGN KEY (`documentoId`) REFERENCES `pnae_edital_documentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_edital_anexos` ADD CONSTRAINT `pnae_edital_anexos_documentoId_fkey` FOREIGN KEY (`documentoId`) REFERENCES `pnae_edital_documentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_edital_anexos` ADD CONSTRAINT `pnae_edital_anexos_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `pnae_templates_documento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_edital_anexos` ADD CONSTRAINT `pnae_edital_anexos_templateVersaoId_fkey` FOREIGN KEY (`templateVersaoId`) REFERENCES `pnae_template_versoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_edital_variaveis` ADD CONSTRAINT `pnae_edital_variaveis_documentoId_fkey` FOREIGN KEY (`documentoId`) REFERENCES `pnae_edital_documentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_importacao_estruturas` ADD CONSTRAINT `pnae_importacao_estruturas_importLogId_fkey` FOREIGN KEY (`importLogId`) REFERENCES `pnae_import_logs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_importacao_campos` ADD CONSTRAINT `pnae_importacao_campos_estruturaId_fkey` FOREIGN KEY (`estruturaId`) REFERENCES `pnae_importacao_estruturas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_historico_geracao_documento` ADD CONSTRAINT `pnae_historico_geracao_documento_documentoId_fkey` FOREIGN KEY (`documentoId`) REFERENCES `pnae_edital_documentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_historico_geracao_documento` ADD CONSTRAINT `pnae_historico_geracao_documento_versaoId_fkey` FOREIGN KEY (`versaoId`) REFERENCES `pnae_edital_versoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
