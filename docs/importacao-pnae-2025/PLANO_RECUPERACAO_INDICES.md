# PLANO DE RECUPERAÇÃO — Índices de `pnae_chamadas_publicas` no banco ATIVO

**Status: PREPARADO — NÃO EXECUTADO.**
Nenhum comando deste plano foi rodado contra o banco ativo `merenda_pnae`. Ele não existe nesta máquina (ver `INCIDENTE_MIGRATION_BANCO_ATIVO.md` §6) e, mesmo que existisse, a ordem vigente é **somente leitura até autorização explícita**.

Este documento entrega: (1) verificação read-only de estado; (2) backup; (3) SQL de recuperação de índices; (4) reconciliação do histórico do Prisma (`_prisma_migrations`); (5) verificações pós-recuperação; (6) critérios de aceitação, rollback e interrupção. O procedimento completo foi **validado em cópia isolada** — ver `VALIDACAO_RECUPERACAO_ISOLADA.md` (DDL: ✔, reconciliação: ✔, rollback por restore: ✔, risco de re-aplicação: ✔).

---

## 0. Pré-condições (todas obrigatórias; nenhuma foi cumprida ainda)

| # | Condição | Status |
| --- | --- | --- |
| 1 | Autorização explícita e datada do responsável técnico/administrativo para escrita no banco ativo | **PENDENTE** |
| 2 | Diagnóstico read-only executado no host do ativo e resultados anexados (§1) | PENDENTE (script pronto) |
| 3 | Decisão de produto sobre o estado-alvo do índice (reverter × manter — §7) | PENDENTE |
| 4 | Backup novo do ativo feito **imediatamente antes** do DDL (§2) — e **1.7/§7.7 sem escrita pós-backup não reconhecida** | PENDENTE (comando pronto) |
| 5 | Nenhuma escrita concorrente em `pnae_chamadas_publicas` durante a janela (backend em manutenção) | PENDENTE |
| 6 | Janela, operador nomeado e canal de rollback acordados | PENDENTE |
| 7 | Validação em cópia isolada concluída | **CONCLUÍDA** (`VALIDACAO_RECUPERACAO_ISOLADA.md`) |

**Regra de ouro:** enquanto 1–6 não estiverem cumpridas, executar **apenas** a §1 (somente `SELECT`).

---

## 1. Fase 0 — Diagnóstico somente leitura (SEMPRE permitido)

Conectar com usuário de leitura no host do ativo:

```sql
-- 1.1 Identidade (confirma que você está no banco certo — não confie na URL)
SELECT DATABASE() AS db, CURRENT_USER() AS usuario, VERSION() AS versao,
       @@hostname AS host, @@port AS porta;

-- 1.2 Linha da migration indevida
SELECT id, migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20261012180000_chamada_publica_unicidade_por_dre';

-- 1.3 Estado dos índices  ← diagnóstico do dano
SELECT INDEX_NAME AS nome, NON_UNIQUE,
       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS colunas
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pnae_chamadas_publicas'
GROUP BY INDEX_NAME, NON_UNIQUE ORDER BY NON_UNIQUE, nome;

-- 1.4 Pré-requisito do CREATE UNIQUE (tem de voltar VAZIO)
SELECT numero, exercicio, COUNT(*) AS n FROM pnae_chamadas_publicas
GROUP BY numero, exercicio HAVING COUNT(*) > 1;

-- 1.5 Linhas sem proteção de índice (dreId NULL)
SELECT SUM(dreId IS NULL) AS sem_dre, COUNT(*) AS total FROM pnae_chamadas_publicas;

-- 1.6 Volume para o pós-check
SELECT (SELECT COUNT(*) FROM pnae_chamadas_publicas) AS chamadas,
       (SELECT COUNT(*) FROM _prisma_migrations)     AS migrations,
       (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()) AS tabelas;

-- 1.7 Alterações legítimas POSTERIORES ao backup de referência
-- (retrato do ativo: 2026-10-12 22:06:24 local/UTC-4 = 2026-10-13 02:06:24 UTC;
--  baseline: 6 chamadas · 33 migrations · 84 tabelas)
SELECT 'pnae_chamadas_publicas' AS tabela, COUNT(*) AS linhas,
       MAX(createdAt) AS maior_criacao, MAX(updatedAt) AS maior_atualizacao
FROM pnae_chamadas_publicas
UNION ALL SELECT 'dres', COUNT(*), MAX(createdAt), MAX(updatedAt) FROM dres
UNION ALL SELECT '_prisma_migrations', COUNT(*), MIN(started_at), MAX(finished_at) FROM _prisma_migrations;

SELECT migration_name, checksum, started_at, finished_at
FROM _prisma_migrations WHERE started_at > '2026-10-13 02:06:24' ORDER BY started_at;
```

