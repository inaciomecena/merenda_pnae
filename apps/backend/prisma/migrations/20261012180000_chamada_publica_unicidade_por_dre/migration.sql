-- Unicidade de ChamadaPublica POR DRE — importação histórica PNAE MT 2025.
--
-- Objetivo: permitir que o mesmo `numero` exista em DREs diferentes do mesmo
-- `exercicio` (numeração local por DRE). Antes, a unique global (numero,
-- exercicio) colidiria entre DREs.
--
-- ATENÇÃO (limitação documentada): em MySQL/MariaDB um índice UNIQUE não
-- restringe linhas com coluna anulável = NULL. Como `dreId` é anulável, o
-- índice novo NÃO impede duplicidade quando `dreId` é nulo (as 6 chamadas de
-- 2026 existentes têm dreId NULL). Esse caso é tratado na camada de aplicação
-- (ChamadasPublicasService#verificarUnicidade). Ver
-- docs/importacao-pnae-2025/AUDITORIA_UNICIDADE_2025.md.
--
-- Compatibilidade com dados existentes: as 6 linhas atuais (exercicio 2026,
-- numero E2E-*, dreId NULL) não colidem em nenhuma das duas regras; nenhuma
-- linha precisa ser alterada. Operação puramente de índice — reversível.

-- 1) Remove o índice único antigo (nome determinístico do Prisma).
DROP INDEX `pnae_chamadas_publicas_numero_exercicio_key` ON `pnae_chamadas_publicas`;

-- 2) Cria o índice único composto novo (nome determinístico do Prisma).
CREATE UNIQUE INDEX `pnae_chamadas_publicas_dreId_numero_exercicio_key` ON `pnae_chamadas_publicas`(`dreId`, `numero`, `exercicio`);
