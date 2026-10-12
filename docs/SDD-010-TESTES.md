# SDD-010 — evidências de teste (12/10/2026)

## Executado

| Verificação | Resultado |
|---|---|
| `prisma validate` | PASS |
| `prisma migrate status` no banco local `merenda_pnae` | 26 migrações aplicadas; nenhuma pendente |
| `npx nest build` | PASS |
| Jest backend | 45 suítes, 396 testes PASS, incluindo 3 testes novos de autorização e reserva |
| Testes frontend | 12 PASS |
| TypeScript e Vite frontend | PASS |
| E2E SDD-010, HTTP/JWT/MySQL isolado | 34/34 PASS; `apps/backend/scripts/e2e-sdd010-last-run.json` |
| E2E SDD-009, HTTP/JWT no mesmo banco isolado | 28/28 PASS; `output/e2e/sdd009-last-run.json` |
| E2E SDD-005, banco novo isolado com 26 migrações e seeds | 69/69 PASS; `apps/backend/scripts/e2e-sdd005-sdd010-run.log` |
| E2E SDD-006, MySQL isolado com fixture DRE-B corrigido | 38/38 PASS; `apps/backend/scripts/e2e-sdd006-last-run.json` |
| E2E SDD-007, MySQL isolado | 25/25 PASS; `apps/backend/scripts/e2e-sdd007-last-run.json` |
| E2E SDD-008, MySQL isolado | 80/80 PASS; `apps/backend/scripts/e2e-sdd008-last-run.json` |

O harness `apps/backend/scripts/run-e2e-sdd010.js` cria um banco novo com nome `merenda_pnae_sdd010_*`, aplica as 26 migrações e inicia uma API própria na porta 3210. Não remove bancos nem acessa o banco principal durante o E2E. O teste cria apenas dados fictícios nesse banco, consulta persistência e valida isolamento entre produtores, extensão autorizada e bloqueios de escrita.

## Limites da regressão

O E2E histórico SDD-005 obteve 57/69 no banco antigo que acumulava dados de rodadas anteriores. Um banco novo, criado sem `DROP` nem `reset`, recebeu as 26 migrações e os seeds, e o teste passou 69/69. O comando `npm run build --workspace apps/backend` falhou na etapa `prisma generate` por `EPERM` ao substituir a DLL do Prisma em uso; `prisma validate` e a compilação direta `npx nest build` passaram.

Uma segunda execução do SDD-009 no mesmo ambiente passou pelas requisições, mas falhou ao regravar `output/e2e/sdd009-last-run.json` com erro de sistema de arquivos `UNKNOWN`. A primeira execução permaneceu registrada com 28/28 PASS; a repetição não fornece evidência adicional de regressão.

Não houve teste visual em Android ou Safari iPhone. A rota responsiva foi compilada, mas precisa de verificação nesses dispositivos.
