# INCIDENTE — Migration de Prisma aplicada ao banco ATIVO `merenda_pnae`

**Data da investigação:** 2026-10-13 · **Natureza:** apuração SOMENTE LEITURA.
**Situação: INCIDENTE CONFIRMADO POR EVIDÊNCIA DOCUMENTAL — NÃO RESOLVIDO.**
Nenhuma intervenção foi feita (nem poderia ser feita) no banco ativo nesta máquina: ele **não existe** no servidor desta estação.

---

## 1. Resumo executivo

| Item | Constatação |
| --- | --- |
| O que se alega | A migration `20261012180000_chamada_publica_unicidade_por_dre` foi aplicada por engano ao banco **ativo** `merenda_pnae`, degradando o índice de unicidade de `pnae_chamadas_publicas`. |
| O que a evidência mostra | **Confirmado.** O dump pré-incidente do banco ativo (`output/backups/merenda_pnae-homolog-pnae2025-before-*.sql`, obtido do git) contém (a) a linha da migration em `_prisma_migrations` com `finished_at` e `rolled_back_at = NULL`, e (b) o `CREATE TABLE` de `pnae_chamadas_publicas` **já com** o índice novo `(dreId,numero,exercicio)` e **sem** o índice antigo `(numero,exercicio)`. |
| Quando | A migration terminou de ser aplicada em **2026-10-12 21:24:28 (UTC-4)** — **48 segundos** após o commit `62362b5` (21:23:40 -0400) que criou o arquivo da migration. Ver §3. |
| Verificável ao vivo daqui? | **Não.** O schema `merenda_pnae` não existe no único servidor MySQL desta máquina (§5). A verificação em tempo real precisa ser feita no host onde o ativo roda (`HP`, segundo os artefatos). |
| O que foi feito | (1) Apuração somente leitura; (2) SQL de recuperação **preparado, não executado** (`PLANO_RECUPERACAO_INDICES.md`); (3) procedimento **validado em cópia isolada** (`VALIDACAO_RECUPERACAO_ISOLADA.md`); (4) correção local de código fail-closed (§8). |
| O que falta | Autorização explícita do responsável para intervir no banco ativo + decisão de produto sobre qual índice é o correto (§10). |

---

## 2. Escopo e regras desta investigação

1. Somente leitura no banco ativo: apenas `SELECT`/`SHOW`. Proibido: DDL/DML, `prisma migrate deploy`, edição de `_prisma_migrations`, restauração de dump **sobre o ativo**.
2. Nenhum branch, commit ou worktree foi criado por esta investigação.
   > **Correção de estado (2026-10-13 15:10:17, reflog `HEAD@{…}`):** o *checkout* foi movido por um **`git pull --ff`** (fast-forward `4fb1656` → `f61e6b4`), executado nesta máquina por via externa a este diagnóstico. Hoje **`HEAD = f61e6b4 = origin/main`** (`git status -sb` → `## main...origin/main`, sem divergência). Isso **não altera** a cronologia do incidente (§3), mas invalida a redação original desta seção, que afirmava `HEAD = 4fb1656` "7 commits atrás de `origin/main`". Corrigido nesta revisão.
3. Conteúdo de `origin/main` lido via `git show origin/main:<caminho>` — nada foi *checkoutado*. A partir de 15:10:17 árvore local e `origin/main` são o mesmo commit, o que torna essas comparações triviais (§5.1).
4. Nada foi declarado resolvido; nenhuma escrita em produção; nenhuma retomada da importação histórica.

---

## 3. Cronologia (fontes: git + artefatos do dump)

> **Nota de relógio:** o nome dos dumps contém `Date.now()` (UTC) e o cabeçalho do `mysqldump` usa hora local — comparando os dois, a máquina roda em **UTC-4** (`22:06:24` local = `02:06:24Z`). Já os timestamps de `_prisma_migrations` são gravados pelo cliente Prisma em **UTC**; se fossem locais, o dump (feito às 22:06 locais) conteria uma linha “do futuro” (`2026-10-13 01:24`), o que é impossível. Abaixo, horários em **UTC-4** com o valor bruto entre parênteses quando relevante.

