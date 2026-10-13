# PLANO DE ALINHAMENTO DO BANCO ATIVO À ARQUITETURA DE UNICIDADE

**Data:** 2026-10-13 · **Natureza:** PLANO — **nada abaixo foi executado**. Toda intervenção
no banco ativo `merenda_pnae` depende de **autorização explícita posterior**
(SDD §§ 12/15). A homologação isolada que sustenta este plano está registrada em
`HOMOLOGACAO_UNICIDADE_ISOLADA.md`; a decisão técnica em
`DECISAO_ARQUITETURAL_UNICIDADE.md`.

---

## 1. Estado atual do banco ativo — **NÃO VERIFICADO nesta máquina**

Diagnóstico §4 registrado como **BLOQUEADO** com evidência:

- Esta máquina (`DESKTOP-2H6BJIT`, MariaDB 10.4.32) **não possui** o schema
  `merenda_pnae` (`information_schema.SCHEMATA`: ausente; scripts de diagnóstico
  falham com `1146 Table 'merenda_pnae._prisma_migrations' doesn't exist`).
- O ativo está no host **`HP`** (segundo `banco-homolog-preparado.json`). Enquanto o
  host não for acessível, o estado abaixo é o **último conhecido** (dump
  `output/backups/merenda_pnae-homolog-pnae2025-before-1791857330521.sql` +
  documentos do incidente).

Último estado conhecido do ativo:

| Item | Estado |
|---|---|
| Índice de chamadas | `..._dreId_numero_exercicio_key` (dreId, numero, exercicio) — o antigo `(numero, exercicio)` foi removido pela migration `20261012180000` (aplicada sem autorização — incidente) |
| Proteção estadual (dreId NULL) | **AUSENTE** (o índice com dreId NULL não restringe duplicidade) |
| `_prisma_migrations` | 33 linhas (29 migrations + **4 nomes duplicados**: sdd_005, reference_data_mt, sdd_010, sdd_0101) |
| Checksums | 25/30 divergem dos arquivos do repo **por `core.autocrlf=true`** (banco guarda LF; checkout Windows tem CRLF) — artefato de checkout, **não** edição de migrations |
| Chamadas | 6 (`E2E-*`, exercício 2026, `dreId` NULL, HOMOLOGADA) |
| Drift banco × PSL | 305 linhas de diff (29 FKs com nomes não-Prisma, 24 RedefineIndex, 4 CreateIndex, 5 AlterTable, 1 DropIndex em `sdd010_sazonalidade_producao`) — **nenhum** sobre `pnae_chamadas_publicas`/`dreEscopo` |

## 2. Estado desejado

1. Tabela `pnae_chamadas_publicas` com **ambos** os índices únicos:
   `(dreId, numero, exercicio)` **e** `(dreEscopo, numero, exercicio)` sobre a coluna
   gerada `dreEscopo = IFNULL(dreId,'ESTADUAL') STORED`.
2. `_prisma_migrations` coerente: linha de `20261013120000_chamada_publica_unicidade_estadual`
   presente; duplicatas removidas (decisão do responsável).
3. Aplicação (services/importação) já alinhada nesta etapa (código nesta árvore).
4. Entradas oficiais de migração protegidas pela guarda fail-closed.

## 3. Diferenças banco × schema × aplicação

| Artefato | Ativo (último conhecido) | Repo/aplicação (nesta árvore) | Ação |
|---|---|---|---|
| Coluna `dreEscopo` | ausente | migration `20261013120000` pronta | **DDL no ativo** (§4) |
| Índice `(dreEscopo, numero, exercicio)` | ausente | criado pela migration | **DDL no ativo** (§4) |
| Índice `(dreId, numero, exercicio)` | presente | `@@unique([dreId, numero, exercicio])` | manter |
| Linha da migration no histórico | ausente | migration versionada | aplicada junto do DDL |
| Duplicatas em `_prisma_migrations` | 4 pares | não representáveis no repo | limpeza opcional (§4.6) |
| Services/importação | binário antigo | escopo DRE+estadual, P2002→409 | deploy de aplicação (fora do banco) |

