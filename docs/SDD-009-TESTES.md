# SDD-009 - Testes e evidências

## Evidências executadas

- `prisma validate`: PASS.
- `prisma migrate status`: 25 migrações encontradas, nenhuma pendente após deploy.
- `prisma generate`: PASS.
- Backend Jest: 44 suítes / 393 testes PASS (baseline preservado).
- Backend `nest build`: PASS.
- Frontend: 12 testes PASS.
- Smoke de escopo DRE: dashboard 200 com contagens restritas; diagnóstico DRE 403.
- Frontend `tsc -b` e Vite build: PASS.
- E2E real SDD-009: 28/28 PASS em `output/e2e/sdd009-last-run.json`.
- Verificação visual Playwright: `output/playwright/sdd009-login.png`.

## E2E SDD-009

Harness reexecutável: `scripts/e2e-sdd009.js`. Usa HTTP, JWT, MySQL e persistência real. Cobriu dashboard, pendências, configuração, precedência, parâmetro e versão, notificação e deduplicação, checklist com bloqueio de homologação, relatório, diagnóstico administrativo e bloqueio sem autenticação, além de auditoria.

Os testes criam somente registros identificados por `e2e.sdd009.<timestamp>` no banco de desenvolvimento autorizado; não executam reset nem apagam dados.