| Quando (UTC-4) | Evento | Fonte |
| --- | --- | --- |
| 2026-10-12 21:23:40 | Commit `62362b5` cria `prisma/migrations/20261012180000_chamada_publica_unicidade_por_dre/migration.sql` e troca `@@unique` de `ChamadaPublica` para `@@unique([dreId, numero, exercicio])` no `schema.prisma` | `git log/show` |
| **2026-10-12 21:24:28** (`01:24:28.733 → .838` UTC) | Migration **aplicada** no banco que gerou o dump: linha `af891b10-7e42-4214-8458-e36eacbb1a70`, checksum `46534e95…`, `rolled_back_at = NULL`, `applied_steps_count = 1` — **48 s após o commit** | `_prisma_migrations` dentro do dump |
| 2026-10-12 22:06:24 / 22:07:29 / 22:08:51 | Três `mysqldump` do **banco ativo** (`-- Dump completed on …`; os três arquivos são idênticos, divergindo apenas nessa linha) | cabeçalhos + comparação linha a linha dos dumps |
| 2026-10-12 22:11:46 | Commit `10b241e` publica `preparar-banco-homolog.js`, `banco-homolog-preparado.json` e os dumps | `git log` |
| 2026-10-13 05:43:12 | Commit `f61e6b4` publica `scripts/diagnostico-incidente.js` (script de apuração — **nenhuma saída dele foi versionada**) | `git log --stat` |
| 2026-10-13 15:10:15 | `git fetch origin` nesta máquina (`.git/FETCH_HEAD` — timestamp do arquivo) | git |
| 2026-10-13 15:10:17 | `git pull --ff` move o `HEAD` local de `4fb1656` para `f61e6b4` (= `origin/main`) — **depois** dos eventos do incidente; não interfere na sua cronologia | reflog |

Consequência temporal importante: **a degradação já existia no banco ativo ~52 minutos antes** de o roteiro de homologação isolada ser executado (`preparar-banco-homolog.js`, 22:06–22:11). Ou seja: o roteiro isolado **não** foi a causa — a causa foi um `prisma migrate deploy` disparado logo após o commit da migration, com `DATABASE_URL` apontando para o ativo.

---

## 4. O que a migration faz e qual o impacto

Arquivo: `apps/backend/prisma/migrations/20261012180000_chamada_publica_unicidade_por_dre/migration.sql` (1.316 bytes, SHA-256 `46534e954294631abed8419fff9adbb20dcd74de72aeba9fe6648a8aeda52f15`):

```sql
DROP INDEX `pnae_chamadas_publicas_numero_exercicio_key` ON `pnae_chamadas_publicas`;
CREATE UNIQUE INDEX `pnae_chamadas_publicas_dreId_numero_exercicio_key`
  ON `pnae_chamadas_publicas`(`dreId`, `numero`, `exercicio`);
```

Impacto no banco ativo, se aplicada indevidamente (é o que a evidência mostra ter ocorrido):

1. **A unicidade global `(numero, exercicio)` deixa de existir no banco.** Passa a vigorar `(dreId, numero, exercicio)`.
2. **`dreId` é anulável** (`dreId String?`). Em MySQL/MariaDB, índice `UNIQUE` **não** restringe linhas com coluna `NULL` (`NULL != NULL`). Com as 6 chamadas existentes todas com `dreId = NULL`, o banco **não impede** mais duplicidade de `(numero, exercicio)` quando não há DRE.
3. **A aplicação continua validando de forma global**: `chamadas-publicas.service.ts` (`criar`) faz `findFirst({ numero, exercicio })` sem `dreId`. Ou seja: a invariante Application-vs-Banco ficou **divergente** — o service recusa o que o banco deixaria passar (e o banco agora é mais permissivo que a aplicação).
4. `simulador-importacao.ts` usa chave `numero|exercicio` (sem DRE) — outro ponto que assume a regra antiga.
5. Operação é **só de índice** (nenhum dado alterado) e **reversível** por DDL, sem restaurar backup — desde que não haja duplicatas (verificado: 0, §6).

