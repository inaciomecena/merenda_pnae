ALTER TABLE `escolas`
  ADD COLUMN `restricaoAtendimento` VARCHAR(191) NULL,
  ADD COLUMN `localizacao` VARCHAR(191) NULL,
  ADD COLUMN `localidadeDiferenciada` VARCHAR(191) NULL,
  ADD COLUMN `categoriaAdministrativa` VARCHAR(191) NULL,
  ADD COLUMN `dependenciaAdministrativa` VARCHAR(191) NULL,
  ADD COLUMN `categoriaEscolaPrivada` VARCHAR(191) NULL,
  ADD COLUMN `conveniadaPoderPublico` VARCHAR(191) NULL,
  ADD COLUMN `regulamentacaoConselho` VARCHAR(191) NULL,
  ADD COLUMN `porteEscola` VARCHAR(191) NULL,
  ADD COLUMN `etapasModalidades` TEXT NULL,
  ADD COLUMN `outrasOfertasEducacionais` VARCHAR(191) NULL,
  ADD COLUMN `latitude` DECIMAL(12,8) NULL,
  ADD COLUMN `longitude` DECIMAL(12,8) NULL;
