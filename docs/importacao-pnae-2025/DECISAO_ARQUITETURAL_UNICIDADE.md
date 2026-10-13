# DECISÃO ARQUITETURAL — UNICIDADE DE CHAMADAS PÚBLICAS (DRE × ESTADUAL)

**Data:** 2026-10-13 · **Natureza:** decisão técnica implementada em código e validada em
homologação isolada. **Banco ativo `merenda_pnae`: NÃO alterado nesta etapa.**

---

## 1. Regra de negócio

**A numeração das chamadas públicas é única dentro da mesma DRE e exercício, e pode se
repetir entre DREs diferentes.**

| DRE | Número | Exercício | Resultado |
|---|---|---|---|
| Alta Floresta | 001/2025 | 2025 | Permitido |
| Sinop | 001/2025 | 2025 | Permitido (outra DRE) |
| Alta Floresta | 001/2025 | 2025 | **Bloqueado — duplicidade** |
| Alta Floresta | 001/2026 | 2026 | Permitido (outro exercício) |
| Estadual (sem DRE) | 001/2025 | 2025 | Permitido (escopo distinto) |
| Estadual (sem DRE) | 001/2025 | 2025 (2ª vez) | **Bloqueado — duplicidade estadual** |

Chave lógica por escopo:

- **DRE:** `(dreId, numero, exercicio)`
- **Estadual:** `(ESTADUAL, numero, exercicio)` — sentinela de escopo (ver §3)

## 2. Escopo por DRE

Coberto pelo índice único `pnae_chamadas_publicas_dreId_numero_exercicio_key`
(já existente no banco ativo desde a migration `20261012180000`, cuja aplicação no ativo
foi o incidente documentado em `INCIDENTE_MIGRATION_BANCO_ATIVO.md`).

No `schema.prisma`: `@@unique([dreId, numero, exercicio])` — inalterado nesta etapa.

## 3. Escopo estadual — o problema do NULL

MySQL/MariaDB **não restringe duplicidade em índice UNIQUE quando a coluna é NULL**
(`NULL <> NULL`). Portanto:

```prisma
@@unique([dreId, numero, exercicio])
```

não impede duas chamadas estaduais (`dreId IS NULL`) com o mesmo número e exercício.
Validação apenas no service também **não é garantia**: duas requisições concorrentes
podem passar pela checagem prévia e ambas inserir.

### Solução escolhida: coluna gerada STORED + índice único composto

```sql
ALTER TABLE `pnae_chamadas_publicas`
  ADD COLUMN `dreEscopo` VARCHAR(191)
  GENERATED ALWAYS AS (IFNULL(`dreId`, 'ESTADUAL')) STORED;

CREATE UNIQUE INDEX `pnae_chamadas_publicas_dreEscopo_numero_exercicio_key`
  ON `pnae_chamadas_publicas`(`dreEscopo`, `numero`, `exercicio`);
```

Um único índice cobre **os dois escopos**:

- linha com DRE → `dreEscopo = dreId` → regra por DRE;
- linha estadual → `dreEscopo = 'ESTADUAL'` → regra estadual;
- estadual × DRE com mesmo número/exercício → `'ESTADUAL'` ≠ qualquer UUID → **permitido**.

## 4. Justificativa técnica (alternativas avaliadas)

| Alternativa | Veredito |
|---|---|
| **Coluna gerada `IFNULL(dreId,'ESTADUAL')` + índice único** (escolhida) | Garantia no banco, `dreId` permanece opcional, nenhum dado legado é alterado, compatível MySQL 5.7+ / MariaDB 10.2+ (nosso alvo: MariaDB 10.4.32). |
| Índice funcional sobre `IFNULL(dreId,'ESTADUAL')` | **Rejeitada** — exigiria MariaDB 10.6+ / MySQL 8.0.13+; incompatível com o servidor 10.4.32. |
| Coluna normal + trigger `BEFORE INSERT/UPDATE` | Funcionaria, mas é mais móveis em movimento (trigger + coluna + dump), maior risco de dessincronia; a coluna gerada é recalculada pelo próprio banco, nunca editável. |
| `dreId` obrigatório + linha-sentinela "ESTADUAL" na tabela `dres` | **Rejeitada** — exigiria alterar os 6 registros legados de 2026 (dreId NULL → sentinela), violando a restrição de não alterar registros existentes, e descaracterizaria a relação opcional. |
| Apenas validação no service | **Insuficiente** — concorrência ultrapassa a checagem prévia (cenário F prova isso no nível do índice). |

