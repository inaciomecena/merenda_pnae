# Testes da preparação de importação histórica PNAE/MT 2025

Este relato registra **o que foi executado neste checkout**, com os resultados obtidos.
Os nomes de teste abaixo são os nomes exatos do arquivo
`apps\backend\src\modules\importacao-historica\importacao-historica.spec.ts`
(57 testes, 11 `describe`s), conferidos linha a linha.

## 1. Como executar (reprodução)

```powershell
cd C:\Projetos\merenda_pnae\apps\backend

# 1) Tipagem de todo o backend (não apenas o módulo novo)
npx tsc --noEmit -p tsconfig.json

# 2) Suíte completa de testes do backend
npx jest --runInBand

# 3) Somente os testes da importação histórica (barras normais: no Windows o jest
#    trata o padrão como regex e "\\m" não casa)
npx jest --runInBand src/modules/importacao-historica/importacao-historica.spec.ts

# 4) Staging (gera os JSONs derivados do pacote) e dry-run (não grava)
npx ts-node scripts/importacao-historica-pnae-2025.ts staging
npx ts-node scripts/importacao-historica-pnae-2025.ts dry-run
```

## 2. Resultados observados nesta execução

| Comando | Resultado |
| --- | --- |
| `npx tsc --noEmit -p tsconfig.json` | **exit 0**, sem erros |
| `npx jest --runInBand` (suíte completa) | **46 suites · 453 testes · 453 passed · 0 failed** |
| `npx jest --runInBand ...importacao-historica.spec.ts` | **1 suite · 57 testes · 57 passed · 0 failed** |
| `... staging` | 125 editais, 2652 itens, 37 bloqueados, 37 segregados, 51 aprovados, 0 pendentes, 0 erros |
| `... dry-run` (1ª vez) | plano com 51 editais novos, 2652 itens, 54 documentos, 74 documentos bloqueados |
| `... dry-run` (2ª vez, idempotência) | **0 novos** — mesmos 51 candidatos já registrados |

> Os 453 testes da suíte completa incluem os 57 desta preparação. Não havia falha
> pré-existente no checkout: **nenhuma falha foi escondida por skip ou filtro**.

## 3. Cenários exigidos no PROMPT §6 → cobertura real

Abaixo, cada cenário do PROMPT §6 com os testes que **realmente** o cobrem (nomes
exatos), ou a evidência executada quando a cobertura é operacional e não unitária.

### 3.1 Dry-run não grava (PROMPT §6.1) — 3 testes

`describe('dry-run: não grava dados nem altera arquivos originais')`

- `simularImportacao é puro: não cria nem altera arquivo no disco` — roda o plano num
  diretório temporário e compara o conteúdo antes/depois.
- `simularImportacao não muta o staging recebido` — serializa o staging antes e depois.
- `o plano gerado só contém operações CREATE (nunca UPDATE/DELETE)` — garante que nem
  mesmo em simulação existe via de sobrescrita.

**Evidência executada (não unitária):** o `dry-run` real de 125 editais rodou duas vezes
com os mesmos insumos e escreveu apenas em `staging/planos/dry-run-plano.json`; o banco
ativo não foi aberto para escrita em nenhum momento.

### 3.2 Elegibilidade 2024→2025 vs. 2025→2026 (PROMPT §6.2) — 7 testes

`describe('classificação de elegibilidade e exercício')`

- `ELEGIVEL_2025 com evidência do exercício 2025 → APROVADO`
- `FORA_ESCOPO_2026 (publicação 2025→2026) → BLOQUEADO, nunca aprovado`
- `CONFLITO_EXERCICIO (ano conflitante) → BLOQUEADO`
- `PREGÃO_2025 → SEGREGADO (não é chamada pública da agricultura familiar)`
- `elegibilidade aprovada mas SEM evidência do exercício → PENDENTE (nunca APROVADO)`
- `elegibilidade aprovada mas PDF ALTERADO/inválido → BLOQUEADO`
- `conflito documental pendente bloqueia mesmo com elegibilidade aprovada`

### 3.3 Ano conflitante (PROMPT §6.3) — 2 testes

- `CONFLITO_EXERCICIO (ano conflitante) → BLOQUEADO` (acima)
- `elegibilidade aprovada mas SEM evidência do exercício → PENDENTE (nunca APROVADO)` —
  ano só de exercício nunca aprova sozinho.

No pacote real, os **19 editais CONFLITO_EXERCICIO** e os **11 FORA_ESCOPO_2026** foram
para `bloqueados`/`segregados` no dry-run — nenhum entrou no plano (ver
`RELATORIO_FINAL_IMPORTACAO_PNAE_2025.md`, §5).

### 3.4 Duplicado binário e retificação (PROMPT §6.4) — 4 testes

`describe('duplicados binários e retificações')`

