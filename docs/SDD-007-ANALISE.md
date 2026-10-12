# SDD-007 - Analise de engenharia reversa

## Inventario de reaproveitamento

| Funcionalidade | Estado encontrado | Reaproveitamento | Lacuna preenchida |
|---|---|---|---|
| Editais e itens | Existente em `Edital`/`EditalItem` | Fonte de verdade do objeto e da demanda | Chamada vinculada ao edital |
| Fornecedores | Existente em `Produtor` e vinculos | Cadastro, escopo e identificacao | Inscricao na chamada |
| Projetos de venda | Existente em `Proposta`/`PropostaItem` | Itens, valores, documentos e contrato | Vinculo a chamada, categoria, envio e versionamento |
| Habilitacao | Nao havia ciclo de chamada | `FiscalDocumentoService` permanece disponivel | Requisitos, analise, parecer e pendencias |
| Selecao | Nao havia registro administrativo | Decimal do Prisma e itens do edital | Classificacao, quantidades e selecao |
| Homologacao | Homologacao tecnica era outro fluxo | `AuditService` e RBAC | Resultado, recursos e homologacao da chamada |
| Contratacao | Existente e formalizacao manual | `Contrato`/`ContratoItem` | Encaminhamento idempotente para rascunho |

## Decisoes

Foram criadas somente as entidades do ciclo ausente: chamada, escolas, documentos publicados, inscricoes, requisitos/analises de habilitacao, classificacoes, resultados, recursos e homologacao. O projeto de venda continua sendo `Proposta`; o contrato continua sendo formalizado no modulo de contratos.

Critérios de priorização nao foram inventados no codigo. A API registra `criterio`, `valorConsiderado` e `justificativa`; a autoridade administrativa deve parametrizar e validar a regra do edital antes de classificar.

## Escopo institucional

ADMIN possui escopo global. DRE e ESCOLA usam `PolicyService` e vinculos vigentes. Fornecedor/representante pode inscrever e enviar projetos conforme os vinculos ja existentes, sem ampliar permissoes administrativas.
