# Relatório final — preparação de importação histórica PNAE/MT 2025

**Data:** 2026-10-12 · **Checkout:** `C:\Projetos\merenda_pnae` (sem commits, sem branches,
sem worktrees) · **Estado do banco ativo (`merenda_pnae`): INTACTO — nenhuma escrita,
nenhuma migration.**

Este relatório fecha a etapa de **preparação** descrita no PROMPT §7. A **gravação
definitiva não foi executada** e permanece condicionada a autorização explícita em etapa
separada (ver §7).

---

## 1. O que foi executado (comandos reais)

| # | Comando (workdir `apps\backend` salvo indicação) | Resultado |
| --- | --- | --- |
| 1 | `node docs/importacao-pnae-2025/scripts/validate-package.js` (raiz do repo) | 128 INTEIRO · 7 AUSENTE · 0 ALTERADO/INVÁLIDO/FORA_DO_PACOTE |
| 2 | `node docs/importacao-pnae-2025/scripts/gerar-mapeamento-institucional.js` (raiz) | `MAPEAMENTO_INSTITUCIONAL.json` gerado (13 DREs) |
| 3 | `npx ts-node scripts/importacao-historica-pnae-2025.ts staging` | 125 editais → 2652 itens, 0 erros |
| 4 | `npx ts-node scripts/importacao-historica-pnae-2025.ts dry-run` (1ª vez) | 51 novos candidatos, 74 bloqueios |
| 5 | `npx ts-node scripts/importacao-historica-pnae-2025.ts dry-run` (2ª vez) | **0 novos** (idempotência) |
| 6 | `npx ts-node scripts/importacao-historica-pnae-2025.ts aplicar` | **exit 3 — BLOQUEADO, nada gravado** (§7) |
| 7 | `npx tsc --noEmit -p tsconfig.json` | exit 0, sem erros |
| 8 | `npx jest --runInBand` | **46 suites · 453 testes · 453 passed · 0 failed** |

Detalhes em `TESTES_IMPORTACAO_PNAE_2025.md`.

## 2. Situação do pacote documental

`VALIDACAO_PACOTE.json` — manifesto `MANIFESTO_DOCUMENTOS.json` com SHA-256
`800d0f833c16b102a723abccd27c583e98ba1dc5b3b4fd5d65ab3b2836d72f16`:

- **128 documentos INTEIRO** (hash confere), **122 hashes únicos** em 4 grupos repetidos.
- **7 AUSENTE** — todos da DRE Tangará da Serra (HTTP 404 no portal na data da coleta).
  **Não foram substituídos, não foram inventados.**
- 0 ALTERADO, 0 INVÁLIDO, 0 FORA_DO_PACOTE.
- Planilha-base: 13 portais, 125 procedimentos, 135 URLs, 553 itens declarados, 44 pendências.

**Isto não é um censo.** A classificação de elegibilidade é pesquisa documental e **não
substitui a revisão administrativa**.

## 3. Staging gerado (`docs\importacao-pnae-2025\staging\`)

125 JSONs por edital + 14 índices + `RESUMO_STAGING.json` + `planos/dry-run-plano.json`.

| Métrica | Valor |
| --- | --- |
| Procedimentos | 125 |
| Aprovados (elegíveis 2025) | **51** |
| Segregados (pregões etc.) | 37 |
| Bloqueados (conflito/fora de escopo/arquivo pendente) | 37 |
| Pendentes (sem decisão) | 0 |
| Erros de extração | **0** |
| Itens extraídos | **2652** (vs. 553 declarados no manifesto — layouts multipágina) |
| Itens com valores | 1614 |
| Itens **sem** valores (coluna cortada pela quebra de página no PDF original) | 1038 |
| Blocos não-item descartados (viraliam item falso) | 1020 |

Pendências totais: **3275** — `item_conferencia` 2087, `bloco_nao_item` 1020,
`resolucao_entidade_executora` 125, `CONFLITO_EXERCICIO` 11, `FORA_ESCOPO_2026` 9,
`PENDENTE_ARQUIVO` 7, `resolucao_municipio` 6, `PENDENTE_EDITAL_COMPLETO` 5,
`REFERENCIA_HISTORICA` 4, `FORMATO_NUMERICO_AMBIGUO` 1.

**Os 1038 itens sem valores são lacuna documental, não erro de leitura** — reabrimos os
PDFs e confirmamos que a coluna de valores foi cortada pela quebra de página na fonte
(há **um único** preço com decimal no pacote inteiro). Nenhum zero foi preenchido;
todos seguem com pendência `item_conferencia` (ver `AUDITORIA_EXTRACAO.md`).

## 4. Resolução institucional (`MAPEAMENTO_INSTITUCIONAL.json`)

Princípio aplicado: **nunca criar nem atualizar cadastro**. Fonte: `snapshot-institucional.json`
(leitura somente do banco ativo).

