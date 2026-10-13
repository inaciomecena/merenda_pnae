# HOMOLOGAÇÃO ISOLADA — UNICIDADE DE CHAMADAS PÚBLICAS

**Data:** 2026-10-13 · **Natureza:** registro de execução REAL (evidências). Todos os
testes abaixo rodam em banco temporário isolado — **o banco ativo `merenda_pnae` não foi
tocado** (nem existe nesta máquina; ver §1).

Reprodutibilidade: `docs/importacao-pnae-2025/scripts/validar-unicidade-isolada.js`
(fail-closed: aborta exit 1 se a conexão não for exatamente o schema isolado).

---

## 1. Ambiente utilizado

| Item | Valor |
|---|---|
| Servidor | `DESKTOP-2H6BJIT:3306` (127.0.0.1, TCP) — MariaDB **10.4.32** |
| Schema isolado | **`merenda_pnae_homolog_2025_unicidade`** (nome contém `homolog`; recusado se não for exatamente este) |
| Banco ativo `merenda_pnae` | **inexistente nesta máquina** (SDD §4 registrado como BLOQUEADO — só existem os isolados) |
| Snapshot restaurado | `output/backups/merenda_pnae-homolog-pnae2025-before-1791857330521.sql` (2,88 MB; dump MariaDB **sem** `CREATE DATABASE`/`USE` — sem risco de redirecionamento) |
| Baseline | 84 tabelas · 33 linhas em `_prisma_migrations` · 6 chamadas (`E2E-*`, 2026, `dreId` NULL, HOMOLOGADA) = estado do ativo no momento do dump (pós-incidente: índice `(dreId,numero,exercicio)`, sem o antigo) |
| Prisma | schema do repo (v5.22.0), `@prisma/client` gerado |

Pré-condições confirmadas antes de cada execução (SDD §9): identidade do servidor
(`@@hostname`/`@@port`/`VERSION()`), schema via `SELECT DATABASE()`, credenciais,
não-ativo, dump de backup disponível, permissão de modificação do isolado.

## 2. Migrações executadas

Após restaurar o snapshot: `node scripts/guardiar-migracao.js` (PERMITIDO — schema
isolado) → `npx prisma migrate deploy`.

```
30 migrations found in prisma/migrations
Applying migration `20261013120000_chamada_publica_unicidade_estadual`
All migrations have been successfully applied.
```

Somente **1** migration pendente (a nossa) foi aplicada — as 29 anteriores já constavam
no snapshot. Ao final (após todos os cenários):
`npx prisma migrate status` → **"Database schema is up to date!"** (30). Nenhum
`migrate reset` foi usado (re-restore via `DROP DATABASE` + `mysqldump` pipeline).

## 3. Índices antes e depois

**Antes (snapshot do ativo):**

| Índice | Colunas | Único |
|---|---|---|
| `pnae_chamadas_publicas_dreId_numero_exercicio_key` | dreId, numero, exercicio | ✔ |

**Depois (migration aplicada):**

| Índice | Colunas | Único |
|---|---|---|
| `pnae_chamadas_publicas_dreId_numero_exercicio_key` | dreId, numero, exercicio | ✔ |
| **`pnae_chamadas_publicas_dreEscopo_numero_exercicio_key`** | **dreEscopo, numero, exercicio** | **✔** |

Coluna nova: `dreEscopo varchar(191) GENERATED ALWAYS AS (ifnull(dreId,'ESTADUAL')) STORED`
— nas 6 linhas legadas passou a materializar `ESTADUAL` (antes inexiste).

## 4. Coerência Prisma × banco (experimentos `migrate diff`)

| PSL testado | Proposta do diff sobre `dreEscopo` |
|---|---|
| sem declaração | `DROP COLUMN` + `DROP INDEX` (destrutivo) |
| só `@ignore` | `DROP INDEX` (coluna protegida, índice não) |
| **`@ignore` + `@@unique` (adotado)** | **nenhuma** ✔ |

`validate` ✔ · `generate` ✔ · `status` ✔. Efeito confirmado do `@ignore`: o campo é
invisível no Prisma Client (`select: { dreEscopo: true }` → *Unknown field*), comportamento
desejável.

## 5. Cenários obrigatórios (§9.1) — execução real