- `agrupa documentos com SHA-256 idêntico (duplicado binário)` — DOC-19/20 colapsam.
- `retificação com alteração real tem hash (e chave de versão) DIFERENTE`
- `mesmo documento sem hash cai em chave estável "sem-hash" (nunca colide com hash real)`
- `classificarPapelDocumento reconhece retificação pelo CONTEÚDO, não pelo numeral`

Aplicação real: os grupos Juína (DOC-0019/0020 e DOC-0026/0027) colapsaram em uma chave
de versão cada, e os 6 documentos de Primavera do Leste (mesmo PDF, 6 editais) ficaram
todos bloqueados — ver `RELATORIO_DUPLICIDADES_VERSOES.md`.

### 3.5 Valores decimais, tabela multipágina, quantidade/unidade/embalagem (PROMPT §6.5)

`describe('monetário e tabela de itens')` — 11 testes:

- `converte centavos sem ponto flutuante (referência financeira decimal)`
- `leitura de "R$ 2.205,70" usa centavos inteiros`
- `divergência real 0,72 (ABACATE DOC-0007) é REGISTRADA, nunca corrigida` —
  quant. 10,00 × R$ 38,08 = R$ 380,80; fonte R$ 380,08 → `diferencaCentavos = -72`,
  com `totalFonteBruto = "380,08"` preservado. **Este é o caso real do pacote.**
- `divergência zero mantém total da fonte como referência`
- `sem quantidade/preço NUNCA calcula e NUNCA marca divergente`
- `extrai quantidade, unidade e embalagem de uma linha de resumo (layout "resumo R$")`
- `tabela MULTIPÁGINA: item cortado pela quebra de página fica SEM valores + pendência (zero artificial jamais)`
- `layout "valores quebrados" (Sinop): qty+preço numa linha, total nas seguintes`
- `preço grafado com PONTO decimal ("R$ 3.96") vira pendência, não valor convertido`
- `embalagem "Unidade de 30g" NÃO vira quantidade`
- `quantidade ambígua ("1.221") fica pendente_revisao com o bruto preservado`

O teste da quebra de página reproduz exatamente o fenômeno que gera os **1038 itens sem
valores** do pacote (coluna de valores cortada pela página), documentado em
`AUDITORIA_EXTRACAO.md` — o item é mantido com pendência, nunca zerado.

### 3.6 Número malformado "025/224" e valor "2,205,70" (PROMPT §6.6) — 4 testes

`describe('preservação de valores brutos ambíguos')`

- `número "025/224" preserva a grafia e propõe normalização COM justificativa`
- `número "25/2024" é normalizado sem justificativa (padrão inequívoco)`
- `valor "2,205,70" (duas vírgulas) é AMBÍGUO: propõe interpretação mas não converte` —
  `interpretacaoProposta = 220570` com `centavos = null` e motivo de revisão.
- `valor ausente nunca vira zero`

### 3.7 Erro, 404, hash divergente e arquivo inválido (PROMPT §6.7) — 6 testes

`describe('validação física dos documentos do pacote')`

- `documento sem caminho (HTTP 404 na pesquisa) → AUSENTE com o motivo explícito`
- `arquivo inexistente → AUSENTE`
- `hash divergente (arquivo alterado) → ALTERADO, com os dois hashes registrados`
- `conteúdo que não é PDF → INVALIDO`
- `caminho que escapa da raiz do pacote → FORA_DO_PACOTE (path traversal)`
- `resumirValidacoes conta as classificações para o relatório`

**Evidência executada (pacote real):** `VALIDACAO_PACOTE.json` — 128 INTEIRO, 7 AUSENTE
(Tangará da Serra, 404), 0 ALTERADO, 0 INVÁLIDO, 0 FORA_DO_PACOTE.

### 3.8 DRE, município e CNPJ ambíguos (PROMPT §6.8) — 8 testes

`describe('resolução institucional nunca vincula em ambiguidade')`

- `DRE com correspondência única → CONFIRMADO`
- `DRE ambígua (município-sede de outra DRE) → AMBIGUO com candidatos, SEM id`
- `DRE inexistente → NAO_ENCONTRADO, nunca cria registro`
- `DRE ausente → NAO_ENCONTRADO`
- `município resolvido por IBGE único → CONFIRMADO`
- `município sem IBGE e ambíguo (dois registros com o mesmo nome) → AMBIGUO, sem id`
- `entidade executora: CNPJ é o critério PREFERENCIAL e decide sozinho`
- `entidade sem CNPJ e sem nome correspondente → NAO_ENCONTRADO (fica pendente)`

