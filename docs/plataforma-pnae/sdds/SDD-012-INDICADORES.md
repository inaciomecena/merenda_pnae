# SDD-012 — Painéis, auditoria e encerramento operacional

Requisitos: RF-12/13/14. Dependências: SDD-002/008/009/010/011.

## Design
Painéis próprios para DRE, escola e produtor usam o mesmo conjunto de operações autorizadas. Mostrar quantidades vigentes, aceites líquidos, reservas e disponível por item; valores vigentes, aceitos, faturados, aprovados e pagos separadamente.

Eliminar interpretação do número de matches como execução entregue. Evolução temporal usa datas do fato e explicita competência/corte. Valores em estados não confirmados não compõem pagamentos realizados.

Alertar sobre prazos, entregas vencidas, contratos próximos do fim, divergências e obrigações vencidas. Notificação falha não altera operação. Dossiê de encerramento inclui contrato, alterações, ordens, comprovantes, notas, pagamentos e ocorrências.

## API/interface
Evoluir dashboard com filtros e escopo aplicados no backend; `GET /contratos/:id/evolucao`, `GET /contratos/:id/dossie`, exportação autorizada e paginada. Distinguir dashboard financeiro de percentual de aplicação dos recursos PNAE.

## Aceite
- CA-012-A: totais do painel conciliam com registros por contrato e escola na mesma data de corte.
- CA-012-B: estorno e ajuste se refletem nos indicadores sem apagar fatos anteriores.
- CA-012-C: denominador zero retorna indicador não aplicável, sem NaN/Infinity.
- CA-012-D: itens em kg/litros/unidades não geram soma física sem significado.
- CA-012-E: DRE e produtor não exportam dados além do vínculo autorizado.
- CA-012-F: notificações têm tentativas/deduplicação e dossiê mantém histórico completo.
