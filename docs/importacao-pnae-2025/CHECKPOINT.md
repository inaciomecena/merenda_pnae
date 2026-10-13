# CHECKPOINT — Importação histórica PNAE MT 2025

## Fase atual

**UNICIDADE DE CHAMADAS — SDD "DEFINIÇÃO DE UNICIDADE, CONSISTÊNCIA PRISMA E PROTEÇÃO DO
BANCO ATIVO" EXECUTADO EM HOMOLOGAÇÃO ISOLADA (2026-10-13).**

- Regra arquitetural implementada: número único por `(DRE, exercício)`; escopo ESTADUAL
  (`dreId` NULL) protegido **no banco** via coluna gerada `dreEscopo =
  IFNULL(dreId,'ESTADUAL')` + índice único (migration
  `20261013120000_chamada_publica_unicidade_estadual`, versionada, **não aplicada no ativo**).
- Services (`chamadas-publicas.service.ts`), simulador/executor da importação e DTO
  alinhados (escopo, normalização canônica `trim`, P2002→409, mensagens por escopo).
- Homologação isolada real: cenários **A–H todos conformes** no schema
  `merenda_pnae_homolog_2025_unicidade` (`HOMOLOGACAO_UNICIDADE_ISOLADA.md`).
- Documentos novos: `DECISAO_ARQUITETURAL_UNICIDADE.md`, `HOMOLOGACAO_UNICIDADE_ISOLADA.md`,
  `PLANO_ALINHAMENTO_PRODUCAO.md`.
- Guarda de migração: matriz de 16 casos + **12 testes jest** (`guardiar-migracao.spec.ts`);
  rotas que contornam a guarda inventariadas (PLANO §6) com afirmação honesta de limites.
- **Banco ativo INTACTO nesta etapa** (nada escrito, nenhuma migration, nenhum
  `_prisma_migrations` tocado). Diagnóstico do ativo continua **BLOQUEADO** (host `HP`
  inacessível desta máquina — schema `merenda_pnae` inexistente aqui). Incidente
  `20261012180000` **não declarado resolvido**.
- Próxima etapa (autorização explícita): aplicar `20261013120000` no ativo conforme
  `PLANO_ALINHAMENTO_PRODUCAO.md` (com backup validado por restore e decisão sobre o
  incidente).

Estado anterior (etapa de preparação/saneamento da importação histórica) segue descrito
nas seções abaixo.

### Revisão de consistência (2026-10-13 — retomada da sessão)

- **Estado do git corrigido nos entregáveis.** O `git pull --ff` das **15:10:17** (reflog
  `HEAD@{…}`) moveu o `HEAD` de `4fb1656` para **`f61e6b4` (= `origin/main`)**. Os três
  documentos de incidente foram gravados às **15:18:51** ainda afirmando `HEAD = 4fb1656`
  "7 commits atrás de `origin/main`" e `git fetch` às `09:33:35` — ambas as afirmações já
  estavam desatualizadas quando escritas e foram **corrigidas** (`INCIDENTE…` §2, §3, §5.1).
  Nenhum branch, commit ou worktree foi criado.
- **Contagem de schemas atualizada (31 → 34)**, com os três acrescentados documentados:
  `merenda_pnae_homolog_2025_validacao` (desta validação), `merenda_pnae_homolog_2025_unicidade`
  (SDD de unicidade) e **`$iso` — VAZIO (0 tabelas), origem não atribuída; confirmar a origem
  antes de removê-lo.** O ativo `merenda_pnae` continua **inexistente** neste servidor.
- **Atividade "alterações legítimas posteriores ao backup" formalizada**: checagens somente-SELECT
  `7.7`/`7.8` (`INCIDENTE_…`) e `1.7` (`PLANO_RECUPERACAO_INDICES.md`), que condicionam a
  validade do dump de 2026-10-12 como canal de rollback (baseline: 6 chamadas · 33 migrations ·
  84 tabelas; corte em `2026-10-13 02:06:24Z`).
