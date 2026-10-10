# Modelo de dados — evolução proposta

Nomes abaixo são conceituais; mapear para convenções Prisma/SQL existentes. Não representam tabelas já implementadas.

## Reutilização
Preservar `Municipio`, `Escola`, `Produtor`, `ProdutorProduto`, `Edital`, `EditalEscola`, `EditalItem`, templates, versões, importações, propostas e auditoria. Completar o modelo em vez de duplicar registros.

## Entidades propostas
| Entidade | Campos/relações essenciais |
|---|---|
| EntidadeExecutora | Identificação, rede, forma de gestão, responsável |
| DRE | Nome, código, entidade executora, situação |
| VinculoEscolaDRE | Escola, DRE, início/fim; preservar mudanças históricas |
| VinculoUsuario | Usuário, função, unidade/fornecedor, vigência |
| RepresentacaoFornecedor | Usuário/extensionista, fornecedor, autorização, escopo e vigência |
| Fornecedor | Tipo de participante, CPF/CNPJ, CAF e relação com produtores existentes |
| ParticipanteFornecedor | Organização/grupo, agricultor, CAF, participação e vigência |
| Demanda / DemandaItem | Escola, ano/período, produto, unidade, quantidade e especificação |
| OfertaPeriodo | Produtor/produto, unidade, capacidade por período, sazonalidade e entrega |
| PesquisaPreco / PesquisaPrecoItem | Produto, fonte, preço, data, custos e documentos |
| PublicacaoEdital | Edital, versão, abertura/encerramento, URLs/evidências e responsável |
| ProjetoVenda | Evolução de Proposta; fornecedor, protocolo, versão apresentada, estado |
| ProjetoVendaItem | Vínculo direto a EditalItem, quantidade, preço e versão de origem |
| DocumentoHabilitacao | Projeto, categoria, arquivo, validade e decisão de análise |
| Analise / Diligencia / Recurso | Processo, responsável, fundamento, prazo e resultado |
| ResultadoItem | Item do edital, fornecedor, quantidade selecionada e decisão |
| Contrato | Número, contratante/UEx, EEx, fornecedor, origem, vigência, valor e estado |
| ContratoItem | Item de origem, descrição preservada, unidade, preço e quantidade vigente |
| ContratoEscola / AlocacaoItemEscola | Escolas e distribuição autorizada de cada item |
| InstrumentoAlteracao | Contrato, tipo, aprovação, documento, efeitos e vigência |
| OrdemFornecimento / OrdemItem | Contrato, escola/local, data, item, quantidade e preço preservado |
| ReservaSaldo | OrdemItem, quantidade reservada/consumida/liberada e estado |
| Entrega / RecebimentoItem | OrdemItem, informado, conferido, aceito, recusado e motivo |
| AjusteRecebimento | Registro original, quantidade/valor, motivo e aprovador |
| DocumentoFiscal / DocumentoFiscalItem | Emissor, número/série/chave, valor, arquivo e vínculos à execução |
| AlocacaoFaturamento | Item fiscal, recebimento aceito e quantidade/valor apropriados |
| ObrigacaoFinanceira | Contrato, documento fiscal, valor aprovado, vencimento e estado |
| Pagamento / AlocacaoPagamento | Valor, data, comprovante, referência e obrigações atendidas |
| EstornoPagamento | Pagamento original, valor, motivo, data e autorização |
| RegraLimite / ControleLimite | Versão legal, agricultor/CAF, EEx, período e compromissos |
| OcorrenciaContrato | Contrato/ordem, tipo, descrição, tratamento e responsável |
| Idempotencia / EventoOutbox | Chave/hash/resultado; evento, destinatário e tentativas |

## Restrições e índices
- Vínculos têm vigência; impedir combinações incompatíveis e representação expirada.
- Unicidade de protocolo e de número contratual por contratante e exercício, conforme padrão definido.
- Itens de proposta referenciam edital; itens de ordem referenciam o mesmo contrato da ordem.
- Recebimento referencia ordem/item/escola consistentes; a alocação fiscal não excede execução aceita disponível.
- Identidade fiscal usa chave quando existente ou combinação tipo/emissor/número/série, com tratamento de cancelamento e substituição.
- Pagamento pode atender várias obrigações e obrigação pode receber vários pagamentos; controlar alocações e duplicidade de referência.
- Índices em DRE/escola/fornecedor, contrato/status/data, item e relações de saldo; paginação nas telas.
- Quantidades e valores positivos nas operações normais; correções são eventos próprios, com limites cumulativos verificados.

## Invariantes de saldo
Quantidade vigente = quantidade original + alterações aprovadas efetivas.
Quantidade aceita líquida = aceites − ajustes/estornos físicos válidos.
Reserva aberta = quantidade reservada ainda não consumida nem liberada.
Disponível para solicitar = vigente − aceita líquida − reserva aberta.

Na conferência, transferir reserva para execução aceita atomicamente. Quantidade recusada permanece devida ou é liberada conforme decisão explícita; não consumir execução por recusa.

Pagamento líquido = pagamentos confirmados − estornos confirmados. Saldo de obrigação = valor aprovado − pagamentos líquidos alocados. Valor faturado depende de documentos válidos e apropriações; não contar arquivos meramente enviados como obrigação aprovada.

Saldos são derivados de registros ou caches transacionais conciliáveis. Não manter números manuais sem trilha que explique sua composição.
