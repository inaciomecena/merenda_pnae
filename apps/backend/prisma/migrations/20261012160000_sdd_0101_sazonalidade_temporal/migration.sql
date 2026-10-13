ALTER TABLE `sdd010_sazonalidade_producao`
  ADD COLUMN `unidadeProdutivaId` VARCHAR(191) NULL,
  ADD COLUMN `anoReferencia` INTEGER NULL,
  ADD COLUMN `tipoPeriodo` VARCHAR(32) NULL;

ALTER TABLE `sdd010_sazonalidade_producao`
  DROP INDEX `sdd010_sazonalidade_producao_produtorId_produtoProdutorId_me_key`,
  ADD UNIQUE INDEX `sdd010_sazonalidade_temporal_key` (`produtorId`, `produtoProdutorId`, `unidadeProdutivaId`, `anoReferencia`, `mes`, `safraProducaoId`);

CREATE INDEX `sdd010_sazonalidade_unidade_ano_idx`
  ON `sdd010_sazonalidade_producao`(`unidadeProdutivaId`, `anoReferencia`);

CREATE INDEX `sdd010_sazonalidade_produtor_mes_ano_idx`
  ON `sdd010_sazonalidade_producao`(`produtorId`, `mes`, `anoReferencia`);

ALTER TABLE `sdd010_sazonalidade_producao`
  ADD CONSTRAINT `sdd010_sazonalidade_producao_unidadeProdutivaId_fkey`
  FOREIGN KEY (`unidadeProdutivaId`) REFERENCES `sdd010_unidades_produtivas`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
