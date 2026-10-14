# Validacao isolada

## Fonte e restauracao

- Fonte: backup integral validado `backups/pnae-2025-importado/merenda_pnae_com_editais_2025_2026.sql`.
- Schema de homologacao: `merenda_pnae_sdd012_homolog_20261013`.
- Restore completo por cliente MariaDB: PASS.
- Estado inicial restaurado: 84 tabelas, 169 FKs, 51 chamadas de 2025, seis chamadas de 2026, 2.652 itens da importacao e 54 documentos historicos.
- Hash do dump-fonte conferido; o backup contem os arquivos fisicos do pacote documental.

## Migrations

`prisma migrate deploy` aplicou na copia, em ordem, a migration estadual pendente e a nova migration de nomes. `prisma migrate status` depois da aplicacao: **Database schema is up to date**, 31 migrations aplicadas.

## Comparacao

- 83 tabelas de aplicacao comparadas individualmente por contagem: zero diferencas.
- Comparacao integral por SHA-256 dos valores de cada linha, ordenados pela PK, entre a copia de backup pre-migration e o principal apos a migration: 83 tabelas, zero diferencas.
- As 11 tabelas renomeadas estavam vazias antes e permaneceram vazias depois.
- Numero total de tabelas permaneceu 84; nenhuma foi criada ou removida pela migration de nomes.
- 169 FKs antes e depois; nenhuma FK composta; nenhum nome antigo `sdd*` permaneceu no catalogo; zero linhas orfas nas FKs.
- A consulta Prisma Client confirmou acesso pelos 11 mappings novos, alem das contagens de 2025 e itens.
- As migrations nao contem DML; os dados, IDs, audit logs, idempotencias e documentos existentes nao foram atualizados.

## Dados sentinela

| Conjunto | Antes | Depois | Resultado |
|---|---:|---:|---|
| Chamadas publicas 2025 | 51 | 51 | PASS |
| Itens importados 2025 | 2.652 | 2.652 | PASS |
| Documentos historicos vinculados | 54 | 54 | PASS |
| DREs na importacao | 6 | 6 | PASS |
| Chamadas 2026 | 6 | 6 | PASS |
| Idempotencias da importacao | 51 | 51 | PASS |
| Auditorias da importacao | 51 | 51 | PASS |

Esta homologacao testa renomeacao estrutural, nao saneamento de dados.

## Aplicacao no banco principal

- Backup integral novo criado em `backups/pnae-sdd012-before-apply/`; 280 arquivos do dump/documentos com SHA-256 conferidos.
- Dump restaurado em `merenda_pnae_sdd012_backup_20261013`; contagens sentinela (51/6/2.652/54/51/51) conferidas.
- `prisma migrate deploy` no destino confirmado `merenda_pnae@HP:3306`: PASS; aplicadas a migration estadual pendente e a migration de nomes.
- Comparacao por hash de dados e PK entre backup restaurado pre-migration e principal apos migration: 83 tabelas, zero diferencas.
- `prisma migrate status`: PASS, 31 migrations encontradas e schema atualizado.
- Estado final: 84 tabelas, 169 FKs, zero tabelas/refs `sdd*`, zero duplicidades para a chave efetiva, zero orfaos e preservacao dos dados 2025/2026, audit logs e idempotencias.
