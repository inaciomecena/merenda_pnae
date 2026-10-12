# SDD-009 - Análise e Reaproveitamento

Engenharia reversa realizada em 12/10/2026 no repositório existente. O SDD-009 complementa os módulos anteriores e não recria autenticação, RBAC, vínculos, auditoria, templates ou dashboards.

| Funcionalidade | Existe | Implementação atual | Lacuna | Ação necessária |
|---|---|---|---|---|
| Autenticação/JWT | Sim | `AuthModule`, guard global e refresh | Nenhuma | Reutilizado |
| RBAC e escopo | Sim | `RolesGuard`, `PolicyService`, `VinculoUsuario` | Superfície operacional nova | Reutilizado no módulo operacional |
| Usuários e vínculos | Sim | `/users`, `/vinculos`, auditoria | Revisão operacional agregada | Reutilizado |
| Configuração global | Sim | `SystemConfig` | Escopo, herança, histórico | `ConfiguracaoInstitucional` |
| Templates | Sim | `TemplateDocumento`, versões e placeholders | Associação operacional futura | Painel existente preservado |
| Auditoria | Sim | `AuditService` e interceptor global | Eventos SDD-009 | Eventos explícitos adicionados |
| Dashboard | Sim | dashboards geral/financeiro | Pendências operacionais unificadas | `GestaoOperacionalService` |
| Pendências | Parcial | estados nas entidades | Visão consolidada sem duplicar estado | Pendências derivadas |
| Notificações internas | Não | sem persistência | usuário, deduplicação e leitura | `NotificacaoInterna` |
| Parâmetros | Não | chaves simples em `SystemConfig` | versão, fonte, status e escopo | `ParametroOperacional*` |
| Health público | Sim | status sanitizado | diagnóstico restrito | `/monitoramento/diagnostico` |
| Prontidão | Não | sem checklist | itens, evidência e bloqueios | `ChecklistImplantacao*` |
| Frontend operacional | Não | menu administrativo existente | telas de operação | `/gestao-operacional`, `/pendencias`, `/monitoramento` |

## Decisões

- A precedência de configuração é `ESCOLA -> DRE -> MUNICIPIO -> GLOBAL`, considerando somente escopos informados e valores ativos.
- Parâmetros normativos sem fonte permanecem `PENDENTE_VALIDACAO`; a API não inventa limites, pontuações ou regras jurídicas.
- Pendências são contagens derivadas de entidades de negócio e não podem ser encerradas artificialmente.
- Diagnóstico detalhado exige papel `ADMIN`; `/health` continua público e sanitizado.
