# SDD-011 - Fechamento E2E HTTP/JWT

## Infraestrutura

Foi criada infraestrutura reutilizável em `apps/backend/test/e2e/support/`: criação segura de banco isolado, validação contra o nome do banco oficial, cliente Prisma e boot/stop do Nest por porta efêmera. O boot usa `ts-node/register/transpile-only` porque o type-check completo do projeto falha em declaração externa de `pdfkit`; os guards, AppModule, AuthModule e PolicyService permanecem reais.

O script `apps/backend/scripts/e2e-sdd011-http.js` cria banco `merenda_pnae_e2e_sdd011_<timestamp>`, aplica as migrações reais, cria fixtures fictícias, autentica via `/auth/login` e executa requisições HTTP reais. Nenhum JWT é gravado na evidência.

## Resultado

Última execução: banco `merenda_pnae_e2e_sdd011_1791855730435`, 29 migrações aplicadas, 13 cenários PASS, 0 FAIL e 4 BLOCKED. Evidência: `output/e2e/sdd011-http-last-run.json`.

Passaram: ausência de token, login JWT, listagem/detalhe, criação/duplicidade/consulta/cancelamento de interesse, IDOR entre produtores, extensionista ativo/revogado, auditoria/notificação e ausência de proposta/contrato/reserva.

Os bloqueios são somente cenários administrativos/históricos que exigem harness adicional: criação/publicação/encerramento pelo fluxo DRE e regressão completa SDD-005 a SDD-009. Não foram convertidos em PASS.

## Defeito corrigido

`OportunidadesQueryDto` não aceitava `produtorId`, embora o controller já o recebesse e o frontend o enviasse. Com `ValidationPipe({ forbidNonWhitelisted: true })`, a listagem HTTP retornava 400. O campo foi adicionado ao DTO e o E2E repetido: listagem e IDOR passaram.

## TS5033

`npm run build` oficial continua bloqueado ao escrever artefatos em `apps/backend/dist`. `npx tsc --noEmit`, frontend sem emissão incremental e Vite passaram. O boot E2E não depende de `dist`.
