# SDD-005 — FECHAMENTO FUNCIONAL

**Data:** 2026-10-11
**Branch:** `main` (sem commits/push; alterações locais apenas)
**Módulo:** Gestão Fiscal — notas fiscais (cadastro manual e upload), conciliação, conferência documental, atestos, registro de liquidação, acompanhamento de pagamentos e dashboard financeiro

---

## Status: **PASS**

A implementação foi entregue por inteiro, validada por regressão completa (42 suítes / 387 testes), cobertura acima da meta e suíte E2E ponta a ponta com **69/69 asserções aprovadas** em ambiente isolado. O escopo fiscal/financeiro é **100% manual e administrativo por decisão do responsável** — integrações externas (SEFAZ, bancos, APIs de pagamento) são **FORA DO ESCOPO**, registradas como decisão e não como pendência ou falha. Em 2026-10-11, mediante autorização do responsável, a **ativação no ambiente de desenvolvimento** foi executada e homologada por inteiro (seção 10): backup, migrações, bootstrap administrativo, vínculos institucionais, homologação funcional ponta a ponta no banco ativo e regressão integral contra os baselines — com **acréscimos e zero regressão** (backend 43 suítes/390 testes, frontend 12/12, E2E isolado reexecutado 69/69, cobertura fiscal 80,74% linhas / 91,4% ramificações). As ressalvas 1 e 2, que registravam essa pendência operacional, estão atualizadas.

---

## 1. Decisão de escopo (definitiva)

As operações fiscais/financeiras são administrativas e manuais. **FORA DO ESCOPO, por decisão do responsável** — não são pendências, falhas nem requisitos não atendidos:

- consulta/validação SEFAZ (inclusive autorização oficial de XML);
- integração com bancos, APIs de pagamento, liquidação bancária;
- PIX, TED, transferências ou qualquer disparo automático de liquidez.

Implicações implementadas e verificadas:

- **Notas fiscais:** cadastro manual completo com conferência e correção antes da confirmação; XML/PDF apenas como apoio de preenchimento (extração assistida), sem afirmar autorização oficial a partir da interpretação do XML.
- **Conferência e atesto:** manuais, com responsável, data/hora, decisão, valor, justificativa, documentos e histórico, preservando segregação de funções.
- **Liquidação:** registro manual com contrato, nota fiscal, atesto, número do processo, número da liquidação, data, valor, responsável, observações e comprovante.
- **Pagamentos:** registro manual com fornecedor, contrato, nota fiscal, liquidação, data, valor, referência (ordem de pagamento), comprovante, observações e responsável; pagamentos parciais permitidos; valores acima do saldo liquidado bloqueados.

Garantias mantidas: RBAC, segregação de funções, isolamento institucional, validação de valores, idempotência, controle de concorrência (`FOR UPDATE` + guards condicionais), trilha de auditoria, integridade documental (SHA-256) e histórico de estorno/retificação (sem exclusão física).

---

## 2. Escopo entregue

Detalhamento completo em `docs/SDD-005-IMPLEMENTACAO.md`. Resumo:

| Área | Entrega |
|---|---|
| **Schema/migração** | 9 enums + 9 models fiscais; migração estritamente aditiva `20261011130000_sdd_005_fiscal_atesto_financeiro` (9 `CREATE TABLE` + FKs/índices; nenhum `ALTER` em tabelas existentes; `pnae_contratos.status` intocado). 20 migrações, `migrate status` = up to date. |
| **Backend** | `src/modules/fiscal/` — domínio (`fiscal-estado`), 13 serviços (XML, nota, documento, conciliação, conferência, atesto, liquidação, pagamento, dashboard, acesso, validação, presenter), DTOs e 4 controllers; **27 rotas fiscais** mapeadas + **`POST /api/v1/vinculos/bootstrap`**. Cadastro manual (`POST /notas-fiscais`), correção/transição (`PATCH /notas-fiscais/:id`), recebimentos (`GET candidatos`, `POST`, `DELETE`). |
| **RolesGuard** | ADMIN é papel global (conta recarregada do banco pelo guard JWT); vínculo institucional exigido apenas para papéis de escopo (DRE/ESCOLA/EXTENSIONISTA), com vigência e revogação imediatas. Bootstrap preservado como registro de histórico/auditoria do primeiro vínculo ADMIN. |
| **Frontend** | 8 páginas MUI; **Notas Fiscais, Conferência Documental, Atestos, Registro de Liquidação, Acompanhamento de Pagamentos, Dashboard Financeiro** (nomenclatura operacional). `NotaFiscalFormPage` com abas *upload* e *cadastro manual*; `NotaFiscalDetalhesPage` com correção/confirmação de dados e vínculo/desvínculo de recebimentos; rótulo `PDF (DANFE)` → `PDF da nota fiscal`; regras puras em `src/lib/fiscal-manual-ui.ts`. |
| **Fluxo** | `cadastro manual (PENDENTE_PROCESSAMENTO) → correção/conferência → confirmação (PROCESSADA) → conciliar → PENDENTE_CONFERENCIA (+divergências tipadas) → conferência aprova → AGUARDANDO_ATESTO → atesto PARCIAL/INTEGRAL → ATESTADA → liquidação REGISTRADA → pagamento REGISTRADO/PARCIAL/CONFIRMADO → estorno ESTORNADO (sem exclusão física)`. |

