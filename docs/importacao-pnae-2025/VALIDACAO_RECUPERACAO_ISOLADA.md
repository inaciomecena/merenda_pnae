# VALIDAÇÃO DA RECUPERAÇÃO EM CÓPIA ISOLADA

**Status: EXECUTADO — somente em schema descartável (`merenda_pnae_homolog_2025_validacao`).**
**O banco ativo `merenda_pnae` NÃO foi tocado: ele nem existe nesta máquina.**
Nenhum arquivo do repositório foi modificado por esta validação; nenhum commit/branch/worktree foi criado.

Este documento registra a execução real do procedimento descrito em `PLANO_RECUPERACAO_INDICES.md`, com as saídas obtidas, para que o responsável possa aprovar (ou rejeitar) a aplicação no banco ativo com base em comportamento observado — não em teoria.

---

## 1. Ambiente e garantias de isolamento

| Item | Valor |
| --- | --- |
| Estação | `DESKTOP-2H6BJIT` · MariaDB **10.4.32** · `127.0.0.1:3306` · cliente `C:\xampp\mysql\bin\mysql.exe` |
| Usuário | `root@localhost` |
| Schema usado | `merenda_pnae_homolog_2025_validacao` — **criado por esta validação** (antes da criação: `COUNT(*) = 0` schemas com esse nome) |
| Schema do ativo | **inexistente** (`ERROR 1049 (42000): Unknown database 'merenda_pnae'`) → impossível tocá-lo |
| Total de schemas | 31 antes → **32** depois (o único acrescentado é o da validação). > **Nota de revisão:** hoje há **34** — o SDD de unicidade acrescentou, depois desta validação, o descartável `merenda_pnae_homolog_2025_unicidade` (16:30) e há um schema vazio `$iso` (0 tabelas, origem não atribuída). O ativo `merenda_pnae` continua **inexistente**. |
| Registro de escrita nesta validação | criar 1 schema; `DROP INDEX`/`CREATE UNIQUE INDEX` na tabela do schema isolado; `DELETE` de 1 linha em `_prisma_migrations` **do isolado**; criar/restaurar/dropar um schema temporário de rollback |

Todas as verificações são `SELECT`/`SHOW`. As únicas escritas são as listadas acima e acontecem exclusivamente no(s) schema(s) descartável(is).

---

## 2. Insumo — dump pré-incidente do banco ativo

| Item | Valor |
| --- | --- |
| Origem | `origin/main:output/backups/merenda_pnae-homolog-pnae2025-before-1791857330521.sql` (lido via `git show`, nada foi checkoutado) |
| Bytes (blob git) | 2.878.704 (= 2.882.183 do arquivo original − 3.479 CRLF normalizados pelo `.gitattributes`) |
| SHA-256 | `ce195358e1afe519e8c2e5994a39119920a3da81fbb42a6589ddac87e0fc4902` |
| Cabeçalho | `-- Dump completed on 2026-10-12 22:06:24` |
| Proveniência | `banco-homolog-preparado.json` → etapa `backup-ativo`, `chamadasNoAtivo: 6` (detalhe em `INCIDENTE_MIGRATION_BANCO_ATIVO.md` §5) |
| Cópia local usada | `%TEMP%\opencode\merenda_pnae-before-1791857330521.sql` |

> Os outros dois dumps (`…-1791857181808.sql`, `…-1791857248287.sql`) têm os **mesmos 2.878.704 bytes** e conteúdo idêntico, diferindo **apenas** na linha `-- Dump completed on` (`22:06:24` / `22:07:29` / `22:08:51`) — confirmado por comparação linha a linha dos três arquivos (1 linha divergente em 3.479, em cada par).

---

## 3. Etapas executadas e saídas

### Etapa 1 — Criar schema isolado

```sql
CREATE DATABASE `merenda_pnae_homolog_2025_validacao`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Pré-verificação: `SELECT COUNT(*) … WHERE SCHEMA_NAME = '…validacao'` → **0**. Execução → `exit 0`; contagem final → **1**.

### Etapa 2 — Restaurar o dump

```bat
mysql --user=root --host=127.0.0.1 --port=3306 --protocol=TCP ^
  merenda_pnae_homolog_2025_validacao < merenda_pnae-before-1791857330521.sql
