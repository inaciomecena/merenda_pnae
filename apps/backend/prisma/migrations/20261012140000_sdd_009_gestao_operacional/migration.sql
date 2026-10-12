CREATE TABLE `pnae_configuracoes_institucionais` (
  `id` VARCHAR(191) NOT NULL,
  `chave` VARCHAR(191) NOT NULL,
  `valor` TEXT NOT NULL,
  `tipo` VARCHAR(191) NOT NULL DEFAULT 'texto',
  `escopo` ENUM('GLOBAL','DRE','ESCOLA','MUNICIPIO') NOT NULL DEFAULT 'GLOBAL',
  `origem` ENUM('ADMINISTRATIVA','NORMATIVA','SISTEMA') NOT NULL DEFAULT 'ADMINISTRATIVA',
  `permiteSobrescrita` BOOLEAN NOT NULL DEFAULT true,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `versao` INTEGER NOT NULL DEFAULT 1,
  `vigenteDesde` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `vigenteAte` DATETIME(3) NULL,
  `responsavelId` VARCHAR(191) NULL,
  `dreId` VARCHAR(191) NULL,
  `escolaId` VARCHAR(191) NULL,
  `municipioId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `config_chave_escopo_ativo_idx` (`chave`,`escopo`,`ativo`),
  INDEX `config_scope_idx` (`dreId`,`escolaId`,`municipioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_configuracoes_institucionais_historico` (
  `id` VARCHAR(191) NOT NULL,
  `configuracaoId` VARCHAR(191) NOT NULL,
  `versao` INTEGER NOT NULL,
  `valor` TEXT NOT NULL,
  `responsavelId` VARCHAR(191) NULL,
  `alteradoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `observacao` TEXT NULL,
  UNIQUE INDEX `config_historico_versao_key` (`configuracaoId`,`versao`),
  INDEX `config_historico_data_idx` (`alteradoEm`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_parametros_operacionais` (
  `id` VARCHAR(191) NOT NULL,
  `codigo` VARCHAR(191) NOT NULL,
  `descricao` TEXT NOT NULL,
  `tipo` VARCHAR(191) NOT NULL DEFAULT 'texto',
  `escopo` ENUM('GLOBAL','DRE','ESCOLA','MUNICIPIO') NOT NULL DEFAULT 'GLOBAL',
  `unidade` VARCHAR(191) NULL,
  `origem` ENUM('ADMINISTRATIVA','NORMATIVA','SISTEMA') NOT NULL DEFAULT 'ADMINISTRATIVA',
  `fonteNormativa` VARCHAR(191) NULL,
  `permiteAlteracao` BOOLEAN NOT NULL DEFAULT true,
  `status` ENUM('ATIVO','PENDENTE_VALIDACAO','INATIVO') NOT NULL DEFAULT 'PENDENTE_VALIDACAO',
  `versaoAtual` INTEGER NOT NULL DEFAULT 0,
  `responsavelId` VARCHAR(191) NULL,
  `vigenteDesde` DATETIME(3) NULL,
  `vigenteAte` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `parametro_codigo_key` (`codigo`),
  INDEX `parametro_status_escopo_idx` (`status`,`escopo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_parametros_operacionais_versoes` (
  `id` VARCHAR(191) NOT NULL,
  `parametroId` VARCHAR(191) NOT NULL,
  `versao` INTEGER NOT NULL,
  `valor` TEXT NOT NULL,
  `escopo` ENUM('GLOBAL','DRE','ESCOLA','MUNICIPIO') NOT NULL DEFAULT 'GLOBAL',
  `dreId` VARCHAR(191) NULL,
  `escolaId` VARCHAR(191) NULL,
  `municipioId` VARCHAR(191) NULL,
  `status` ENUM('ATIVO','PENDENTE_VALIDACAO','INATIVO') NOT NULL DEFAULT 'PENDENTE_VALIDACAO',
  `justificativa` TEXT NULL,
  `fonteNormativa` VARCHAR(191) NULL,
  `vigenteDesde` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `vigenteAte` DATETIME(3) NULL,
  `responsavelId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `parametro_versao_key` (`parametroId`,`versao`),
  INDEX `parametro_versao_scope_idx` (`escopo`,`dreId`,`escolaId`,`municipioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_notificacoes_internas` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `mensagem` TEXT NOT NULL,
  `status` ENUM('NAO_LIDA','LIDA') NOT NULL DEFAULT 'NAO_LIDA',
  `referenciaTipo` VARCHAR(191) NULL,
  `referenciaId` VARCHAR(191) NULL,
  `link` VARCHAR(191) NULL,
  `origem` VARCHAR(191) NULL,
  `dedupeKey` VARCHAR(191) NOT NULL,
  `escopo` ENUM('GLOBAL','DRE','ESCOLA','MUNICIPIO') NOT NULL DEFAULT 'GLOBAL',
  `dreId` VARCHAR(191) NULL,
  `escolaId` VARCHAR(191) NULL,
  `municipioId` VARCHAR(191) NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lidaEm` DATETIME(3) NULL,
  UNIQUE INDEX `notificacao_dedupe_key` (`dedupeKey`),
  INDEX `notificacao_user_status_idx` (`userId`,`status`,`criadoEm`),
  INDEX `notificacao_scope_idx` (`escopo`,`dreId`,`escolaId`,`municipioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_checklists_implantacao` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `escopo` ENUM('GLOBAL','DRE','ESCOLA','MUNICIPIO') NOT NULL DEFAULT 'GLOBAL',
  `dreId` VARCHAR(191) NULL,
  `escolaId` VARCHAR(191) NULL,
  `municipioId` VARCHAR(191) NULL,
  `status` ENUM('NAO_INICIADO','EM_CONFIGURACAO','PENDENTE_VALIDACAO','APTO_PARA_HOMOLOGACAO','HOMOLOGADO_OPERACIONALMENTE','BLOQUEADO') NOT NULL DEFAULT 'NAO_INICIADO',
  `observacao` TEXT NULL,
  `responsavelId` VARCHAR(191) NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizadoEm` DATETIME(3) NOT NULL,
  INDEX `checklist_status_escopo_idx` (`status`,`escopo`),
  INDEX `checklist_scope_idx` (`dreId`,`escolaId`,`municipioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pnae_itens_checklist_implantacao` (
  `id` VARCHAR(191) NOT NULL,
  `checklistId` VARCHAR(191) NOT NULL,
  `codigo` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDENTE','EM_ANALISE','CONCLUIDO','BLOQUEADO') NOT NULL DEFAULT 'PENDENTE',
  `evidencia` TEXT NULL,
  `responsavelId` VARCHAR(191) NULL,
  `prazo` DATETIME(3) NULL,
  `observacao` TEXT NULL,
  `pendencia` TEXT NULL,
  `atualizadoEm` DATETIME(3) NOT NULL,
  UNIQUE INDEX `checklist_item_codigo_key` (`checklistId`,`codigo`),
  INDEX `checklist_item_status_prazo_idx` (`status`,`prazo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pnae_configuracoes_institucionais` ADD CONSTRAINT `config_responsavel_fk` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pnae_configuracoes_institucionais` ADD CONSTRAINT `config_dre_fk` FOREIGN KEY (`dreId`) REFERENCES `dres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_configuracoes_institucionais` ADD CONSTRAINT `config_escola_fk` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_configuracoes_institucionais` ADD CONSTRAINT `config_municipio_fk` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_configuracoes_institucionais_historico` ADD CONSTRAINT `config_historico_config_fk` FOREIGN KEY (`configuracaoId`) REFERENCES `pnae_configuracoes_institucionais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_configuracoes_institucionais_historico` ADD CONSTRAINT `config_historico_user_fk` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pnae_parametros_operacionais` ADD CONSTRAINT `parametro_user_fk` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pnae_parametros_operacionais_versoes` ADD CONSTRAINT `parametro_versao_parametro_fk` FOREIGN KEY (`parametroId`) REFERENCES `pnae_parametros_operacionais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_parametros_operacionais_versoes` ADD CONSTRAINT `parametro_versao_user_fk` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pnae_notificacoes_internas` ADD CONSTRAINT `notificacao_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_checklists_implantacao` ADD CONSTRAINT `checklist_user_fk` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pnae_checklists_implantacao` ADD CONSTRAINT `checklist_dre_fk` FOREIGN KEY (`dreId`) REFERENCES `dres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_checklists_implantacao` ADD CONSTRAINT `checklist_escola_fk` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_checklists_implantacao` ADD CONSTRAINT `checklist_municipio_fk` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pnae_itens_checklist_implantacao` ADD CONSTRAINT `checklist_item_checklist_fk` FOREIGN KEY (`checklistId`) REFERENCES `pnae_checklists_implantacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pnae_itens_checklist_implantacao` ADD CONSTRAINT `checklist_item_user_fk` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