---

## 3. Evidências de verificação (execuções reais)

### 3.1 Qualidade do código (backend)

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **EXIT 0** |
| `npx nest build` | **EXIT 0** |
| `npx jest` (regressão completa) | **42 suítes / 387 testes — 100% PASS** (EXIT 0) |
| `npx prisma validate` / `generate` / `migrate deploy` | PASS (20 migrações aplicadas; status up to date) |

### 3.2 Testes do módulo fiscal e cobertura

| Verificação | Resultado |
|---|---|
| Suítes do fiscal (`jest src/modules/fiscal`) | **23 suítes / 312 testes PASS** (parser XML com seus 6 testes preservados; inclui `nota-fiscal-manual-recebimentos.service.spec.ts` com 28 testes de cadastro manual/correção/vínculo/recebimentos e campos de liquidação/pagamento) |
| Cobertura — módulo completo (`src/modules/fiscal/**/*.ts`, incl. controllers/DTO) | **81,12% statements · 91,4% ramificações · 80,74% linhas** |
| Cobertura — camada de aplicação (`src/modules/fiscal/application/**/*.ts`) | **98,4% statements · 92,25% ramificações · 99,33% linhas** (meta: ≥80% ✅) |

RBAC e bootstrap: `roles.guard.spec.ts` (ADMIN global sem vínculo autorizado; escopo com vigência/revogação) + `bootstrap-vinculo.service.spec.ts` incluídos nos totais acima.

### 3.3 Frontend

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **EXIT 0** |
| `npm test` (runner nativo Node) | **9/9 PASS** (`composicao-ui` + `fiscal-manual-ui`: bloqueios por status, chave de acesso, cálculo de valores manuais) |
| `npm run build` (tsc -b + vite) | **EXIT 0** |

### 3.4 Validação ponta a ponta (E2E) — ambiente isolado

Ambiente: banco **novo e isolado** `merenda_pnae_sdd005` (20 migrações + seeds de domínio: DRE-A/DRE-B, escola, município, edital 001/2026, contrato 0001/2026 VIGENTE com valorAtualizado 1.000,00, fornecedor 12345678000195, usuários, cadeia de recebimento com Entrega `ACEITA`), backend compilado servido na porta 3100 com `BOOTSTRAP_ADMIN_TOKEN`/`JWT_SECRET` próprios. **O banco ativo não foi tocado.**

**Resultado: 69/69 asserções OK, 0 falhas (EXIT 0)** — log completo em `apps/backend/scripts/e2e-sdd005-last-run.log`.