Contexto de produto: a troca de índice era, de fato, **uma proposta deliberada** para a importação histórica PNAE 2025 (`ANALISE_MIGRACAO_UNICIDADE.md`, que registra “NÃO aplicada, NÃO gerada migration”). O incidente **não** é a ideia da troca — é tê-la **aplicado ao banco ativo, fora de qualquer janela autorizada, sem backup, sem validação e sem os ajustes de código correspondentes**.

---

## 5. Evidência coletada (e o que ela proves)

### 5.1 Proveniência do dump: é mesmo o banco ativo?

| Evidência | Valor |
| --- | --- |
| `banco-homolog-preparado.json` → etapa `backup-ativo` | `dump C:\Projetos\merenda_pnae\output\backups\merenda_pnae-homolog-pnae2025-before-1791857330521.sql (2882183 bytes) — banco ativo NAO alterado` |
| Mesmo arquivo em `origin/main` | 2.878.704 bytes — diferença de **3.479 bytes = 3.479 finais de linha CRLF→LF**, exatamente o que `.gitattributes` (`* text=auto`) normaliza ao commitar (arquivo tem 3.479 quebras de linha). **É o mesmo arquivo.** |
| Quem o gerou | `preparar-banco-homolog.js`: `ATIVO = 'merenda_pnae'`, `mysqldump … merenda_pnae` na etapa 3 — **antes** de criar o banco isolado (etapa 4) e **antes** do `migrate deploy` isolado (etapa 6). |
| Sanidade | JSON registra `chamadasNoAtivo: 6`; o dump tem **6** linhas em `pnae_chamadas_publicas`. |
| Cabeçalho do dump | `-- Dump completed on 2026-10-12 22:06:24` (os três dumps diferem **apenas** nessa linha) |

⇒ O dump é um retrato do **banco ativo `merenda_pnae`** em 2026-10-12 22:06–22:08 (UTC-4).

> **Nota de revisão (2026-10-13):** desde 15:10:17 a árvore local está em `f61e6b4 = origin/main`, de modo que a comparação "arquivo local × `origin/main`" citada acima passou a ser trivial. A prova de identidade continua válida pelos **bytes** (2.882.183 originais ↔ 2.878.704 normalizados ↔ SHA-256 do blob) e pela cadeia de proveniência (`banco-homolog-preparado.json` + `preparar-banco-homolog.js`), não pela diferença de revisão.

### 5.2 O que o dump mostra sobre o incidente

Conteúdo extraído do dump (leitura de arquivo, sem executar SQL nenhum):

```
CREATE TABLE `pnae_chamadas_publicas` (...
  PRIMARY KEY (`id`),
  UNIQUE KEY `pnae_chamadas_publicas_dreId_numero_exercicio_key` (`dreId`,`numero`,`exercicio`),
  KEY `pnae_chamadas_publicas_editalId_idx` (`editalId`),
  ...
```

- `pnae_chamadas_publicas_dreId_numero_exercicio_key` → **1 ocorrência** (no `CREATE TABLE`);
- `pnae_chamadas_publicas_numero_exercicio_key` → **0 ocorrências** (índice antigo **inexistente**);
- `_prisma_migrations` → linha da migration indevida, com:
  - `checksum = 46534e954294631abed8419fff9adbb20dcd74de72aeba9fe6648a8aeda52f15`
  - `started_at = 2026-10-13 01:24:28.733`, `finished_at = 2026-10-13 01:24:28.838` (UTC)
  - `rolled_back_at = NULL`, `applied_steps_count = 1`;
- 84 tabelas, 33 linhas em `_prisma_migrations`, 6 `ChamadaPublica` (todas `exercicio = 2026`, `dreId = NULL`).

### 5.3 Checksum: método de verificação **validado**

