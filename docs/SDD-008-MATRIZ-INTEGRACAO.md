# SDD-008 - Matriz de integracao

| Origem | Destino | Entidades | Transformacao/validacao | Operador/permissao |
|---|---|---|---|---|
| Edital e itens | Chamada publica | Edital, EditalItem, ChamadaPublica | periodo, escolas, DRE e numero unicos | ADMIN/DRE |
| Inscricao | Projeto de venda | InscricaoChamada, Proposta, PropostaItem | produtor/categoria; duplicidade por chamada+produtor | produtor/representante |
| Projeto | Habilitacao/classificacao | AnaliseHabilitacao, ClassificacaoProjeto | status e quantidade limitada por oferta/demanda | ADMIN/DRE |
| Resultado | Contrato | HomologacaoChamada, Contrato, ContratoItem | contrato derivado dos itens selecionados | ADMIN/DRE |
| Contrato | Entrega | ProgramacaoEntrega, Entrega, EntregaItem | reserva e aceite nao podem exceder saldo | ADMIN/DRE/ESCOLA |
| Recebimento | Fiscal | NotaFiscal, VinculoRecebimentoFiscal | associacao manual item a item | ADMIN/DRE |
| Fiscal | Financeiro | Atesto, Liquidacao, Pagamento | valores Decimal, parciais e saldos | ADMIN/DRE |
| Execucao | Prestacao | PrestacaoContas e demonstrativo | agregacao por contrato/DRE/escola/periodo | ADMIN/DRE/ESCOLA |
| Mutacoes | Auditoria | AuditLog | ator, acao, entidade e valores | ADMIN consulta |
| Demonstrativo | Publico | TransparenciaController | sanitizacao de CPF/CNPJ/caminhos | publico sem JWT |

As regras de selecao usadas no cenario sao explicitamente de teste; nao foram
introduzidos criterios normativos no produto.
