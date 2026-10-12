# SDD-006 - Implementacao

## Entregas

- `PrestacaoContas` e `PrestacaoContasDocumento`, com periodo, exercicio, DRE/escola, status, versao, justificativa e trilha temporal.
- Fluxo `RASCUNHO -> EM_CONFERENCIA -> ENVIADA -> EM_ANALISE -> APROVADA`, com devolucao/cancelamento e justificativa obrigatoria para devolucao.
- Demonstrativo consolidado derivado de contratos, entregas aceitas, notas fiscais, atestos, liquidacoes e pagamentos.
- Indicadores: contratado, recebido, faturado, atestado, liquidado, pago, saldo contratual, pendencias documentais e divergencias.
- Filtros por exercicio, municipio, DRE, escola, edital, contrato, fornecedor, situacao documental e financeira.
- Exportacoes CSV, XLSX e PDF com os mesmos filtros da tela e registro de auditoria.
- Consulta publica `/api/v1/transparencia/contratos` somente com dados agregados e autorizados.
- Tela `/prestacao-contas` integrada ao menu e ao design system MUI.

## APIs

- `GET /api/v1/prestacoes-contas/demonstrativo`
- `GET /api/v1/prestacoes-contas/exportar/:formato` (`csv`, `xlsx`, `pdf`)
- `GET /api/v1/prestacoes-contas`
- `POST /api/v1/prestacoes-contas`
- `PATCH /api/v1/prestacoes-contas/:id` (edicao otimista por `versao`)
- `POST /api/v1/prestacoes-contas/:id/transicoes/:status`
- `GET /api/v1/transparencia/contratos` (publica)

## Fechamento e evidencias operacionais

- Backup verificavel do banco principal antes dos testes E2E: `backups/sdd006-before-20261012-101223.sql`, 2.592.059 bytes, SHA-256 `070382BB9F97DE5CD92B8C945794FF018727E4D42CE7B9D473D7F9D03F8DC98A`. A migration ja estava registrada quando o snapshot foi feito.
- `prisma migrate status` no banco principal: 23 migracoes, schema up to date.
- `prisma migrate deploy` no banco principal: nenhuma pendente; SDD-006 ja aplicada em `2026-10-12T13:28:58.730Z`.
- `prisma validate` com `DATABASE_URL` carregada de `apps/backend/.env`: schema valido; `prisma generate`: PASS.
- Confirmadas as tabelas `pnae_prestacoes_contas` e `pnae_prestacoes_contas_documentos`, sete indices (incluindo PKs) e tres foreign keys esperadas.
- A migration SDD-006 foi aplicada tambem ao banco isolado `merenda_pnae_sdd006_regressao`; nao contem `DROP`, `TRUNCATE` ou comandos destrutivos de dados.
- Build Nest limpo: `nest build EXIT 0`.
- TypeScript backend/frontend: PASS.
- Backend Jest: 44 suites / 393 tests PASS.
- Frontend tests: 12 PASS.
- Frontend build: PASS (`vite built in 1m 19s`).
- E2E SDD-006 real: 38/38 PASS em `scripts/e2e-sdd006-last-run.json`.
- E2E SDD-005 real em banco novo isolado e porta 3101: 69/69 PASS; o resultado anterior 55/69 foi descartado como execução contaminada por banco já utilizado, sem caracterizar regressão.

## Regras

Os pagamentos sao somados somente em status ativos e permanecem com pendencia documental quando nao possuem comprovante. O escopo autenticado usa o perfil institucional; a consulta publica nao retorna CPF/CNPJ, dados bancarios, tokens, caminhos ou anexos.

