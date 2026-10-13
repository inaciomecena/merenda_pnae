# Relatório de saneamento — importação histórica PNAE/MT 2025

**Data:** 2026-10-12 · **Escopo:** os **51 editais aprovados** (candidatos) ·
**Banco ativo: SOMENTE LEITURA — nenhuma escrita, nenhuma migration, `aplicar` continuou bloqueado.**

Este saneamento **não alterou** staging, schema nem banco. É análise sobre os artefatos
já gerados (`staging/*.json`) + leitura somente-leitura do banco + leitura dos PDFs/TXT
do pacote. Nenhum valor foi inventado ou corrigido silenciosamente.

---

## 1. Entidade executora — verificação com dados oficiais

### 1.1 Evidência documental encontrada

O CNPJ **`53.291.992/0001-10`** foi localizado nos textos extraídos dos editais sob o
cabeçalho oficial **"IDENTIFICAÇÃO DA ENTIDADE EXECUTORA DO PNAE/FNDE/MEC"**, associado a
"SECRETARIA DE ESTADO DE EDUCAÇÃO — CUIABÁ/MT" (endereço Rua Engenheiro Edgar Prado Arze,
215, CPA). Exemplos verificados linha a linha:

- `DOC-0075` (Sinop) linhas 1529, 1609, 1711 — três blocos de identificação, todos com o mesmo CNPJ.
- `DOC-0103` (Alta Floresta) linhas 813, 858, 954.

**Cobertura:** **53 dos 54** documentos dos 51 editais aprovados declaram esse CNPJ como
entidade executora. O único sem a declaração é **`DOC-0010` (Diamantino/ED-0010)** — um
documento curto que não contém a seção "IDENTIFICAÇÃO DA ENTIDADE EXECUTORA" (só traz
orientações genéricas sobre CNPJ/CPF de produtores).

