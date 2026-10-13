# Matriz de pendências — importação histórica PNAE/MT 2025

**Data:** 2026-10-12 · **Base:** `staging/*.json` (125 editais) + saneamento da etapa atual.

## Legenda de classificação

| Classe | Significado | Efeito no `aplicar` |
| --- | --- | --- |
| **RESOLVIDA** | Encerrada nesta etapa, com evidência rastreável. | Nenhum. |
| **DEPENDENTE** | Pendente de **validação administrativa** (decisão humana/documental). | Pode importar os **metadados**, mas o campo/relação fica `null`/pendente até a decisão. |
| **BLOQUEANTE** | Impede a importação **daquele edital/registro**. | O edital **não** entra no plano. |

Totais gerais: **3275** pendências em 125 editais — **3158** nos 51 aprovados, **117** nos 74 não aprovados.

---

## 1. Pendências dos 51 editais aprovados (candidatos à importação)

| Tipo | Qtd | Classe | Observação e destino |
| --- | ---: | --- | --- |
| `item_conferencia` | **2087** | **DEPENDENTE** | Conferência manual de itens: divergências numéricas, itens sem valores, itens sem unidade. Detalhado em §1.1. |
| `bloco_nao_item` | **1020** | **RESOLVIDA** (como ruído de tabela) | Blocos de texto que **não** eram itens e foram descartados corretamente (cabeçalhos, números de página, prosa). Não representam dado perdido — são exatamente o que não deve virar item. |
| `resolucao_entidade_executora` | **51** (1 por edital) | **DEPENDENTE** | CNPJ da SEDUC-MT identificado no documento (53/54 docs), mas cadastro tem `cnpj: null`. Vinculação suportada por evidência, aguarda preenchimento de cadastro + decisão. Ver `RELATORIO_SANEAMENTO_2025.md` §1. |
| **Total** | **3158** | — | |

### 1.1 Composição das 2087 pendências `item_conferencia` (51 aprovados)

Apurado sobre os 2652 itens dos aprovados:

| natureza | Qtd | Classe |
| --- | ---: | --- |
| Itens **sem nenhum valor** (quebra de página no PDF de origem) | **1038** | **DEPENDENTE** — lacuna documental; resolver com novo levantamento/OCR. Nunca zerado. |
| Itens com **divergência numérica não nula** (total fonte ≠ qtd × preço) | **597** | **DEPENDENTE** — valor bruto e calculado preservados; nenhuma correção automática. |
| Itens **sem unidade comercial** | **400** | **DEPENDENTE** — unidade não inferida; conferir no documento. |
| (sobreposições: um item pode ter mais de uma marcação) | — | — |

> As **maiores divergências** (PÃO CASEIRO +550,00; BEBIDA LÁCTEA +99,30; MELANCIA −15,86)
> estão em `RELATORIO_SANEAMENTO_2025.md` §3.1 e exigem conferência prioritária.

---

## 2. Pendências dos 74 editais não aprovados (bloqueados/segregados)

| Tipo | Qtd | Classe | Efeito |
| --- | ---: | --- | --- |
| `resolucao_entidade_executora` | **74** | **DEPENDENTE** | Mesma causa dos aprovados (cadastro sem CNPJ). |
| `CONFLITO_EXERCICIO` | **11** | **BLOQUEANTE** | Ano conflitante (ex.: edital 2024 com evidência de 2026). Não importar sem decisão. |
| `FORA_ESCOPO_2026` | **9** | **BLOQUEANTE** | Publicação/exercício 2026 — fora do recorte histórico 2025. |
| `PENDENTE_ARQUIVO` | **7** | **BLOQUEANTE** | Tangará da Serra: 7 arquivos HTTP 404 no portal. Sem documento, não há o que importar. |
| `resolucao_municipio` | **6** | **DEPENDENTE** | Município ambiguo/ausente (Cáceres 2, Metropolitana 2, Primavera 2) — sem id atribuído. |
| `PENDENTE_EDITAL_COMPLETO` | **5** | **BLOQUEANTE** | Edital sem o documento integral. |
| `REFERENCIA_HISTORICA` | **4** | **BLOQUEANTE** | Documento de referência, não é chamada pública a importar. |
| `FORMATO_NUMERICO_AMBIGUO` | **1** | **DEPENDENTE** | PEPINO `R$ 2,205,70` (`ED-0002` Diamantino, bloqueado) — duas vírgulas, não convertido. |
| **Total** | **117** | — | |

> Os 74 não aprovados **não entram no plano de importação** em nenhuma hipótese desta etapa.

---

## 3. Quadro-resumo por classe (só os 51 candidatos)

| Classe | Pendências | Itens de decisão |
| --- | ---: | --- |
| **RESOLVIDA** | 1020 (`bloco_nao_item` descartados corretamente) | 0 |
| **DEPENDENTE** | 2138 (`item_conferencia` 2087 + entidade executora 51) | 3 frentes: (a) conferência de itens, (b) CNPJ da entidade executora, (c) unidade comercial |
| **BLOQUEANTE** | **0** entre os 51 | — |

**Nenhum dos 51 candidatos tem pendência bloqueante.** Todos podem ir a homologação
isolada; as pendências são todas de conferência/validação administrativa e ficam
`null`/pendentes no registro importado, nunca preenchidas por inferência.

## 4. Frentes de decisão administrativa (ordem sugerida)

1. **Entidade executora (51 editais):** preencher CNPJ `53.291.992/0001-10` no cadastro da
   entidade estadual e confirmar a vinculação. Desbloqueia `entidadeExecutoraId`.
2. **`025/224` (1 edital, ED-0067):** confirmar normalização para `025/2024` (evidência
   interna do PDF). **Antes** do `aplicar`, pois altera a chave lógica/idempotência.
3. **Divergências numéricas (597 itens):** conferência documental, priorizando as 204
   acima de R$ 1,00. Nenhuma correção automática.
4. **Itens sem valores (1038) e sem unidade (400):** novo levantamento/OCR junto às DREs.
5. **Municípios ambíguos (6, em não aprovados):** decisão só relevante se algum desses
   editais for reavaliado para candidato.

## 5. Rastreabilidade

Cada pendência nos JSONs de `staging/` preserva `tipo`, `descricao` e `origem`
(documento ou "snapshot institucional"), e cada item carrega valor bruto + normalizado +
`documentoId` + `sha256` + `pagina` + `metodo` + `statusRevisao`. Nenhum dado foi
alterado nesta etapa de saneamento.