| Grupo | Conteúdo | OK |
|---|---|---|
| A | Bootstrap institucional (ADMIN global autorizado sem vínculo 200 — design atual do RolesGuard, token inválido 403, token ausente 400, primeiro bootstrap 201 ADMIN global, repetição 409, escalonamento ESCOLA 403, ADMIN 200) | 7/7 |
| B | Vínculos institucionais (DRE-A/DRE-B/ESCOLA/EXTENSIONISTA, validações 400, ADMIN duplicado 400) | 8/8 |
| C | Upload/validação de XML (criação PROCESSADA, detalhe, chave duplicada 409, perfil sem permissão 403, PDF sem XML, XML malformado) | 4/4 |
| D | Conciliação (divergências MEDIA, `CONCILIADA_COM_RESSALVAS`, `PENDENTE_CONFERENCIA`, reexecução encerra divergências) | 5/5 |
| E | Divergências persistidas (2 MEDIA ABERTA: `PRODUTO_DIVERGENTE` + `RECEBIMENTO_NAO_CONFIRMADO`) e conferência | 3/3 |
| F | Conferência humana (aprovação → `AGUARDANDO_ATESTO`, checklist/ressalvas, rejeição) | 4/4 |
| G | Atesto e liquidação (parcial 5,00 + integral 7,50 → `ATESTADA`; estouro de saldo 409; liquidação 12,50 REGISTRADA; segunda liquidação 409; papel sem permissão 403) | 10/10 |
| H | Pagamentos (acima do saldo 409, parcial 6,00, integral 6,50 → CONFIRMADO, estorno ESTORNADO sem exclusão, estorno repetido 409, **concorrência: 2 pagamentos parciais simultâneos → exatamente 1×2xx e 1×409**) | 7/7 |
| I | Saldos/dashboard/revogação (3 pagamentos no histórico, Σ ativos 10,00, saldo pendente 2,50, 5 dashboards HTTP 200, revogação de vínculo → 403 imediato) | 8/8 |
| J | **Operação manual** (cadastro manual → `PENDENTE_PROCESSAMENTO`; correção; transição para PROCESSADA; EXTENSIONISTA 403; DRE-B fora do escopo 403; candidatos de recebimento; vínculo; excedente faturado 409; conciliação manual `CONCILIADA` sem divergências; conferência+atesto → `ATESTADA`; desvinculação pós-atesto 400; liquidação com `numeroLiquidacao`; pagamento parcial com `numeroOrdemPagamento`) | 13/13 |

### 3.5 Integridade do banco ativo

- Migração SDD-005 puramente aditiva (9 `CREATE TABLE` + FKs); nenhum `ALTER` sobre tabelas existentes; `pnae_contratos.status` e dados SDD-001–004 intactos.
- Nenhum dado do banco ativo foi criado, alterado ou apagado durante a validação (E2E 100% no banco isolado, recriado do zero antes da execução definitiva).
- Estado do banco ativo na data desta validação: **zero vínculos institucionais** — os papéis de escopo (DRE/ESCOLA/EXTENSIONISTA) dependiam de `POST /vinculos/bootstrap` + criação de vínculos; ADMIN é papel global e não exige vínculo. **ATUALIZADO em 2026-10-11:** bootstrap executado e vínculos institucionais criados no banco ativo (seção 10).

---

## 4. Ressalvas

1. **E2E em ambiente isolado, não no ambiente de homologação ativo.** A execução do bootstrap no banco ativo não estava autorizada à época; o banco isolado `merenda_pnae_sdd005` (criado para o fim) reproduziu o ciclo completo com o mesmo código compilado. A infraestrutura de reprodução está versionada no repositório. **ATUALIZADO (2026-10-11):** com autorização do responsável, o bootstrap foi executado no banco ativo e o ciclo completo foi homologado ali (seção 10); a reprodução isolada segue versionada e foi reexecutada após a ativação (**69/69**).
2. **Banco ativo sem vínculos institucionais (RESOLVIDA em 2026-10-11).** Os papéis de escopo recebiam 403 nas rotas protegidas até que `POST /vinculos/bootstrap` fosse executado com autorização e os vínculos (DRE/ESCOLA/EXTENSIONISTA) fossem populados. Era uma pendência operacional, não de código — a rota, o serviço e os cenários de segurança já haviam sido validados ao vivo (grupo A). **RESOLVIDO:** bootstrap ADMIN executado no banco ativo (vínculo `d3ac263d…`) + 7 vínculos institucionais criados (um deles revogado como teste de revogação imediata); 10 cenários de autorização/isolamento validados ao vivo (seção 10.4).
3. **Camada de apresentação sem unitário de controllers/DTO** (0% de cobertura nesses arquivos). Ela foi validada pelo E2E HTTP (69 asserções cobrindo as 27 rotas fiscais + bootstrap + envelopes de erro). O módulo completo ainda atinge 80,74% linhas / 91,4% ramificações.
4. **Sem E2E de navegador.** O frontend foi verificado por `tsc`, `build` e testes unitários (9/9), integrado aos endpoints reais, mas não por automação de UI.
5. **Comprovantes são download de arquivo anexado** (SHA-256 conferido no download); não há geração server-side de PDF de atesto/liquidação/pagamento.

> **Não são ressalvas:** integrações SEFAZ/bancárias — registradas na seção 1 como **FORA DO ESCOPO, por decisão do responsável**.

---

## 5. Pendências e recomendações (operacionais)

