# MAPEAMENTO_CAMPOS — PNAE MT 2025 → PNAE Digital

> Correspondência entre os campos extraídos do pacote documental e os modelos
> do banco. Para cada campo: origem, transformação, e o que acontece quando a
> fonte é ambígua ou ausente.

## 1. Princípio comum a todos os campos

Todo valor extraído é gravado no staging **com quatro camadas**:

| Camada | Conteúdo | Exemplo real |
| --- | --- | --- |
| `bruto` | texto exatamente como está no PDF | `"1.221"`, `"R$ 3.96"`, `"025/224"` |
| `normalizado` | interpretação em formato canônico, ou `null` se ambígua | `null` para os acima |
| proveniência | `pagina`, `documentoId`, `sha256`, `metodo` | `p.14 / DOC-0001 / 36fc… / pdf_texto_regex` |
| revisão | `statusRevisao` + `pendencia` | `pendente_revisao` + motivo |

**Nenhuma lacuna é preenchida por zero, cálculo ou suposição.** Quando o
documento não traz o valor, o campo fica `null` com pendência explícita.

## 2. Identificação do edital (`IdentificacaoExtraida` → `Edital` / `ChamadaPublica`)

| Campo staging | Origem no PDF | Transformação | Alvo no banco | Se ambíguo |
| --- | --- | --- | --- | --- |
| `numeroBruto` | "EDITAL DE CHAMADA PÚBLICA nº X" / "Chamada Pública Nº X" | **nenhuma** (cópia literal) | `ChamadaPublica.numero` (via staging) | preservado sempre |
| `numeroNormalizado` | idem | zero-pad para 3 dígitos (`25/2024`→`025/2024`) | conferência | grafia estranha mantida (`025/224`) + justificativa |
| `anoNumeracao` | parte após a barra do número | inteiro | `Edital.ano` | — |
| `exercicio` | trechos "ano letivo de 2025" | inteiro, com `exercicioEvidencia[{pagina,trecho}]` | `ChamadaPublica.exercicio` | sem evidência → edital PENDENTE, nunca APROVADO |
| `processoAdministrativo` | "PROCESSO ADMINISTRATIVO nº …" | literal | `Edital.processoAdministrativo` | — |
| `dreNome` | cabeçalho da DRE | literal | → `resolverDRE` → `dreId` | `AMBIGUO`/`NAO_ENCONTRADO` → pendência, sem vínculo |
| `municipioAtendido` | "município de X/MT" | literal | → `resolverMunicipio` → `municipioId` | IBGE decide; sem IBGE e ambíguo → pendência |
| `recorte` | "SALA ANEXA", "DISTRITO", … | enum `RecorteTerritorial` | `Edital.recorte` | default `NAO_IDENTIFICADO` |
| `dataPublicacao` / `dataSessao` | datas do edital | literal + interpretação | `ChamadaPublica.dataAbertura` | ambígua → pendência |
| `objeto`, `fundamentacaoLegal`, `prazos`, `habilitacao`, `criteriosSelecao`, `condicoesEntrega`, `condicoesPagamento` | cláusulas correspondentes | texto completo, com página | textos do edital/chamada | — |
| `valorEstimado` | "VALOR TOTAL ESTIMADO" | leitura monetária | `ChamadaPublica.valorEstimado` | `"SIGILOSO"` mantido como texto, não vira 0 |

### Tratamento do número `025/224` (DOC-0075, Sinop)

```json
{
  "numeroBruto": "025/224",
  "numeroNormalizado": "025/224",
  "justificativa": "grafia do documento \"025/224\" com ano de 3 dígitos; normalização proposta \"025/224\" — a grafia original é preservada e a normalização depende de revisão administrativa"
}
```

A normalização **não** foi aplicada unilateralmente: o documento manteve a
grafia, e a proposta fica registrada para decisão humana.

## 3. Itens (`ItemExtraido` → `EditalItem`)

