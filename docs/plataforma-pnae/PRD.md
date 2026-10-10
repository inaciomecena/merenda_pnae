# PRD — Plataforma Merenda PNAE

Versão 1.0 • 10/10/2026 • Status: proposta funcional especificada, implementação pendente.

## Problema e resultado esperado
Escolas e DREs precisam publicar demandas compreensíveis para agricultores e acompanhar os fornecimentos contratados. Informações dispersas entre PDFs, cadastros e controles manuais dificultam encontrar oportunidades, preparar projetos de venda e verificar saldos.

A plataforma deve permitir que uma informação cadastrada alimente documentos e operações posteriores, preservando os registros de cada etapa. Cada alimento aceito deve ser rastreável ao contrato e à ordem; cada pagamento deve ser rastreável ao documento financeiro e à execução correspondente.

## Usuários
| Perfil | Responsabilidade |
|---|---|
| Administração | Organizar unidades, vínculos e permissões; supervisionar o sistema |
| DRE | Consolidar demandas e acompanhar processos e execução de sua regional |
| Escola/UEx | Planejar demanda, solicitar fornecimento e conferir recebimentos |
| Produtor | Manter oferta, apresentar projetos e acompanhar fornecimento e recebíveis |
| Representante de organização | Atuar por associação, cooperativa, grupo ou empreendimento autorizado |
| Extensionista | Auxiliar produtores com delegação explícita e rastreável |
| Comissão | Analisar habilitação e registrar seleção, decisões e resultados |
| Fiscal/gestor contratual | Acompanhar contrato, atestar recebimentos e tratar ocorrências |
| Financeiro | Conferir faturamento e registrar pagamentos conforme competência |
| Controle/consulta | Consultar evidências e relatórios conforme autorização |

Função institucional não equivale a permissão irrestrita. Uma pessoa pode exercer várias funções, desde que seus vínculos e competências sejam registrados.

## Jornada principal
1. Escola informa necessidade com produto, quantidade, período e entrega.
2. DRE ou unidade competente revisa e consolida; nutricionista participa das especificações aplicáveis.
3. Responsável prepara edital, pesquisa de preços e documentos; publicação cria versão preservada.
4. Produtor pesquisa itens e apresenta projeto com documentação e protocolo.
5. Comissão registra habilitação, seleção por alimento e resultado, incluindo tratamentos previstos no processo.
6. Resultado fundamenta contrato com preços e quantidades definidos.
7. Escola/DRE emite ordem de fornecimento, reservando saldo.
8. Produtor confirma programação e informa entrega.
9. Escola/fiscal confere quantidade aceita, recusada e pendente.
10. Financeiro vincula documento fiscal à execução e registra pagamento e comprovante.
11. Gestor acompanha saldos, ocorrências, vigência e encerramento.

## Requisitos funcionais
| ID | Requisito | SDD |
|---|---|---|
| RF-01 | Conciliar dump, schema e migrações sem perda de dados | 001 |
| RF-02 | Isolar acessos por DRE, escola, fornecedor e representação | 002 |
| RF-03 | Registrar demanda e oferta com unidade, período e capacidade estruturados | 003 |
| RF-04 | Criar, importar, revisar, gerar e publicar editais com versões | 004 |
| RF-05 | Consultar oportunidades públicas por produto, localidade e prazo | 005 |
| RF-06 | Preparar e apresentar projeto de venda com protocolo e documentos | 006 |
| RF-07 | Registrar habilitação, seleção, resultado e tratamentos processuais | 007 |
| RF-08 | Gerir contrato, distribuição por escola, vigência e instrumentos de alteração | 008 |
| RF-09 | Emitir ordens diretas ao fornecedor contratado com reserva de saldo | 009 |
| RF-10 | Registrar entregas parciais, conferência, recusas e reposições | 010 |
| RF-11 | Vincular faturamento, conferir diferenças e registrar pagamentos/estornos | 011 |
| RF-12 | Exibir execução física, financeira e pagamentos separadamente | 012 |
| RF-13 | Registrar auditoria e preservar documentos críticos em todos os fluxos | Todos |
| RF-14 | Notificar eventos e permitir operação assistida ao produtor | 002/005/009/012 |