**Leitura da 1.7 (obrigatória antes da §2):** se existirem linhas ou migrations com marca
posterior a `2026-10-13 02:06:24Z`, o dump de 2026-10-12 **não é mais um canal de rollback
válido** (um restore a perderia). Nesse caso o §2 deixa de ser "boa prática" e vira
pré-condição absoluta, e o §6 "rollback completo" deve ser reavaliado pelo responsável.
Procedimento detalhado: `INCIDENTE_MIGRATION_BANCO_ATIVO.md` §7.7–7.8.

**Interpretação (matriz de decisão da Fase 1):**

| 1.3 mostra | Estado | Próximo passo |
| --- | --- | --- |
| Só `…_dreId_numero_exercicio_key` (única além de PRIMARY) | Degradação ativa (esperado pela evidência do dump) | §2 (recuperar) se a decisão for reverter |
| `…_numero_exercicio_key` **e** `…_dreId_numero_exercicio_key` | Recuperação incompleta (interrupção no meio) | rodar só o passo 2 do §3 |
| Só `…_numero_exercicio_key` | Já recuperado | pular para §4 + §5 |
| Nenhuma das duas | Interrupção no pior ponto (tabela sem nenhuma unique) | rodar passo 2 do §3 **imediatamente** |

Valores de referência (retrato do dump de 2026-10-12 22:06, usado como *baseline*): 84 tabelas · 33 linhas em `_prisma_migrations` · 6 `ChamadaPublica` (todas 2026, `dreId NULL`) · 0 duplicatas.

---

## 2. Fase 1 — Backup obrigatório (executar logo antes do DDL)

```bat
C:\xampp\mysql\bin\mysqldump.exe --user=<leitura_escrita> --host=<host> --port=3306 ^
  --single-transaction --routines --triggers merenda_pnae > backup_merenda_pnae_antes_recuperacao_%date%.sql
```

Aceitação do backup (obrigatório antes de seguir):

```bat
for %A in (backup_merenda_pnae_antes_recuperacao_*.sql) do @echo %~zA bytes
```

- tamanho na casa dos **milhões** de bytes (o retrato atual do ativo tem 2.882.183 bytes no original / 2.878.704 no git);
- conferir que o arquivo contém `CREATE TABLE \`pnae_chamadas_publicas\`` e `INSERT INTO \`_prisma_migrations\``;
- guardar o SHA-256 do arquivo junto com o registro da janela.

> Não usar como “backup” os dumps de 2026-10-12 sem recapturar: qualquer coisa escrita desde então ficaria de fora.

---

## 3. Fase 2 — Recuperação dos índices (DDL) — **NÃO EXECUTADO**

Operação puramente de índice: **nenhum dado é alterado**; rollback não exige restaurar dados.

### Pré-checagem (falhar se não passar)

```sql
-- Tem de voltar VAZIO (senão o CREATE UNIQUE falha; interromper e tratar duplicatas):
SELECT numero, exercicio, COUNT(*) AS n FROM pnae_chamadas_publicas
GROUP BY numero, exercicio HAVING COUNT(*) > 1;
-- Esperado hoje: 0 linhas (0 duplicatas — verificado em cópia isolada).
```

### Passo 1 — remover o índice indevido

```sql
DROP INDEX `pnae_chamadas_publicas_dreId_numero_exercicio_key` ON `pnae_chamadas_publicas`;
```

> **Ponto de interrupção crítico:** a partir daqui a tabela **não tem nenhuma unique** de `(numero, exercicio)`. Se o processo cair aqui, o estado é detectável (§1 matriz: “nenhuma das duas”) e a **retomada é rodar o passo 2** — não é preciso restaurar backup.

### Passo 2 — restaurar o índice original

```sql
CREATE UNIQUE INDEX `pnae_chamadas_publicas_numero_exercicio_key`
  ON `pnae_chamadas_publicas`(`numero`, `exercicio`);
```

### Passo 3 — verificação imediata

```sql
SELECT INDEX_NAME AS nome, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS colunas
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pnae_chamadas_publicas' AND NON_UNIQUE = 0
GROUP BY INDEX_NAME;
-- Esperado: PRIMARY(id) e pnae_chamadas_publicas_numero_exercicio_key(numero,exercicio)
```