| Campo staging | Origem | Transformação | Alvo | Se ausente/ambíguo |
| --- | --- | --- | --- | --- |
| `sequencia` | numeral "NN." / "NN " | inteiro | `EditalItem.numeroItem` | — |
| `produto` | trecho antes da primeira vírgula, prefixo de sequência removido, uppercase | ≤80 chars, deve ter letra | `EditalItem.produtoOriginal` | `null` + pendência "produto não identificado" |
| `descricaoCompleta` | primeiras ~6 linhas do bloco + prefixo de resumo | espaços colapsados | `EditalItem.especificacao` | — |
| `unidadeComercial` | coluna "UNIDADE DE MEDIDA" / linha de resumo | mapa para sigla: `Quilograma`→`KG`, `Litro`→`L`, `Unidade`→`UN`, `Caixa`→`CX`, `Maço`→`MACO`, `Bandeja`→`BDJ`, `Dúzia`→`DZ`, `Fardo`→`FARD`, `Pacote`→`PCT` | `EditalItem.unidade` | `null` + pendência "unidade comercial não identificada" |
| `embalagem` | "Unidade de 30g", "Pacote de 5kg"… | regex `extrairEmbalagem`; **nunca** vira quantidade | `EditalItem.observacoes` | — |
| `quantidade` | coluna QUANTIDADE | leitura em centavos/`Decimal(10,2)` | `EditalItem.quantidade` | formato fora do padrão → `null` + pendência |
| `precoUnitario` | coluna PREÇO UNITÁRIO | `Decimal(10,2)` | `EditalItem.precoUnitario` | idem |
| `totalFonte` | coluna VALOR TOTAL (o que está **escrito**) | `Decimal(10,2)` | `EditalItem.valorTotal` | idem |
| `totalCalculado` | `quantidade × precoUnitario` em centavos | só conferência | — (não grava) | — |
| `divergencia` | `totalFonte − totalCalculado` em centavos | string decimal | pendência | — |
| `statusRevisao` | — | `extraido` / `pendente_revisao` / `pendente_conferencia` / `confirmado` / `bloqueado` | `EditalItem.status` | — |

### Por que `totalCalculado` nunca substitui `totalFonte`

`EditalItem.valorTotal` recebe **o que está escrito no documento**. O cálculo
existe apenas para detectar divergência. Caso real (DOC-0007, item 93 ABACATE):

```
bruto          = "380,08"     (o que o PDF diz)
totalCalculado = 380,80       (10,00 × 38,08, em centavos)
divergencia    = -0,72        (registrada, NÃO corrigida)
statusRevisao  = pendente_conferencia
```

### Tratamento monetário: centavos, nunca float

`multiplicarCentavos(quantidadeCentavos, precoCentavos)` faz a conta em
inteiros e divide por 100 no fim. `centavosParaDecimal(38008)` → `"380.08"`.
Nenhum valor monetário passa por `float` como referência definitiva; o
Prisma usa `Decimal(10,2)`.

### Valores ambíguos mantidos como texto

| Grafia | `bruto` | `centavos` | `interpretacaoProposta` | Motivo |
| --- | --- | --- | --- | --- |
| `R$ 2.205,70` | `"R$ 2.205,70"` | `220570` | `220570` | padrão brasileiro inequívoco |
| `2,205,70` | `"2,205,70"` | `null` | `220570` | duas vírgulas — exige revisão |
| `R$ 3.96` | `"R$ 3.96"` | `null` | — | ponto decimal, fora do padrão |
| `1.221` (quantidade) | `"1.221"` | `null` | — | milhar ou decimal? ambíguo |
| ausente | `null` | `null` | — | **nunca vira 0** |

## 4. Documentos (`DocumentoPacote` → `EditalDocumento` / `ChamadaPublicaDocumento`)

