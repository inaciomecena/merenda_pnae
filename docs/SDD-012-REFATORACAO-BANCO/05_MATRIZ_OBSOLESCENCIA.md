# Matriz de obsolescencia

Apenas classificacao F pode ser excluida, apos prova e autorizacao especifica. Nesta auditoria nao foi confirmada nenhuma tabela F ou E. Estruturas vazias permanecem preservadas; tabelas com FKs ou model Prisma nao sao candidatas a exclusao por ausencia de linhas.

| Tabela atual | Registros | Classe | Dependencias FK | Evidencia de uso | Recomendacao |
|---|---:|:---:|---:|---|---|
| `dres` | 13 | A | 10 | model=DRE; uso direto=10; referencias FK=1/9 | Preservar; sem exclusao autorizada |
| `entidades_executoras` | 1 | A | 3 | model=EntidadeExecutora; uso direto=15; referencias FK=1/2 | Preservar; sem exclusao autorizada |
| `escolas` | 3182 | A | 14 | model=Escola; uso direto=143; referencias FK=1/13 | Preservar; sem exclusao autorizada |
| `municipios` | 142 | A | 13 | model=Municipio; uso direto=145; referencias FK=0/13 | Preservar; sem exclusao autorizada |
| `pnae_analises_habilitacao` | 6 | A | 1 | model=AnaliseHabilitacao; uso direto=1; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_atestos` | 1 | A | 4 | model=Atesto; uso direto=44; referencias FK=3/1 | Preservar; sem exclusao autorizada |
| `pnae_audit_logs` | 595 | C | 0 | model=AuditLog; uso direto=11; referencias FK=0/0 | Preservar; sem exclusao autorizada |
| `pnae_campos_template` | 285 | A | 1 | model=CampoTemplate; uso direto=3; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_chamadas_publicas` | 57 | A | 13 | model=ChamadaPublica; uso direto=10; referencias FK=4/9 | Preservar; sem exclusao autorizada |
| `pnae_chamadas_publicas_documentos` | 54 | A | 1 | model=ChamadaPublicaDocumento; uso direto=2; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_chamadas_publicas_escolas` | 0 | B | 2 | model=ChamadaPublicaEscola; uso direto=0; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_checklists_implantacao` | 4 | A | 5 | model=ChecklistImplantacao; uso direto=1; referencias FK=4/1 | Preservar; sem exclusao autorizada |
| `pnae_classificacoes_projetos` | 5 | A | 2 | model=ClassificacaoProjeto; uso direto=1; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_conferencias_fiscais` | 1 | A | 1 | model=ConferenciaFiscal; uso direto=3; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_configuracoes_institucionais` | 5 | A | 5 | model=ConfiguracaoInstitucional; uso direto=1; referencias FK=4/1 | Preservar; sem exclusao autorizada |
| `pnae_configuracoes_institucionais_historico` | 5 | C | 2 | model=ConfiguracaoInstitucionalHistorico; uso direto=1; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_contratos` | 4 | A | 16 | model=Contrato; uso direto=107; referencias FK=6/10 | Preservar; sem exclusao autorizada |
| `pnae_contrato_aditivos` | 0 | B | 4 | model=AditivoContrato; uso direto=1; referencias FK=1/3 | Preservar; sem exclusao autorizada |
| `pnae_contrato_aditivo_itens` | 0 | B | 2 | model=AditivoItem; uso direto=1; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_contrato_documentos` | 0 | B | 2 | model=ContratoDocumento; uso direto=2; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_contrato_itens` | 5 | A | 7 | model=ContratoItem; uso direto=31; referencias FK=3/4 | Preservar; sem exclusao autorizada |
| `pnae_contrato_signatarios` | 0 | B | 2 | model=ContratoSignatario; uso direto=1; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_divergencias_fiscais` | 0 | B | 2 | model=DivergenciaFiscal; uso direto=14; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_editais` | 54 | A | 10 | model=Edital; uso direto=117; referencias FK=2/8 | Preservar; sem exclusao autorizada |
| `pnae_edital_anexos` | 0 | B | 3 | model=EditalAnexo; uso direto=6; referencias FK=3/0 | Preservar; sem exclusao autorizada |
| `pnae_edital_documentos` | 0 | B | 5 | model=EditalDocumento; uso direto=5; referencias FK=1/4 | Preservar; sem exclusao autorizada |
| `pnae_edital_escolas` | 0 | B | 2 | model=EditalEscola; uso direto=4; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_edital_itens` | 2823 | A | 7 | model=EditalItem; uso direto=31; referencias FK=2/5 | Preservar; sem exclusao autorizada |
| `pnae_edital_variaveis` | 0 | B | 1 | model=EditalVariavel; uso direto=4; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_edital_versoes` | 0 | C | 2 | model=EditalVersao; uso direto=4; referencias FK=1/1 | Preservar; sem exclusao autorizada |
| `pnae_entregas` | 1 | A | 10 | model=Entrega; uso direto=69; referencias FK=5/5 | Preservar; sem exclusao autorizada |
| `pnae_entrega_documentos` | 0 | B | 1 | model=EntregaDocumento; uso direto=1; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_entrega_estornos` | 0 | B | 1 | model=EntregaEstorno; uso direto=2; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_entrega_itens` | 2 | A | 4 | model=EntregaItem; uso direto=23; referencias FK=2/2 | Preservar; sem exclusao autorizada |
| `pnae_habilitacao_documentos` | 0 | B | 2 | model=HabilitacaoDocumento; uso direto=0; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_historico_geracao_documento` | 0 | C | 2 | model=HistoricoGeracaoDocumento; uso direto=3; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_homologacoes_chamadas` | 6 | A | 1 | model=HomologacaoChamada; uso direto=1; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_idempotencia_operacoes` | 51 | C | 0 | model=IdempotenciaOperacao; uso direto=5; referencias FK=0/0 | Preservar; sem exclusao autorizada |
| `pnae_importacao_campos` | 0 | B | 1 | model=ImportacaoCampo; uso direto=2; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_importacao_estruturas` | 0 | B | 2 | model=ImportacaoEstrutura; uso direto=2; referencias FK=1/1 | Preservar; sem exclusao autorizada |
| `pnae_import_logs` | 55 | C | 2 | model=ImportLog; uso direto=10; referencias FK=1/1 | Preservar; sem exclusao autorizada |
| `pnae_inscricoes_chamadas` | 6 | A | 2 | model=InscricaoChamada; uso direto=1; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_itens_checklist_implantacao` | 36 | A | 2 | model=ItemChecklistImplantacao; uso direto=1; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_liquidacoes` | 1 | A | 3 | model=Liquidacao; uso direto=24; referencias FK=2/1 | Preservar; sem exclusao autorizada |
| `pnae_matches` | 0 | B | 7 | model=Match; uso direto=44; referencias FK=6/1 | Preservar; sem exclusao autorizada |
| `pnae_notas_fiscais` | 1 | A | 12 | model=NotaFiscal; uso direto=42; referencias FK=4/8 | Preservar; sem exclusao autorizada |
| `pnae_nota_fiscal_documentos` | 0 | B | 3 | model=NotaFiscalDocumento; uso direto=2; referencias FK=1/2 | Preservar; sem exclusao autorizada |
| `pnae_nota_fiscal_itens` | 2 | A | 4 | model=NotaFiscalItem; uso direto=15; referencias FK=2/2 | Preservar; sem exclusao autorizada |
| `pnae_notificacoes_internas` | 4 | A | 1 | model=NotificacaoInterna; uso direto=3; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_ocorrencias_entrega` | 0 | B | 2 | model=OcorrenciaEntrega; uso direto=3; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_pagamentos` | 2 | A | 3 | model=Pagamento; uso direto=37; referencias FK=3/0 | Preservar; sem exclusao autorizada |
| `pnae_parametros_operacionais` | 5 | A | 2 | model=ParametroOperacional; uso direto=1; referencias FK=1/1 | Preservar; sem exclusao autorizada |
| `pnae_parametros_operacionais_versoes` | 9 | C | 2 | model=ParametroOperacionalVersao; uso direto=1; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `pnae_prestacoes_contas` | 6 | A | 3 | model=PrestacaoContas; uso direto=2; referencias FK=2/1 | Preservar; sem exclusao autorizada |
| `pnae_prestacoes_contas_documentos` | 0 | B | 1 | model=PrestacaoContasDocumento; uso direto=0; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_produtos_referencia` | 61 | A | 5 | model=ProdutoReferencia; uso direto=15; referencias FK=0/5 | Preservar; sem exclusao autorizada |
| `pnae_programacao_entrega_itens` | 2 | A | 3 | model=ProgramacaoEntregaItem; uso direto=7; referencias FK=2/1 | Preservar; sem exclusao autorizada |
| `pnae_programacoes_entrega` | 1 | A | 7 | model=ProgramacaoEntrega; uso direto=8; referencias FK=5/2 | Preservar; sem exclusao autorizada |
| `pnae_propostas` | 7 | A | 9 | model=Proposta; uso direto=60; referencias FK=3/6 | Preservar; sem exclusao autorizada |
| `pnae_proposta_itens` | 8 | A | 3 | model=PropostaItem; uso direto=10; referencias FK=2/1 | Preservar; sem exclusao autorizada |
| `pnae_recursos_chamadas` | 6 | A | 3 | model=RecursoChamada; uso direto=1; referencias FK=3/0 | Preservar; sem exclusao autorizada |
| `pnae_requisitos_habilitacao` | 0 | B | 2 | model=RequisitoHabilitacao; uso direto=0; referencias FK=1/1 | Preservar; sem exclusao autorizada |
| `pnae_resultados_chamadas` | 6 | A | 1 | model=ResultadoChamada; uso direto=1; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `pnae_system_config` | 0 | D | 0 | model=sem model; uso direto=0; referencias FK=0/0 | Preservar; sem exclusao autorizada |
| `pnae_templates_documento` | 15 | A | 3 | model=TemplateDocumento; uso direto=8; referencias FK=0/3 | Preservar; sem exclusao autorizada |
| `pnae_template_versoes` | 31 | C | 2 | model=TemplateVersao; uso direto=10; referencias FK=1/1 | Preservar; sem exclusao autorizada |
| `pnae_vinculo_recebimento_fiscal` | 2 | A | 6 | model=VinculoRecebimentoFiscal; uso direto=3; referencias FK=6/0 | Preservar; sem exclusao autorizada |
| `produtores` | 5 | A | 20 | model=Produtor; uso direto=127; referencias FK=1/19 | Preservar; sem exclusao autorizada |
| `produtor_produtos` | 15 | A | 8 | model=ProdutorProduto; uso direto=10; referencias FK=3/5 | Preservar; sem exclusao autorizada |
| `representacoes_fornecedor` | 0 | B | 2 | model=RepresentacaoFornecedor; uso direto=4; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `sdd010_assistencia_tecnica` | 0 | D | 2 | model=sem model; uso direto=0; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `sdd010_disponibilidades_producao` | 0 | D | 3 | model=sem model; uso direto=0; referencias FK=3/0 | Preservar; sem exclusao autorizada |
| `sdd010_informacoes_nutricionais` | 0 | D | 1 | model=sem model; uso direto=0; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `sdd010_logistica_produtor` | 0 | D | 1 | model=sem model; uso direto=0; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `sdd010_mapeamentos_produto_edital` | 0 | D | 4 | model=sem model; uso direto=0; referencias FK=4/0 | Preservar; sem exclusao autorizada |
| `sdd010_safras_producao` | 0 | D | 5 | model=sem model; uso direto=0; referencias FK=3/2 | Preservar; sem exclusao autorizada |
| `sdd010_sazonalidade_producao` | 0 | D | 4 | model=sem model; uso direto=0; referencias FK=4/0 | Preservar; sem exclusao autorizada |
| `sdd010_solicitacoes_catalogo` | 0 | D | 1 | model=sem model; uso direto=0; referencias FK=1/0 | Preservar; sem exclusao autorizada |
| `sdd010_unidades_produtivas` | 0 | D | 5 | model=sem model; uso direto=0; referencias FK=2/3 | Preservar; sem exclusao autorizada |
| `sdd011_interesses_oportunidade` | 0 | D | 3 | model=sem model; uso direto=0; referencias FK=3/0 | Preservar; sem exclusao autorizada |
| `users` | 9 | A | 13 | model=User; uso direto=148; referencias FK=2/11 | Preservar; sem exclusao autorizada |
| `vinculos_usuario` | 8 | A | 5 | model=VinculoUsuario; uso direto=14; referencias FK=5/0 | Preservar; sem exclusao autorizada |
| `vinculo_escola_dre` | 497 | A | 2 | model=VinculoEscolaDRE; uso direto=6; referencias FK=2/0 | Preservar; sem exclusao autorizada |
| `_prisma_migrations` | 33 | C | 0 | model=Prisma (interno); uso direto=0; referencias FK=0/0 | Preservar; sem exclusao autorizada |

**Conclusao:** zero tabelas com recomendacao de exclusao. `pnae_system_config` esta vazia, mas possui model e indices; classificacao conservadora G/D conforme inventario, sem prova de obsolescencia. As dez tabelas SDD de oferta/oportunidade estao vazias, porem relacionadas por FKs e models Prisma; normalizar nomes nao as torna obsoletas.