O Prisma grava em `_prisma_migrations.checksum` o **SHA-256 hexadecimal do conteúdo do arquivo** da migration. Método comprovado contra o banco local `seaf_pnae` (leitura):

| Arquivo | SHA-256 calculado aqui | Valor no `_prisma_migrations` |
| --- | --- | --- |
| `20261008020000_create_audit_logs/migration.sql` (como aplicado, **sem** `IF NOT EXISTS`) | `791444915a8912dec0e776a6814de01995b9c5a8ecce51e25fa9723ba9777cd0` | `79144491…77cd0` ✅ igual |
| `20261012180000_chamada_publica_unicidade_por_dre/migration.sql` (bytes do git) | `46534e954294631abed8419fff9adbb20dcd74de72aeba9fe6648a8aeda52f15` | `46534e95…52f15` ✅ igual |

Isso demonstra que (a) o método de cálculo está correto e (b) o arquivo aplicado ao ativo é **byte a byte** o arquivo commitado em `origin/main`.

> Achado lateral (risco residual, não é este incidente): em `seaf_pnae` o arquivo `20261008020000_create_audit_logs/migration.sql` foi editado **depois** de aplicado (`IF NOT EXISTS` adicionado): arquivo atual `93745b81b0e71d0f1d262fa96a3179e433a06bd7bb788f804256150c441cc97b` ≠ checksum registrado `79144491…`. As outras 13 migrations conferem. Isso faz `prisma migrate dev` reportar *drift* de checksum — tratar em separado.

---

## 6. Verificações executadas nesta máquina (todas somente leitura)

```
# 1. Schemas existentes — contagem ATUALIZADA (revisão 2026-10-13)
mysql -e "SELECT COUNT(*) FROM information_schema.SCHEMATA"   → 34   (31 na apuração original)
# Os 3 acrescentados DEPOIS da apuração, todos descartáveis e NÃO sendo o ativo:
#   merenda_pnae_homolog_2025_validacao  — cópia isolada da validação da recuperação (13:40)
#   merenda_pnae_homolog_2025_unicidade  — cópia isolada do SDD de unicidade (16:30)
#   $iso                                 — schema VAZIO (0 tabelas), artefato não atribuído;
#                                          origem a confirmar pelo responsável antes de removê-lo
# A lista da apuração original (31, sem nenhum "merenda*"):
mysql -e "SELECT GROUP_CONCAT(...) FROM information_schema.SCHEMATA"
      → agape, agape_hml_35b, agricultura_municipal, apicaf, appantigo, bolicho,
        inaciomecena_sigseaf, information_schema, marketplace, mysql, performance_schema,
        phpmyadmin, prisma_migrate_shadow_db_adaed339-…, proleite, proleite_dev_rebuilt,
        proleite_test, proleite_test_ater_management_20260908, proleite_test_harness_final2_…,
        proleite_test_harness_final_…, proleite_test_rebuild_…, sagae, seaf, seaf_pnae,
        sgaf, sgaf_agape, siaf, siapp_db, smi2026, test, testesigseaf

# 2. Conexão com o banco ativo → INEXISTENTE
mysql --database=merenda_pnae → ERROR 1049 (42000): Unknown database 'merenda_pnae'

# 3. Servidor único desta estação
mysqld PID 5236 em :3306 · @@hostname = DESKTOP-2H6BJIT · 10.4.32-MariaDB · porta 3306
(outros portas 3307/3308 e outros processos: nenhum)

# 4. Nenhum diretório de schema "merenda*" em C:\xampp\mysql\data (raiz mtime 08/10/2026 15:36:06)
#    e nenhum diretório merenda* em C:\Projetos e D:\

# 5. Banco local realmente presente (seaf_pnae, lido de apps/backend/.env):
25 tabelas · 14 migrations · `prisma migrate status` → "Database schema is up to date!"
   (drift de checksum apenas em 20261008020000_create_audit_logs — §5.3)

# 6. Artefatos do incidente lidos do git (nada foi checkoutado):
git show origin/main:docs/importacao-pnae-2025/banco-homolog-preparado.json
git show origin/main:apps/backend/prisma/migrations/20261012180000_chamada_publica_unicidade_por_dre/migration.sql
git show origin/main:output/backups/merenda_pnae-homolog-pnae2025-before-*.sql   (leitura de bytes)
```

