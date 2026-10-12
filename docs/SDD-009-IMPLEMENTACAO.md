# SDD-009 - Implementação

## Banco

Migração aditiva `20261012140000_sdd_009_gestao_operacional` aplicada com `prisma migrate deploy`. Foram criadas as tabelas `pnae_configuracoes_institucionais`, `pnae_configuracoes_institucionais_historico`, `pnae_parametros_operacionais`, `pnae_parametros_operacionais_versoes`, `pnae_notificacoes_internas`, `pnae_checklists_implantacao` e `pnae_itens_checklist_implantacao`.

O SQL contém somente `CREATE TABLE`, índices e chaves estrangeiras. Não contém `DROP`, `TRUNCATE` ou remoção de dados.

## Backend

Módulo: `apps/backend/src/modules/gestao-operacional`.

Endpoints principais (prefixo `/api/v1`):

- `GET/POST/PATCH /gestao-operacional/configuracoes` e `GET /gestao-operacional/configuracoes/resolver`.
- `GET/POST /gestao-operacional/parametros` e `POST /gestao-operacional/parametros/:id/versoes`.
- `GET/POST /gestao-operacional/notificacoes` e `PATCH /gestao-operacional/notificacoes/:id/lida`.
- `GET/POST/PATCH /gestao-operacional/checklists`, `POST /checklists/:id/itens` e `GET /checklists/:id/relatorio`.
- `GET /gestao-operacional/dashboard`, `GET /gestao-operacional/pendencias`.
- `GET /monitoramento/diagnostico` (ADMIN).

Foi corrigida a validação JWT para usar a chave configurada no `JwtModule`, evitando divergência entre carregamento de `.env` e validação do guard.

## Frontend

`GestaoOperacionalPage` fornece painel, central de pendências e monitoramento responsivos; as rotas e entradas de menu respeitam os papéis existentes.
