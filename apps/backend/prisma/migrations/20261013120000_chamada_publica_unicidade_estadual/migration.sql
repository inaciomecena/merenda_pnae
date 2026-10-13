-- Unicidade EFETIVA de `ChamadaPublica` em dois escopos, garantida na camada de
-- persistência (não apenas no service):
--
--   1. Escopo DRE      : (dreId, numero, exercicio)
--        -> já coberto pelo índice `pnae_chamadas_publicas_dreId_numero_exercicio_key`
--           criado pela migration 20261012180000_chamada_publica_unicidade_por_dre.
--
--   2. Escopo ESTADUAL : linhas com `dreId IS NULL`
--        -> MySQL/MariaDB NÃO restringe duplicidade em índice UNIQUE quando a
--           coluna é NULL (NULL <> NULL). Para proteger o escopo estadual sem
--           tornar `dreId` obrigatório (relação opcional preservada) e sem
--           alterar nenhum dado legado, esta migration cria a coluna GERADA
--
--             dreEscopo = IFNULL(dreId, 'ESTADUAL')   (STORED)
--
--           e o índice único composto (dreEscopo, numero, exercicio), que
--           garante:
--             * mesma DRE + mesmo numero + mesmo exercicio   -> BLOQUEADO;
--             * DREs diferentes + mesmo numero/exercicio     -> PERMITIDO;
--             * mesma DRE + exercicios diferentes            -> PERMITIDO;
--             * estaduais (NULL) duplicadas no mesmo exerc.  -> BLOQUEADO;
--             * estadual x DRE com mesmo numero/exercicio    -> PERMITIDO
--               (sentinela 'ESTADUAL' nunca igual a um dreId real, que é UUID
--               da tabela `dres`).
--
-- A sentinela literal 'ESTADUAL' não pode colidir com valores reais de `dreId`
-- porque `dres.id` é UUID (String @default(uuid())) — um UUID nunca é a string
-- exata 'ESTADUAL'.
--
-- A coluna gerada não é inserível/editável: o INSERT do Prisma não a inclui
-- (não está em uso no cliente; marcada `@ignore` no schema.prisma) e o banco
-- sempre a recalcula a partir de `dreId`. Nenhum dado existente é alterado —
-- apenas uma coluna derivada é materializada.
--
-- SQL não representável em Prisma Schema Language (PSL): geração de coluna não
-- existe no PSL. Esta migration é a fonte versionada da DDL; qualquer migration
-- futura que recriar `pnae_chamadas_publicas` (CREATE TABLE) deverá reproduzir
-- esta definição — ver docs/importacao-pnae-2025/DECISAO_ARQUITETURAL_UNICIDADE.md
-- §"Compatibilidade com Prisma".

-- AlterTable: coluna gerada STORED (MariaDB >= 10.2 / MySQL >= 5.7)
ALTER TABLE `pnae_chamadas_publicas`
  ADD COLUMN `dreEscopo` VARCHAR(191)
  GENERATED ALWAYS AS (IFNULL(`dreId`, 'ESTADUAL')) STORED;

-- CreateIndex: unicidade efetiva por escopo (DRE ou ESTADUAL) + numero + exercicio
CREATE UNIQUE INDEX `pnae_chamadas_publicas_dreEscopo_numero_exercicio_key`
  ON `pnae_chamadas_publicas`(`dreEscopo`, `numero`, `exercicio`);
