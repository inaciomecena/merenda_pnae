# SDD-005 — Implementação verificada

**Data:** 2026-10-11
**Branch:** `main`
**Status:** implementação integral concluída nas áreas de código; ver `docs/SDD-005-RELATORIO-FINAL.md` para o status de fechamento e evidências de regressão.

> Documento anterior (pré-recuperação P0) preservado no histórico do Git; a recuperação estrutural está em `docs/SDD-005-RECUPERACAO-P0.md`.

## Decisão de escopo (definitiva): operação fiscal 100% manual e administrativa

As operações fiscais/financeiras do módulo são **administrativas e manuais**, por decisão do responsável:

- **FORA DO ESCOPO, por decisão do responsável** (não são pendências, falhas nem requisitos não atendidos): consulta/validação SEFAZ, integração com bancos, APIs de pagamento, liquidação bancária, PIX/TED/transferências e qualquer outro sistema externo de liquidez.
- **Notas fiscais:** cadastro manual completo (`POST /notas-fiscais`) ou upload de XML/PDF; o XML serve apenas como **apoio de preenchimento** — extração de dados, conferência e correção antes da confirmação. A interpretação do XML **não** significa autorização oficial junto a qualquer órgão.
- **Conferência/atesto:** sempre manuais, com responsável, data/hora, decisão, valor, justificativa, documentos e histórico, preservando segregação de funções (quem confere, quem atesta e quem liquida são papéis distintos).
- **Liquidação:** registro manual com contrato, nota fiscal, atesto, número do processo, número da liquidação, data, valor, responsável, observações e comprovante.
- **Pagamentos:** registro manual com fornecedor, contrato, nota fiscal, liquidação, data, valor, referência (número da ordem de pagamento), comprovante, observações e responsável; pagamentos parciais permitidos; valores acima do saldo liquidado são bloqueados; não há disparo de transferências.

As garantias de segurança permanecem integralmente: RBAC, segregação de funções, isolamento institucional, validação de valores, idempotência, controle de concorrência, trilha de auditoria, integridade documental e histórico de estorno/retificação.

## Escopo entregue

### Schema e migração
- `apps/backend/prisma/schema.prisma`: 9 enums (`StatusNotaFiscal`, `ResultadoConciliacaoFiscal`, `TipoDivergenciaFiscal`, `SeveridadeDivergencia`, `StatusDivergenciaFiscal`, `StatusConferenciaFiscal`, `StatusAtesto`, `StatusLiquidacao`, `StatusPagamento`) e 9 models (`NotaFiscal`, `NotaFiscalItem`, `NotaFiscalDocumento`, `VinculoRecebimentoFiscal`, `DivergenciaFiscal`, `ConferenciaFiscal`, `Atesto`, `Liquidacao`, `Pagamento`), com `@@map`/`@map`, decimais, índices e relações inversas em `Contrato`, `ContratoItem`, `Entrega`, `EntregaItem` e `Produtor`.
- Migração estritamente aditiva `20261011130000_sdd_005_fiscal_atesto_financeiro`, aplicada no MySQL local. Nenhum `ALTER` sobre `pnae_contratos.status`; nenhum dado existente alterado ou apagado.
- `npx prisma validate` PASS; `npx prisma migrate deploy` PASS (20 migrações); `npx prisma migrate status` = up to date; `npx prisma generate` PASS.