## 5. Comportamento com NULL

- `dreId = NULL` → `dreEscopo = 'ESTADUAL'` (coluna STORED, sempre materializada).
- A sentinela `'ESTADUAL'` não pode colidir com um `dreId` real: `dres.id` é UUID
  (`String @default(uuid())`) — um UUID jamais é a string exata `ESTADUAL`.
- A coluna gerada **não é inserível nem editável**: o INSERT do Prisma não a inclui e o
  banco sempre a recalcula a partir de `dreId`.
- `dreEscopo` é exposto **nem no Prisma Client** (campo `@ignore` — verificado
  empiricamente: `select: { dreEscopo: true }` falha com *Unknown field*), o que é o
  comportamento desejado: é artefato de persistência, não de domínio.

## 6. Compatibilidade com MySQL/MariaDB

- Colunas geradas: MariaDB ≥ 10.2 e MySQL ≥ 5.7 ✔ (servidor real: 10.4.32-MariaDB).
- Índice UNIQUE sobre coluna gerada STORED: suportado ✔ (verificado no drill).
- `migrate deploy` e `mysqldump`: a definição `GENERATED ALWAYS AS (...) STORED` é
  dumper/restaurável (o dump pré-incidente do ativo já foi restaurado 4× nesta homologação
  sem perda).
- Censura de colação: `utf8mb4_unicode_ci` é insensível a caixa/acentos e ignora espaços à
  direita (PAD SPACE) — a comparação em app e em banco ficam alinhadas (ver §8).

## 7. Compatibilidade com Prisma (validada empiricamente)

Colunas geradas **não são representáveis em Prisma Schema Language**. Testes `prisma
migrate diff` executados contra o banco isolado (resultados registrados em
`HOMOLOGACAO_UNICIDADE_ISOLADA.md` §4):

| PSL (schema.prisma) | Diff banco → PSL |
|---|---|
| sem nenhuma declaração de `dreEscopo` | propunha `DROP COLUMN` + `DROP INDEX` (**destrutivo**) |
| só `dreEscopo String? @ignore` | protegia a coluna, mas ainda propunha `DROP INDEX` |
| **`@ignore` + `@@unique([dreEscopo, numero, exercicio])` (adotado)** | **nenhuma ação** sobre `dreEscopo`/índice — coerência total |

Portanto o schema declara:

```prisma
dreEscopo String? @ignore @db.VarChar(191)
...
@@unique([dreId, numero, exercicio])
@@unique([dreEscopo, numero, exercicio])
```

- `@ignore` → Prisma Migrate ignora a coluna (não cria nem descarta); Prisma Client não a expõe.
- `@@unique([dreEscopo, ...])` → Prisma reconhece o índice (nome gerado = nome criado) e
  **não o trata como drift**.
- A DDL versionada fica em
  `apps/backend/prisma/migrations/20261013120000_chamada_publica_unicidade_estadual/migration.sql`
  com documentação no cabeçalho. **Qualquer migration futura que recriar a tabela via
  `CREATE TABLE` deverá reproduzir a coluna gerada e seu índice** (mesma ressalva já
  presente no cabeçalho da migration e nesta seção).

Verificações executadas: `prisma validate` ✔ · `prisma generate` (v5.22.0) ✔ ·
`prisma migrate status` no isolado: *Database schema is up to date!* (30 migrations) ✔ ·
`prisma migrate diff` sem drift nos nossos artefatos ✔.

## 8. Normalização da numeração (§2.3)

Inspeção do estado real (não presumir equivalências):

- **Banco (6 registros legados de 2026):** `E2E-<timestamp>` (prefixo de teste E2E).
- **Importação histórica (51 aprovados):** `NNN/AAAA` com zero à esquerda (`001/2025`,
  `030/2024`), via `normalizarNumero` do gerador de staging.
- **Caso conhecido `025/224`** (ED-0067_sinop): **não corrigido** — permanece bloqueado
  pendente de decisão administrativa; `025/224` **não** é tratado como `025/2024`.

Regra canônica adotada (uma única fonte compartilhada):
`apps/backend/src/common/util/numero-chamada.ts` → `normalizarNumeroChamada()` = **`trim()`
apenas**.