O teste `DRE ambígua` reproduz o caso real: "Sinop" é município-sede de duas DREs no
snapshot (Sinop e Sorriso fictícias no fixture) — a resolução devolve candidatos e
**nunca um id**. No pacote real as 13 DREs resolveram `CONFIRMADO`
(`MAPEAMENTO_INSTITUCIONAL.json`), e as 125 pendências `resolucao_entidade_executora`
permanecem — CNPJ não consta do acervo e nada foi preenchido por inferência.

### 3.9 RBAC e separação de ambientes (PROMPT §6.9) — cobertura parcial

- Coberto pelos testes `chamada pública 2026 já existente vira "jaExistentes", sem CREATE`
  (preservação de 2026) e `registro confirmado NUNCA é sobrescrito por nova extração` /
  `revisão manual também é imutável` / `campo extraído pode ser proposto para revisão,
  mas o conflito fica registrado` (registros revisados preservados).
- **O RBAC em si não tem teste unitário neste módulo**, porque a simulação é uma
  biblioteca pura sem HTTP/sessão; a exigência de operador autorizado é imposta pela
  camada de aplicação (NestJS guards) no comando `aplicar`, que **não foi executado**
  neste ambiente (sai com código 3 sem confirmação explícita). Registrado como lacuna de
  cobertura em `MAPEAMENTO_IMPLEMENTACAO.md` (§lacunas).

### 3.10 Idempotência (PROMPT §6.10) — 4 testes

`describe('idempotência do reprocessamento')`

- `segunda execução com os mesmos hashes não gera novas ações`
- `chave de item é estável e distinta por documento/sequência/hash`
- `chave de idempotência é determinística por operação + chave lógica`
- `chave lógica do edital é estável sob grafias equivalentes de número` (`020/2024` ≡ `20/2024`)

**Evidência executada:** 2º `dry-run` real → 0 novos candidatos.

### 3.11 Geração do staging (PROMPT §6.11) — 5 testes

`describe('ruído de tabela descartado sem virar item')`

- `cabeçalho de tabela (com a palavra UNIDADE) NÃO vira item`
- `cabeçalho solto antes do primeiro item não gera item (linha de produto real é extraída)`
- `número de página na borda não abre bloco de item`
- `texto corrido sem evidência de coluna vira bloco descartado com trecho`
- `todo item extraído carrega proveniência (documento, página, método)` —
  `documentoId`, `pagina`, `metodo`, e no `totalFonte` também `sha256`.

Mais `extrai quantidade, unidade e embalagem...` (§3.5), que cobre a separação
produto/quantidade/unidade/embalagem no staging.

**Evidência executada (pacote real):** staging final com 2652 itens, 1020 blocos não-item
em pendência, 84→11 itens sem produto descartados (após as duas correções de raiz
documentadas em `AUDITORIA_EXTRACAO.md`).

### 3.12 Resumo por DRE (insumo do relatório final) — 1 teste

- `agrega aprovados/segregados/bloqueados/pendentes por DRE`

## 4. Mapa módulo → testes que o cobrem

| Arquivo | Testes |
| --- | --- |
| `aplicacao/extrator-documento.ts` | 11 de `monetário e tabela de itens` + 5 de `ruído de tabela` |
| `aplicacao/leitor-pacote.ts` | 4 de `duplicados binários` + 6 de `validação física` |
| `dominio/classificacao-pacote.ts` | 7 de `classificação de elegibilidade` + `número 025/224` + `resumo por DRE` |
| `dominio/chaves-logicas.ts` | 3 de `duplicados binários` + 3 de `idempotência` + 3 de `preservação de registros` |
| `dominio/decimal-monetario.ts` | 5 de `monetário` + 2 de `valores brutos ambíguos` |
| `aplicacao/resolucao-institucional.ts` | 8 de `resolução institucional` |
| `aplicacao/simulador-importacao.ts` | 3 de `dry-run` + `chamada pública 2026 jaExistentes` + `segunda execução` |

Nenhum teste é "de humor": as fixtures reproduzem padrões observados nos PDFs do pacote
(cabeçalho de tabela, número de página isolado, linha inline, bloco sem quantidade), e os
números citados (0,72 do ABACATE DOC-0007; 025/224; 2,205,70; R$ 3.96; 1.221) vêm dos
documentos reais do acervo.

## 5. O que **não** foi testado (e por quê)

- **Escrita definitiva no banco** (`aplicar`): propositalmente não executada — o comando
  existe protegido por confirmação explícita e sai com código 3 sem ela.
- **RBAC HTTP real**: fora deste módulo puro; ver §3.9 — lacuna registrada, não escondida.
- **Migração `@@unique([dreId, numero, exercicio])`**: apenas proposta em
  `MAPEAMENTO_IMPLEMENTACAO.md`; não aplicada nem testada contra o banco ativo.
- **OCR** dos PDFs digitalizados: inexistente no projeto; itens sem valores viram
  pendência de conferência, nunca zero.
