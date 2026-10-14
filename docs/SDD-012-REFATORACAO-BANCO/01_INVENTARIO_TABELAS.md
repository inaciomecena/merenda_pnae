# Inventario de tabelas

Estado observado em 2026-10-14 no banco local antes da migration de nomes.

**Cobertura:** 84 tabelas fisicas; 83 models Prisma; 169 FKs de uma coluna; todas InnoDB. TABLE_ROWS nao foi usado para contagem porque e estimativa; registros foram contados individualmente.

A categoria e conservadora: C para trilha/historico, D para estruturas preparadas vazias, A para dados com uso direto localizado, B para dependencia referencial e G quando a evidencia nao permite afirmar uso. E/F nao foram atribuidas sem prova. Nomes-alvo refletem a migration homologada.

| Tabela atual | Nome-alvo | Model Prisma | Registros | Bytes dados+indices | PK | Indices | FKs de saida/entrada | Classe | Dominio |
|---|---|---|---:|---:|---|---:|---:|:---:|---|
| `dres` | `dres` | DRE | 13 | 49152 | `id` | 3 | 1/9 | A | cadastro territorial |
| `entidades_executoras` | `entidades_executoras` | EntidadeExecutora | 1 | 65536 | `id` | 4 | 1/2 | A | cadastro territorial |
| `escolas` | `escolas` | Escola | 3182 | 3178496 | `id` | 3 | 1/13 | A | cadastro territorial |
| `municipios` | `municipios` | Municipio | 142 | 81920 | `id` | 3 | 0/13 | A | cadastro territorial |
| `pnae_analises_habilitacao` | `pnae_analises_habilitacao` | AnaliseHabilitacao | 6 | 32768 | `id` | 2 | 1/0 | A | editais e selecao |
| `pnae_atestos` | `pnae_atestos` | Atesto | 1 | 114688 | `id` | 7 | 3/1 | A | financeiro e prestacao de contas |
| `pnae_audit_logs` | `pnae_audit_logs` | AuditLog | 595 | 606208 | `id` | 5 | 0/0 | C | auditoria e importacao |
| `pnae_campos_template` | `pnae_campos_template` | CampoTemplate | 285 | 147456 | `id` | 2 | 1/0 | A | documentos |
| `pnae_chamadas_publicas` | `pnae_chamadas_publicas` | ChamadaPublica | 57 | 1687552 | `id` | 7 | 4/9 | A | editais e selecao |
| `pnae_chamadas_publicas_documentos` | `pnae_chamadas_publicas_documentos` | ChamadaPublicaDocumento | 54 | 65536 | `id` | 2 | 1/0 | A | editais e selecao |
| `pnae_chamadas_publicas_escolas` | `pnae_chamadas_publicas_escolas` | ChamadaPublicaEscola | 0 | 49152 | `id` | 3 | 2/0 | B | editais e selecao |
| `pnae_checklists_implantacao` | `pnae_checklists_implantacao` | ChecklistImplantacao | 4 | 98304 | `id` | 6 | 4/1 | A | configuracao e operacao |
| `pnae_classificacoes_projetos` | `pnae_classificacoes_projetos` | ClassificacaoProjeto | 5 | 49152 | `id` | 3 | 2/0 | A | editais e selecao |
| `pnae_conferencias_fiscais` | `pnae_conferencias_fiscais` | ConferenciaFiscal | 1 | 81920 | `id` | 5 | 1/0 | A | referencia e integracao |
| `pnae_configuracoes_institucionais` | `pnae_configuracoes_institucionais` | ConfiguracaoInstitucional | 5 | 98304 | `id` | 6 | 4/1 | A | configuracao e operacao |
| `pnae_configuracoes_institucionais_historico` | `pnae_configuracoes_institucionais_historico` | ConfiguracaoInstitucionalHistorico | 5 | 65536 | `id` | 4 | 2/0 | C | configuracao e operacao |
| `pnae_contratos` | `pnae_contratos` | Contrato | 4 | 163840 | `id` | 10 | 6/10 | A | contratos e entrega |
| `pnae_contrato_aditivos` | `pnae_contrato_aditivos` | AditivoContrato | 0 | 65536 | `id` | 4 | 1/3 | B | contratos e entrega |
| `pnae_contrato_aditivo_itens` | `pnae_contrato_aditivo_itens` | AditivoItem | 0 | 49152 | `id` | 3 | 2/0 | B | contratos e entrega |
| `pnae_contrato_documentos` | `pnae_contrato_documentos` | ContratoDocumento | 0 | 49152 | `id` | 3 | 2/0 | B | contratos e entrega |
| `pnae_contrato_itens` | `pnae_contrato_itens` | ContratoItem | 5 | 65536 | `id` | 4 | 3/4 | A | contratos e entrega |
| `pnae_contrato_signatarios` | `pnae_contrato_signatarios` | ContratoSignatario | 0 | 49152 | `id` | 3 | 2/0 | B | contratos e entrega |
| `pnae_divergencias_fiscais` | `pnae_divergencias_fiscais` | DivergenciaFiscal | 0 | 98304 | `id` | 6 | 2/0 | B | referencia e integracao |
| `pnae_editais` | `pnae_editais` | Edital | 54 | 1622016 | `id` | 3 | 2/8 | A | referencia e integracao |
| `pnae_edital_anexos` | `pnae_edital_anexos` | EditalAnexo | 0 | 65536 | `id` | 4 | 3/0 | B | editais e selecao |
| `pnae_edital_documentos` | `pnae_edital_documentos` | EditalDocumento | 0 | 65536 | `id` | 4 | 1/4 | B | editais e selecao |
| `pnae_edital_escolas` | `pnae_edital_escolas` | EditalEscola | 0 | 49152 | `id` | 3 | 2/0 | B | editais e selecao |
| `pnae_edital_itens` | `pnae_edital_itens` | EditalItem | 2823 | 5308416 | `id` | 3 | 2/5 | A | editais e selecao |
| `pnae_edital_variaveis` | `pnae_edital_variaveis` | EditalVariavel | 0 | 32768 | `id` | 2 | 1/0 | B | editais e selecao |
| `pnae_edital_versoes` | `pnae_edital_versoes` | EditalVersao | 0 | 32768 | `id` | 2 | 1/1 | C | editais e selecao |
| `pnae_entregas` | `pnae_entregas` | Entrega | 1 | 147456 | `id` | 9 | 5/5 | A | contratos e entrega |
| `pnae_entrega_documentos` | `pnae_entrega_documentos` | EntregaDocumento | 0 | 32768 | `id` | 2 | 1/0 | B | contratos e entrega |
| `pnae_entrega_estornos` | `pnae_entrega_estornos` | EntregaEstorno | 0 | 32768 | `id` | 2 | 1/0 | B | contratos e entrega |
| `pnae_entrega_itens` | `pnae_entrega_itens` | EntregaItem | 2 | 49152 | `id` | 3 | 2/2 | A | contratos e entrega |
| `pnae_habilitacao_documentos` | `pnae_habilitacao_documentos` | HabilitacaoDocumento | 0 | 49152 | `id` | 3 | 2/0 | B | editais e selecao |
| `pnae_historico_geracao_documento` | `pnae_historico_geracao_documento` | HistoricoGeracaoDocumento | 0 | 65536 | `id` | 4 | 2/0 | C | documentos |
| `pnae_homologacoes_chamadas` | `pnae_homologacoes_chamadas` | HomologacaoChamada | 6 | 32768 | `id` | 2 | 1/0 | A | editais e selecao |
| `pnae_idempotencia_operacoes` | `pnae_idempotencia_operacoes` | IdempotenciaOperacao | 51 | 32768 | `chave` | 2 | 0/0 | C | auditoria e importacao |
| `pnae_importacao_campos` | `pnae_importacao_campos` | ImportacaoCampo | 0 | 32768 | `id` | 2 | 1/0 | B | auditoria e importacao |
| `pnae_importacao_estruturas` | `pnae_importacao_estruturas` | ImportacaoEstrutura | 0 | 32768 | `id` | 2 | 1/1 | B | auditoria e importacao |
| `pnae_import_logs` | `pnae_import_logs` | ImportLog | 55 | 65536 | `id` | 2 | 1/1 | C | auditoria e importacao |
| `pnae_inscricoes_chamadas` | `pnae_inscricoes_chamadas` | InscricaoChamada | 6 | 49152 | `id` | 3 | 2/0 | A | editais e selecao |
| `pnae_itens_checklist_implantacao` | `pnae_itens_checklist_implantacao` | ItemChecklistImplantacao | 36 | 65536 | `id` | 4 | 2/0 | A | configuracao e operacao |
| `pnae_liquidacoes` | `pnae_liquidacoes` | Liquidacao | 1 | 98304 | `id` | 6 | 2/1 | A | financeiro e prestacao de contas |
| `pnae_matches` | `pnae_matches` | Match | 0 | 114688 | `id` | 7 | 6/1 | B | editais e selecao |
| `pnae_notas_fiscais` | `pnae_notas_fiscais` | NotaFiscal | 1 | 147456 | `id` | 9 | 4/8 | A | referencia e integracao |
| `pnae_nota_fiscal_documentos` | `pnae_nota_fiscal_documentos` | NotaFiscalDocumento | 0 | 49152 | `id` | 3 | 1/2 | B | financeiro e prestacao de contas |
| `pnae_nota_fiscal_itens` | `pnae_nota_fiscal_itens` | NotaFiscalItem | 2 | 49152 | `id` | 3 | 2/2 | A | financeiro e prestacao de contas |
| `pnae_notificacoes_internas` | `pnae_notificacoes_internas` | NotificacaoInterna | 4 | 65536 | `id` | 4 | 1/0 | A | referencia e integracao |
| `pnae_ocorrencias_entrega` | `pnae_ocorrencias_entrega` | OcorrenciaEntrega | 0 | 81920 | `id` | 5 | 2/0 | B | contratos e entrega |
| `pnae_pagamentos` | `pnae_pagamentos` | Pagamento | 2 | 114688 | `id` | 7 | 3/0 | A | financeiro e prestacao de contas |
| `pnae_parametros_operacionais` | `pnae_parametros_operacionais` | ParametroOperacional | 5 | 65536 | `id` | 4 | 1/1 | A | configuracao e operacao |
| `pnae_parametros_operacionais_versoes` | `pnae_parametros_operacionais_versoes` | ParametroOperacionalVersao | 9 | 65536 | `id` | 4 | 2/0 | C | configuracao e operacao |
| `pnae_prestacoes_contas` | `pnae_prestacoes_contas` | PrestacaoContas | 6 | 81920 | `id` | 5 | 2/1 | A | referencia e integracao |
| `pnae_prestacoes_contas_documentos` | `pnae_prestacoes_contas_documentos` | PrestacaoContasDocumento | 0 | 49152 | `id` | 3 | 1/0 | B | documentos |
| `pnae_produtos_referencia` | `pnae_produtos_referencia` | ProdutoReferencia | 61 | 16384 | `id` | 1 | 0/5 | A | referencia e integracao |
| `pnae_programacao_entrega_itens` | `pnae_programacao_entrega_itens` | ProgramacaoEntregaItem | 2 | 49152 | `id` | 3 | 2/1 | A | contratos e entrega |
| `pnae_programacoes_entrega` | `pnae_programacoes_entrega` | ProgramacaoEntrega | 1 | 147456 | `id` | 9 | 5/2 | A | contratos e entrega |
| `pnae_propostas` | `pnae_propostas` | Proposta | 7 | 81920 | `id` | 5 | 3/6 | A | editais e selecao |
| `pnae_proposta_itens` | `pnae_proposta_itens` | PropostaItem | 8 | 49152 | `id` | 3 | 2/1 | A | editais e selecao |
| `pnae_recursos_chamadas` | `pnae_recursos_chamadas` | RecursoChamada | 6 | 65536 | `id` | 4 | 3/0 | A | editais e selecao |
| `pnae_requisitos_habilitacao` | `pnae_requisitos_habilitacao` | RequisitoHabilitacao | 0 | 32768 | `id` | 2 | 1/1 | B | editais e selecao |
| `pnae_resultados_chamadas` | `pnae_resultados_chamadas` | ResultadoChamada | 6 | 49152 | `id` | 3 | 1/0 | A | editais e selecao |
| `pnae_system_config` | `pnae_configuracoes_sistema` | sem model | 0 | 32768 | `id` | 2 | 0/0 | D | configuracao e operacao |
| `pnae_templates_documento` | `pnae_templates_documento` | TemplateDocumento | 15 | 212992 | `id` | 3 | 0/3 | A | documentos |
| `pnae_template_versoes` | `pnae_template_versoes` | TemplateVersao | 31 | 196608 | `id` | 2 | 1/1 | C | documentos |
| `pnae_vinculo_recebimento_fiscal` | `pnae_vinculo_recebimento_fiscal` | VinculoRecebimentoFiscal | 2 | 114688 | `id` | 7 | 6/0 | A | financeiro e prestacao de contas |
| `produtores` | `produtores` | Produtor | 5 | 49152 | `id` | 3 | 1/19 | A | referencia e integracao |
| `produtor_produtos` | `produtor_produtos` | ProdutorProduto | 15 | 65536 | `id` | 4 | 3/5 | A | referencia e integracao |
| `representacoes_fornecedor` | `representacoes_fornecedor` | RepresentacaoFornecedor | 0 | 65536 | `id` | 4 | 2/0 | B | acesso e identidade |
| `sdd010_assistencia_tecnica` | `pnae_assistencias_tecnicas` | sem model | 0 | 49152 | `id` | 3 | 2/0 | D | produtores e oferta |
| `sdd010_disponibilidades_producao` | `pnae_disponibilidades_producao` | sem model | 0 | 65536 | `id` | 4 | 3/0 | D | produtores e oferta |
| `sdd010_informacoes_nutricionais` | `pnae_informacoes_nutricionais` | sem model | 0 | 32768 | `id` | 2 | 1/0 | D | produtores e oferta |
| `sdd010_logistica_produtor` | `pnae_logistica_produtores` | sem model | 0 | 32768 | `id` | 2 | 1/0 | D | produtores e oferta |
| `sdd010_mapeamentos_produto_edital` | `pnae_mapeamentos_produto_edital` | sem model | 0 | 81920 | `id` | 5 | 4/0 | D | produtores e oferta |
| `sdd010_safras_producao` | `pnae_safras_producao` | sem model | 0 | 65536 | `id` | 4 | 3/2 | D | produtores e oferta |
| `sdd010_sazonalidade_producao` | `pnae_sazonalidade_producao` | sem model | 0 | 114688 | `id` | 7 | 4/0 | D | produtores e oferta |
| `sdd010_solicitacoes_catalogo` | `pnae_solicitacoes_catalogo` | sem model | 0 | 49152 | `id` | 3 | 1/0 | D | produtores e oferta |
| `sdd010_unidades_produtivas` | `pnae_unidades_produtivas` | sem model | 0 | 49152 | `id` | 3 | 2/3 | D | produtores e oferta |
| `sdd011_interesses_oportunidade` | `pnae_interesses_oportunidades` | sem model | 0 | 81920 | `id` | 5 | 3/0 | D | produtores e oferta |
| `users` | `users` | User | 9 | 65536 | `id` | 4 | 2/11 | A | acesso e identidade |
| `vinculos_usuario` | `vinculos_usuario` | VinculoUsuario | 8 | 114688 | `id` | 7 | 5/0 | A | acesso e identidade |
| `vinculo_escola_dre` | `vinculo_escola_dre` | VinculoEscolaDRE | 497 | 344064 | `id` | 4 | 2/0 | A | cadastro territorial |
| `_prisma_migrations` | `_prisma_migrations` | Prisma (interno) | 33 | 16384 | `id` | 1 | 0/0 | C | auditoria e importacao |

## Notas de leitura

- A coluna Bytes e a soma de DATA_LENGTH e INDEX_LENGTH informadas pelo InnoDB e pode variar com estatisticas e fragmentacao.
- Todas as tabelas possuem chave primaria; a maioria usa `id`, `pnae_idempotencia_operacoes` usa `chave` e `_prisma_migrations` usa `id`.
- O inventario separa tabelas fisicas de models Prisma; `_prisma_migrations` e infraestrutura do Prisma e nao tem model de aplicacao.
- Nenhuma tabela foi considerada obsoleta apenas por estar vazia.