## 4. Passos futuros (somente com autorização explícita)

1. **Backup:** `mysqldump --single-transaction --routines` do ativo no host `HP`;
   conferir o backup **restaurando-o em schema isolado** (mesmo procedimento já
   executado e comprovado nesta homologação).
2. **Pré-checks read-only no host `HP`:**
   `node docs/importacao-pnae-2025/scripts/diagnostico-incidente.js` +
   `SHOW INDEX FROM pnae_chamadas_publicas` + contagem/índices de `_prisma_migrations`
   (conferir a linha de `20261012180000` e o estado das 4 duplicatas).
3. **Decisão sobre o incidente `20261012180000`** (fora do escopo desta etapa):
   como a arquitetura aprovada **mantém** o índice `(dreId, numero, exercicio)`, a
   reconciliação natural é **validar e manter** a linha do histórico (opção B de
   `PLANO_RECUPERACAO_INDICES.md`), em vez de removê-la. Qualquer decisão exige o
   responsible party — o incidente **não** é declarado resolvido aqui.
4. **Aplicar `20261013120000_chamada_publica_unicidade_estadual` no ativo:**
   `node apps/backend/scripts/guardiar-migracao.js` (deve reportar PERMITIDO com
   identidade efetiva = `merenda_pnae` **no host autorizado**) →
   `npx prisma migrate deploy` → verificar índices (§2.1 do registro de homologação
   como esperado) e `migrate status`.
5. **Deploy da aplicação** correspondente (services + importação já nesta árvore).
6. **Limpeza opcional das 4 duplicatas** em `_prisma_migrations` (SQL preparado sob
   demanda; só linhas duplicadas, sem tocar em checksums de migrations).
7. **Higiene de repo (recomendação):** `.gitattributes` com
   `apps/backend/prisma/migrations/** text eol=lf` para eliminar o artefato
   autocrlf dos checksums; nenhuma migration antiga deve ser reescrita.

## 5. Necessidade de DDL

**SIM** — a migration exige no ativo:

```sql
ALTER TABLE `pnae_chamadas_publicas`
  ADD COLUMN `dreEscopo` VARCHAR(191)
  GENERATED ALWAYS AS (IFNULL(`dreId`, 'ESTADUAL')) STORED;
CREATE UNIQUE INDEX `pnae_chamadas_publicas_dreEscopo_numero_exercicio_key`
  ON `pnae_chamadas_publicas`(`dreEscopo`, `numero`, `exercicio`);
```

Riscos de dados: **nenhum** — coluna derivada, sem UPDATE/DELETE de linhas; comportamento
em 6 linhas legadas demonstrado no isolado (G: idênticas coluna a coluna).

## 6. Proteção contra migrations acidentais (guarda)

Validação §8 (matriz de 16 casos executada + **12 testes jest** em
`apps/backend/scripts/guardiar-migracao.spec.ts`, todos passando):

- `new URL()` com query parameters ✔ · rejeita `merenda_pnae` **antes de conectar**
  (etapa `politica`) ✔ · allowlist `MIGRACAO_SCHEMAS_PERMITIDOS` ✔ · lista de
  proibidos ✔ · identidade efetiva via `SELECT DATABASE()/@@hostname/@@port/CURRENT_USER()`
  ✔ (inclui teste de divergência via alias DNS) ✔ · URL sem schema/lixo/postgres ✔ ·
  porta morta (falha = bloqueio) ✔ · nenhuma saída contém `mysql://` ou senha ✔.

Entradas **protegidas** pela guarda: `npm run dev`, `npm run prisma:migrate`,
`iniciar-sistema.bat` (passo [2/4] aborta com `exit /b 1` se a guarda bloquear, antes
do `migrate deploy` do passo [3/4]).

