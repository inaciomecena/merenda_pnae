# SDD-010 - Modelagem

Entidades aditivas:

- `UnidadeProdutiva`: propriedade do `Produtor`, município, comunidade, áreas opcionais e localização protegida.
- `ProdutorProduto` existente: ampliado com referências opcionais a `ProdutoReferencia` e `UnidadeProdutiva`, preservando registros legados.
- `SafraProducao`: ciclo planejado, estimativa, colheita, perdas, reservas e versão.
- `SazonalidadeProducao`: mês/período informado pelo produtor, sem calendário genérico automático.
- `DisponibilidadeProducao`: compromisso/reserva fundamentada e origem auditável.
- `LogisticaProdutor`: modalidades de entrega, municípios atendidos e capacidade.
- `InformacaoNutricional`: fonte, versão, estado do alimento e status de validação.
- `VinculoAssistenciaTecnica`: extensionista, produtor, escopo, vigência e concessor.
- `MapeamentoProdutoEdital`: compatibilidade proposta, critérios e revisão humana.

Todos os modelos usam FKs, índices, `Decimal` para quantidades e exclusão restritiva/cascata somente nos filhos apropriados.
