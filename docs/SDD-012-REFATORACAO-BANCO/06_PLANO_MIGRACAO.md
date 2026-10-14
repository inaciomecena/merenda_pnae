# Plano de migracao

## Escopo executado

1. Restaurar um dump completo recente em schema isolado.
2. Aplicar a migration pendente `20261013120000_chamada_publica_unicidade_estadual` na copia, preservando a regra de unicidade efetiva por DRE/escopo estadual.
3. Aplicar `20261014120000_normalizacao_nomes_tabelas`, que renomeia as 11 tabelas listadas em `03_PADRAO_NOMENCLATURA.md`.
4. Atualizar os `@@map` Prisma; manter nomes de models e propriedades publicas.
5. Atualizar o verificador SDD-005 que verificava `pnae_system_config`.
6. Gerar Prisma Client e executar testes e comparacoes antes de considerar aplicacao local.

## Propriedades da migration nova

- Uma instrucao `RENAME TABLE` com 11 pares, compativel com MariaDB 10.4.32.
- Sem `DROP TABLE`, `CREATE TABLE`, `UPDATE`, `DELETE`, conversao de dados, mudanca de PK ou alteracao de regra de negocio.
- FKs, indices e dados permanecem ligados as tabelas renomeadas.
- Reversao tecnica preparada: executar os pares de `RENAME TABLE` em ordem inversa antes de qualquer migration posterior que dependa dos nomes novos; nao marcar migration como revertida automaticamente.
- Migrations historicas e checksums permanecem intocados.

## Drift Prisma existente

`prisma migrate diff` contra a base anterior apontou, alem da migration estadual pendente, varias diferencas de nomes de FKs/indices e alguns tipos/relacionamentos. O diff inclui operacoes `DROP FOREIGN KEY`, alteracoes de largura de colunas e recriacao de indices. Elas nao foram aplicadas automaticamente: nao ha evidencia suficiente para afirmar que todas sejam incorretas, e aceitar o diff completo pode reduzir integridade ou alterar dados. O escopo desta migration limita-se a renomes de tabela e ao historico pendente previamente versionado.

## Exclusoes

Nenhuma tabela sera removida nesta migration. Estruturas candidatas permanecem preservadas ate prova funcional e aprovacao especifica, conforme `05_MATRIZ_OBSOLESCENCIA.md`.