---

## 4. Fase 3 — Reconciliação do histórico do Prisma (`_prisma_migrations`)

A migration continua **registrada como aplicada** (`finished_at` preenchido, `rolled_back_at NULL`) mesmo com o banco revertido. Há duas opções; **escolher uma** (as duas foram analisadas; a Opção A foi validada em isolamento):

### 4.0 Captura obrigatória (read-only, antes de qualquer coisa)

```sql
SELECT id, migration_name, checksum, rolled_back_at, started_at, finished_at, applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20261012180000_chamada_publica_unicidade_por_dre';
```

Registrar a saída como evidência. Valores conhecidos:

- `id = af891b10-7e42-4214-8458-e36eacbb1a70`
- `checksum = 46534e954294631abed8419fff9adbb20dcd74de72aeba9fe6648a8aeda52f15`
  (= SHA-256 do arquivo `migration.sql`; método validado — `INCIDENTE_MIGRATION_BANCO_ATIVO.md` §5.3)
- `started_at/finished_at = 2026-10-13 01:24:28.733 / .838` (UTC)

### Opção A — remover a linha (histórico passa a dizer “nunca aplicada”)

```sql
DELETE FROM `_prisma_migrations`
WHERE `migration_name` = '20261012180000_chamada_publica_unicidade_por_dre';
```

- ✔ Reflete a realidade do banco (a migration não vale para este schema).
- ✖ Se o arquivo existir em `prisma/migrations` e alguém rodar `prisma migrate deploy`, ela **re-aplica** e a degradação volta — **demonstrado em isolamento** (`VALIDACAO_RECUPERACAO_ISOLADA.md`, teste “re-aplicação”).
- Mitigações obrigatórias se escolher A: (i) guarda `apps/backend/scripts/guardiar-migracao.js` ligada nos pontos de entrada (recusa `merenda_pnae` sempre); (ii) *freeze* de `prisma migrate deploy` no ativo até a §7; (iii) na mesma mudança de produto, **retirar** `prisma/migrations/20261012180000_chamada_publica_unicidade_por_dre/` do repositório e alinhar o `schema.prisma` (isso exige commit — fora do escopo desta entrega).

### Opção B — manter a linha (histórico passa a dizer “aplicada”, mas o banco diz o contrário)

- ✔ Nenhum DML no histórico; `prisma migrate deploy` **não** tenta re-aplicar (já consta como aplicada).
- ✖ O histórico mente sobre o estado real; divergência invisível para o Prisma (validado: `prisma migrate status` continua *up to date* mesmo com a linha removida e o índice divergente — ele **não** compara schema × banco).
- Cabe quando se escolhe **manter o índice novo** (§7, opção B de produto) ou como estado temporário até a decisão.

### Tabela decisória

| Critério | Opção A (DELETE) | Opção B (manter) |
| --- | --- | --- |
| Histórico reflete o banco | ✔ | ✖ |
| Risco de re-aplicação automática | ✖ (precisa das 3 mitigações) | ✔ |
| DML na tabela de sistema do Prisma | Sim (precisa da autorização nº 1) | Não |
| Validada em isolamento | ✔ (`VALIDACAO_…`) | parcialmente (estado observado) |

**Recomendação técnica:** A **somente** com as três mitigações acima e com a decisão de §7 tomada na mesma janela; caso a decisão seja “manter o índice novo”, usar B e tratar o resto como mudança de produto.

### Proibido

- Editar/reescrever `checksum`, `started_at`, `finished_at` (frauda a auditoria; além disso o Prisma compara checksum com o arquivo e passa a bloquear `migrate dev` com erro opaco).
- `prisma migrate reset`, `prisma migrate dev`, `prisma db push` no ativo — todos **recriariam** o schema a partir do `schema.prisma` atual (que declara o índice novo).
- Restaurar dump **sobre o ativo** (só como último recurso, com autorização específica; perde tudo escrito após o backup).

---

## 5. Fase 4 — Verificações pós-recuperação (somente leitura)

