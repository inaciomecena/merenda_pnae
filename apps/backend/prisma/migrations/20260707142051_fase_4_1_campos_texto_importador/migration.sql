-- AlterTable
ALTER TABLE `pnae_editais` MODIFY `descricao` TEXT NULL,
    MODIFY `objeto` TEXT NULL,
    MODIFY `observacoes` TEXT NULL;

-- AlterTable
ALTER TABLE `pnae_edital_itens` MODIFY `especificacao` TEXT NULL,
    MODIFY `observacoes` TEXT NULL;

-- AlterTable
ALTER TABLE `pnae_import_logs` MODIFY `resumo` TEXT NULL,
    MODIFY `mensagemErro` TEXT NULL,
    MODIFY `objeto` TEXT NULL;