1. **Com autorização**, executar `POST /api/v1/vinculos/bootstrap` no ambiente de homologação com `BOOTSTRAP_ADMIN_TOKEN` forte, e popular vínculos institucionais (DRE/ESCOLA/EXTENSIONISTA com `municipioId` para EXTENSIONISTA — regra de domínio).
2. Recomenda-se **remover a env `BOOTSTRAP_ADMIN_TOKEN`** após o bootstrap (a rota já é inofensiva depois: retorna 409 enquanto houver ADMIN ativo, mas a secret deixa de ser necessária).
3. **Backup** do banco antes da homologação; a migração é aditiva, mas é a prática recomendada.
4. Orelhada de observabilidade: os eventos de auditoria já gravados (`CONCILIACAO_FISCAL_EXECUTADA`, `PAGAMENTO_ESTORNADO`, etc.) podem alimentar alertas de divergência/recusa.

---

## 6. Nota metodológica (transparência)

- A primeira execução do E2E retornou 52/56: as 4 falhas foram investigadas uma a uma no código de produção e resultaram ser **expectativas incorretas do próprio harness** (serialização `12.5` vs `12.50`; divergências lidas do campo errado da resposta; caminho de status errado na conferência; contagem de pagamentos subestimada). Nenhum defeito real de produção foi suprimido.
- Nesta iteração, o grupo J (13 asserções de operação manual) foi executado ao vivo no banco isolado e aprovado integralmente. A asserção A1 foi alinhada ao design atual do `RolesGuard` (ADMIN é papel global sem exigência de vínculo institucional — `roles.guard.spec.ts`, cenário 1); a contagem de cenários foi preservada e o comportamento é coberto por teste unitário e pelo caminho HTTP do E2E.
- Nenhum teste existente foi alterado para mascarar falha; nenhuma funcionalidade válida foi apagada do frontend.

---

## 7. Conformidade com as restrições do trabalho

- ✅ Branch `main` apenas; nenhum branch/worktree novo, nenhum commit, push ou deploy.
- ✅ Migrações apenas aditivas; nenhum `migrate reset`/`db push --force-reset`/`db pull`; `pnae_contratos.status` e dados SDD-001–004 intactos; sem SDD-006.
- ✅ Banco ativo sem alteração de dados; E2E em banco isolado novo (criado para o fim, removível).
- ✅ Parser XML ativo preservado com seus 6 testes.
- ✅ Sem `any`/`@ts-ignore` como correção genérica; nenhum teste alterado para mascarar falha.
- ✅ Frontend reutiliza o Design System MUI existente e endpoints reais; operações financeiras protegidas por RBAC, locks `FOR UPDATE`, guards condicionais de concorrência e trilha de auditoria.
- ✅ Integrações externas registradas como fora do escopo por decisão, nunca como pendência/falha.
- ✅ Servidor de desenvolvimento (porta 3000, banco ativo) e frontend dev (porta 5173) preservados durante todo o trabalho.

---

## 8. Reprodutibilidade do E2E

Harness versionado: `apps/backend/scripts/e2e-sdd005-seed.ts`, `apps/backend/scripts/e2e-sdd005-run.ts`, `apps/backend/scripts/.e2e-create-db.js`. Reexecução (PowerShell, em `apps/backend`):

```powershell
# 1. recriar banco isolado + migrações + seeds
node scripts/.e2e-create-db.js
$env:DATABASE_URL='mysql://root:@localhost:3306/merenda_pnae_sdd005?charset=utf8mb4'
npx prisma migrate deploy
npx ts-node prisma/seed.ts; npx ts-node prisma/seed-test.ts; npx ts-node scripts/e2e-sdd005-seed.ts

# 2. servidor dedicado (não usar a porta 3000 do dev server)
$env:BOOTSTRAP_ADMIN_TOKEN='sdd005-e2e-bootstrap-2026'; $env:PORT='3100'; $env:JWT_SECRET='change-me'
node dist/main

# 3. runner (em outro terminal)
$env:E2E_BASE='http://localhost:3100/api/v1'; $env:BOOTSTRAP_ADMIN_TOKEN='sdd005-e2e-bootstrap-2026'
npx ts-node scripts/e2e-sdd005-run.ts   # esperado: 69/69 OK, EXIT 0
```

O banco isolado `merenda_pnae_sdd005` pode ser mantido para reexecuções ou removido com `DROP DATABASE`; o banco ativo não depende dele. **Reexecução pós-ativação (2026-10-11):** o banco isolado foi recriado do zero (drop/create, migrações e seeds) e o harness completo foi reexecutado — **69/69 asserções OK, EXIT 0** (log regravado em `apps/backend/scripts/e2e-sdd005-last-run.log`).

