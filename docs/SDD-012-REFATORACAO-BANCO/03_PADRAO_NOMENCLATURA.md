# Padrao de nomenclatura

## Convencao adotada

- Tabelas especificas do sistema: prefixo `pnae_`, minusculas, `snake_case` e substantivos descritivos.
- Cadastros compartilhados permanecem sem prefixo: `municipios`, `escolas`, `dres`, `produtores`, `users` e `entidades_executoras`.
- Models Prisma permanecem em PascalCase; o nome fisico e declarado explicitamente por `@@map`.
- `_prisma_migrations` e nome tecnico reservado e permanece inalterado.
- Nomes historicos de migrations, FKs e indices nao sao reescritos retroativamente.

## Renomeacoes verificadas

| Atual | Novo | Model | Evidencia | Estado na copia isolada |
|---|---|---|---|---|
| `sdd010_unidades_produtivas` | `pnae_unidades_produtivas` | `UnidadeProdutiva` | model Prisma e FKs a produtores/municipios | renomeada; 0 linhas |
| `sdd010_safras_producao` | `pnae_safras_producao` | `SafraProducao` | model Prisma e FKs a oferta/unidade | renomeada; 0 linhas |
| `sdd010_sazonalidade_producao` | `pnae_sazonalidade_producao` | `SazonalidadeProducao` | model Prisma e FKs a safra/unidade | renomeada; 0 linhas |
| `sdd010_disponibilidades_producao` | `pnae_disponibilidades_producao` | `DisponibilidadeProducao` | model Prisma e FKs a safra/produto | renomeada; 0 linhas |
| `sdd010_logistica_produtor` | `pnae_logistica_produtores` | `LogisticaProdutor` | model Prisma e FK a produtor | renomeada; 0 linhas |
| `sdd010_informacoes_nutricionais` | `pnae_informacoes_nutricionais` | `InformacaoNutricional` | model Prisma e FK ao catalogo | renomeada; 0 linhas |
| `sdd010_assistencia_tecnica` | `pnae_assistencias_tecnicas` | `VinculoAssistenciaTecnica` | model Prisma e FKs a produtor/usuario | renomeada; 0 linhas |
| `sdd010_mapeamentos_produto_edital` | `pnae_mapeamentos_produto_edital` | `MapeamentoProdutoEdital` | model Prisma e FKs ao edital/produto | renomeada; 0 linhas |
| `sdd010_solicitacoes_catalogo` | `pnae_solicitacoes_catalogo` | `SolicitacaoCatalogoProduto` | model Prisma e FK ao solicitante | renomeada; 0 linhas |
| `sdd011_interesses_oportunidade` | `pnae_interesses_oportunidades` | `InteresseOportunidade` | model Prisma e FKs a produtor/chamada/item | renomeada; 0 linhas |
| `pnae_system_config` | `pnae_configuracoes_sistema` | `SystemConfig` | model Prisma; nome tecnico em ingles divergente | renomeada; 0 linhas |

Renomeacoes foram implementadas com `RENAME TABLE`, nao com `DROP`/`CREATE`. MariaDB 10.4.32 manteve os 169 relacionamentos e atualizou as referencias das FKs. Os nomes de FKs e indices historicos continuam com seus nomes originais; renomea-los seria uma mudanca adicional sem ganho funcional demonstrado.

## Nomes mantidos

As 73 demais tabelas de aplicacao usam nomes portugueses descritivos ou sao cadastros compartilhados. Nenhuma teve renomeacao proposta. O inventario integral, modelos e metadados por tabela esta em `01_INVENTARIO_TABELAS.md`.
