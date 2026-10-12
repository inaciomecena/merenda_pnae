# SDD-010 - Implementação

O módulo `produtor-painel` usa `AuthModule`, `PolicyService`, `AuditService` e `PrismaService` existentes. As rotas são protegidas por JWT/RBAC e usam o produtor do vínculo ou representação autorizada.

Principais endpoints:

- `GET /produtor/meu-painel`
- `GET/POST/PATCH /produtor/minhas-unidades`
- `GET/POST/PATCH /produtor/meus-produtos`
- `GET/POST/PATCH /produtor/minhas-safras`
- `GET/POST/PATCH /produtor/minha-sazonalidade`
- `GET /produtor/minha-disponibilidade`
- `GET/POST/PATCH /produtor/minha-logistica`
- `GET /catalogo-produtos`, `GET /catalogo-produtos/:id`, `GET /catalogo-produtos/:id/nutricao`
- `POST /catalogo-produtos/solicitacoes`
- `GET/POST/PATCH /produtor/assistencia-tecnica`

O frontend adiciona a rota `/meu-campo` com cartões de resumo e navegação para os cadastros reais.