## Regras essenciais do produto
- Consulta de disponibilidade antes da contratação não constitui seleção nem ordem de fornecimento.
- Interesse comercial, projeto apresentado, projeto habilitado e fornecedor contratado são situações diferentes.
- Compatibilidade de produto identifica oportunidades; seu score não decide a classificação da chamada.
- As permissões de publicação, contratação, recebimento e pagamento dependem da organização adotada pela instituição.
- Ordens liberadas reservam quantidades; pedidos concorrentes não podem comprometer o mesmo saldo.
- Entrega informada pelo produtor não aumenta execução aceita antes da conferência autorizada.
- Recebimento aceito não significa pagamento realizado.
- Dados de proposta, preço publicado e contrato mantêm vínculo e cópias preservadas da versão de origem.
- Valores monetários usam Decimal e regras explícitas de arredondamento; quantidades admitem frações adequadas à unidade.
- Correções de recebimentos e pagamentos confirmados são eventos de ajuste/estorno, com justificativa e referência ao original.
- Aditivos não reescrevem retroativamente ordens e recebimentos existentes.
- Documentos pessoais ficam restritos; a publicação utiliza somente campos autorizados.
- Limites legais são parametrizados com fundamento, vigência e dimensão de controle. Não presumir limite único por escola ou global para todo o país.

## Painéis
| Painel | Visão inicial e ações principais |
|---|---|
| DRE | Escolas, demandas, chamadas, contratos, pendências e execução consolidada |
| Escola | Demandas, contratos vinculados, solicitação de entrega e conferência |
| Produtor | Oportunidades, projetos, contratos, ordens e valores a receber |
| Comissão | Projetos, documentos, diligências e decisões |
| Financeiro | Faturas, divergências, obrigações e pagamentos |

A experiência deve priorizar as tarefas de cada perfil, com navegação simples no celular. Importação, templates e configuração ficam acessíveis aos responsáveis, sem dominar a jornada do produtor.

## Indicadores
- Execução física por item = quantidade aceita líquida / quantidade vigente do item.
- Execução financeira = valor aceito líquido / valor vigente contratual.
- Percentual pago = pagamento líquido / valor vigente contratual.
- Saldo a executar = valor vigente menos valor aceito líquido.
- Obrigações aprovadas ainda não pagas e execução aceita ainda não faturada são indicadores distintos.
- Atraso usa data prevista da ordem e quantidade ainda devida, considerando cancelamentos e alterações aprovadas.
- Não somar kg, litros e unidades para formar percentual físico geral.
- Indicador da aplicação de recursos do PNAE depende de fonte financeira e base completa de repasses/despesas; não pode ser inferido apenas dos contratos cadastrados.

## Requisitos não funcionais
- RNF-01: autorização no backend em toda consulta e alteração, inclusive downloads e relatórios.
- RNF-02: transações e controle de concorrência para reservas, recebimentos e pagamentos.
- RNF-03: repetição da mesma operação não duplica efeitos; chaves de idempotência em comandos críticos.
- RNF-04: auditoria com ator, vínculo representado, ação, data, motivo e identificador de correlação.
- RNF-05: documentos com acesso controlado, versão e hash; upload com validação de tipo/tamanho.
- RNF-06: interface responsiva, navegação por teclado, rótulos e estados de erro acessíveis.
- RNF-07: paginação e índices; meta inicial de listagens p95 até 2 segundos, a medir em ambiente e volume acordados.
- RNF-08: backup de banco e arquivos e teste de restauração; RPO/RTO a definir antes de produção.
- RNF-09: timestamps em UTC e apresentação em America/Cuiaba; prazos com timezone explícito e relógio do servidor.
- RNF-10: integrações externas indisponíveis geram pendência, sem validar silenciosamente dados.

## Escopo e implantação
Entrega A: compatibilidade, vínculos e painel por perfil. Entrega B: demanda, publicação, oportunidades e projetos. Entrega C: seleção, contratos e ordens. Entrega D: recebimentos, financeiro e dashboards.

Fora da primeira versão: executar transferências bancárias, substituir sistemas oficiais de prestação de contas, blockchain, roteirização avançada e aprovação autônoma por IA. Registrar pagamentos não é movimentar dinheiro.

## Aceite integrado
Em contrato fictício de 1.000 kg a R$ 5/kg: emitir ordem de 200 kg; aceitar 180 kg; tratar os 20 kg restantes; faturar R$ 900; pagar R$ 500. Resultado: execução aceita R$ 900, pago R$ 500, obrigação aprovada pendente R$ 400 e saldo contratual a executar R$ 4.100. A reserva restante depende do tratamento explícito dos 20 kg. Testar isoladamente saldo por escola e saldo global do item.

## Sucesso e riscos
Medir tempo para preparar edital/projeto, proporção de itens com propostas válidas, entregas pontuais e divergências financeiras. Metas quantitativas serão definidas após medir a operação inicial.

Principais riscos: dados históricos incompletos, diversidade dos modelos institucionais, documentação de produtores, conectividade e aplicação incorreta das regras. Mitigar com migração conciliada, configuração versionada, operação assistida e testes dos fluxos críticos.