### 6.1 O que **NÃO** foi possível verificar daqui (lacuna declarada)

O banco ativo `merenda_pnae` **não existe neste servidor** (host `DESKTOP-2H6BJIT`); os artefatos do incidente registram `MariaDB/10.4.32 em HP:3306`. Portanto os diagnósticos ao vivo ficaram **PREPARADOS E NÃO EXECUTADOS** — em especial:

- `SELECT … FROM _prisma_migrations WHERE migration_name = '20261012180000_…'` **no ativo**;
- `SHOW INDEX`/`information_schema.STATISTICS` de `pnae_chamadas_publicas` **no ativo**;
- checagens de duplicidade `(numero, exercicio)` e `(dreId, numero, exercicio)` **no ativo**;
- diff de schema atual × backup.

Nada disso pode ser afirmado como “verificado em tempo real”; o que se tem é o **retrato do dump** (§5) — que, por ser o próprio dump do ativo, é evidência direta do estado em 2026-10-12 22:06 local.

---

## 7. Diagnóstico read-only PREPARADO para o host do ativo (NÃO EXECUTADO)

Executar **somente** no host onde `merenda_pnae` existe, com usuário de leitura, **antes** de qualquer decisão:

```sql
-- 7.1 Identidade e versão
SELECT DATABASE(), CURRENT_USER(), VERSION(), @@hostname, @@port;

-- 7.2 Histórico da migration indevida (é a prova-RAIZ)
SELECT id, migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20261012180000_chamada_publica_unicidade_por_dre';
-- esperado (p/ confirmar o incidente): 1 linha, rolled_back_at NULL, finished_at preenchido
-- conferir: checksum = 46534e954294631abed8419fff9adbb20dcd74de72aeba9fe6648a8aeda52f15

-- 7.3 Estado dos índices (é a prova do DANO)
SELECT INDEX_NAME AS nome, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'merenda_pnae' AND TABLE_NAME = 'pnae_chamadas_publicas'
GROUP BY INDEX_NAME, NON_UNIQUE;
-- se houver ..._dreId_numero_exercicio_key e NÃO houver ..._numero_exercicio_key → degradação confirmada

-- 7.4 Risco concreto: duplicatas que a regra antiga impediria
SELECT numero, exercicio, COUNT(*) AS n FROM pnae_chamadas_publicas
GROUP BY numero, exercicio HAVING COUNT(*) > 1;

-- 7.5 Risco concreto: linhas sem proteção (dreId NULL)
SELECT SUM(dreId IS NULL) AS sem_dre, COUNT(*) AS total FROM pnae_chamadas_publicas;

-- 7.6 Volume de migrations e tabelas (contexto)
SELECT COUNT(*) FROM _prisma_migrations;
SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'merenda_pnae';

-- 7.7 Alterações legítimas POSTERIORES ao backup (atividade "o que foi escrito depois do retrato")
-- O retrato de referência terminou em 2026-10-12 22:06:24 local (UTC-4) = 2026-10-13 02:06:24 UTC.
-- Qualquer linha/migration com marca posterior a esse instante veio DEPOIS do backup e precisa ser
-- RECONHECIDA como legítima (ou explicada) antes de qualquer DDL ou restore.
SELECT 'pnae_chamadas_publicas' AS tabela, COUNT(*) AS linhas,
       MAX(createdAt) AS maior_criacao, MAX(updatedAt) AS maior_atualizacao
FROM pnae_chamadas_publicas
UNION ALL SELECT 'dres', COUNT(*), MAX(createdAt), MAX(updatedAt) FROM dres
UNION ALL SELECT '_prisma_migrations', COUNT(*), MIN(started_at), MAX(finished_at) FROM _prisma_migrations;
-- Interpretação: no baseline do dump eram 6 chamadas e 33 migrations. Se hoje houver MAIS linhas
-- ou timestamps posteriores a 02:06:24Z, isso é escrita legítima pós-backup e muda a decisão de
-- rollback (restore de 2026-10-12 a perderia — §6 rollback completo).

-- 7.8 Migrations registradas DEPOIS do dump (a baseline tem 33)
SELECT migration_name, checksum, started_at, finished_at
FROM _prisma_migrations
WHERE started_at > '2026-10-13 02:06:24'
ORDER BY started_at;
```