- **13/13 DREs → CONFIRMADO** (correspondência exata por nome/código).
- Municípios: 6 pendências `resolucao_municipio` (ambiguidade/ausência) — **nenhum id atribuído por inferência**.
- **Entidades executoras: 125 pendências** — o pacote não traz CNPJ e a resolução prefere
  CNPJ; nada foi preenchido por nome parecido. **Isso é um bloqueio legítimo para o `aplicar`.**

## 5. Dry-run (`planos/dry-run-plano.json`)

`resumo`: `novosCandidatos 51` · `jaExistente 0` · `bloqueados 74` · `itensCriados 2652` ·
`documentosCriados 54` · `anexosCriados 0`. Total de ações: **2808** —
`ChamadaPublica` 51, `EditalItem` 2652, `EditalDocumento` 54, `IdempotenciaOperacao` 51.
Todas `CREATE` (não existe via de UPDATE/DELETE nem em simulação).

### Por DRE (apurado do staging)

| DRE | Aprovados | Segregados | Bloqueados | Itens |
| --- | --- | --- | --- | --- |
| Alta Floresta | 7 | 0 | 0 | 233 |
| Barra do Garças | 0 | 0 | 1 | 0 |
| Cáceres | 0 | 5 | 0 | 0 |
| Confresa | 0 | 0 | 1 | 0 |
| Diamantino | 13 | 0 | 1 | 500 |
| Juína | 10 | 0 | 0 | 997 |
| Matupá | 0 | 0 | 1 | 0 |
| Metropolitana | 0 | 11 | 11 | 0 |
| Pontes e Lacerda | 1 | 0 | 0 | 104 |
| Primavera do Leste | 2 | 21 | 14 | 55 |
| Rondonópolis | 0 | 0 | 1 | 0 |
| Sinop | 18 | 0 | 0 | 763 |
| Tangará da Serra | 0 | 0 | 7 | 0 |
| **Total** | **51** | **37** | **37** | **2652** |

**Sinop:** a notícia anunciava 19 chamadas, mas só **18** existem no acervo — a 19ª **não
foi criada**. **Tangará da Serra:** 7 arquivos 404 → todos bloqueados com
`PENDENTE_ARQUIVO`, nada importado.

## 6. Divergências e achados que exigem decisão administrativa

Nenhuma foi corrigida em silêncio; todas estão preservadas com valor bruto + pendência.

1. **Divergência real de R$ 0,72 (ABACATE)** — `ED-0007_diamantino`, `DOC-0007`, página 3:
   quantidade **17** × R$ **22,40** = R$ **380,80**; total informado na fonte R$ **380,08**.
   `divergencia = "-0.72"`, `totalCalculado = "380.80"`, e a pendência registra
   *"total informado na fonte difere de quantidade × preço unitário em 0.72"*.
   O total da fonte é a referência; **o cálculo não sobrescreve a fonte**.
2. **Valor ambíguo "R$ 2,205,70" (PEPINO)** — `ED-0002_diamantino`, item 37, página 18:
   duas vírgulas, separadores ambíguos → `FORMATO_NUMERICO_AMBIGUO`, **não convertido**.
   É o único caso `FORMATO_NUMERICO_AMBIGUO` do pacote e é parte do motivo de o edital
   estar bloqueado.
3. **Número malformado "025/224"** — `ED-0067_sinop`, página 1: o PDF diz `025/224` e o
   manifesto diz `025/2024`. A grafia original foi **preservada** (`numeroNormalizado`
   também `025/224`) e o conflito está nas observações. **Atenção:** a grafia casa com o
   padrão `\d{3,4}/\d{3,4}`, por isso o edital consta como APROVADO no staging, mas o
   `anoNumeracao` ficou `224` — **deve ser resolvido na revisão antes de qualquer `aplicar`**.
4. **Preço com ponto decimal "R$ 3.96"** e **quantidade ambígua "1.221" / "2.134"** —
   tratados como ambíguos (sem conversão), com bruto preservado, conforme os testes.
5. **Mesmo PDF vinculado a 6 editais diferentes (Primavera do Leste)** — `DOC-0055/0059/0060`
   e `DOC-0056/0057/0058` repetem o mesmo conteúdo em editais distintos. Fragilidade da
   coleta; todos os 6 documentos estão **bloqueados/segregados**, nada é importado.
   Detalhe em `RELATORIO_DUPLICIDADES_VERSOES.md`.
6. **Duplicados binários reais (Juína)** — `DOC-0019/0020` e `DOC-0026/0027` são o mesmo
   edital em arquivos diferentes (mesmo hash) → colapsados em uma `chaveVersao` cada.
7. **Coluna de valores cortada pela quebra de página** — 1038 itens sem valores (§3).
   Lacuna do PDF de origem; resolver exigiria OCR ou obtenção dos anexos íntegros.
8. **125 entidades executoras sem CNPJ no pacote** — pendência de resolução (§4).

## 7. Por que a gravação definitiva NÃO foi feita (e o que falta)

