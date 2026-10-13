# RELATÓRIO DE DUPLICIDADES E VERSÕES — PNAE MT 2025

> Base: `VALIDACAO_PACOTE.json` (128 INTEIRO / 7 AUSENTE / 0 ALTERADO / 0
> INVÁLIDO / 0 FORA_DO_PACOTE) sobre o manifesto com SHA-256
> `800d0f833c16b102a723abccd27c583e98ba1dc5b3b4fd5d65ab3b2836d72f16`.

## 1. Panorama

| Indicador | Valor |
| --- | ---: |
| Documentos no manifesto | 135 |
| Arquivos presentes e íntegros | 128 |
| Ausentes (HTTP 404 — Tangará da Serra) | 7 |
| **Hashes SHA-256 únicos** | **122** |
| **Grupos de duplicados binários** | **4** |
| Documentos envolvidos em duplicidade | 10 |

Duplicidade binária = dois ou mais `DOC-xxxx` com **o mesmo SHA-256**, ou seja,
arquivos byte a byte idênticos baixados de URLs diferentes. Não é coincidência de
conteúdo: é o mesmo arquivo publicado em mais de um lugar.

## 2. Os 4 grupos de duplicados binários

### Grupo 1 — `625e2422…5dab` — Juína (2 documentos)

| ID | Caminho no pacote |
| --- | --- |
| DOC-0019 | `PNAE_MT_2025/06_JUINA/DOC-0019_cotriguacuedital--chamada-pUblica-2025-t7Br.pdf` |
| DOC-0020 | `PNAE_MT_2025/06_JUINA/DOC-0020_cotriguacuedital--chamada-pUblica-2025-2-MbYw.pdf` |

Proveniência: mesmo portal (`drejuina.com.br/uploads/editais/…`), dois sufixos
de nome diferentes (`-t7Br` e `-2-MbYw`) apontando para o mesmo PDF.

**Leitura:** o portal publicou o mesmo edital duas vezes com nome de arquivo
gerado por upload distinto. Não é retificação — retificação teria hash
diferente.

### Grupo 2 — `a3e9ff86…af21` — Juína (2 documentos)

| ID | Caminho no pacote |
| --- | --- |
| DOC-0026 | `…/DOC-0026_aripuana-edital--chamada-pUblica-2025pos-parecerdocx-1-gKjW.pdf` |
| DOC-0027 | `…/DOC-0027_aripuana-edital--chamada-pUblica-2025pos-parecerdocx-1-xI4f.pdf` |

Mesma situação do Grupo 1: dois uploads do mesmo arquivo (Aripuanã).

### Grupo 3 — `9add7924…745e` — Primavera do Leste (3 documentos)

| ID | Caminho no pacote |
| --- | --- |
| DOC-0055 | `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0055_DOC-0055.pdf` |
| DOC-0059 | `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0059_DOC-0059.pdf` |
| DOC-0060 | `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0060_DOC-0060.pdf` |

Proveniência: três IDs de arquivo Google Drive **diferentes**
(`1ZOyOp4R…`, `1Wjo67zq…`, `1g3_xIr5…`) todos sob o mesmo portal
(`sites.google.com/edu.mt.gov.br/drepva/…/certames-2025`), contendo o mesmo PDF.

**Leitura:** o mesmo edital foi publicado no portal com três links de Drive
distintos. Todos apontam para o mesmo binário.

### Grupo 4 — `f54c7bef…35fb` — Primavera do Leste (3 documentos)

| ID | Caminho no pacote |
| --- | --- |
| DOC-0056 | `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0056_DOC-0056.pdf` |
| DOC-0057 | `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0057_DOC-0057.pdf` |
| DOC-0058 | `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0058_DOC-0058.pdf` |

Três IDs de Drive distintos (`1Y_315oY…`, `1FTJ9Bu_…`, `1dtNrtzL…`), mesmo
binário. Situação idêntica ao Grupo 3.

## 3. Decisão tomada — os dois grupos são coisas diferentes

A inspeção por `id_edital` mostrou que os 4 grupos **não** têm a mesma natureza.
Tratá-los como um único caso seria um erro de interpretação.

### 3.1 Juína (grupos 1 e 2): duplicidade VERDADEIRA — mesmo edital, dois IDs