```sql
-- 5.1 Índices (critério de aceitação primário)
SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX)
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pnae_chamadas_publicas'
GROUP BY INDEX_NAME, NON_UNIQUE;
-- Aceita: PRIMARY + ..._numero_exercicio_key UNIQUE(numero,exercicio) + não-únicos já existentes
-- Rejeita: qualquer ..._dreId_numero_exercicio_key

-- 5.2 Nenhuma duplicata sob a regra restaurada (tem de voltar VAZIO)
SELECT numero, exercicio, COUNT(*) FROM pnae_chamadas_publicas
GROUP BY numero, exercicio HAVING COUNT(*) > 1;

-- 5.3 Integridade de volume (nada pode ter mudado)
SELECT COUNT(*) AS chamadas FROM pnae_chamadas_publicas;      -- esperado: mesmo da §1.6
SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();
SELECT COUNT(*) FROM _prisma_migrations;                      -- A: −1 | B: igual

-- 5.4 Preservação de 2026
SELECT exercicio, COUNT(*) FROM pnae_chamadas_publicas GROUP BY exercicio;   -- 2026 → 6

-- 5.5 Estado do histórico (conforme opção escolhida)
SELECT migration_name, finished_at FROM _prisma_migrations
WHERE migration_name = '20261012180000_chamada_publica_unicidade_por_dre';
```

Fora do SQL: subir o backend em modo somente-verificação e confirmar que `GET /chamadas-publicas` responde e que a criação de chamada com `(numero, exercicio)` duplicado é recusada pelo service (409) — a garantia efetiva hoje é a da aplicação.

**`prisma migrate status` não serve como aceitação** — validado em isolamento: reporta *up to date* mesmo com o índice divergente e com a linha removida.

---

## 6. Critérios de aceitação, rollback e interrupção

### Aceitação (todos obrigatórios)

1. §5.1 mostra `…_numero_exercicio_key` UNIQUE e **não** mostra `…_dreId_numero_exercicio_key`.
2. §5.2 vazia; §5.3 igual à pré-checagem (6 chamadas / 84 tabelas / migrations −1 ou igual conforme opção).
3. §5.4 intacta (todas de 2026).
4. Backend sobe e valida unicidade global via service (409 em duplicata).
5. Evidências (saídas SQL + SHA-256 do backup) anexadas à janela.
6. Reconciliação de §4 registrada com a opção escolhida e o operador.

### Rollback (se algo falhar após o passo 1 do §3, ou na validação)

- **Rollback preferencial (rápido):** rodar o passo 2 do §3 — o estado fica “os dois índices” ou “índice novo ausente”; depois repetir a sequência conforme a §1.
- **Rollback completo (contingência):** restaurar o backup do §2 (`mysql merenda_pnae < backup…sql`), **apenas** com autorização específica, ciente de que perde escritas posteriores ao backup.
- Rollback da reconciliação (Opção A): reinsertar a linha capturada na §4.0 com os valores originais (`id`, `checksum`, `started_at`, `finished_at`, `applied_steps_count = 1`) — é o motivo de a captura ser obrigatória.

### Interrupção

| Onde caiu | Estado | Ação |
| --- | --- | --- |
| Antes do passo 1 | Intacto (degradado) | Retomar do início |
| Entre passo 1 e 2 | **Sem nenhuma unique** | Rodar passo 2 o quanto antes; §1 detecta |
| Após passo 2, antes da §4 | Índice recuperado; histórico ainda “aplicada” | Retomar na §4 |
| Durante a §4 (DELETE parcial impossível — statement único) | linha presente ou ausente | conferir com §4.0/§5.5 e decidir A/B |
| Qualquer erro de SQL | Depende | **Parar**, capturar §1 completo, não tentar “consertar” sem o diagnóstico |

---

## 7. Decisão de produto que condiciona tudo (não é técnica)

A migration nasceu de uma proposta legítima (`ANALISE_MIGRACAO_UNICIDADE.md`): permitir o mesmo `numero` em DREs diferentes. Escolher:

- **Reverter (opção do plano acima):** restaurar `(numero, exercicio)` no banco — e então `schema.prisma` (que declara `@@unique([dreId, numero, exercicio])`) **também** precisa voltar, senão gera *drift* permanente. Exige commit.
- **Manter:** não rodar §3/§4; em vez disso, na mesma janela: ajustar `chamadas-publicas.service.ts` (validação por `dreId`), `simulador-importacao.ts` (chave `dreId|numero|exercicio`), documentar que `dreId NULL` fica sem proteção de índice e usar a Opção B da §4.

Não há caminho neutro: hoje banco, aplicação e `schema.prisma` estão em três estados diferentes.

---

*Plano preparado, não executado. Nenhuma escrita foi feita no banco ativo (inexistente nesta máquina). Validação do procedimento: `VALIDACAO_RECUPERACAO_ISOLADA.md`. Contexto e evidências: `INCIDENTE_MIGRATION_BANCO_ATIVO.md`.*
