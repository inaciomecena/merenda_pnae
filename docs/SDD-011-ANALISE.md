# SDD-011 - Análise de reaproveitamento

Oportunidades são derivadas de `ChamadaPublica` e `EditalItem`; não há cópia de edital, catálogo ou proposta. A produção vem de `ProdutorProduto`, `SafraProducao`, `DisponibilidadeProducao`, `SazonalidadeProducao` e `LogisticaProdutor`. `MapeamentoProdutoEdital` revisado é usado como evidência forte. Lacuna persistente identificada: não existia conceito de manifestação, então foi criada somente `InteresseOportunidade`.

Chamadas públicas elegíveis: `PUBLICADA` ou `INSCRICOES_ABERTAS`, com `inscricoesFim` vigente. Rascunhos, canceladas e encerradas não aparecem. A autorização usa `PolicyService`; extensionistas dependem de vínculo/representação vigente.