**Afirmação honesta — rotas que contornam a guarda** (a guarda **não** impede comandos
diretos do Prisma):

| Rota | Caminho:linha | Proteção atual |
|---|---|---|
| E2E SDD-011 (vetor do incidente) | `apps/backend/scripts/e2e-sdd011-http.js:14` (`ensureDatabase`: `CREATE DATABASE` + `prisma migrate deploy` com URL por concatenação) | só `assertIsolatedDatabase` por **nome** — sem confirmação de identidade |
| Runner E2E SDD-010 | `apps/backend/scripts/run-e2e-sdd010.js:42` (spawn `prisma migrate deploy`) | sem guarda |
| Runner SDD-005 | `apps/backend/scripts/run-sdd005-fresh-isolated.js:30` | sem guarda |
| Preparação de homolog | `docs/importacao-pnae-2025/scripts/preparar-banco-homolog.js:139` | asserção por nome do schema |
| Seeds (`prisma:seed`, `seed:test`, `seed:reference`) | `apps/backend/package.json` | escrita de **dados**, sem DDL (não cobertos por design) |
| `npx prisma migrate ...` digitado manualmente | qualquer terminal | **imprevisível pelo repo** |

**Proposta de separação de credenciais** (não executada nesta etapa):

1. **Usuário da aplicação** (`app_pnae`): `GRANT SELECT, INSERT, UPDATE, DELETE ON merenda_pnae.*` — **sem DDL**; `DATABASE_URL` de produção usa este usuário (um `migrate deploy` manual falharia por permissão).
2. **Usuário de homologação** (`hml_pnae`): DDL apenas nos schemas `merenda\_pnae\_homolog\_%` (ex.: `GRANT ALL ON \`merenda\_pnae\_homolog\_%\`.*`).
3. **Usuário de migração de produção** (`mig_pnae`): DDL restrito a `merenda_pnae`, guarda obrigatória no caminho de execução, credencial fora do `.env` da aplicação, uso apenas com autorização registrada.

## 7. Estratégia de backup

1. `mysqldump --single-transaction --routines --triggers` antes de qualquer DDL (mesmo
   formato já usado e validado — o dump desta homologação foi restaurado 4×).
2. **Validar o backup por restore em schema isolado** (não basta o arquivo existir).
3. Manter também o dump pré-incidente `...before-1791857330521.sql` como linha de base.

## 8. Critérios de rollback

- A migration só **adiciona** coluna derivada + índice → rollback = `DROP INDEX
  pnae_chamadas_publicas_dreEscopo_numero_exercicio_key` +
  `DROP COLUMN dreEscopo` (sem perda de dados; a coluna é recalculável).
- DDL no MySQL/MariaDB não é transacional: se o `CREATE UNIQUE INDEX` falhar (1062 por
  duplicatas), a coluna permanece sem índice (**comportamento drillado em
  `HOMOLOGACAO_UNICIDADE_ISOLADA.md` §8**); recuperação = saneamento das duplicatas +
  reexecução do índice.
- Restore completo do backup só em caso de corrupção — nunca como passo rotineiro.

## 9. Critérios de autorização

1. Autorização **escrita** nomeando host, schema, migration e janela de execução.
2. Backup validado por restore em isolado.
3. Guarda PERMITIDO com identidade efetiva conferida no output.
4. Pré-checks read-only (§4.2) executados e revisados.
5. Decisão registrada sobre o incidente `20261012180000` (§4.3).
6. Credenciais separadas (§6) quando aplicável.

## 10. Situação do incidente

O incidente `20261012180000` **permanece aberto** (`INCIDENTE_MIGRATION_BANCO_ATIVO.md`);
nada nesta etapa modifica `_prisma_migrations` do ativo nem declara resolução. Os documentos
de recuperação (`PLANO_RECUPERACAO_INDICES.md`, `VALIDACAO_RECUPERACAO_ISOLADA.md`)
continuem válidos como alternativa, mas a arquitetura aprovada altera a recomendação final
(§4.3).