```
→ `exit 0`.

### Etapa 3 — Linha de base (espelho do ativo no momento do dump)

Saída real (`--table`):

```
=== 1. identidade ===
database_conectado                  = merenda_pnae_homolog_2025_validacao
hostname = DESKTOP-2H6BJIT   porta = 3306   versao = 10.4.32-MariaDB

=== 2. índices de pnae_chamadas_publicas ===
pnae_chamadas_publicas_dreId_numero_exercicio_key  nao_unico=0  (dreId,numero,exercicio)   ← DEGRADADO
PRIMARY                                            nao_unico=0  (id)
pnae_chamadas_publicas_dreId_municipioId_idx       nao_unico=1
pnae_chamadas_publicas_editalId_idx                nao_unico=1
pnae_chamadas_publicas_entidadeExecutoraId_fkey    nao_unico=1
pnae_chamadas_publicas_municipioId_fkey            nao_unico=1
pnae_chamadas_publicas_status_inscricoesFim_idx    nao_unico=1
   (índice antigo ..._numero_exercicio_key: AUSENTE)

=== 3. linha da migration ===
id=af891b10-7e42-4214-8458-e36eacbb1a70
migration_name=20261012180000_chamada_publica_unicidade_por_dre
checksum=46534e954294631abed8419fff9adbb20dcd74de72aeba9fe6648a8aeda52f15
started_at=2026-10-13 01:24:28.733   finished_at=2026-10-13 01:24:28.838
rolled_back_at=NULL                  applied_steps_count=1

=== 4..8 ===
migrations_registradas = 33   ·   chamadas = 6   ·   exercicio 2026 = 6
dreId NULL = 6 / dreId preenchido = 0   ·   duplicatas (numero,exercicio) = 0   ·
duplicatas (dreId,numero,exercicio) = 0   ·   tabelas = 84
```

⇒ A cópia reproduz fielmente o estado degradado descrito no incidente.

### Etapa 4 — Backup do ponto de partida (do próprio isolado)

```bat
mysqldump … --single-transaction --routines --triggers merenda_pnae_homolog_2025_validacao ^
  > %TEMP%\opencode\backup_isolado_antes_recuperacao.sql
```
→ `exit 0`, **2.882.229 bytes**. Este arquivo sustentou o teste de rollback (Etapa 10).

### Etapa 5 — Pré-requisito do `CREATE UNIQUE`

`SELECT … GROUP BY numero, exercicio HAVING COUNT(*) > 1` → **0 linhas** ⇒ o índice antigo pode ser recriado sem falha (idem no ativo, segundo o baseline).

### Etapa 6 — Recuperação passo 1 + simulação de interrupção

```sql
DROP INDEX `pnae_chamadas_publicas_dreId_numero_exercicio_key` ON `pnae_chamadas_publicas`;
```
→ `exit 0`. Estado imediatamente após (detecção de interrupção):

```
índices unicos:  apenas PRIMARY(id)     ← tabela SEM nenhuma unique
linha da migration: 20261012180000_… (rolled_back_at = NULL)   ← histórico ainda "aplicada"
duplicatas (numero,exercicio): 0
totais: chamadas=6 · migrations=33 · tabelas=84
```
Esse estado é exatamente o que o §1 do plano classifica como “nenhuma das duas” e a retomada é apenas rodar o passo 2 — **confirmado na prática**.

### Etapa 7 — Recuperação passo 2 (retomada)

```sql
CREATE UNIQUE INDEX `pnae_chamadas_publicas_numero_exercicio_key`
  ON `pnae_chamadas_publicas`(`numero`, `exercicio`);
