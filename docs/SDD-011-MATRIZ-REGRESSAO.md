# SDD-011 - Matriz de regressão

| SDD | Testes executados | PASS | FAIL | BLOCKED | Evidência |
|---|---:|---:|---:|---:|---|
| 010.1 mobile/login | 8 | 8 | 0 | 0 | `output/e2e/sdd0101-mobile/` |
| 010.1 unitário painel | 3 | 3 | 0 | 0 | Jest `produtor-painel.service.spec.ts` |
| 011 migração/integridade | 7 | 7 | 0 | 0 | `output/e2e/sdd011-migrations-last-run.json` |
| 011 UI Chromium | 4 | 4 | 0 | 0 | `output/e2e/sdd011-mobile/*chromium.png` |
| 011 UI WebKit | 4 | 4 | 0 | 0 | `output/e2e/sdd011-mobile/*webkit.png` |
| SDD-005 a 009 | 0 | 0 | 0 | 1 | Harness histórico não executado com isolamento comprovado nesta sessão |

Comandos executados: `npx prisma validate`, `npx prisma migrate deploy` em banco isolado, `node scripts/e2e-sdd011-db.js`, `npx playwright test playwright/sdd011-oportunidades.spec.ts --project=chromium --project=webkit`, `npx playwright test playwright/sdd0101-mobile.spec.ts --project=chromium --project=webkit`, `npx jest --runInBand src/modules/produtor-painel/application/produtor-painel.service.spec.ts`, `npx tsc --noEmit`, `npx tsc --noEmit --incremental false`, `npm run build`, `npx vite build`.