- Espaços nas bordas nunca são numeração documental → removidos na comparação e na escrita.
- **Caixa e miolo são preservados** (nada de uppercase/padding no dado armazenado).
- A comparação em banco já é case-insensitive por colação (`utf8mb4_unicode_ci`); o
  simulador da importação usa `.toUpperCase()` apenas em **chaves em memória**
  (`Set`/`Map`), simulando a mesma semântica — mesma regra em todos os lados.
- Nenhum dado histórico foi alterado; nenhum formato foi reescrito silenciosamente.

## 9. Impactos em services (`chamadas-publicas.service.ts`)

1. `verificarUnicidade` agora consulta **por escopo** (`dreId` ou `null` para estadual) com
   `numero` normalizado — nunca uma checagem global `(numero, exercicio)`.
2. Mensagens claras por escopo: `Numero ja utilizado nesta DRE para o exercicio` ×
   `Numero ja utilizado no escopo estadual para o exercicio`.
3. **Tratamento de conflito na escrita** (`tratarConflitoUnicidade`): violação detectada
   pelo banco (corrida entre requisições) → `P2002`/`ER_DUP_ENTRY`/`meta.target` convertidos
   em **409 ConflictException** com a mensagem do escopo; qualquer outro erro é
   re-lançado intacto (não mascarado).
4. `criar` e `atualizar` normalizam `numero` (trim) na escrita; DTO ganhou
   `@IsNotEmpty() @Length(1, 191)` (limites da coluna — sem restringir formato).
5. Permissões (`ADMIN`/`DRE`/`ESCOLA`), auditoria e os fluxos de aprovação, publicação,
   contratação e homologação **não foram alterados**; a auditoria não registra `CREATE`
   quando há conflito.
6. A validação do service é **UX**, não garantia: a garantia efetiva é dos dois índices no
   banco (comentário no código aponta esta decisão).

## 10. Impactos na importação histórica

1. `chaveChamada` (idempotência) usa a identidade **`(dreId|SEM_DRE, numero, exercicio)`**
   com a normalização canônica compartilhada.
2. Plano (`simulador-importacao.ts`): documento **sem nenhuma DRE identificada**
   (`nomePacote` vazio) → planejado como **estadual** (`dreId: null`, resumo explícito
   `escopo ESTADUAL`); DRE **nomeada porém não resolvida** continua **bloqueada** — nunca
   se infere troca de escopo institucional.
3. Executor (`executor-importacao-historica.ts`): colisão verificada por
   `(dreId ?? null, numero, exercicio)`; corrida na escrita cai no tratamento P2002 do
   service (409), transação abortada.
4. **`aplicar` permanece placeholder protegido (exit 3)** — importação definitiva **não**
   liberada.
5. Achado relevante da execução experimental: o plano real tem 51 ações de chamada com
   **48 chaves únicas** — a chave `012/2024|2025` (DRE Alta Floresta) é planejada **4×**
   (ED-0092/0093/0094/0096, procedimentos distintos da mesma chamada); as repetições são
   detectadas como `JA_EXISTENTE` pela identidade (sem duplicar registro).

## 11. Riscos residuais

1. **Banco ativo ainda sem o índice estadual** — enquanto `20261013120000_*` não for
   aplicada lá (com autorização explícita), o escopo estadual do ativo depende só do
   service (corrida possível). Ver `PLANO_ALINHAMENTO_PRODUCAO.md`.
2. **Incidente `20261012180000` permanece não resolvido no ativo** (aplicada sem
   autorização; linhas duplicadas em `_prisma_migrations` pré-existentes) — fora do escopo
   desta etapa.
3. **Rotas que contornam a guarda de migração** (e2e/scripts) — inventariadas em
   `PLANO_ALINHAMENTO_PRODUCAO.md` §6; a guarda **não** impede `prisma migrate` manual.
4. Checksums do histórico: 25/30 linhas do snapshot divergem dos arquivos do repo por
   `core.autocrlf=true` (banco guarda LF, checkout Windows tem CRLF) — artefato de
   checkout, não edição de migrations; recomendação de `.gitattributes` registrada no plano.
5. Se uma migration futura recriar `pnae_chamadas_publicas` via `CREATE TABLE`, deverá
   reproduzir a coluna gerada e o índice (§7).