Os **outros** CNPJs encontrados no pacote (ex.: `09.321.974/0001-41`, `08.878.966/0001-38`,
`01.463.907/0001-50`) são de **unidades executoras/escolas** (Anexo "Unidade Escolar/Salas
Anexas"), **não** da entidade executora — foram descartados como candidatos.

### 1.2 Correspondência com o cadastro existente

O `snapshot-institucional.json` (leitura somente do banco) contém **exatamente uma**
entidade executora:

```
id: b72a5ceb-c5e2-11f1-8f2d-6451061ac5e7
nome: "Secretaria de Estado de Educação de Mato Grosso"
cnpj: null   tipo: ESTADUAL   uf: MT   municipioId: null   ativo: true
```

**Conclusão:** há **uma única** entidade estadual no cadastro, com nome compatível com o
documento, mas **com `cnpj` nulo** — por isso o casamento **por CNPJ** (o critério
preferencial) **falha automaticamente** e os 125 editais ficaram `PENDENTE`.

**Nada foi atribuído.** A vinculação `entidadeExecutoraId = b72a5ceb-…` para os 51
candidatos é **tecnicamente suportada pela evidência** (CNPJ declarado em documento
oficial + tipo ESTADUAL + ser a única entidade estadual), mas depende de **duas ações
administrativas prévias** que ficam registradas como pendência:

1. Confirmar que `b72a5ceb-…` é de fato a SEDUC-MT e **preencher o CNPJ
   `53.291.992/0001-10` no cadastro** (atualização de cadastro — fora do escopo desta etapa);
2. Decidir formalmente a vinculação dos 51 editais.

Enquanto isso não ocorrer, o `entidadeExecutoraId` permanece `null` no plano de importação
(e o simulador já trata isso como pendência, não como erro).

## 2. Divergência `025/224` × `025/2024` — investigação

**Edital:** `ED-0067_sinop_APROVADO` · **Documento:** `DOC-0075` (46 páginas) ·
Município atendido: **Santa Carmem/MT** · Câmara de Negócios: Sinop.

### 2.1 O que o PDF contém (evidência interna, não inferência)

O texto extraído do **próprio documento** traz **as duas grafias**:

| Linha | Conteúdo |
| --- | --- |
| 5 | "Chamada Pública Nº **025/224**. Para Aquisição de gêneros alimentícios…" |
| 13 | "AVISO DE CHAMADA PÚBLICA Nº **025/2024**." |
| 14 | "Processo SIGADOC **SEDUC-PRO-2024/178226**" |
| 34 | "Aquisição do Edital: **Edital 025/2024** do Município de Santa Carmem – MT." |

Elementos convergentes para **025/2024**: o número do processo administrativo
(SEDUC-PRO-**2024**/178226), a data da sessão (**31 de janeiro de 2025**, ou seja, edital
de numeração 2024 julgado em 2025), e a remissão explícita "Edital 025/2024" duas vezes.
A grafia "025/224" aparece **uma única vez**, no cabeçalho da primeira linha — padrão
consistente com **erro de digitação** (ano com 3 dígitos).

### 2.2 Tratamento dado

A grafia **original foi preservada** em `numeroBruto` e `numeroNormalizado` (`025/224`),
`anoNumeracao` ficou `224`, e **duas observações** registram o conflito no próprio JSON de
staging (PDF ≠ manifesto; normalização depende de revisão administrativa).

**Não foi corrigido silenciosamente.** A normalização para `025/2024` é **fortemente
sustentada pela evidência interna do documento**, mas continua classificada como
**dependente de validação administrativa** (ver `MATRIZ_PENDENCIAS_2025.md`), porque
altera a chave lógica do edital e, portanto, a identidade do registro a ser importado.

> Impacto técnico: `anoNumeracao = 224` entra na `chaveLogicaEdital`. Se a revisão
> aprovar `025/2024`, a chave lógica muda — o que reforça a necessidade de resolver **antes**
> de qualquer `aplicar` (idempotência por chave lógica).

## 3. Itens com valores ausentes, incorretos ou ambíguos

Apurado sobre os **2652 itens** dos 51 editais aprovados:

| Situação | Qtd | % dos itens |
| --- | ---: | ---: |
| Itens **com** pelo menos um valor (preço ou total) | 1614 | 60,9% |
| Itens **sem nenhum valor** (coluna cortada pela quebra de página no PDF de origem) | **1038** | 39,1% |
| Itens com **divergência numérica não nula** (total da fonte ≠ qtd × preço) | **597** | 22,5% |
| Itens **sem unidade comercial** identificada | **400** | 15,1% |

### 3.1 Divergências numéricas (597) — caracterização

Distribuição por magnitude (valor absoluto da diferença, em reais):

| Faixa | Qtd |
| --- | ---: |
| ≤ R$ 0,10 | 33 |
| R$ 0,11 – 0,50 | 226 |
| R$ 0,51 – 1,00 | 134 |
| **> R$ 1,00** | **204** |

Por natureza: **581** maiores que centavos (erro de aritmética/grafia no documento),
**11** na faixa de centavos, **5** valores inteiros. Por DRE: **Sinop 321**, **Juína 219**,
**Alta Floresta 56**, **Diamantino 1**. Presentes em **34 documentos**.

**Caso real verificado no PDF** (não é erro de extração): `DOC-0075` item 6 ALFACE CRESPA
— o PDF grava `145  R$ 19,24  R$ 2.789,08`; 145 × 19,24 = **2.789,80**, logo a fonte tem
os dígitos trocados (**2.789,08**), divergência **−0,72**. O mesmo padrão se repete no
pacote (ex.: `ED-0007` Diamantino ABACATE: 17 × 22,40 = 380,80 vs. fonte 380,08).

As **maiores divergências** apuradas (todas preservadas, nenhuma corrigida):

| DRE | Item | Produto | qtd × preço = calculado | Total da fonte | Δ |
| --- | --- | --- | --- | --- | ---: |
| Juína | 95 | PÃO CASEIRO | 275 × 17,71 = 4.870,25 | 5.420,25 | **+550,00** |
| Juína | 25 | BEBIDA LÁCTEA FERMENTADA SABOR MORANGO | 279 × 11,57 = 3.228,03 | 3.327,33 | +99,30 |
| Sinop | 30 | MELANCIA | 3172 × 4,10 = 13.005,20 | 12.989,34 | −15,86 |
| Sinop | 22 | LEITE UHT INTEGRAL | 4499 × 7,99 = 35.947,01 | 35.962,01 | +15,00 |
| Sinop | 9 | BANANA NANICA | 2869 × 8,97 = 25.734,93 | 25.720,59 | −14,34 |

> A divergência de **+550,00** em PÃO CASEIRO (Juína) é grande o suficiente para sugerir
> erro material no edital de origem; permanece **intocada** e sinalizada para conferência.

### 3.2 Itens sem valores (1038) — lacuna documental, nunca zerados

Confirmado em inspeção dos PDFs (detalhado em `AUDITORIA_EXTRACAO.md`): a coluna de
preço/total foi **cortada pela quebra de página** no PDF de origem. Não há valor a ler —
não é falha de extração. **Nenhum zero foi preenchido**; todos seguem com pendência
`item_conferencia`. Resolver exigiria novo levantamento junto às DREs ou OCR.

### 3.3 Ambiguidades numéricas (preservadas)

- **`R$ 2,205,70`** (PEPINO, `ED-0002` Diamantino, item 37, p.18) — duas vírgulas;
  `FORMATO_NUMERICO_AMBIGUO`, não convertido. É o **único** caso do tipo no pacote.
- **`R$ 3.96`** (ponto decimal) e **quantidades `1.221` / `2.134`** (ponto de milhar
  ambíguo) — tratados como ambíguos, bruto preservado, conforme testes unitários.

### 3.4 Itens sem unidade comercial (400)

Concentrados em Sinop (207), Juína (108), Diamantino (67). Em vários casos a unidade
aparece como embalagem ("Unidade de 30g") ou a coluna não foi extraída; permanecem com
`unidadeComercial: null` e pendência de conferência — **não** foram inferidas.

## 4. Preservação verificada

- **Valor bruto + normalizado + documento + SHA-256 + página + método + status de revisão**
  presentes em cada item e cada leitura monetária (conferido nos JSONs de staging).
- **Hashes do manifesto** mantidos (`800d0f83…` no `RESUMO_STAGING.json`).
- Nenhum documento do pacote original foi alterado.
- Registros de **2026** do banco intactos (§6 de `ANALISE_MIGRACAO_UNICIDADE.md`).

## 5. Banco ativo — verificação de integridade

Consulta **somente-leitura** via `scripts/analisar-unicidade-readonly.js` (apenas
`find`/`count`/`groupBy`/`SHOW INDEX`):

| Verificação | Resultado |
| --- | --- |
| `ChamadaPublica` totais | **6** |
| Exercício | **todas 2026** (fixtures E2E, `numero` tipo `E2E-<timestamp>`, `dreId` **NULL**, status HOMOLOGADA) |
| Colisões da unique atual `(numero, exercicio)` | **0** |
| Colisões `(dreId, numero, exercicio)` | **0** |
| `(numero, exercicio)` em mais de uma DRE | **0** |
| `Edital` totais | 3 (2 de 2025, 1 de 2026) |
| Índice real da tabela | `pnae_chamadas_publicas_numero_exercicio_key (numero, exercicio)` UNIQUE |

**Nenhuma escrita foi realizada.** O banco está exatamente como no início da etapa.

## 6. Conclusão do saneamento

- **Entidade executora:** identificada oficialmente por CNPJ (SEDUC-MT,
  `53.291.992/0001-10`) em 53/54 documentos; vinculação **tecnicamente suportada**, mas
  **dependente** do preenchimento do CNPJ no cadastro e de decisão administrativa.
- **`025/224`:** resolvido **por evidência interna do próprio documento** a favor de
  `025/2024`, sem correção silenciosa; depende de confirmação administrativa (muda a chave lógica).
- **Valores:** 1038 sem valores (lacuna documental), **597 divergências** numéricas
  preservadas, 400 sem unidade, 1 formato ambíguo — **nenhuma correção automática**.
- **Banco:** intacto; 6 chamadas de 2026 preservadas; nenhum conflito de unicidade hoje.

Classificação completa das pendências (resolvidas × dependentes × bloqueantes) em
`MATRIZ_PENDENCIAS_2025.md`.