> A execução de 7.7 e 7.8 **no host do ativo** é pré-condição da §0 nº 4 do `PLANO_RECUPERACAO_INDICES.md`: se houver escrita pós-backup, o backup de 2026-10-12 **não** serve como canal de rollback e um backup novo (§2 do plano) torna-se obrigatório.

Não executar aqui: `prisma migrate deploy|dev|reset|db push`, `DELETE/UPDATE` em `_prisma_migrations`, qualquer DDL, restauração de dump sobre o ativo.

---

## 8. Causa raiz e correção de código aplicada (local)

**Causa raiz (controle):** `prisma migrate deploy` foi executado contra o `DATABASE_URL` padrão **sem verificar a identidade do banco de destino**. Os pontos de entrada do projeto fazem exatamente isso:

- `apps/backend/package.json` → `"dev": "prisma migrate deploy && nest start --watch"`
- `iniciar-sistema.bat` → `call npx prisma migrate deploy`

**Fator agravante (construção de URL):** em `origin/main` a única URL de banco construída por **concatenação** é a do harness E2E:

```js
// apps/backend/scripts/e2e-sdd011-http.js (origin/main)
const database = process.env.SDD011_E2E_DATABASE || `merenda_pnae_e2e_sdd011_${Date.now()}`;
const url = `mysql://root:@localhost:3306/${database}?charset=utf8mb4`;   // sem new URL(), sem encoding
assertIsolatedDatabase(url);   // guarda por REGEX na string crua, não por new URL()
// ensureDatabase(): CREATE DATABASE + prisma migrate deploy — SEM SELECT DATABASE()
```

Ou seja: nome vindo de variável de ambiente interpolado sem `new URL()`/encoding, guarda baseada em texto (`OFFICIAL = /(^|\/)merenda_pnae(?:\?|$)/i` em `test/e2e/support/test-database.js`) e **nenhuma comparação com a conexão efetiva** antes do `migrate deploy` — falha por padrão **aberto**.

**Correção local (arquivos modificados nesta árvore, sem commit):**

| Arquivo | Mudança |
| --- | --- |
| `apps/backend/scripts/guardiar-migracao.js` (novo) | Guarda fail-closed: `new URL()` no `DATABASE_URL`; recusa URL ausente/não parseável/sem schema/protocolo ≠ `mysql:`; recusa schema `merenda_pnae` (e `MIGRACAO_SCHEMAS_PROIBIDOS`); exige pertencimento a `MIGRACAO_SCHEMAS_PERMITIDOS` quando definida; conecta (somente `SELECT`) e compara **identidade efetiva** `SELECT DATABASE()` × pathname, `@@port` × porta, `@@hostname` × host; qualquer erro = bloqueio; exit 0 só para liberar. |
| `apps/backend/package.json` | `dev` e `prisma:migrate` passam a rodar a guarda antes do Prisma; script novo `prisma:guard`. |
| `iniciar-sistema.bat` | Novo passo `[2/4]` que executa a guarda e aborta (exit 1) antes de `prisma migrate deploy`. |

**Testes executados (somente leitura; 1 permitido + 6 bloqueados):**

| Cenário | Resultado |
| --- | --- |
| `DATABASE_URL` padrão (`seaf_pnae`) | `PERMITIDO` exit 0 — `seaf_pnae @ DESKTOP-2H6BJIT:3306`, `root@localhost`, 10.4.32 |
| `…/merenda_pnae` (banco ativo) | `BLOQUEADO (politica)` exit 1 |
| `MIGRACAO_SCHEMAS_PERMITIDOS` sem o schema atual | `BLOQUEADO (politica)` exit 1 |
| URL sem schema (`mysql://root:@localhost:3306`) | `BLOQUEADO (url)` exit 1 |
| URL lixo (`:::nao-e-url`) | `BLOQUEADO (url)` exit 1 — `new URL()` falhou |
| Porta de servidor inexistente (3399) | `BLOQUEADO (conexao)` exit 1 — fail-closed |
| `postgres://…` | `BLOQUEADO (url)` exit 1 — protocolo inesperado |
| Cópia isolada de validação | `PERMITIDO` exit 0 + `prisma migrate status` → 14 migrations / *up to date* |