### Backend (`apps/backend/src/modules/fiscal/`)
- **Domínio:** `application/domain/fiscal-estado.ts` (enums tipo+valor, máquina de transições de nota/atesto/liquidação/pagamento; fonte única, importada por `fiscal-validacao.ts`).
- **Serviços:** `xml-fiscal.service.ts` (preservado, 6 testes), `nota-fiscal.service.ts` (cadastro manual completo com validação de soma dos itens, processamento XML, listagem com escopo, correção de dados com bloqueio pós-atesto/cancelamento, transição de status pela máquina de estados via `PATCH` opcional `{status, motivo}`, **candidatos de recebimento** (`recebimentosCandidatos`), **vínculo/desvínculo de recebimentos** com locks `FOR UPDATE` e guardas de quantidade faturada/aceita, conciliação, `receberArquivo` XML/PDF), `fiscal-documento.service.ts` (upload com MIME/magic bytes/10 MB, versionamento, hash SHA-256, download com verificação de integridade e proteção contra path traversal), `conciliacao-fiscal.service.ts` (contrato × recebimento × nota com **checagem quantitativa recebido × faturado** quando os vínculos têm `notaFiscalItemId`, divergências tipadas com severidade, resultado, encerramento de divergências abertas em reexecução), `conferencia-fiscal.service.ts` (aprovação/rejeição com checklist, guarda otimista e lock `FOR UPDATE`), `atesto.service.ts` (saldo de atestos, INTEGRAL/PARCIAL, comprovante com hash, transição para `ATESTADA`), `liquidacao.service.ts` (saldo atestado − liquidações, **número da liquidação e observações persistidos**, comprovante, lock `FOR UPDATE`), `pagamento.service.ts` (saldo da liquidação, parcial/integral, **número da ordem de pagamento e observações persistidos**, estorno sem exclusão física com trilha de auditoria), `dashboard-financeiro.service.ts` (indicadores, saldos, pendências, divergências e gráfico com escopo institucional), `fiscal-acesso.service.ts` (RBAC/escopo por perfil), `fiscal-validacao.ts` e `fiscal-presenter.ts` (detalhe inclui `vinculos` de recebimento).
- **API:** `presentation/dto/fiscal.dto.ts` (class-validator, validação de UUID/data/decimal) e controllers `nota-fiscal`, `liquidacao`, `pagamento`, `dashboard-financeiro`, registrados em `fiscal.module.ts` e importados no `app.module.ts`.

### Endpoints (prefixo `api/v1`)
| Método | Rota | Perfis |
|---|---|---|
| GET | `/notas-fiscais` | todos |
| POST | `/notas-fiscais` | ADMIN, DRE (cadastro manual, inicia em `PENDENTE_PROCESSAMENTO`) |
| PATCH | `/notas-fiscais/:id` | ADMIN, DRE (correção de dados; `status`+`motivo` opcional delegado à máquina de estados) |
| GET | `/notas-fiscais/:id/recebimentos/candidatos` | todos (itens da nota + entregas aceitas com disponibilidade) |
| POST | `/notas-fiscais/:id/recebimentos` | ADMIN, DRE (vínculo entrega/item × item da nota) |
| DELETE | `/notas-fiscais/:id/recebimentos/:vinculoId` | ADMIN, DRE (desvinculação; bloqueada em `ATESTADA`/`REJEITADA`/`CANCELADA`) |
| POST | `/notas-fiscais/upload` | ADMIN, DRE |
| GET | `/notas-fiscais/:id` | todos |
| POST | `/notas-fiscais/:id/conciliar` | ADMIN, DRE |
| GET | `/notas-fiscais/:id/documentos/:documentoId` | todos |
| GET/POST | `/notas-fiscais/:id/conferencia` | GET todos; POST ADMIN, DRE |
| GET/POST | `/notas-fiscais/:id/atestos` | GET todos; POST ADMIN, DRE |
| GET | `/notas-fiscais/:id/atestos/:atestoId/comprovante` | todos |
| GET/POST | `/liquidacoes` · GET `/liquidacoes/:id/comprovante` | GET todos; POST ADMIN, DRE (`numeroLiquidacao`, `observacoes` opcionais) |
| GET/POST | `/pagamentos` · POST `/pagamentos/:id/estornar` · GET `/pagamentos/:id/comprovante` | GET todos; POST ADMIN, DRE (`numeroOrdemPagamento`, `observacoes` opcionais) |
| GET | `/dashboard-financeiro/{indicadores,saldos,pendencias,divergencias,grafico}` | todos |

**Regras do cadastro manual e dos recebimentos:**
- `POST /notas-fiscais` valida `Σ itens.valorTotal === valorProdutos`, exige contrato/fornecedor válidos e aplica `exigir(..., 'PROCESSAR')` no escopo institucional; status inicial `PENDENTE_PROCESSAMENTO`.
- Correção de dados (`PATCH`) bloqueada em `ATESTADA`/`CANCELADA`; a transição de status opcional delega à máquina de estados (`transicionar`) após atualizar os campos.
- Vínculo de recebimento: entrega deve estar `ACEITA`, fornecedor deve coincidir e o item deve pertencer ao contrato; dentro de transação com lock `FOR UPDATE`: item vinculado ≤ quantidade faturada e entregaItem vinculado ≤ quantidade aceita (excedente → 409).
- Conciliação quantitativa: quando os vínculos carregam `notaFiscalItemId` (sempre no banco real), faturado > recebido gera divergência `QUANTIDADE_ACIMA_ACEITA`/ALTA e recebido > faturado gera `OUTRA`/MEDIA; vínculos legados sem atribuição de item pulam a checagem quantitativa.