- **Revalidação do código local:** `npx tsc --noEmit -p tsconfig.json` → **exit 0**;
  `npx jest --runInBand` → **49 suites · 494 testes · 494 passed · 0 failed**.
- **Evidências do isolado reconfirmadas (somente SELECT):** `…_validacao` segue com
  `pnae_chamadas_publicas_numero_exercicio_key (numero,exercicio)` + `PRIMARY`, **32** migrations
  e **0** linhas da migration `20261012180000_…` — a evidência da validação está íntegra.
- **Banco ativo segue INTACTO e inacessível desta máquina. Incidente não declarado resolvido.**

## Contexto

- Raiz do projeto: `C:\Projetos\merenda_pnae`
- Raiz do pacote (PACKAGE_DIR): `C:\Projetos\merenda_pnae\docs\PNAE_MT_2025_PACOTE_IMPORTACAO`
- Manifesto encontrado **diretamente** em PACKAGE_DIR: `PACKAGE_DIR\MANIFESTO_DOCUMENTOS.json`
- Área de entrega: `C:\Projetos\merenda_pnae\docs\importacao-pnae-2025`

## Caminhos reais confirmados

- `PACKAGE_DIR\MANIFESTO_DOCUMENTOS.json` (864.285 bytes)
- `PACKAGE_DIR\INVENTARIO_EDITAIS_PNAE_MT_2025.xlsx` (8 abas)
- `PACKAGE_DIR\RELATORIO_PESQUISA_PNAE_MT_2025.md`
- `PACKAGE_DIR\PENDENCIAS_PESQUISA.md`
- `PACKAGE_DIR\EVIDENCIAS_ACESSO_PORTAIS.json`
- `PACKAGE_DIR\MAPEAMENTO_TERRITORIAL_PARCIAL.md`
- `PACKAGE_DIR\CONTROLE_INTEGRIDADE.md`
- `PACKAGE_DIR\LEIA_ME.md`
- `PACKAGE_DIR\PROMPTS_POR_DRE\` (13 arquivos)
- `PACKAGE_DIR\PNAE_MT_2025\` (12 subpastas de DRE, 128 PDF + 128 TXT)
- `PACKAGE_DIR\DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES\` (08_METROPOLITANA, 10_PRIMAVERA_DO_LESTE)

Caminhos Linux citados nos documentos do pacote (`/workspace/scratch/6c61238d1c73/outputs/pnae2025/`) foram desconsiderados; os arquivos foram resolvidos pelos caminhos Windows acima.

Não existe `AGENTS.md` nem `CLAUDE.md` no repositório (verificado por glob).

## Hash do manifesto

- Arquivo: `MANIFESTO_DOCUMENTOS.json`
- SHA-256: `800d0f833c16b102a723abccd27c583e98ba1dc5b3b4fd5d65ab3b2836d72f16`
- Tamanho: 864.285 bytes

## Resultado da validação do pacote (Etapa 2)

`node docs/importacao-pnae-2025/scripts/validate-package.js` → `VALIDACAO_PACOTE.json`.

| Classificação | Qtd |
|---|---:|
| INTEIRO (hash confere, %PDF- ok) | 128 |
| AUSENTE (sem arquivo; 7× HTTP 404, Tangará da Serra) | 7 |
| ALTERADO | 0 |
| INVÁLIDO | 0 |
| FORA_DO_PACOTE (traversal) | 0 |

- Reconciliação manifesto ↔ planilha: 13 portais, 125 procedimentos, 135 URLs, 553 itens, 312 anexos, 44 pendências — **idênticos nas duas fontes**.
- 122 hashes únicos; 4 grupos de duplicados binários: DOC-0019/0020, DOC-0026/0027, DOC-0055/0059/0060, DOC-0056/0057/0058.
- Elegibilidade dos 125: 52 ELEGIVEL_2025, 27 PREGAO_2025, 19 CONFLITO_EXERCICIO, 11 FORA_ESCOPO_2026, 7 PENDENTE_ARQUIVO, 5 PENDENTE_EDITAL_COMPLETO, 4 REFERENCIA_HISTORICA.

## Resultado do staging e do dry-run (Etapa final)

- **Staging:** 125 editais → **51 aprovados · 37 segregados · 37 bloqueados · 0 pendentes · 0 erros**; **2652 itens** (1614 com valores, **1038 sem valores** por coluna cortada pela quebra de página no PDF de origem — lacuna documental, nunca zerada); 1020 blocos não-item descartados.
- **Dry-run (1ª vez):** 51 novos candidatos, 74 bloqueios, 2808 ações (todas `CREATE`), `planos/dry-run-plano.json`.
- **Dry-run (2ª vez):** **0 novos** → idempotência comprovada.
- **`aplicar` executado só para registrar o comportamento:** **exit 3 — BLOQUEADO** (placeholder protegido; nada gravado, nenhuma migration).
- **Institucional:** 13/13 DREs `CONFIRMADO`; 125 entidades executoras pendentes (sem CNPJ no pacote); 6 municípios não resolvidos. Nada criado/atualizado em cadastro.
- **Por DRE (aprovados/itens):** Alta Floresta 7/233 · Diamantino 13/500 · Juína 10/997 · Pontes e Lacerda 1/104 · Primavera do Leste 2/55 · Sinop 18/763; demais DREs só segregados/bloqueados.

## Resultado do saneamento (etapa atual — somente análise)

- **Entidade executora:** CNPJ **`53.291.992/0001-10`** (SEDUC-MT) confirmado sob o cabeçalho
  oficial "IDENTIFICAÇÃO DA ENTIDADE EXECUTORA DO PNAE/FNDE/MEC" em **53 dos 54**
  documentos dos 51 aprovados (`DOC-0010` não traz a seção). O cadastro tem **1 única**
  entidade estadual (`b72a5ceb-…`) mas com **`cnpj: null`** → casamento por CNPJ falha,
  vinculação **não atribuída** (depende de preencher o CNPJ + decisão administrativa).
- **`025/224`:** o **próprio PDF** (`DOC-0075`) contém as duas grafias — linha 5 "Nº 025/224"
  (cabeçalho, ano de 3 dígitos) e linhas 13/34 "Nº 025/2024" / "Edital 025/2024", com
  Processo **SEDUC-PRO-2024/178226** e sessão **31/01/2025**. Evidência interna a favor de
  `025/2024`; **sem correção silenciosa** (depende de confirmação administrativa — muda a chave lógica).
- **Valores (2652 itens dos aprovados):** 1614 com valores · **1038 sem valores** (quebra de
  página no PDF de origem, nunca zerados) · **597 divergências numéricas não-nulas**
  (204 acima de R$ 1,00; caso real `ALFACE CRESPA` 145×19,24=2.789,80 vs. fonte 2.789,08)
  · **400 sem unidade comercial** · 1 `FORMATO_NUMERICO_AMBIGUO` (PEPINO, em edital bloqueado).
- **Classificação:** entre os 51 candidatos — **0 bloqueantes**, 1020 `bloco_nao_item`
  RESOLVIDAS (ruído de tabela descartado corretamente), 2138 DEPENDENTES de validação
  administrativa. Detalhe em `MATRIZ_PENDENCIAS_2025.md`.
- **Migração de unicidade:** avaliada em `ANALISE_MIGRACAO_UNICIDADE.md` — **0 colisões** hoje
  (6 chamadas existentes, todas 2026, `dreId` NULL, fixtures E2E); proposta
  `@@unique([dreId, numero, exercicio])` é compatível, mas **não é só schema**: exige ajuste
  da validação global em `chamadas-publicas.service.ts` (linha 16) e da chave do simulador.
  **NÃO aplicada, NÃO gerada migration.**
- **Plano de homologação isolada:** escrito em `PLANO_HOMOLOGACAO_IMPORTACAO_2025.md`
  (banco temporário, migrações autorizadas, teste real, idempotência, integridade,
  preservação de 2026, RBAC). Nada executado.

## Testes

- `npx tsc --noEmit -p tsconfig.json` → **exit 0**.
- `npx jest --runInBand` → **49 suites · 494 testes · 494 passed · 0 failed** (base da
  preparação: 46/453; +12 guarda, +15 service, +14 escopo da importação).
- `npx jest --runInBand src/modules/importacao-historica/importacao-historica.spec.ts` → **57/57**.
- Mapeamento cenário × teste em `TESTES_IMPORTACAO_PNAE_2025.md`.

## Observação sobre `schema.prisma` e o trabalho SDD-010.1 (importante)

O `git status` mostra `apps\backend\prisma\schema.prisma` como modificado, **mas essa
alteração não pertence a esta preparação**:

- `schema.prisma` já estava modificado por **trabalho independente do SDD-010.1**, presente
  no checkout antes e durante esta execução.
- Os modelos **`SazonalidadeProducao`** e **`UnidadeProdutiva`** (e seus campos/relações)
  pertencem ao SDD-010.1.
- A migration **`20261012160000_sdd_0101_sazonalidade_temporal`** pertence ao SDD-010.1 e
  **não** à importação histórica PNAE.
- A preparação **PNAE 2025 não alterou o schema**: nenhuma linha foi adicionada,
  removida ou modificada por esta etapa, e nada foi revertido do SDD-010.1.
- A alteração de `@@unique([numero, exercicio])` para `@@unique([dreId, numero, exercicio])`
  era, na preparação, **apenas proposta** (`ANALISE_MIGRACAO_UNICIDADE.md`). **Atualizada
  pelo SDD de unicidade (2026-10-13):** o modelo já declara `@@unique([dreId, numero,
  exercicio])` (migration `20261012180000`), e o SDD acrescentou a proteção efetiva do
  escopo estadual — coluna gerada `dreEscopo` (`@ignore`) + `@@unique([dreEscopo, numero,
  exercicio])` + migration versionada `20261013120000_chamada_publica_unicidade_estadual`
  (aplicada **apenas** no banco isolado de homologação). Ver
  `DECISAO_ARQUITETURAL_UNICIDADE.md`.

Os arquivos do SDD-010.1 (migration, modelos, docs `SDD-010.1-*`) foram preservados
integralmente — não modificados nem revertidos.

## Decisões registradas

1. Trabalhar no checkout atual, sem branches, sem worktrees, sem commits automáticos.
2. Pacote tratado como **levantamento com lacunas**; classificação de elegibilidade não substitui conferência administrativa.
3. Reaproveitar importador/extração/versionamento existentes; não duplicar módulos. Módulo novo (`importacao-historica`) é **biblioteca pura** (sem Prisma/HTTP/DI).
4. Dry-run somente em memória/arquivos de staging; nenhum `prisma migrate`, seed ou escrita no banco ativo.
5. Pregões segregados de chamadas públicas da agricultura familiar.
6. Valores monetários preservados como texto bruto + normalização decimal revisável (centavos inteiros, nunca float); divergências numéricas **não** corrigidas silenciosamente (ex.: ABACATE −0,72 registrado).
7. Resolução institucional **nunca cria nem atualiza** cadastro; `AMBIGUO`/`NAO_ENCONTRADO` ficam pendentes.
8. `scripts/gerar-mapeamento-institucional.js` mantido como script reprodutível da entrega (regenera `MAPEAMENTO_INSTITUCIONAL.json` a partir do staging + snapshot).

## Alterações realizadas (todas novas; nenhum arquivo existente modificado)

Documentação (`docs\importacao-pnae-2025\`): `CHECKPOINT.md`, `VALIDACAO_PACOTE.json`,
`MAPEAMENTO_IMPLEMENTACAO.md`, `MAPEAMENTO_CAMPOS.md`, `MAPEAMENTO_INSTITUCIONAL.json`,
`RELATORIO_DUPLICIDADES_VERSOES.md`, `AUDITORIA_EXTRACAO.md`,
`TESTES_IMPORTACAO_PNAE_2025.md`, `RELATORIO_FINAL_IMPORTACAO_PNAE_2025.md`,
**`RELATORIO_SANEAMENTO_2025.md`**, **`MATRIZ_PENDENCIAS_2025.md`**,
**`ANALISE_MIGRACAO_UNICIDADE.md`**, **`PLANO_HOMOLOGACAO_IMPORTACAO_2025.md`**,
`snapshot-institucional.json`, `staging\` (125 JSONs + índices + plano), `scripts\`
(`validate-package.js`, `dump-inventario.js`, `dump-snapshot-institucional.js`,
`gerar-mapeamento-institucional.js`, `inspect-db-readonly.js`,
**`analisar-unicidade-readonly.js`**).

Código (`apps\backend\`): `src\modules\importacao-historica\` (inclui
`importacao-historica.spec.ts`) + `scripts\importacao-historica-pnae-2025.ts`.
**O schema do Prisma não foi alterado por esta preparação** (a migração
`@@unique([dreId, numero, exercicio])` está apenas proposta em `ANALISE_MIGRACAO_UNICIDADE.md`).

Nenhum arquivo do pacote documental foi alterado. Os arquivos do **SDD-010.1** (migration
`20261012160000_sdd_0101_sazonalidade_temporal`, modelos `SazonalidadeProducao`/
`UnidadeProdutiva`, docs `SDD-010.1-*`) foram **preservados integralmente** — não
modificados nem revertidos. Todas as alterações estão **não commitadas** no checkout atual.

## Comandos executados (etapa de saneamento)

```
node docs/importacao-pnae-2025/scripts/analisar-unicidade-readonly.js   # somente SELECT — banco intacto
node docs/importacao-pnae-2025/scripts/inspect-db-readonly.js           # somente SELECT
npx tsc --noEmit -p tsconfig.json                                       # exit 0
npx jest --runInBand                                                    # 46 suites / 453 testes / 0 failed
```

## Bloqueios (para a gravação definitiva — não impediram a preparação/saneamento)

1. Ausência de **autorização explícita** para escrita (etapa separada).
2. **Entidade executora:** cadastro com `cnpj: null` — vinculação dos 51 depende de
   preencher `53.291.992/0001-10` + decisão administrativa.
3. **`025/224`** (ED-0067_sinop) — normalização para `025/2024` depende de confirmação
   (muda a chave lógica/idempotência; resolver antes do `aplicar`).
4. **`ChamadaPublica` unicidade** — ~~proposta `@@unique([dreId, numero, exercicio])` exige
   também ajuste de `chamadas-publicas.service.ts` (validação global) e do simulador;
   migração **não aplicada**.~~ **RESOLVIDO EM CÓDIGO E HOMOLOGAÇÃO ISOLADA (2026-10-13)**
   — service/simulador/executor/DTO ajustados, migration `20261013120000` validada no
   isolado (cenários A–H). **Pendente apenas:** aplicar a migration no banco ativo, sob
   autorização explícita (`PLANO_ALINHAMENTO_PRODUCAO.md`).
5. **7 arquivos Tangará da Serra** (HTTP 404), **1038 itens sem valores** e **597 divergências**
   numéricas — lacunas/conferências documentais; resolver exigiria novo levantamento/OCR.

## Próxima ação

Nenhuma automática. Para a **importação definitiva**: homologação conforme
`PLANO_HOMOLOGACAO_IMPORTACAO_2025.md` e definição do `aplicar` (autorização, backup,
ambiente isolado, reutilização dos services existentes e resolução dos bloqueios acima)
é decisão do responsável técnico/administrativo.

Para o **alinhamento do banco ativo à arquitetura de unicidade**: seguir
`PLANO_ALINHAMENTO_PRODUCAO.md` (backup validado por restore → pré-checks read-only no
host `HP` → decisão sobre o incidente `20261012180000` → aplicação guardada de
`20261013120000_chamada_publica_unicidade_estadual` → verificação). Enquanto não houver
autorização escrita, o ativo permanece como está (sem a proteção estadual no banco).
