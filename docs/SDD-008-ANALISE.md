# SDD-008 - Analise de homologacao integrada

## Escopo

Esta homologacao verifica a passagem de dados entre edital, chamada publica,
projeto de venda, habilitacao, selecao, contrato, entrega, fiscal/financeiro e
prestacao de contas. O cenario e ficticio, identificado pelo prefixo
`SDD008-`, e nao representa aprovacao juridica ou administrativa.

## Engenharia reversa

- Prisma: `Edital`/`EditalItem` alimentam `ChamadaPublica`; inscricoes e
  `Proposta` mantem produtor, categoria, itens, habilitacao e selecao.
- `ClassificacaoProjeto` e `HomologacaoChamada` registram selecao e resultado;
  o endpoint de encaminhamento cria `Contrato` e `ContratoItem`.
- `ProgramacaoEntrega` reserva saldo de `ContratoItem`; `Entrega` controla
  recebimento/aceite/estorno.
- `NotaFiscal`, `Atesto`, `Liquidacao` e `Pagamento` formam o encadeamento
  fiscal manual. Nao ha integracao SEFAZ ou bancaria.
- `PrestacaoContasService` consolida contratos, entregas aceitas, notas,
  atestos, liquidacoes, pagamentos, documentos e divergencias com `Decimal`.
- Guards JWT/Roles e `PolicyService` aplicam escopo de DRE/escola/produtor;
  `AuditService` registra operacoes mutantes e exportacoes.

## Riscos encontrados

1. Contratos originados da chamada nascem como rascunho e precisam de escopo,
   vigencia, documento e formalizacao antes de programar entrega. O E2E cobre
   explicitamente essa transicao.
2. A homologacao tecnica nao valida assinatura externa, autenticidade de XML,
   criterio normativo ou autorizacao financeira. Esses pontos permanecem
   administrativos.

## Classificacao

Nenhum P0/P1 foi aberto durante a execucao registrada em
`apps/backend/scripts/e2e-sdd008-last-run.json` (80/80). O primeiro disparo do
E2E SDD-006 em um banco legado isolado foi interrompido por fixture ausente
(`dre-b@seaf.gov.br`); a execucao definitiva foi repetida no banco principal,
sem reset, e passou 38/38. O runner SDD-007 tambem foi repetido a partir da
raiz para gravar a evidencia no caminho correto e passou 25/25.

As regras de selecao, habilitacao, homologacao e pagamento usadas no cenario
sao as regras ja implementadas e dados ficticios; nenhuma regra administrativa
externa foi inventada.