### Frontend (`apps/frontend/src/`)
Páginas integradas aos endpoints reais e ao Design System MUI: `NotasFiscaisPage`, `NotaFiscalFormPage` (**duas abas: upload de documento XML/PDF e cadastro manual** com itens dinâmicos, preenchimento auxiliar a partir dos itens do contrato, valores calculados e aviso de que nenhum sistema externo é consultado), `NotaFiscalDetalhesPage` (abas de dados, itens, documentos, **recebimentos com vínculo/desvínculo e dialog de candidatos**, conciliação com ação de conciliar e histórico; botões **Corrigir dados** e **Confirmar dados** com gate por status), `ConferenciaFiscalPage`, `AtestoPage`, `LiquidacaoPage`, `PagamentosPage` (inclui estorno) e `DashboardFinanceiroPage`. Nomenclatura operacional alinhada ao fluxo manual: menu/títulos **Notas Fiscais, Conferência Documental, Atestos, Registro de Liquidação, Acompanhamento de Pagamentos, Dashboard Financeiro** (`menu.config.tsx` + títulos das páginas). O rótulo `PDF (DANFE)` foi renomeado para `PDF da nota fiscal` (referência funcional a integração externa removida; nenhuma funcionalidade válida foi apagada). Regras de bloqueio por status e cálculos de valores centralizados em `src/lib/fiscal-manual-ui.ts` (funções puras testadas). Rotas e itens de menu registrados em `App.tsx` e `Layout.tsx` com restrição por perfil (ADMIN/DRE para conferência, atestos, liquidações e pagamentos).

## Fluxo funcional
`cadastro manual (PENDENTE_PROCESSAMENTO) → correção/conferência dos dados → confirmação (PROCESSADA) → conciliar → PENDENTE_CONFERENCIA (com divergências tipadas) → conferência aprova → AGUARDANDO_ATESTO → atesto integral/parcial → ATESTADA → liquidação (REGISTRADA) → pagamento (REGISTRADO/PARCIAL/CONFIRMADO) → estorno (ESTORNADO, sem exclusão)`. O upload de XML segue o mesmo fluxo após o processamento; vínculos de recebimento podem ser associados/desassociados até `ATESTADA`/`REJEITADA`/`CANCELADA`.

## Proteções
- **RBAC/escopo:** `FiltroNotaFiscal` por perfil (ADMIN/DRE/escola/fornecedor) aplicado em listagens e dashboard; `exigir` por operação (CONSULTAR/PROCESSAR/CONFERIR/ATESTAR).
- **Concorrência:** locks `SELECT ... FOR UPDATE` sobre a nota, a liquidação e o pagamento + guards de `updateMany` condicional (`count !== 1` → `ConflictException`).
- **Integridade documental:** SHA-256 conferido no download; MIME + magic bytes; limite de 10 MB; proteção contra path traversal; comprovantes de atesto/liquidação/pagamento no mesmo padrão.
- **Auditoria:** `CONCILIACAO_FISCAL_EXECUTADA`, `NOTA_FISCAL_CRIADA`, `NOTA_FISCAL_PROCESSADA_XML`, `NOTA_FISCAL_TRANSICIONADA`, `CONFERENCIA_FISCAL_REGISTRADA`, `NOTA_FISCAL_ATESTADA`, `LIQUIDACAO_REGISTRADA`, `PAGAMENTO_REGISTRADO`, `PAGAMENTO_ESTORNADO`, `DOCUMENTO_FISCAL_ANEXADO`.

## Restrições de projeto assumidas
- O schema não possui colunas `tipo` (Atesto/Pagamento) nem `atestoId` (Liquidacao): os valores são derivados e validados no serviço, sem migração adicional.
- O XML é apoio de preenchimento: os dados extraídos passam por conferência e correção manual antes da confirmação, e a interpretação do XML não representa autorização oficial de qualquer órgão.
- A conferência é sempre humana: a conciliação automática encaminha a nota para `PENDENTE_CONFERENCIA` e não substitui o atesto do conferente.

## Bootstrap institucional (dependência circular do RolesGuard)