| Cenário | Ação executada | Resultado |
|---|---|---|
| **A — DREs diferentes** | Alta Floresta e Barra do Garças criam `SC-A/2025` (2025) | **PERMITIDO** — 2 linhas; `dreEscopo` = UUID de cada DRE |
| **B — Mesma DRE** | Alta Floresta repete `SC-A/2025` (2025) | **BLOQUEADO pelo banco** — `P2002` |
| **C — Exercícios diferentes** | Alta Floresta cria `SC-A/2025` em **2026** | **PERMITIDO** |
| **D — Estaduais ×2** | 2ª escrita idêntica com `dreId NULL` via **Prisma Client direto (sem service)** | **BLOQUEADO pela persistência** — `P2002`; `dreEscopo = 'ESTADUAL'` ✔ (prova: só o índice poderia bloquear) |
| **E — Estadual × DRE** | DRE cria `SC-D/2025` (2025) já existindo estadual com mesmo nº/exercício | **PERMITIDO** (escopos distintos; sentinela ≠ UUID) |
| **F — Concorrência** | `Promise.allSettled([create, create])` idênticas, sem await intermediário | **OK — 1 persistida, 1 rejeitada** (`P2002`) |
| **G — Registros de 2026** | Snapshot coluna-a-coluna (23 colunas) dos 6 `E2E-*` antes × depois de tudo | **OK — 6 registros idênticos, 0 divergências** (total 2026 = 7 linhas: 6 legadas + 1 do cenário C) |
| **H — Idempotência** | Importação experimental do plano real executada **2×** + re-simulação do plano | **OK — ver §6** |

Íntegridade referencial final (§9.2.6): **0 órfãs** (`editalId`/`dreId`/`municipioId`),
60 chamadas.

## 6. Evidências de idempotência (cenário H)

Plano real `staging/planos/dry-run-plano.json` → 51 ações `ChamadaPublica`
(**48 chaves únicas**; a chave `012/2024|2025` da DRE Alta Floresta é planejada 4× pelos
procedimentos ED-0092/0093/0094/0096):

| Execução | Resultado | Contagem total |
|---|---|---|
| 1ª | 48 `CREATE` + 3 `JA_EXISTENTE` (repetições intra-lote detectadas pela identidade) | 12 → **60** |
| 2ª | 51 `JA_EXISTENTE` (nenhum `CREATE`) | **60 → 60** (estável) |
| Re-simulação do plano com existentes lidos do banco | `chamadasRestantesNoPlano: 0`, `jaExistentesChamada: 51`, `novosCandidatos: 0` | — |

- **13 números repetidos entre DREs** no plano foram todos importados — antes, com a
  unique global `(numero, exercicio)`, a 2ª DRE de cada número colidiria.
- Nenhuma sobrescrita indevida: segunda execução não modifica linhas (só detecta).
- Importação **experimental** apenas no isolado; `aplicar` definitivo permanece
  bloqueado (exit 3) e nada foi importado no ativo.

Idempotência do plano também coberta em biblioteca pura:
`unicidade-escopo.spec.ts` cenário H (14 testes).

## 7. Evidências de concorrência (cenário F)

Duas escritas idênticas disparadas simultaneamente (pool Prisma, conexões distintas):
exatamente **1 fulfilled / 1 rejected**, erro `P2002` (único violado = índice). Como o
teste grava via Prisma Client **sem passar pela validação do service**, a única barreira
possível era o índice — confirmação da garantia na camada de persistência.

## 8. Falha e recuperação (§9.2.7) — drill em scratch isolado

Tabela scratch com duas linhas estaduais duplicadas e a migration pendente de índice:

1. `CREATE UNIQUE INDEX` → **ERRO 1062** `Duplicate entry 'ESTADUAL-001/2025-2025'` (exit 1) — **fail-closed**, sem efeito parcial (tabela intacta, 2 linhas, sem índice).
2. Recuperação conforme plano documentado: saneamento da duplicata + reexecução do `CREATE UNIQUE INDEX` → sucesso.
3. Proteção reativada: novo INSERT duplicado → **1062** (contagem final 1). Scratch removido.

## 9. Preservação dos dados (§9.2 e SDD §12)

- Snapshot G: 6 registros `E2E-*` de 2026 comparados **coluna a coluna (23 colunas)**
  antes/depois de todos os cenários e da importação experimental → **idênticos**.
- Nenhum `UPDATE`/`DELETE` foi executado em linhas legadas em toda a homologação.
- Histórico Prisma: nenhuma migration antiga editada; nenhum checksum alterado; nenhuma
  linha removida de `_prisma_migrations`.

## 10. Resultado final

| Item | Status |
|---|---|
| Cenários A–H | **8/8 conforme o esperado** |
| Migration no isolado | Aplicada; `status` up-to-date; coerente com schema e app |
| `tsc --noEmit` | **exit 0** |
| `jest --runInBand` | **49 suítes · 494 testes · 494 passed · 0 failed** (novos: guard 12, service 15, escopo 14) |
| Guarda de migração | Matriz de 16 casos + 12 testes jest (ver `PLANO_ALINHAMENTO_PRODUCAO.md` §6) |
| Banco ativo alterado | **NÃO** |

**Classificação: CONCLUÍDO EM HOMOLOGAÇÃO.** O alinhamento do banco ativo (aplicar a
migration lá) depende de autorização explícita posterior — ver
`PLANO_ALINHAMENTO_PRODUCAO.md`.