---

## 9. Documentos relacionados

- `docs/SDD-005-IMPLEMENTACAO.md` — escopo, decisão de operação manual, endpoints, proteções e evidências detalhadas.
- `docs/SDD-005-PROXIMOS-PASSOS.md` — estado das etapas e próximos passos operacionais.
- `docs/SDD-005-RECUPERACAO-P0.md` — recuperação estrutural prévia (compatibilização de modelos SDD-003/004).
- `apps/backend/scripts/e2e-sdd005-last-run.log` — log completo da execução E2E definitiva (69/69), regravado na reexecução pós-ativação.
- `apps/backend/scripts/sdd005-*.js` e `apps/backend/scripts/sdd005-bootstrap-dev.ps1` — scripts de ativação no ambiente de desenvolvimento (verificação de schema, inventário de cadastros, bootstrap efêmero, vínculos, etapas 3–5 e verificações de homologação), todos reexecutáveis.

---

## 10. ATIVAÇÃO NO AMBIENTE DE DESENVOLVIMENTO (registro de 2026-10-11)

Executada mediante autorização do responsável, no **banco de desenvolvimento ativo** (`merenda_pnae`), cobrindo o ciclo completo previsto nas ressalvas 1–2. Para não perturbar o ambiente do usuário, os serviços de ativação rodaram em **portas dedicadas (3200/3100)** com variáveis de ambiente próprias; o `apps/backend/.env` **nunca foi alterado** e os servidores de dev (porta 3000 e 5173) ficaram preservados. Nenhum branch/commit/push/deploy foi feito.

### 10.1 Backup e migrações (ETAPA 1 — PASS)

- Backup completo **antes** de qualquer mudança: `C:\Users\HP ELITE\AppData\Local\Temp\opencode\backup-sdd005\merenda_pnae_backup_20261011.sql` (2,45 MB, 54 tabelas).
- `prisma migrate deploy`: 21/21 migrações (no-op, tudo já aplicado); `prisma validate` e `prisma generate` EXIT 0.
- Migração SDD-005 conferida como **estritamente aditiva**: 9 `CREATE TABLE` + 24 `ADD CONSTRAINT` (FK), zero `DROP`/`ALTER`/DML (`sdd005-verificar-schema.js` valida as 9 tabelas fiscais).
- Snapshot pós-migração confirmou os dados pré-existentes intactos.

### 10.2 Bootstrap administrativo (ETAPA 2 — PASS)

- `POST /api/v1/vinculos/bootstrap` executado no banco ativo com **token efêmero** (valor gerado para a sessão e passado por variável de ambiente ao processo do servidor dedicado; **nunca gravado em `.env`, nunca logado**, removido com o processo).
- **Observação de mecanismo:** a implementação aceita o token no **corpo da requisição** (`{token}`, comparação em tempo constante) — não no cabeçalho `x-bootstrap-token`. A ativação usou o mecanismo existente, sem mudanças de código.
- Resultados: token inválido → **403**; primeiro bootstrap → **vínculo ADMIN global** criado (`d3ac263d-4dad-40b2-912e-d81cfabbb052`); replay → **409**; evento `BOOTSTRAP_ADMIN_VINCULO` registrado na auditoria. O banco ativo tinha 0 vínculos (os bootstraps do E2E eram do banco isolado), então o bootstrap era necessário e foi autorizado.

### 10.3 Usuários e vínculos institucionais (ETAPA 3 — PASS)

- 5 usuários **fictícios** criados via `POST /users`, todos marcados "fictício - teste SDD-005": `dre-b@`, `produtor-teste@`, `sem-vinculo@`, `inativo-teste@`, `revogado-teste@` (mesmo padrão de e-mail dos usuários existentes).
- 7 vínculos criados via `POST /vinculos` **reutilizando cadastros existentes** (13 DREs reais MT, 142 municípios, 3.182 escolas): DRE-A (DRE Metropolitana/Cuiabá), DRE-B (DRE Cáceres/Corumbá), ESCOLA (escola de Cuiabá), EXTENSIONISTA (Cuiabá), PRODUTOR (Cooperativa Frutos do Pantanal), um com vigência encerrada e um revogável (para revogação imediata). Nenhum cadastro real foi alterado ou apagado; respeitado o `municipioId` e o isolamento institucional.

### 10.4 Autorização e isolamento (ETAPA 4 — 10/10)