```
→ `exit 0`. Verificação:

```
índices unicos: pnae_chamadas_publicas_numero_exercicio_key (numero,exercicio) + PRIMARY(id)   ✔
duplicatas: 0 · chamadas=6 · migrations=33 · tabelas=84   (nada mudou)   ✔
```

### Etapa 8 — Reconciliação (Opção A) no isolado

Captura (read-only) da linha completa — id, checksum, `started_at`, `finished_at`, `applied_steps_count=1` — registrada acima (Etapa 3) e usada como base de rollback.

```sql
DELETE FROM `_prisma_migrations`
WHERE `migration_name` = '20261012180000_chamada_publica_unicidade_por_dre';
```
→ `exit 0` · `SELECT COUNT(*) FROM _prisma_migrations` → **32** (antes 33) · `SELECT … WHERE migration_name = …` → **0 linhas**.

### Etapa 9 — Teste de risco: re-aplicação após a reconciliação

Executada, **no isolado**, a própria migration de origem (`git show …:migration.sql`, 1.316 bytes) simulando um `prisma migrate deploy` feito com o arquivo presente e a linha removida:

```sql
DROP INDEX `pnae_chamadas_publicas_numero_exercicio_key` ON `pnae_chamadas_publicas`;
CREATE UNIQUE INDEX `pnae_chamadas_publicas_dreId_numero_exercicio_key` …;
```
→ `exit 0` · resultado:

```
índices unicos: pnae_chamadas_publicas_dreId_numero_exercicio_key (dreId,numero,exercicio) + PRIMARY
linha da migration: AUSENTE   ·   migrations = 32   ·   chamadas = 6   ·   tabelas = 84
```

**Conclusões do teste:** (a) a degradação **volta sozinha** se o arquivo continuar no repositório e o histórico estiver sem a linha; (b) a recuperação é **idempotente/repetível** — foi refeita logo em seguida (Etapa 10).

### Etapa 10 — Recuperação final + rollback por restore

Recuperação repetida (passos 1 e 2) → estado final do isolado:

```
índices unicos: pnae_chamadas_publicas_numero_exercicio_key (numero,exercicio) + PRIMARY   ✔
duplicatas: 0 · chamadas=6 · migrations=32 · tabelas=84   ✔
```

Rollback por backup (validado em schema temporário `merenda_pnae_homolog_2025_rollback`):

1. `CREATE DATABASE …_rollback` → exit 0;
2. `mysql …_rollback < backup_isolado_antes_recuperacao.sql` → exit 0;
3. verificação:

```
índices unicos: pnae_chamadas_publicas_dreId_numero_exercicio_key (dreId,numero,exercicio) + PRIMARY  ← degradação restaurada
migrations = 33 · migrations_incidente = 1 · chamadas = 6 · tabelas = 84   ← idêntico à linha de base
```

4. `DROP DATABASE …_rollback` → exit 0 (limpeza; o schema de evidência `…_validacao` foi mantido de propósito).

### Etapa 11 — Guarda fail-closed + ferramenta Prisma

```bat
set DATABASE_URL=mysql://root:@localhost:3306/merenda_pnae_homolog_2025_validacao?charset=utf8mb4
node scripts\guardiar-migracao.js        → {"decisao":"PERMITIDO", schema: …validacao, exit 0}
npx prisma migrate status                → 14 migrations found / "Database schema is up to date!" (exit 0)
```

**Achado importante:** o `migrate status` reportou *up to date* **mesmo** com (i) o índice divergente do `schema.prisma` e (ii) a linha da migration removida — porque a pasta local não contém essa migration e porque o Prisma **não** compara schema × banco. `migrate status` **não** serve como critério de aceitação da recuperação; só `information_schema` serve.

---

## 4. Resultado × critérios

| Critério (do plano §6) | Esperado | Observado | Veredito |
| --- | --- | --- | --- |
| Índice antigo UNIQUE presente, novo ausente | sim | Etapa 7 e 10 | **PASS** |
| 0 duplicatas `(numero, exercicio)` | 0 | 0 em todas as etapas | **PASS** |
| Volumes inalterados (6 chamadas / 84 tabelas) | iguais | 6 / 84 sempre | **PASS** |
| Preservação de 2026 | 6 de 2026 | 6 (todas `dreId NULL`) | **PASS** |
| Pré-requisito do `CREATE UNIQUE` | vazio | vazio | **PASS** |
| Reconciliação (Opção A) | 33 → 32 e 0 linhas | 33 → 32, 0 linhas | **PASS** |
| Interrupção entre os passos é detectável e retomável | sim | Etapa 6 → 7 | **PASS** |
| Rollback por restore reproduz o estado inicial | sim | Etapa 10 | **PASS** |
| Risco de re-aplicação é real | demonstrar | Etapa 9 | **CONFIRMADO** |
| `migrate status` como aceitação | não serve | Etapa 11 | **CONFIRMADO** |

Guarda fail-closed: 7 cenários (1 liberação + 6 bloqueios) — tabela em `INCIDENTE_MIGRATION_BANCO_ATIVO.md` §8.

---

## 5. Limitações do que foi validado

1. **Foi validado num banco derivado do dump, não no ativo vivo.** Não se testou: lock/concorrência com escrita real, carga (a tabela tem 6 linhas — o `CREATE UNIQUE` é instantâneo; num ativo maior medir antes), replicação/backups externos, permissões de usuário de produção.
2. **Não se executou `prisma migrate deploy` de verdade** — apenas o `migrate status` (somente leitura) e a execução manual do SQL da migration (Etapa 9) para reproduzir o efeito. Um deploy real com o arquivo presente produziria o mesmo DDL + nova linha no histórico.
3. **O host `HP` não foi exercitado**: nenhum destes passos rodou onde o `merenda_pnae` de fato vive; a validação em si não exige esse host (o procedimento é idêntico), mas a **confirmação do estado atual do ativo** continua pendente de execução lá (`INCIDENTE_…` §7).
4. **A Opção B da reconciliação não foi executada** (só observada como estado possível): manter a linha significa simplesmente não rodar o `DELETE`.
5. **Cadeia de proveniência do dump** depende de `banco-homolog-preparado.json` + código do `preparar-banco-homolog.js` — consistente (bytes, contagens, horários), mas assinada apenas pelo próprio artefato.

---

## 6. Estado final deixado nesta máquina

| Recurso | Estado |
| --- | --- |
| `merenda_pnae_homolog_2025_validacao` | **mantido** como evidência: índice antigo restaurado, sem a linha da migration (32), 6 chamadas, 84 tabelas. Descartável a qualquer momento. |
| `merenda_pnae_homolog_2025_rollback` | **removido** (`DROP DATABASE` após a verificação) |
| `merenda_pnae` (ativo) | **inexistente** neste servidor — intocado |
| Demais schemas da época (31) | intocados (apenas `SELECT`). Posteriores a esta validação: `merenda_pnae_homolog_2025_unicidade` (criado pelo SDD de unicidade, não por esta validação) e `$iso` (vazio, não atribuído) — nenhum dos dois é o ativo. |
| Repositório | 3 arquivos de documentação novos + `apps/backend/scripts/guardiar-migracao.js` novo + ajustes em `apps/backend/package.json` e `iniciar-sistema.bat`; **nada commitado** |
| Scripts de apoio da validação | `%TEMP%\opencode\*.sql`, `analisar-dump.js`, `migration_indevida.sql`, `backup_isolado_antes_recuperacao.sql` |

---

## 7. Conclusão

O procedimento de `PLANO_RECUPERACAO_INDICES.md` **funciona como escrito**: recuperação de índices (2 passos), detecção/retomada de interrupção, reconciliação do histórico do Prisma, verificação por `information_schema` e rollback por restore — todos demonstrados com saída real em cópia derivada do próprio banco ativo. Também ficaram demonstrados os dois riscos que o plano alerta: **re-aplicação automática** da migration e **cegueira do `prisma migrate status`**.

Resta, para o banco ativo: (1) confirmar o estado atual com o diagnóstico somente-leitura (`INCIDENTE_…` §7) no host onde ele existe; (2) decidir reverter × manter (`PLANO_…` §7); (3) autorizar a execução. **Até lá: nada executado.**
