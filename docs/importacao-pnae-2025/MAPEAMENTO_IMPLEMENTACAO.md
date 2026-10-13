# MAPEAMENTO_IMPLEMENTACAO — Importação histórica PNAE MT 2025

> Como a importação histórica se apoia na implementação **existente** do PNAE
> Digital. Nenhum módulo foi duplicado; o novo código é uma camada fina de
> leitura/classificação/staging que reaproveita mecanismos já em produção.

## 1. Módulo novo: `apps/backend/src/modules/importacao-historica/`

Biblioteca **pura** de TypeScript: sem injeção de dependência do NestJS, sem
controllers/HTTP, sem Prisma. Isso é deliberado — toda a lógica de decisão
roda offline sobre o pacote documental e produz staging auditável.

```
importacao-historica/
├── index.ts
├── dominio/
│   ├── tipos.ts                  # tipos do staging + ItemExtraido + StagingEdital
│   ├── decimal-monetario.ts      # leitura monetária em CENTAVOS (sem float)
│   ├── classificacao-pacote.ts   # elegibilidade → APROVADO/BLOQUEADO/SEGREGADO/PENDENTE
│   └── chaves-logicas.ts         # chaves lógicas, versão de documento, idempotência
└── aplicacao/
    ├── leitor-pacote.ts          # leitura do manifesto + validação física (hash/header)
    ├── apoio-extracao.ts         # wrappers do módulo monetário já existente
    ├── extrator-documento.ts     # extração de itens/identificação/anexos dos PDFs
    ├── resolucao-institucional.ts# DRE/município/entidade/escola vs snapshot
    ├── gerador-staging.ts        # monta StagingEdital + pendências
    └── simulador-importacao.ts   # dry-run: plano de ações, sem escrever
```

CLI: `apps/backend/scripts/importacao-historica-pnae-2025.ts`
comandos `staging` | `dry-run` | `aplicar` (este último **travado**, sai com
código 3 e não executa).

## 2. O que foi reaproveitado (não reescrito)

| Mecanismo existente | Onde | Uso na importação histórica |
| --- | --- | --- |
| Extração de PDF | `composicao-editais/application/domain/engenharia-reversa.ts` (`PaginaTexto`, `analisarTextoEdital`) | Mesma estrutura de página (`{numero, texto}`); o extrator histórico devolve itens com a mesma proveniência |
| Tratamento monetário | `dominio/decimal-monetario.ts` | `lerValorMonetario`, `lerQuantidade`, `compararTotal`, `multiplicarCentavos` — tudo em centavos inteiros |
| Normalização de quantidade | idem | `lerPossivel` reexportado por `apoio-extracao.ts` |
| JWT/RBAC e guards | `common/guards/*` | Não replicados: o módulo histórico não expõe rota. O `aplicar` futuro passará pelos controllers existentes de `importador-editais`/`chamadas-publicas` |
| Auditoria e versionamento | `EditalDocumento` / `ChamadaPublicaDocumento` + `chaveVersaoDocumento` | Chave de versão por `sha256`; retificação gera chave nova, nunca sobrescreve |
| Idempotência | `IdempotenciaOperacao` (`@@map("pnae_idempotencia_operacoes")`) | `chaveIdempotenciaOperacao(operacao, chaveLogica)` segue o mesmo padrão |
| Isolamento por DRE | `DRE`, `Municipio`, `VinculoEscolaDRE` | Resolução contra snapshot; sem vínculo automático em ambiguidade |

## 3. Caminho de dados (o que acontece, e o que NÃO acontece)

```
MANIFESTO_DOCUMENTOS.json ──► leitor-pacote (hash, %PDF-, traversal)
        │                              │
        ▼                              ▼
classificacao-pacote            VALIDACAO_PACOTE.json (128 INTEIRO / 7 AUSENTE)
        │
        ▼
extrator-documento  ◄── PDFs do pacote (pdf-parse, só leitura)
        │
        ▼
resolucao-institucional ◄── snapshot-institucional.json (leitura somente do banco)
        │
        ▼
gerador-staging ──► staging/*.json + índices + RESUMO_STAGING.json
        │
        ▼
simulador-importacao ──► planos/dry-run-plano.json   (NENHUMA escrita)
```