| ID | `id_edital` | número | município | SHA-256 |
| --- | --- | --- | --- | --- |
| DOC-0019 | ED-0018 | 019/2024 | Cotriguaçu | `625e2422…` |
| DOC-0020 | ED-0018 | 019/2024 | Cotriguaçu | `625e2422…` |
| DOC-0026 | ED-0024 | 015/2024 | Aripuanã | `a3e9ff86…` |
| DOC-0027 | ED-0024 | 015/2024 | Aripuanã | `a3e9ff86…` |

Mesmo `id_edital`, mesmo número, mesmo município, mesmo binário. É o **mesmo
edital** publicado duas vezes no portal, com dois sufixos de nome de arquivo
gerados por uploads distintos (`-t7Br` vs `-2-MbYw`; `-gKjW` vs `-xI4f`).

Como `chaveVersao = sha256De(chaveLogica | papel | sha256)` e os dois documentos
têm o **mesmo `chaveLogica`** (mesmo procedimento), o **mesmo `papel`**
(`EDITAL_PRINCIPAL`) e o **mesmo `sha256`**, ambos convergem para a **mesma
`chaveVersao`**. A importação registra **uma** versão do documento; o segundo ID
vira apenas URL de proveniência adicional.

Evidência do staging (ED-0018 e ED-0024 estão `APROVADO`):

```
ED-0018 APROVADO | docs=DOC-0019/EDITAL_PRINCIPAL, DOC-0020/EDITAL_PRINCIPAL
ED-0024 APROVADO | docs=DOC-0026/EDITAL_PRINCIPAL, DOC-0027/EDITAL_PRINCIPAL
```

### 3.2 Primavera do Leste (grupos 3 e 4): NÃO é duplicidade — mesmo PDF apontado para 6 editais DIFERENTES

Aqui a leitura é outra, e mais séria. Os documentos têm o **mesmo binário**, mas
pertencem a **procedimentos distintos**, com número e município diferentes:

| ID | `id_edital` | número | município | elegibilidade | `papel` classificado |
| --- | --- | --- | --- | --- | --- |
| DOC-0055 | ED-0050 | 009/2024 | Santo Antônio do Leste | PENDENTE_EDITAL_COMPLETO | `AVISO` |
| DOC-0059 | ED-0054 | 011/2024 | Poxoréu | PENDENTE_EDITAL_COMPLETO | `AVISO` |
| DOC-0060 | ED-0055 | 012/2024 | Campo Verde | PENDENTE_EDITAL_COMPLETO | `AVISO` |
| DOC-0056 | ED-0051 | 014/2024 | Paranatinga (urbana) | PREGAO_2025 | `AVISO` |
| DOC-0057 | ED-0052 | 013/2024 | Paranatinga (urbana) | PENDENTE_EDITAL_COMPLETO | `AVISO` |
| DOC-0058 | ED-0053 | 010/2024 | Primavera do Leste | PENDENTE_EDITAL_COMPLETO | `AVISO` |

Todos têm `titulo = "Documento Certames 2025"` e URLs de Drive distintas
(`1ZOyOp4R…`, `1Wjo67zq…`, `1g3_xIr5…`, `1Y_315oY…`, `1FTJ9Bu_…`, `1dtNrtzL…`)
sob o mesmo portal `sites.google.com/edu.mt.gov.br/drepva/…/certames-2025`.

**Leitura:** não são seis editais. É **um único PDF** (provavelmente um aviso /
extrato de certames) que o portal vinculou a seis entradas de procedimento
diferentes. A pesquisa o replicou para as seis. Como `chaveLogica` difere
(número e ano distintos), os `chaveVersao` **não** colidem — mas também não há
nada a importar: nenhum dos seis é uma chamada pública da agricultura familiar
com edital completo.

Duas proteções já existentes cobrem esse caso, sem código novo:

1. **Classificação de papel pelo conteúdo** — os seis foram classificados como
   `AVISO`, não `EDITAL_PRINCIPAL`. Um aviso não vira documento principal de
   edital.
2. **Elegibilidade** — ED-0051 é `PREGAO_2025` → `SEGREGADO`; os outros cinco
   são `PENDENTE_EDITAL_COMPLETO` → `BLOQUEADO`.

Evidência do staging:

```
ED-0050 BLOQUEADO | docs=DOC-0055/AVISO                | PENDENTE_EDITAL_COMPLETO
ED-0051 SEGREGADO | docs=DOC-0056/AVISO, DOC-0066/EDITAL_PRINCIPAL | PREGAO_2025
ED-0052 BLOQUEADO | docs=DOC-0057/AVISO                | PENDENTE_EDITAL_COMPLETO
ED-0053 BLOQUEADO | docs=DOC-0058/AVISO                | PENDENTE_EDITAL_COMPLETO
ED-0054 BLOQUEADO | docs=DOC-0059/AVISO                | PENDENTE_EDITAL_COMPLETO
ED-0055 BLOQUEADO | docs=DOC-0060/AVISO                | PENDENTE_EDITAL_COMPLETO
```

**Nenhum dos seis entra na importação.** Registre-se, porém, que esta é uma
fragilidade do levantamento, não da implementação: se um desses editais viesse
como `ELEGIVEL_2025`, o mesmo PDF seria aceito como edital de municípios
distintos. A salvaguarda correta é a conferência administrativa prevista em
`PENDENTE_EDITAL_COMPLETO` — e é por isso que esses seis **não** foram
promovidos a elegíveis.

### 3.3 Efeito sobre a importação

| Grupo | DRE | IDs | natureza | efeito |
| --- | --- | ---: | --- | --- |
| 1 | Juína | 2 | duplicidade verdadeira (mesmo edital) | colapsa em **1** versão; ambos os edital `APROVADO` |
| 2 | Juína | 2 | duplicidade verdadeira (mesmo edital) | colapsa em **1** versão; ambos os edital `APROVADO` |
| 3 | Primavera do Leste | 3 | mesmo PDF em 3 editais distintos | **nada importado** (todos bloqueados/segregados) |
| 4 | Primavera do Leste | 3 | mesmo PDF em 3 editais distintos | **nada importado** (todos bloqueados/segregados) |

Dos 10 documentos duplicados, **4** representam 2 editais reais (Juína, já
dentro dos 51 aprovados) e **6** representam 0 editais importáveis.

## 4. Retificação com alteração real (caso diferente)

Retificação **não** é duplicidade. Ela tem hash **diferente** do edital
original e é classificada pelo **conteúdo**, não pelo numeral
(`classificarPapelDocumento` procura "retific" no tipo/título/observações).

| Situação | SHA-256 | `papel` | `chaveVersao` |
| --- | --- | --- | --- |
| Edital original | `ffffffff…` | `EDITAL_PRINCIPAL` | `chaveVersao A` |
| Retificação do mesmo edital | `99999999…` (diferente) | `RETIFICACAO` | `chaveVersao B` |

Como `chaveVersao` mistura `papel` **e** `sha256`, uma retificação nunca
colide com o original: as duas versões coexistem, com histórico preservado.

## 5. Ausentes (não são duplicidade, mas bloqueiam)

Os 7 documentos ausentes são da **Tangará da Serra** e falharam com HTTP 404
durante a pesquisa. Não há arquivo, não há hash, não há o que importar.

Tratamento: os 7 procedimentos correspondentes (ED-0080 a ED-0086) ficam
`BLOQUEADO` com o motivo explícito
`"sem caminho no manifesto (download falhou na pesquisa: HTTP 404)"`. Nenhum
registro é criado. Não foi feita nova tentativa de download nem uso de serviço
de terceiros.

## 6. Registros revisados nunca são sobrescritos

Mesmo quando uma nova extração traz valor diferente, a gravação respeita
`podeSobrescrever(statusRevisaoAtual, statusRevisaoNovo)`:

| Status atual | Pode ser sobrescrito? |
| --- | --- |
| `confirmado` | **não** |
| `manual` | **não** |
| `extraido` / `pendente_*` | sim, com conflito registrado |

Quando os valores divergem, `compararCampos` produz um `ConflitoCampo` com
`acao: 'MANTIDO'` — o valor revisado é preservado e a proposta fica registrada
para decisão humana, sem sobrescrita silenciosa.

## 7. Números-chave para conferência

```
135 documentos no manifesto
128 arquivos presentes e íntegros
  7 ausentes (HTTP 404, Tangará da Serra)
122 hashes únicos
  4 grupos com hash repetido
 10 documentos em hash repetido
   4 = duplicidade verdadeira (Juína, mesmo edital) → 2 editais, 1 versão cada
   6 = mesmo PDF em 6 editais distintos (Primavera do Leste) → 0 importáveis
  0 alterados
  0 inválidos
  0 tentativas de path traversal
```