A guarda **não impede** um deploy feito à mão (`npx prisma migrate deploy` puro); ela protege os dois pontos de entrada do projeto e precisa ser adotada também em qualquer runbook de produção.

---

## 9. Riscos residuais

1. **Estado atual do ativo desconhecido em tempo real.** O retrato é do dump de 2026-10-12 22:06; qualquer coisa pode ter acontecido desde então (inclusive rollback manual). Confirmar com §7 no host `HP`.
2. **O ativo pode estar sem qualquer índice único** se alguém tiver executado só metade da recuperação (o plano trata esse caso de interrupção).
3. **Aplicação × banco divergentes**: service valida globalmente, banco não garante mais. Enquanto não se decidir (§10), a invariante depende do `findFirst` (que é corrida, fora de transação).
4. **Re-aplicação automática**: enquanto a migration existir em `prisma/migrations` e houver linha no `_prisma_migrations` ausente, qualquer `migrate deploy` com o arquivo presente a re-aplica (demonstrado em isolamento). A guarda reduz o risco nos pontos de entrada, mas não elimina execução manual.
5. **`prisma migrate status` é cego a tudo isso** — validado: reporta *up to date* mesmo com o índice divergente e com a linha da migration removida (o diff de schema não é feito). A única detecção é via `information_schema`.
6. **Esta máquina não é o host do ativo**: nenhuma correção aqui altera o estado real do `merenda_pnae`.
7. Drift de checksum em `seaf_pnae` (`20261008020000_create_audit_logs`) — pendência separada.

---

## 10. Decisão necessária do responsável (nada disto foi feito)

1. **Confirmar/ordenar a verificação read-only** (§7) no host do banco ativo.
2. **Decidir o estado-alvo do índice** — as duas opções são legítimas, mas precisam ser escolhidas:
   - **A. Reverter** para `(numero, exercicio)` (restaurar a regra antiga) → `PLANO_RECUPERACAO_INDICES.md`;
   - **B. Manter** `(dreId, numero, exercicio)` como decisão de produto — exige **mesma janela**: ajustar `chamadas-publicas.service.ts` (validação com `dreId`), `simulador-importacao.ts` (chave `dreId|numero|exercicio`) e registrar a semântica “unicidade por DRE, não valendo para `dreId NULL`”.
   Escolher A mantendo o `schema.prisma` com `@@unique([dreId, numero, exercicio])` cria *drift* permanente (o próximo `migrate dev` tentará recriar o índice novo) — a decisão de schema acompanha a decisão de banco.
3. **Autorizar ou não** a execução do plano (DDL + reconciliação de `_prisma_migrations`) — até lá, tudo permanece **preparado e não executado**.
4. Aprovar a guarda fail-closed (§8) como padrão nos pontos de entrada, e avaliar aplicar `new URL()` + identidade efetiva ao harness E2E de `origin/main` quando a árvore for atualizada.

---

*Investigação somente leitura. Incidente **não** declarado resolvido. Documentos irmãos: `PLANO_RECUPERACAO_INDICES.md` (SQL preparado, não executado) e `VALIDACAO_RECUPERACAO_ISOLADA.md` (procedimento validado em cópia isolada).*
