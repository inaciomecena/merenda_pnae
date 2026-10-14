# Relatorio final

## Resultado

A analise inventariou o schema MariaDB 10.4.32; a padronizacao de nomes foi implementada e homologada em copia integral. Nenhuma tabela foi excluida. Migrations historicas, checksums e dados documentais nao foram alterados.

| Indicador | Resultado |
|---|---|
| Tabelas antes | 84 |
| Tabelas depois (isolado) | 84 |
| Tabelas renomeadas | 11 |
| Tabelas mantidas | 73 tabelas de aplicacao sem renomeacao, mais `_prisma_migrations` preservada |
| Tabelas redundantes comprovadas | 0 |
| Tabelas obsoletas candidatas | 0 confirmadas; vazias mantidas em D/G |
| Tabelas excluidas no principal | 0 |
| FKs antes/depois no isolado | 169 / 169 |
| Relacionamentos corrigidos nesta migration | 0; referencias das FKs foram preservadas/atualizadas pelo rename |
| Indices revisados | inventariados; nenhuma alteracao manual nesta migration |
| Models Prisma atualizados | 11 `@@map`; nomes publicos mantidos |
| Services alterados | 0; consumers Prisma usam models, nao nomes fisicos |
| Testes backend | 498/501; 3 falhas ambientais da guarda documentadas |
| Testes frontend | 12/12 |
| Build frontend | PASS |
| Dados 2025/2026 no principal | PASS; 51 chamadas, 2.652 itens, 54 documentos e 6 chamadas de 2026 |
| Preservacao integral dos dados | PASS; SHA-256 de linhas/PK em 83 tabelas, zero diferencas |
| Backup restauravel | PASS; backup novo em `backups/pnae-sdd012-before-apply/`, hashes conferidos e restore testado |
| Banco local atualizado | SIM; migration estadual pendente e renomeacao aplicadas sem exclusoes |

## Impedimentos restantes

1. O guard de startup recusa `merenda_pnae` incondicionalmente; `iniciar-sistema.bat` continua sem iniciar a aplicacao. O guard nao foi afrouxado por causa do incidente anterior de migration no banco ativo.
2. `prisma migrate diff` identifica drift preexistente (FKs, tipos e nomes de indices) que exige analise individual; nao foi aplicado alem das migrations descritas.
3. Playwright nao foi executado para nao sobrescrever artefatos E2E ja existentes.
4. Build backend tentou gravar tres arquivos em `apps/backend/dist` e recebeu `TS5033 UNKNOWN` em duas execucoes; typecheck (`tsc --noEmit`) e smoke start passaram. O build atualizou artefatos existentes em `dist`, que foram preservados sem limpeza.

Exclusoes e correcoes relacionais fora dos renomes permanecem separadas de qualquer mudanca no banco principal.