| Campo staging | Origem | Alvo |
| --- | --- | --- |
| `idDocumento` | manifesto | registro de documento |
| `papel` | classificado **pelo conteúdo** (`classificarPapelDocumento`), não pelo numeral | `papel`: `EDITAL_PRINCIPAL` / `RETIFICACAO` / `ANEXO` / `AVISO` / `EXTRATO` / `MATERIAL_AUXILIAR` |
| `sha256` | cálculo sobre o arquivo real | coluna de hash do documento |
| `caminho` | manifesto, resolvido **dentro** da raiz do pacote | caminho do arquivo |
| `paginas` | extraído do PDF | nº de páginas |
| `urls` | manifesto (publicação + download) | URLs de proveniência |
| `chaveVersao` | `sha256De(chaveLogica\|papel\|sha256)` truncado em 32 | chave de versionamento |

Classificação física (`ValidacaoDocumento.classificacao`):

| Classe | Condição | Efeito |
| --- | --- | --- |
| `INTEIRO` | hash confere + header `%PDF-` | elegível |
| `AUSENTE` | sem arquivo (7× HTTP 404, Tangará da Serra) | bloqueia o procedimento, com o motivo explícito |
| `ALTERADO` | hash ≠ manifesto | bloqueia — nunca importa arquivo divergente |
| `INVALIDO` | sem header `%PDF-` | bloqueia |
| `FORA_DO_PACOTE` | caminho escapa da raiz (traversal) | bloqueia |

## 5. Institucional (`VinculoInstitucional`)

| Campo | Critério de resolução | Se ambíguo/inexistente |
| --- | --- | --- |
| `dre` | nome normalizado (sem acento/caixa, prefixo "DRE" removido), sede ou código | `AMBIGUO`/`NAO_ENCONTRADO` → **sem id**, pendência |
| `municipio` | **IBGE primeiro**; depois nome normalizado | idem |
| `entidadeExecutora` | **CNPJ primeiro** (só dígitos); depois nome | `PENDENTE` → sem id, pendência |
| `escolas` | INEP; depois nome + município + vigência do vínculo | `CONFIRMADO`/`SEM_VINCULO`/`NAO_VERIFICADO` |

A resolução **nunca cria nem atualiza** registro de cadastro. É leitura de
`snapshot-institucional.json` (gerado por leitura somente do banco).

## 6. Pendências (o que vai para revisão administrativa)

| `tipo` | Qtde | Significado |
| --- | ---: | --- |
| `item_conferencia` | 2087 | item mantido mas com campo a conferir (unidade ausente, quantidade ambígua, divergência) |
| `bloco_nao_item` | 1020 | bloco descartado por não ser linha de tabela (texto corrido, cláusula, cabeçalho) — com trecho para revisão |
| `resolucao_entidade_executora` | 125 | sem CNPJ/nome de entidade executora no pacote |
| `resolucao_municipio` | 6 | município não resolvido com segurança |
| `FORMATO_NUMERICO_AMBIGUO` | 1 | grafia numérica que exige decisão humana |
| `FORA_ESCOPO_2026` / `CONFLITO_EXERCICIO` / `PENDENTE_ARQUIVO` / `PENDENTE_EDITAL_COMPLETO` / `REFERENCIA_HISTORICA` | 36 | bloqueios de elegibilidade vindos do levantamento |

## 7. Itens sem valores: lacuna documental, não falha de parsing

Dos **2652** itens extraídos, **1038** não têm nenhum valor. A auditoria
(`AUDITORIA_EXTRACAO.md`) confirmou, reabrindo o PDF de origem, que a linha de
valores **não existe no documento**: ela foi cortada pela quebra de página no
próprio edital (a coluna de valores fica à direita e some na borda).

Eles são mantidos como item, com unidade e produto, e a pendência diz
literalmente: *"linha de valores não reconhecida … item mantido sem valores,
sem preenchimento por zero"*. Concentração: Juína (576), Pontes e Lacerda (69),
Alta Floresta (136), Diamantino (225), Sinop (25).
