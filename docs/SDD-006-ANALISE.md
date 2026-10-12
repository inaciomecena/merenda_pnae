# SDD-006 - Analise de engenharia reversa

## Escopo encontrado

O projeto esta na branch `main` e possui alteracoes nao commitadas relacionadas aos SDDs anteriores. Essas alteracoes foram preservadas. Nao existem branches ou worktrees novos.

## Fonte de verdade do ciclo

- Editais e itens: `Edital`, `EditalItem`, `EditalEscola`.
- Contratos e itens: `Contrato`, `ContratoItem`, aditivos e documentos.
- Execucao fisica: `ProgramacaoEntrega`, `Entrega`, `EntregaItem`, documentos e estornos.
- Fiscal: `NotaFiscal`, `NotaFiscalItem`, `NotaFiscalDocumento`, `VinculoRecebimentoFiscal`, `ConferenciaFiscal`, `DivergenciaFiscal`.
- Atesto, liquidacao e pagamento: `Atesto`, `Liquidacao`, `Pagamento`, todos com status, usuario, datas e campos de comprovacao/hash.
- Auditoria: `AuditLog` e `AuditService`, ja utilizado nos fluxos de contratos e fiscal.

## Backend reutilizado

- `FiscalAcessoService` e `PolicyService`: escopo por perfil, DRE, escola, municipio e fornecedor.
- `DashboardFinanceiroService`: calculos financeiros consolidados, saldos, pendencias, divergencias e grafico contratado -> pago.
- `FiscalDocumentoService`: anexos restritos, validacao de tipo, limite, hash e integridade.
- `AuditService`: registro de usuario, entidade, acao, valores, endpoint e metadados.
- `ReportsService` existente: relatorios legados de cadastro; nao possui o ciclo financeiro necessario ao SDD-006.

## Frontend reutilizado

React + MUI + React Router. O menu hierarquico ja possui os grupos de execucao contratual e fiscal-financeiro. As telas `DashboardFinanceiroPage`, `RelatoriosPage`, contratos, entregas e fiscal seguem o padrao de `api`, `ProtectedRoute`, cards MUI e tabelas responsivas.

## Lacunas identificadas

1. Nao havia entidade para consolidar uma prestacao de contas com periodo, status, versao, documentos e historico.
2. O dashboard financeiro nao oferecia filtros combinados nem visao por DRE/municipio/fornecedor/unidade.
3. Exportacoes estavam limitadas a JSON/CSV legado; nao havia demonstrativo financeiro filtrado nem PDF/XLSX estruturado.
4. Nao havia consulta publica sanitizada para informacoes autorizadas.

## Decisoes de implementacao

- Criar `PrestacaoContas` e `PrestacaoContasDocumento` sem duplicar dados financeiros. O demonstrativo sempre recalcula a partir de contratos, entregas, notas, atestos, liquidacoes e pagamentos.
- Usar status `RASCUNHO`, `EM_CONFERENCIA`, `ENVIADA`, `EM_ANALISE`, `DEVOLVIDA`, `APROVADA` e `CANCELADA`, com transicoes validadas e justificativa nas devolucoes.
- Aplicar `FiscalAcessoService`/`PolicyService` nos endpoints autenticados.
- Expor no endpoint publico somente edital publicado/ativo, contrato formalizado e valores agregados; nunca CPF/CNPJ, dados bancarios ou caminhos de anexos.
- Reutilizar `AuditService` para criacao, alteracao, transicoes e exportacoes.

## Fechamento tecnico (2026-10-12)

- Processo identificado: `nest start --watch` (PID 10964), iniciado pelo launcher `npm run dev` (PID 2548), mantendo artefatos em `apps/backend/dist`.
- Somente os processos backend identificados foram encerrados; Vite e demais processos foram preservados.
- `apps/backend/dist` foi limpo exclusivamente como artefato gerado e o `nest build` subsequente terminou com `EXIT 0`.
- Banco principal confirmado: `merenda_pnae` em `localhost:3306`.
- Banco isolado de regressao criado sem apagar o banco SDD-005 existente: `merenda_pnae_sdd006_regressao`.