O comando `aplicar` foi **executado propositalmente** apenas para registrar seu
comportamento real (comando 6, §1): ele é um **placeholder protegido** que sempre termina
com **exit 3** e a mensagem *"BLOQUEADO: o comando `aplicar` NÃO está habilitado nesta
etapa"*, listando as condições para habilitação. **Nada foi gravado. Nenhuma migration
foi aplicada.**

Condições pendentes para uma futura gravação (etapa separada, com autorização):

1. **Autorização explícita** do responsável (fora desta preparação).
2. **Backup** (`mysqldump` do banco ativo) antes de qualquer escrita; rollback = restaurar o dump.
3. **Ambiente isolado** — nunca o banco de produção; nada de `migrate reset`.
4. **Implementação reutilizando os services existentes** (`importador-editais` /
   `chamadas-publicas`), não código novo, conforme exigido pelo PROMPT.
5. **Resolução das pendências de entidade executora (CNPJ)** e da divergência `025/224` (§6.3).

### Proposta de migração — NÃO APLICADA

`apps\backend\prisma\schema.prisma` linha **2176**: o model `ChamadaPublica` tem
`@@unique([numero, exercicio])`. Como o mesmo `numero` recorre em DREs diferentes, uma
importação definitiva com 51 chamadas **colidiria** com esse índice (e com registros já
existentes). A proposta registrada em `MAPEAMENTO_IMPLEMENTACAO.md` é trocar para
`@@unique([dreId, numero, exercicio])`. **A migração está apenas proposta — não foi
gerada, não foi aplicada, não foi testada contra o banco ativo**, e deve embarcar somente
com o `aplicar` autorizado em ambiente isolado com backup.

## 8. Segurança operacional confirmada

- **Chamadas públicas de 2026 intactas**: o plano só produz `CREATE` e o dry-run marca
  existentes como `jaExistentes` (testado); nenhuma escrita ocorreu.
- **Registros revisados preservados**: `podeSobrescrever` recusa sobrescrita de campo
  `confirmado`/`manual` por extração (testado).
- **RBAC**: a gravação definitiva depende da camada de aplicação (guards NestJS); o módulo
  novo é biblioteca pura sem HTTP e por isso **não tem teste de RBAC** — lacuna registrada
  em `TESTES_IMPORTACAO_PNAE_2025.md` §3.9, não escondida.
- **Nenhum pagamento/contratação/homologação/publicação** foi disparado (não há integração
  SEFAZ/banco no escopo; nada de APIs pagas ou serviços externos).

## 9. Entregáveis desta preparação

`docs\importacao-pnae-2025\`:

- `CHECKPOINT.md` — estado por fase.
- `MAPEAMENTO_IMPLEMENTACAO.md` — arquitetura, lacunas e proposta de migração.
- `MAPEAMENTO_CAMPOS.md` — campo a campo (bruto + normalizado + doc + hash + página + método + status).
- `VALIDACAO_PACOTE.json` — integridade física do acervo.
- `MAPEAMENTO_INSTITUCIONAL.json` + `scripts/gerar-mapeamento-institucional.js` (reprodutível).
- `RELATORIO_DUPLICIDADES_VERSOES.md` — duplicados/retificações.
- `AUDITORIA_EXTRACAO.md` — auditoria de qualidade e correções de raiz.
- `TESTES_IMPORTACAO_PNAE_2025.md` — cenários × testes, com resultados.
- `RELATORIO_FINAL_IMPORTACAO_PNAE_2025.md` — este documento.
- `staging/` — 125 JSONs por edital + índices + plano de dry-run.

Código novo: `apps\backend\src\modules\importacao-historica\` (biblioteca pura, sem
Prisma/HTTP/DI) + `apps\backend\scripts\importacao-historica-pnae-2025.ts` (CLI
staging/dry-run/aplicar-bloqueado). Nenhum módulo existente foi duplicado nem modificado;
o schema do Prisma **não** foi alterado por esta preparação.

> Observação sobre o working tree: `apps\backend\prisma\schema.prisma` aparece como
> modificado no `git status`, mas por **outro trabalho já existente no checkout** (SDD-010.1
> — modelos `SazonalidadeProducao`/`UnidadeProdutiva` e a migration
> `20261012160000_sdd_0101_sazonalidade_temporal`, ambos não commitados). Esta preparação
> não tocou nesses arquivos; o único ponto tocado pelo tema aqui é a **constatação** da
> `@@unique([numero, exercicio])` do `ChamadaPublica` (§7), sem alteração.

## 10. Conclusão

A preparação está **concluída dentro do escopo autorizado**: pacote validado, dados
extraídos com proveniência completa, staging e dry-run gerados, idempotência comprovada,
suíte completa verde (453/453) e **zero escrita no banco ativo**. A gravação definitiva
fica para uma etapa futura e condicionada, com os bloqueios e divergências de §6 e §7
listados e rastreáveis — nenhum deles foi contornado por inferência ou correção silenciosa.
