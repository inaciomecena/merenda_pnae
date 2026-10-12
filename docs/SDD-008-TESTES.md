# SDD-008 - Testes e evidencias

O runner registra cada assercao em
`apps/backend/scripts/e2e-sdd008-last-run.json`, incluindo status HTTP,
resultado esperado e valor observado. A cobertura inclui:

- chamada, edicao/versionamento, inscricoes e duplicidade;
- tres categorias, projetos, habilitacao com pendencia/correcao,
  classificacao, selecao parcial, recurso e homologacao;
- dois contratos derivados, minuta, documento, conferencia, assinatura e
  formalizacao;
- duas programacoes, recebimentos parciais, aceite e saldo;
- nota manual, associacao de recebimento, conciliacao, conferencia, atesto,
  liquidacao e dois pagamentos parciais;
- demonstrativo, CSV/XLSX/PDF, prestacao, auditoria e transparencia publica;
- JWT invalido e sanitizacao publica.

A suite nao usa mocks como substituto da API ou persistencia. A ausencia de
um item, produtor, vinculo ou template no banco isolado e falha de preparo e
deve ser documentada, nao contornada com dados oficiais.

## Regressao final

| Verificacao | Evidencia | Resultado |
|---|---|---|
| Prisma validate | `npx prisma validate` | PASS |
| Prisma migrations | `npx prisma migrate status` | 24/24 aplicadas |
| Prisma generate | `npx prisma generate` | PASS |
| TypeScript backend/frontend | `npx tsc --noEmit` | PASS |
| Build NestJS | `npx nest build` | PASS |
| Jest backend | `npm test --workspace apps/backend` | 44/44 suites, 393/393 testes |
| Frontend tests/build | `npm test/build --workspace apps/frontend` | 12/12; PASS |
| E2E SDD-005 | `e2e-sdd005-last-run.log` | 69/69 PASS |
| E2E SDD-006 | `e2e-sdd006-last-run.json` | 38/38 PASS |
| E2E SDD-007 | `e2e-sdd007-last-run.json` | 25/25 PASS |
| E2E SDD-008 | `e2e-sdd008-last-run.json` | 80/80 PASS |

O SDD-008 confirmou adicionalmente o estorno real de entrega (`CANCELADA`),
bloqueio da mesma rota para `EXTENSIONISTA` (403), pagamentos parciais com
saldo, auditoria e transparencia sanitizada.
