# Auditoria de qualidade da extração — PNAE MT 2025

> Documento de apoio ao `RELATORIO_FINAL_IMPORTACAO_PNAE_2025.md`.
> Registra como os itens extraídos foram auditados e quais decisões foram tomadas
> com base em evidência do documento fonte (não em suposição).

## 1. Método

A auditoria partiu do staging gerado (`docs/importacao-pnae-2025/staging`) e
classificou **cada item** por uma assinatura de 5 bits:

| Símbolo | Significado |
| --- | --- |
| `P` | produto identificado |
| `U` | unidade comercial identificada |
| `Q` | quantidade extraída |
| `R` | preço unitário extraído |
| `T` | total da fonte extraído |

Para todo item anômalo, o texto cru correspondente foi **reaberto no PDF de
origem** (`pdf-parse`, página por página) antes de qualquer decisão. Nenhum valor
foi corrigido, preenchido ou descartado sem essa conferência.

## 2. Resultado da classificação

| Assinatura | Qtde | Interpretação | Decisão |
| --- | --- | --- | --- |
| `PUQTR` | 1213 | linha de tabela completa | item válido |
| `P-QTR` | 400 | produto + valores, sem unidade na linha | item válido, pendência `unidade comercial não identificada` |
| `PU---` | 1028 | produto + unidade, **sem nenhum valor** | investigado — ver §3 |
| `-U---` | 84 → **0** | texto corrido com unidade falsa | **eliminado** — ver §4 |
| `-UQTR` | 1 | item com valores mas sem produto | item válido, pendência `produto não identificado` |

## 3. `PU---` (1028 itens): lacuna documental, NÃO bug de parsing

**Hipótese testada:** a linha de valores existiria no PDF em formato não
reconhecido.

**Evidência coletada** (`_audit-quebra.js`, `_dump-pag2.js`, DOC-0017 p.3/p.4):

```
… resistente.
Quilograma          ← última linha da página 3: SÓ a unidade
3                  ← número de página
4.                 ← página 4 já começa no PRÓXIMO item
ABÓBORA PAULISTA …
```

A linha de valores (`437  4,83  2.109,25`) **não existe em nenhuma página** do
PDF: ela foi cortada pela quebra de página no próprio documento fonte. A tabela
do edital tem a coluna de valores à direita, e quando o item cai na borda da
página o recorte do PDF perde essa coluna.

**Conferência cruzada:** apenas **1** linha em todo o pacote usa preço com ponto
decimal (`R$ 3.96`, DOC-0001 MELANCIA) — insuficiente para explicar 1028 casos, e
ela já é tratada como divergência (item mantido, `statusRevisao:
pendente_conferencia`).

**Conclusão:** são itens **reais** cuja coluna de valores foi perdida no
documento. A conduta correta é manter o item com `pendente_conferencia` e a
pendência explícita *"linha de valores não reconhecida … item mantido sem
valores, sem preenchimento por zero"*. **Zero artificial jamais é gerado.**

Concentração: Juína (~55–66 por edital), Pontes e Lacerda (70), Diamantino
(19–38), Alta Floresta (22–31), Sinop (1–21).

## 4. `-U---` (84 itens falsos): duas causas-raiz, ambas corrigidas

Os 84 blocos eram **texto corrido** (cabeçalho de página, "DECLARAÇÃO DE
PRODUÇÃO PRÓPRIA", "ANEXO V", listas de escolas) que ganhavam uma unidade
comercial falsa `"UN"` e passavam no critério de coluna.

### Causa-raiz 1 — número de página abrindo bloco

`"2"` / `"39"` (número de página isolado na borda) abriam um novo bloco, cujo
conteúdo era o texto da página inteira.

**Correção** (`blocosDePagina`): número de página na borda é **ignorado** mesmo
quando não há bloco em curso. Exige borda de página + ausência de ponto, então
nunca descarta item real (`"4."` / `"4 PRODUTO"` continuam válidos).

**Efeito:** −69 itens falsos e **−877 pendências** `bloco_nao_item` (o número de
página deixou de virar bloco descartado).

### Causa-raiz 2 — palavra de cabeçalho `UNIDADE` lida como unidade comercial

A linha de cabeçalho da tabela (`Nº PRODUTO COM ESPECIFICAÇÃO TÉCNICA / UNIDADE
DE MEDIDA / QUANTIDADE ESTIMADA / PREÇO DE AQUISIÇÃO UNITÁRIO / VALOR TOTAL R$`)
contém a palavra `UNIDADE`, que casava com o vocabulário de unidades.

**Correção** (`ehBlocoCabecalhoTabela`): o bloco é rejeitado quando o texto
**junto** contém **2 ou mais** sinais de cabeçalho
(`ESPECIFICAÇÃO TÉCNICA`, `UNIDADE (DE) MEDIDA`, `PREÇO (DE) AQUISIÇÃO`,
`VALOR TOTAL`, `QUANTIDADE ESTIMADA`). O limiar em 2 sinais evita falso
negativo em produto legítimo que citaria uma palavra isolada.

Os PDFs quebram o cabeçalho em várias linhas (`UNIDADE` / `DE` / `MEDIDA`), por
isso a checagem usa o bloco concatenado e não a linha isolada.

**Efeito:** os 84 casos restantes de `-U---` caíram para 0.

## 5. Estado final

| Indicador | Antes | Depois |
| --- | --- | --- |
| `itensExtraidos` | 2725 | **2652** |
| `blocosNaoItem` (pendências) | 3075 | **1020** |
| itens sem produto (`-U---`) | 84 | **11** |
| erros de extração | 0 | **0** |
| candidatos aprovados | 51 | **51** |

Os 11 itens restantes sem `produto` são **reais**: 10 são o item `MURICI` (nome
sem vírgula delimitadora na fonte, unidade `KG` correta, valores cortados pela
quebra de página) e 1 é item com valores mas sem nome de produto. Todos ficam
com pendência explícita — nenhum foi preenchido por suposição.

## 6. Divergências reais preservadas (nunca corrigidas silenciosamente)

| Caso | Local | Bruto | Calculado | Ação |
| --- | --- | --- | --- | --- |
| ABACATE | DOC-0007 L93 | `R$ 380,08` | `380,80` | divergência `0.72`, `pendente_conferencia` |
| PEPINO | DOC-0002 L878 | formato ambíguo | — | bruto preservado, `pendente_revisao` |
| MELANCIA | DOC-0001 p.15 | `R$ 3.96` (ponto decimal) | — | bruto preservado, `pendente_revisao` |
| Item 31/34 | DOC-0001 | `1.221` / `2.134` | — | quantidade ambígua, `pendente_revisao` |
| nº edital | DOC-0075 | `025/224` | — | `025/224` mantido em `numeroBruto` e `numeroNormalizado` |
