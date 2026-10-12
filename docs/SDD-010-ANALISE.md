# SDD-010 - Engenharia reversa e matriz de reaproveitamento

Análise realizada no repositório existente antes da modelagem.

| Funcionalidade | Entidade atual | Reaproveitamento | Lacuna | Implementação |
|---|---|---|---|---|
| Identidade do agricultor | `Produtor` | Reutilizada integralmente | Nenhuma | Endpoints de painel usam o produtor autorizado |
| Conta e autenticação | `User`, JWT, `RolesGuard` | Reutilizados | Nenhuma | Sem novo login |
| Autorização de produtor | `VinculoUsuario`, `RepresentacaoFornecedor`, `PolicyService` | Reutilizados | Assistência explícita | `VinculoAssistenciaTecnica` |
| Produto legado | `ProdutorProduto` | Preservado | Sem unidade produtiva/catálogo | Novo vínculo produtivo opcional |
| Catálogo | `ProdutoReferencia` | Reutilizado | nutrição e fonte técnica | Campos técnicos e `InformacaoNutricional` |
| Edital e item | `Edital`, `EditalItem` | Leitura | correspondência produtiva | `MapeamentoProdutoEdital` para revisão humana |
| Propostas/contratos | `Proposta`, `Contrato` | Leitura | nenhuma duplicação | Painel conta registros existentes |
| Unidades produtivas | inexistente | `Municipio` reutilizado | cadastro da propriedade | `UnidadeProdutiva` |
| Safra/ciclo | inexistente | Produto do produtor | planejamento e colheita | `SafraProducao` |
| Disponibilidade | inexistente | safra e perdas | saldo explícito | `DisponibilidadeProducao` |
| Sazonalidade | inexistente | produto/unidade | calendário real do produtor | `SazonalidadeProducao` |
| Logística | inexistente | municípios existentes | capacidade e entrega | `LogisticaProdutor` |
| Nutrição | inexistente | produto de referência | fonte/versão/validação | `InformacaoNutricional` |

## Decisões

- `ProdutoReferencia` continua sendo o catálogo central; não é criado `ProdutoCatalogo` paralelo.
- `ProdutorProduto` legado permanece compatível. `ProdutoProdutor` referencia o catálogo e a unidade produtiva para os novos fluxos.
- Disponibilidade é calculada como `colhida - perdas - comprometida - reservada`; previsão não é estoque confirmado.
- Nenhuma reserva automática é criada por consulta a edital.
- Nutrição sem fonte/valor permanece nula ou pendente; não são inseridos zeros demonstrativos.
- Coordenadas são protegidas por autorização de produtor/extensionista e nunca entram em respostas públicas.
