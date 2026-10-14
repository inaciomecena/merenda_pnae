# Resultado dos testes

## Passaram

- `npx prisma validate`: PASS.
- `npx prisma generate`: PASS (Prisma Client 5.22.0).
- `npx tsc --noEmit -p tsconfig.json`: PASS.
- `npm test --workspace apps/frontend`: PASS, 12/12.
- `npm run build --workspace apps/frontend`: PASS; Vite reportou apenas aviso de chunk >500 kB.
- `npx prisma migrate deploy` no schema isolado: PASS, duas migrations pendentes aplicadas.
- `npx prisma migrate status` no isolado: PASS, schema atualizado.
- `npm run start --workspace apps/backend`: PASS em smoke test; Nest carregou os modulos/rotas e iniciou com os nomes novos. O processo foi encerrado apos confirmar a inicializacao.
- Smoke de Prisma Client nos 11 modelos renomeados e nas tabelas importadas: PASS.
- Integridade FK no isolado: 169 restricoes verificadas, zero orfaos.

## Jest backend

`npm test --workspace apps/backend`: 49/50 suites aprovadas; 498/501 testes aprovados. Tres falhas na suite `scripts/guardiar-migracao.spec.ts` esperam conexao permitida a `seaf_pnae` e `merenda_pnae_homolog_2025_unicidade`, schemas que nao existem neste MariaDB local. A causa foi reproduzida executando a guarda diretamente, que retorna etapa `conexao`; nao foi causada pela migration ou pelo schema. Nao foram criados schemas de teste fora do escopo.

## Playwright

Nao executado nesta rodada. A configuracao grava screenshots e relatorio sobre artefatos existentes em `output/e2e/sdd0101-mobile` e `output/e2e/sdd011-mobile`; para preservar os arquivos locais, nao rodei uma suite que os sobrescreveria. Esta e uma lacuna de verificacao, nao um resultado PASS.

`npm run build --workspace apps/backend` falhou em duas execucoes com tres erros TS5033 `UNKNOWN` ao gravar em `apps/backend/dist`; typecheck e smoke start passaram. O build atualizou artefatos existentes em `dist`, que foram preservados sem limpeza.
