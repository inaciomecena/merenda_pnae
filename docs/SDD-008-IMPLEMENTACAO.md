# SDD-008 - Implementacao e preparacao operacional

## Artefatos

- `apps/backend/scripts/e2e-sdd008-create-db.cjs`: cria apenas o banco isolado
  nomeado por `E2E_DB_NAME`.
- `apps/backend/scripts/e2e-sdd008-seed.ts`: prepara DRE, duas escolas,
  vinculos, edital/item ficticio e garante tres produtores.
- `apps/backend/scripts/e2e-sdd008.ts`: runner HTTP reexecutavel e JSON de
  evidencias.

## Execucao isolada

```powershell
node scripts/e2e-sdd008-create-db.cjs
$env:DATABASE_URL='mysql://root:@localhost:3306/merenda_pnae_sdd008?charset=utf8mb4'
npx prisma migrate deploy
npx prisma generate
npx ts-node prisma/seed.ts
npx ts-node prisma/seed-test.ts
npx ts-node scripts/e2e-sdd008-seed.ts
npm run build
$env:PORT='3208'; $env:E2E_BASE='http://localhost:3208/api/v1'; node dist/main
```

Em outro terminal: `npx ts-node scripts/e2e-sdd008.ts`.

O banco principal `merenda_pnae` nao e resetado nem recebe dados do cenario.

## Evidencias da execucao final (2026-10-12)

- Banco principal: `merenda_pnae`; backup logico anterior aos testes em
  `output/backups/merenda_pnae-sdd008-20261012.sql`, 2.719.930 bytes,
  SHA-256 `AE86A760DF1BF1FE699C8D0B72FC4711F080BACC46E69D92DFCFF954A6F13478`.
- `prisma validate`, `prisma migrate status` e `prisma generate`: PASS; 24/24
  migracoes aplicadas. As migracoes SDD-006 e SDD-007 nao contem DROP,
  TRUNCATE, DELETE ou alteracao destrutiva.
- Snapshot estrutural do banco principal: 67 tabelas, 222 indices secundarios
  e 127 constraints de chave estrangeira em `information_schema`.
- `npx tsc --noEmit` backend/frontend, `npx nest build` e build Vite: PASS.
- Jest backend: 44 suites / 393 testes PASS; frontend: 12 testes PASS.
- E2E SDD-005: 69/69 em `merenda_pnae_sdd005_regressao_20261012` (porta
  3100); E2E SDD-006: 38/38 no banco principal (porta 3000); E2E SDD-007:
  25/25 no banco principal; E2E SDD-008: 80/80 em
  `merenda_pnae_sdd008` (porta 3208).
- O SDD-008 nao adiciona uma migration propria: a homologacao integra as 24
  migrations existentes e os modulos ja aplicados.
