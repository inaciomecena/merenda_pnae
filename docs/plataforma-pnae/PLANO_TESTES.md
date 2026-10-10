# Plano de testes e aceite integrado

## Estratégia
Unidade para fórmulas e transições; integração com banco compatível para transações/concorrência; E2E para jornadas de cada perfil. Testar documentos e versões em geração/download. Registrar falhas legadas sem mascará-las com o sucesso das novas suítes.

## Matriz mínima
| Cenário | Resultado esperado | SDD |
|---|---|---|
| Dump restaurado e migrado | Estrutura e dados conciliados, sem perda | 001 |
| DRE A acessa ID da DRE B | Acesso negado, inclusive export/download | 002 |
| Escola em edital consolidado | Consulta somente o que seu vínculo permite | 002/004 |
| Representação expirada | Novo comando bloqueado | 002/006 |
| Demanda com kg e unidades | Não soma quantidades incompatíveis | 003 |
| Importação não revisada | Publicação bloqueada | 004 |
| Retificação | Documento anterior e efeitos preservados | 004 |
| Consulta pública | Sem dados pessoais/documentos restritos | 005 |
| Projeto apresentado duas vezes | Um efeito e protocolo estável | 006 |
| Seleção baseada em match | Score não define resultado formal | 007 |
| Contrato excede limite configurado | Bloqueio ou tratamento explicitamente previsto | 008 |
| Duas ordens disputam saldo | Apenas operações dentro do saldo são confirmadas | 009 |
| Entrega parcial/recusa | Execução apenas sobre quantidade aceita | 010 |
| Documento fiscal duplicado | Sem duplicação de obrigação | 011 |
| Dois pagamentos disputam obrigação | Total não ultrapassa saldo | 011 |
| Estorno parcial | Saldo recomposto e histórico preservado | 011/012 |
| Painel com filtros | Totais conciliam e respeitam vínculo | 012 |
| Falha de notificação | Operação persiste, envio pode ser repetido | 009/012 |

## Cenário de referência detalhado
Contrato de 1.000 kg a R$ 5/kg, valor R$ 5.000. Ordem de 200 kg reserva 200 e deixa 800 disponíveis. Aceite de 180 consome essa parcela: 180 aceitos, 20 reservados, 800 disponíveis. A execução vale R$ 900.

Se cancelar justificadamente a pendência de 20 kg, a reserva cai a zero e o disponível sobe a 820 kg. Se exigir reposição, a reserva continua 20 até atendimento/cancelamento.

Documento fiscal aprovado de R$ 900 gera obrigação. Pagamento de R$ 500 deixa R$ 400 pendentes. Execução física do item = 18%; execução financeira = 18%; percentual pago = 10%. Um estorno de R$ 100 reduz pagamento líquido a R$ 400, aumenta pendência para R$ 500 e percentual pago passa a 8%.

## Testes adversos
Requisições duplicadas e simultâneas; IDs de outro contrato/escola; valor fiscal diferente do aceite; soma de pagamentos acima da obrigação; nota cancelada; ajuste físico sobre execução já faturada; representante revogado; documento vencido; fechamento de prazo no timezone correto; mudança de preço por instrumento formal; denominador zero; arquivo indisponível.

## Liberação
Bloquear liberação do módulo quando autorização, saldo ou rastreabilidade falharem. Para produção, comprovar restore de banco e arquivos e fechar as decisões operacionais que habilitam os respectivos fluxos. Informar ambiente, comandos, volume e limitações das evidências; não declarar PASS sem execução.