Validados ao vivo no banco ativo: ADMIN global sem vínculo (200); ESCOLA/DRE/EXTENSIONISTA restritos ao próprio escopo; DRE-B fora do escopo (403); EXTENSIONISTA bloqueado em cadastro de NF (papel); PRODUTOR bloqueado em fornecedor alheio (403); usuário sem vínculo (403); usuário com vínculo inativo/vigência encerrada (403); **revogação em tempo real** (200 → revoga → 403 imediato). Scripts: `sdd005-ativacao-etapa4.js` (8 cenários) + Part C do `sdd005-ativacao-etapa5.js` (isolamento DRE-B e outro fornecedor).

### 10.5 Homologação funcional ponta a ponta (ETAPA 5 — PASS)

Cadeia **100% ficcional e identificada como tal**, reutilizando entidades existentes: edital 9901/2026 → proposta FINALIZADA → **contrato 90001/2026, VIGENTE, R$ 1.400,00** (DRE-A/fornecedor fictício) → itens (Arroz 100 KG, Feijão 50 KG) → PE-SDD005-ATIV-001 CONFIRMADA → entrega ENT-SDD005-ATIV-001 ACEITA (10 KG + 5 KG).

Fluxo manual completo via API, como previsto no escopo: cadastro manual de NF (`PENDENTE_PROCESSAMENTO`) → correção de dados → transição para `PROCESSADA` → candidatos de recebimento → **2 vínculos de recebimento** (10 KG + 5 KG) → conciliação manual → `CONCILIADA` com **0 divergências** → conferência documental APROVAR → **atesto integral (R$ 140,00)** → liquidação `LQ-2026-ATIV-001` → pagamento **parcial R$ 80,00** (PARCIAL) + **complementar R$ 60,00** → nota **QUITADA** → tentativa de excesso de R$ 0,01 **bloqueada (4xx)** → saldos e dashboards HTTP 200 → trilha de auditoria completa (criação, transições, bootstrap).

**17 verificações de fluxo** executadas (`sdd005-ativacao-etapa5.js`); a única divergência do script foi bug de contagem cumulativa no próprio script (a API retorna o total de vínculos, não por chamada) — confirmado por consulta direta ao banco (`sdd005-verificar-homologacao.js`): 2 vínculos, 0 divergências, pagamentos R$ 80,00 REGISTRADO + R$ 60,00 CONFIRMADO = R$ 140,00 quitados.

### 10.6 Regressão (ETAPA 6 — PASS; acréscimos sobre os baselines, zero regressão)

| Verificação | Baseline | Resultado pós-ativação |
|---|---|---|
| Backend `jest --runInBand` | 42 suítes / 387 testes | **43 suítes / 390 testes PASS** (EXIT 0). Delta +1 suíte / +3 testes = `reference-data.spec.ts` (arquivo não rastreado do trabalho local de reference-data MT); nenhum teste apagado; 0 falhas |
| Suítes do módulo fiscal | 23 suítes / 312 testes | **23 suítes / 312 testes PASS** (idêntico) |
| Cobertura fiscal | 80,74% linhas / 91,4% ramificações | **80,74% linhas / 91,4% ramificações / 81,12% statements** (idêntico) |
| Backend `tsc --noEmit` / `nest build` | EXIT 0 | **EXIT 0 / EXIT 0** |
| Frontend `npm test` | 9/9 | **12/12 PASS** (acréscimo de `display-text.test.ts` e `screen-config.test.ts`, do trabalho local de menu/textos; 0 falhas) |
| Frontend `tsc -b` / `npm run build` | EXIT 0 | **EXIT 0 / EXIT 0** |
| E2E isolado (recriado do zero) | 69/69 | **69/69 asserções OK** (EXIT 0), log regravado |

### 10.7 Estado final do ambiente

- Dev backend (porta 3000, `GET /api/v1/health` → HTTP 200) e frontend dev (porta 5173) **ativos** ao final do trabalho.
- `apps/backend/.env` intacto; nenhum commit/push/branch/deploy; nenhum registro real alterado; todos os dados de teste claramente marcados como fictícios.
- Scripts de evidência reexecutáveis: `sdd005-verificar-schema.js`, `sdd005-listar-cadastros.js`, `sdd005-bootstrap-dev.ps1`, `sdd005-verificar-bootstrap.js`, `sdd005-ativacao-etapa3.js`, `sdd005-ativacao-etapa4.js`, `sdd005-ativacao-etapa5.js`, `sdd005-verificar-homologacao.js` (em `apps/backend/scripts/`).
