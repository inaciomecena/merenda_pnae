# SDD-007 - Testes e evidencias

- Prisma validate: PASS.
- Backend TypeScript: PASS.
- Frontend TypeScript: PASS.
- Backend build Nest: PASS apos limpar exclusivamente `apps/backend/dist` gerado.
- Frontend build Vite: PASS.
- Backend Jest: 44 suites / 393 testes PASS.
- Frontend: 12 testes PASS.
- E2E SDD-007 real reexecutavel: `apps/backend/scripts/e2e-sdd007-last-run.json`, **25/25 PASS**.
- E2E SDD-006 executado apos a migration: **38/38 PASS**.
- E2E SDD-005: baseline isolado previamente homologado **69/69 PASS**; a migration SDD-007 e aditiva.

O E2E usa API HTTP, JWT, persistencia MySQL e dados existentes. Cobre publicacao, inscricao duplicada, projeto, envio, habilitacao, classificacao, selecao, recurso, homologacao, contrato rascunho, auditoria e acesso sem autenticacao.