O `RolesGuard` exige vínculo institucional ativo compatível com `user.role`; um ADMIN recém-criado não possui vínculo e ficaria bloqueado permanentemente (ciclo: para criar o primeiro vínculo seria preciso já ter um vínculo). Solução: `POST /api/v1/vinculos/bootstrap` (sem `@Roles`, motivo documentado em comentário no código), protegido por:

1. `JwtAuthGuard` global (sem bypass do `RolesGuard`);
2. `role === 'ADMIN'` presente no JWT;
3. header `x-bootstrap-token` comparado a `BOOTSTRAP_ADMIN_TOKEN` via `crypto.timingSafeEqual` (comparação de tempo constante);
4. semântica de uso único: `ConflictException` (409) se já existir vínculo ADMIN ativo;
5. validação de usuário ativo (`deletedAt` nulo);
6. auditoria `BOOTSTRAP_ADMIN_VINCULO`.

Cenários cobertos por teste (E2E ao vivo A2–A7 + unitários): token inválido 403, token ausente 400, primeiro bootstrap 201, repetição 409, escalonamento ESCOLA 403, com vínculo 200. **Nota (design atual):** o `RolesGuard` trata ADMIN como papel global — a conta é recarregada do banco pelo guard JWT (ativa e não deletada) e o vínculo institucional não é exigido para ADMIN (`roles.guard.spec.ts`, cenário 1; E2E A1 cobre o caminho HTTP). O bootstrap permanece como registro de histórico/auditoria do primeiro vínculo ADMIN global.

## Validação ponta a ponta (E2E) em ambiente isolado

Como a execução do bootstrap no banco ativo não está autorizada e esse banco está com zero vínculos (todos os usuários recebem 403 em rotas protegidas por `@Roles`), a validação E2E foi feita em banco **novo e isolado** `merenda_pnae_sdd005` (criado para o fim, sem tocar o banco ativo):

- 20 migrações (`migrate deploy`) + seeds (`prisma/seed.ts`, `prisma/seed-test.ts`, `scripts/e2e-sdd005-seed.ts`: DRE-A/DRE-B, escola, município, edital 001/2026, contrato 0001/2026 VIGENTE com valorAtualizado 1000, fornecedor 12345678000195, usuários, **cadeia de recebimento: ContratoItem 'Arroz'/KG, ProgramacaoEntrega/Item e Entrega `ACEITA` com EntregaItem**).
- Servidor backend em porta separada (3100) com `BOOTSTRAP_ADMIN_TOKEN`/`JWT_SECRET` próprios.
- Harness reexecutável: `apps/backend/scripts/e2e-sdd005-seed.ts` (domínio) + `apps/backend/scripts/e2e-sdd005-run.ts` (**69 asserções nos grupos A–J**) + `apps/backend/scripts/.e2e-create-db.js` (recriação do banco isolado).
- **Resultado: 69/69 asserções OK** — bootstrap (A1–A7), vínculos por perfil (B1–B8), upload/validação XML (C1–C6), conciliação e divergências (D1–E3), conferência (F1–F4), atesto (G1–G5), liquidação (H1–H5), pagamentos com concorrência (H6–H9), dashboards (I3), revogação de acesso imediata (I4) e consistência de saldos (I1–I2: Σ pagamentos ativos 10,00 sobre liquidação 12,50, saldo pendente 2,50, 1 estornado), **operação manual (J1–J13: cadastro manual → correção → PROCESSADA; papel EXTENSIONISTA 403 e escopo DRE-B 403; candidatos de recebimento; vínculo; excedente 409; conciliação manual CONCILIADA sem divergências; conferência+atesto → ATESTADA; desvinculação pós-atesto 400; liquidação com `numeroLiquidacao`; pagamento parcial com `numeroOrdemPagamento`)**.

## Testes e cobertura (evidência final)

- Backend regressão completa: **42 suítes / 387 testes PASS**; `tsc --noEmit` EXIT 0; `nest build` EXIT 0.
- Módulo fiscal: 23 suítes / 312 testes (inclui a nova spec de cadastro manual/recebimentos e casos de conciliação quantitativa); cobertura de `src/modules/fiscal/**` completo: **81,12% statements · 91,4% ramificações · 80,74% linhas**; camada de aplicação (`application/**`): **98,4% statements · 92,25% ramificações · 99,33% linhas** (meta 80%).
- Parser XML ativo preservado com seus 6 testes originais.
- Frontend: `tsc --noEmit` EXIT 0, `npm test` **9/9 PASS** (`composicao-ui` + `fiscal-manual-ui`), `npm run build` EXIT 0.