**O que NÃO foi feito nesta execução:**

- nenhuma `prisma migrate` (nem `reset`); nenhuma escrita no banco ativo;
- nenhum seed destrutivo; nenhuma limpeza de tabela;
- nenhuma publicação, homologação, contratação ou pagamento;
- nenhum toque nas chamadas públicas de 2026;
- nenhuma chamada a API paga, serviço externo, SEFAZ ou banco.

## 4. Lacunas documentadas da implementação existente

Estas são limitações **reais** encontradas no código atual. Nenhuma foi
corrigida silenciosamente: todas ficam registradas, com a mitigação adotada e a
mudança proposta (não aplicada).

| # | Lacuna | Impacto | Mitigação nesta execução | Mudança proposta (NÃO aplicada) |
| --- | --- | --- | --- | --- |
| 1 | `importador-editais` não tem modo dry-run | risco de escrita acidental | `simulador-importacao.ts` é puro e escreve só em `staging/`; `aplicar` sai com código 3 | adicionar flag `--dry-run` no importador existente |
| 2 | não há idempotência por hash de documento | reimportação duplicaria itens | `chaveItem(documentoId, sha256, sequencia)` e `chaveIdempotenciaOperacao` no staging | gravar `IdempotenciaOperacao` por `(operacao, chaveLogica)` no ato do `aplicar` |
| 3 | `ChamadaPublica` tem `@@unique([numero, exercicio])` **sem `dreId`** | **colisão entre DREs**: "020/2024" de Sinop e de Juína são a mesma chave | staging carrega `dreId`; o plano marca a colisão como risco | ver §5 |
| 4 | `EditalItem` não tem colunas de proveniência | item importado perderia página/hash/método | staging preserva tudo em `ItemExtraido` | adicionar `paginaOrigem`, `documentoOrigemId`, `sha256Origem`, `metodoExtracao`, `statusRevisao` a `EditalItem` |
| 5 | não há OCR no projeto | PDFs digitalizados sem camada de texto não têm itens | 0 casos no pacote (todos têm texto); pendência explícita caso apareçam | avaliar OCR apenas se surgir PDF escaneado — sem serviço pago |

## 5. Proposta de migração para a colisão de `ChamadaPublica` (NÃO APLICADA)

`apps/backend/prisma/schema.prisma`, model `ChamadaPublica`:

```prisma
@@unique([numero, exercicio])          // ATUAL — colide entre DREs
@@unique([dreId, numero, exercicio])   // PROPOSTO — escopo por DRE
```

Por que é bloqueante para a importação histórica: o pacote tem **18 chamadas
"020/2024" a "037/2024" de Sinop** e chamadas de mesmo número em outras DREs.
Com a unique atual, importar a segunda DRE falharia por violação de constraint.

Requisitos antes de aplicar (todos NÃO EXECUTADOS nesta rodada):

1. backup `mysqldump` completo do schema `merenda_pnae`;
2. conferir se existem dados reais já duplicados sob a unique atual;
3. `prisma migrate dev` em **ambiente isolado**, nunca no banco ativo;
4. rollout junto com o `aplicar` da importação, não antes.

Recomendação operacional: aplicar a migração **somente** junto com a execução
autorizada do `aplicar`, em ambiente isolado, com rollback definido em §"Backup
e rollback" do `RELATORIO_FINAL_IMPORTACAO_PNAE_2025.md`.

## 6. Reuso do importador definitivo (futuro, sob autorização separada)

A escrita definitiva **não** será feita pelo módulo histórico. Ela reutilizará:

- `importador-editais` / `chamadas-publicas` — criação de `Edital`,
  `ChamadaPublica`, `EditalItem`, `EditalDocumento`, `EditalAnexo`;
- `IdempotenciaOperacao` — uma linha por `(operacao, chaveLogica)`;
- `EditalDocumento.chaveVersao` — versionamento por sha256;
- RBAC/auditoria existentes — o `aplicar` roda como comando administrativo
  restrito, com o mesmo `createdBy`/`updatedBy` do restante do sistema.

O staging gerado é a **única** entrada do `aplicar`: nada é relido do PDF no
momento da escrita, então a revisão humana acontece sobre o staging, que é
auditável e versionável.
