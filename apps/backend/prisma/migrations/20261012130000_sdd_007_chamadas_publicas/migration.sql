ALTER TABLE `pnae_propostas`
  ADD COLUMN `categoriaParticipante` ENUM('INDIVIDUAL','GRUPO_INFORMAL','GRUPO_FORMAL','OUTRA') NULL,
  ADD COLUMN `chamadaPublicaId` VARCHAR(191) NULL,
  ADD COLUMN `enviadoEm` DATETIME(3) NULL,
  ADD COLUMN `identificacaoProjeto` VARCHAR(191) NULL,
  ADD COLUMN `statusHabilitacao` ENUM('PENDENTE','EM_ANALISE','HABILITADO','INABILITADO','PENDENTE_CORRECAO') NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN `statusSelecao` ENUM('PENDENTE','CLASSIFICADO','SELECIONADO','NAO_SELECIONADO') NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN `versaoProjeto` INTEGER NOT NULL DEFAULT 1;

CREATE TABLE `pnae_chamadas_publicas` (
  `id` VARCHAR(191) NOT NULL,
  `editalId` VARCHAR(191) NOT NULL,
  `numero` VARCHAR(191) NOT NULL,
  `exercicio` INTEGER NOT NULL,
  `objeto` TEXT NOT NULL,
  `entidadeExecutoraId` VARCHAR(191) NULL,
  `dreId` VARCHAR(191) NULL,
  `municipioId` VARCHAR(191) NULL,
  `inscricoesInicio` DATETIME(3) NOT NULL,
  `inscricoesFim` DATETIME(3) NOT NULL,
  `dataAbertura` DATETIME(3) NULL,
  `prazoDocumentos` DATETIME(3) NULL,
  `localApresentacao` VARCHAR(191) NULL,
  `formaApresentacao` VARCHAR(191) NULL,
  `status` ENUM('RASCUNHO','PUBLICADA','INSCRICOES_ABERTAS','INSCRICOES_ENCERRADAS','EM_HABILITACAO','EM_SELECAO','RESULTADO_PRELIMINAR','EM_RECURSO','HOMOLOGADA','CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
  `versaoPublicada` INTEGER NOT NULL DEFAULT 1,
  `publicadaEm` DATETIME(3) NULL,
  `responsavelId` VARCHAR(191) NULL,
  `observacoes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `createdBy` VARCHAR(191) NULL,
  `updatedBy` VARCHAR(191) NULL,
  INDEX `pnae_chamadas_publicas_editalId_idx` (`editalId`),
  INDEX `pnae_chamadas_publicas_dreId_municipioId_idx` (`dreId`,`municipioId`),
  INDEX `pnae_chamadas_publicas_status_inscricoesFim_idx` (`status`,`inscricoesFim`),
  UNIQUE INDEX `pnae_chamadas_publicas_numero_exercicio_key` (`numero`,`exercicio`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_chamadas_publicas_escolas` (
  `id` VARCHAR(191) NOT NULL,
  `chamadaId` VARCHAR(191) NOT NULL,
  `escolaId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `pnae_chamadas_publicas_escolas_escolaId_idx` (`escolaId`),
  UNIQUE INDEX `pnae_chamadas_publicas_escolas_chamadaId_escolaId_key` (`chamadaId`,`escolaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_chamadas_publicas_documentos` (
  `id` VARCHAR(191) NOT NULL,
  `chamadaId` VARCHAR(191) NOT NULL,
  `versao` INTEGER NOT NULL DEFAULT 1,
  `tipo` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `arquivoPath` VARCHAR(191) NULL,
  `arquivoNome` VARCHAR(191) NULL,
  `mimeType` VARCHAR(191) NULL,
  `hashSha256` VARCHAR(64) NULL,
  `publicado` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(191) NULL,
  INDEX `pnae_chamadas_publicas_documentos_chamadaId_versao_idx` (`chamadaId`,`versao`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_inscricoes_chamadas` (
  `id` VARCHAR(191) NOT NULL,
  `chamadaId` VARCHAR(191) NOT NULL,
  `produtorId` VARCHAR(191) NOT NULL,
  `categoria` ENUM('INDIVIDUAL','GRUPO_INFORMAL','GRUPO_FORMAL','OUTRA') NOT NULL,
  `representante` VARCHAR(191) NULL,
  `contato` VARCHAR(191) NULL,
  `status` ENUM('ATIVA','CANCELADA') NOT NULL DEFAULT 'ATIVA',
  `inscritoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `observacoes` TEXT NULL,
  INDEX `pnae_inscricoes_chamadas_produtorId_idx` (`produtorId`),
  UNIQUE INDEX `pnae_inscricoes_chamadas_chamadaId_produtorId_key` (`chamadaId`,`produtorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_requisitos_habilitacao` (
  `id` VARCHAR(191) NOT NULL,
  `chamadaId` VARCHAR(191) NOT NULL,
  `categoria` ENUM('INDIVIDUAL','GRUPO_INFORMAL','GRUPO_FORMAL','OUTRA') NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `descricao` VARCHAR(191) NOT NULL,
  `obrigatorio` BOOLEAN NOT NULL DEFAULT true,
  `validadeDias` INTEGER NULL,
  INDEX `pnae_requisitos_habilitacao_chamadaId_categoria_idx` (`chamadaId`,`categoria`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_habilitacao_documentos` (
  `id` VARCHAR(191) NOT NULL,
  `propostaId` VARCHAR(191) NOT NULL,
  `requisitoId` VARCHAR(191) NULL,
  `versao` INTEGER NOT NULL DEFAULT 1,
  `tipo` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `arquivoPath` VARCHAR(191) NULL,
  `arquivoNome` VARCHAR(191) NULL,
  `mimeType` VARCHAR(191) NULL,
  `tamanhoBytes` INTEGER NULL,
  `hashSha256` VARCHAR(64) NULL,
  `validadeAte` DATETIME(3) NULL,
  `status` ENUM('PENDENTE','EM_ANALISE','HABILITADO','INABILITADO','PENDENTE_CORRECAO') NOT NULL DEFAULT 'PENDENTE',
  `parecer` TEXT NULL,
  `conferidoEm` DATETIME(3) NULL,
  `conferidoPor` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(191) NULL,
  INDEX `pnae_habilitacao_documentos_propostaId_tipo_versao_idx` (`propostaId`,`tipo`,`versao`),
  INDEX `pnae_habilitacao_documentos_requisitoId_idx` (`requisitoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_analises_habilitacao` (
  `id` VARCHAR(191) NOT NULL,
  `propostaId` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDENTE','EM_ANALISE','HABILITADO','INABILITADO','PENDENTE_CORRECAO') NOT NULL DEFAULT 'PENDENTE',
  `parecer` TEXT NULL,
  `pendencias` TEXT NULL,
  `analisadoEm` DATETIME(3) NULL,
  `analisadoPor` VARCHAR(191) NULL,
  `versao` INTEGER NOT NULL DEFAULT 1,
  UNIQUE INDEX `pnae_analises_habilitacao_propostaId_key` (`propostaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_classificacoes_projetos` (
  `id` VARCHAR(191) NOT NULL,
  `propostaId` VARCHAR(191) NOT NULL,
  `editalItemId` VARCHAR(191) NOT NULL,
  `prioridade` INTEGER NOT NULL,
  `criterio` VARCHAR(191) NOT NULL,
  `valorConsiderado` DECIMAL(14,4) NULL,
  `justificativa` TEXT NULL,
  `quantidadeSelecionada` DECIMAL(14,4) NOT NULL DEFAULT 0,
  `valorSelecionado` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `status` ENUM('PENDENTE','CLASSIFICADO','SELECIONADO','NAO_SELECIONADO') NOT NULL DEFAULT 'PENDENTE',
  `criadoPor` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `pnae_classificacoes_projetos_editalItemId_prioridade_idx` (`editalItemId`,`prioridade`),
  UNIQUE INDEX `pnae_classificacoes_projetos_propostaId_editalItemId_key` (`propostaId`,`editalItemId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_resultados_chamadas` (
  `id` VARCHAR(191) NOT NULL,
  `chamadaId` VARCHAR(191) NOT NULL,
  `versao` INTEGER NOT NULL DEFAULT 1,
  `tipo` VARCHAR(191) NOT NULL,
  `geradoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `geradoPor` VARCHAR(191) NULL,
  `justificativa` TEXT NULL,
  `dadosJson` LONGTEXT NOT NULL,
  INDEX `pnae_resultados_chamadas_chamadaId_tipo_idx` (`chamadaId`,`tipo`),
  UNIQUE INDEX `pnae_resultados_chamadas_chamadaId_versao_key` (`chamadaId`,`versao`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_recursos_chamadas` (
  `id` VARCHAR(191) NOT NULL,
  `chamadaId` VARCHAR(191) NOT NULL,
  `propostaId` VARCHAR(191) NULL,
  `produtorId` VARCHAR(191) NOT NULL,
  `fundamentacao` TEXT NOT NULL,
  `anexosJson` LONGTEXT NULL,
  `prazoFinal` DATETIME(3) NULL,
  `status` ENUM('PENDENTE','DEFERIDO','INDEFERIDO','PARCIALMENTE_DEFERIDO') NOT NULL DEFAULT 'PENDENTE',
  `decisao` TEXT NULL,
  `decididoEm` DATETIME(3) NULL,
  `decididoPor` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(191) NULL,
  INDEX `pnae_recursos_chamadas_chamadaId_status_idx` (`chamadaId`,`status`),
  INDEX `pnae_recursos_chamadas_produtorId_idx` (`produtorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_homologacoes_chamadas` (
  `id` VARCHAR(191) NOT NULL,
  `chamadaId` VARCHAR(191) NOT NULL,
  `resultadoId` VARCHAR(191) NULL,
  `homologadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `homologadoPor` VARCHAR(191) NOT NULL,
  `fundamentacao` TEXT NOT NULL,
  `documentoId` VARCHAR(191) NULL,
  UNIQUE INDEX `pnae_homologacoes_chamadas_chamadaId_key` (`chamadaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `pnae_propostas_chamadaPublicaId_idx` ON `pnae_propostas` (`chamadaPublicaId`);
CREATE INDEX `pnae_propostas_statusHabilitacao_statusSelecao_idx` ON `pnae_propostas` (`statusHabilitacao`,`statusSelecao`);

ALTER TABLE `pnae_chamadas_publicas` ADD CONSTRAINT `pnae_chamadas_publicas_editalId_fkey` FOREIGN KEY (`editalId`) REFERENCES `pnae_editais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_chamadas_publicas` ADD CONSTRAINT `pnae_chamadas_publicas_entidadeExecutoraId_fkey` FOREIGN KEY (`entidadeExecutoraId`) REFERENCES `entidades_executoras`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_chamadas_publicas` ADD CONSTRAINT `pnae_chamadas_publicas_dreId_fkey` FOREIGN KEY (`dreId`) REFERENCES `dres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_chamadas_publicas` ADD CONSTRAINT `pnae_chamadas_publicas_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_chamadas_publicas_escolas` ADD CONSTRAINT `pnae_chamadas_publicas_escolas_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_chamadas_publicas_escolas` ADD CONSTRAINT `pnae_chamadas_publicas_escolas_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_chamadas_publicas_documentos` ADD CONSTRAINT `pnae_chamadas_publicas_documentos_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_inscricoes_chamadas` ADD CONSTRAINT `pnae_inscricoes_chamadas_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_inscricoes_chamadas` ADD CONSTRAINT `pnae_inscricoes_chamadas_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_requisitos_habilitacao` ADD CONSTRAINT `pnae_requisitos_habilitacao_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_habilitacao_documentos` ADD CONSTRAINT `pnae_habilitacao_documentos_propostaId_fkey` FOREIGN KEY (`propostaId`) REFERENCES `pnae_propostas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_habilitacao_documentos` ADD CONSTRAINT `pnae_habilitacao_documentos_requisitoId_fkey` FOREIGN KEY (`requisitoId`) REFERENCES `pnae_requisitos_habilitacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_analises_habilitacao` ADD CONSTRAINT `pnae_analises_habilitacao_propostaId_fkey` FOREIGN KEY (`propostaId`) REFERENCES `pnae_propostas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_classificacoes_projetos` ADD CONSTRAINT `pnae_classificacoes_projetos_propostaId_fkey` FOREIGN KEY (`propostaId`) REFERENCES `pnae_propostas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_classificacoes_projetos` ADD CONSTRAINT `pnae_classificacoes_projetos_editalItemId_fkey` FOREIGN KEY (`editalItemId`) REFERENCES `pnae_edital_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_resultados_chamadas` ADD CONSTRAINT `pnae_resultados_chamadas_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_recursos_chamadas` ADD CONSTRAINT `pnae_recursos_chamadas_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_recursos_chamadas` ADD CONSTRAINT `pnae_recursos_chamadas_propostaId_fkey` FOREIGN KEY (`propostaId`) REFERENCES `pnae_propostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_recursos_chamadas` ADD CONSTRAINT `pnae_recursos_chamadas_produtorId_fkey` FOREIGN KEY (`produtorId`) REFERENCES `produtores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_homologacoes_chamadas` ADD CONSTRAINT `pnae_homologacoes_chamadas_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_propostas` ADD CONSTRAINT `pnae_propostas_chamadaPublicaId_fkey` FOREIGN KEY (`chamadaPublicaId`) REFERENCES `pnae_chamadas_publicas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
