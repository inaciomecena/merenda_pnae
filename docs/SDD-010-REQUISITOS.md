# SDD-010 - Requisitos implementados

- Painel do produtor com cadastro, unidades, produtos, safras, sazonalidade, disponibilidade e logística.
- Reutilização de `Produtor`, `ProdutorProduto`, `ProdutoReferencia`, `Edital`, `EditalItem`, `Proposta`, `Contrato` e vínculos existentes.
- Isolamento por produtor via `PolicyService` e autorização explícita de extensionista.
- Quantidades não negativas, transições de safra controladas e versionamento otimista.
- Catálogo técnico com solicitação de inclusão e informações nutricionais rastreáveis.
- Mapeamento edital-produto somente como sugestão/revisão humana.
- Auditoria para alterações produtivas e assistência técnica.

Não foram criados dados produtivos ou nutricionais fictícios e não foram alteradas regras jurídicas de editais.
