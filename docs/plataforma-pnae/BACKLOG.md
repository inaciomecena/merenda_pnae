# Backlog de implementação

O estado abaixo distingue implementação de validação. Cada entrega inclui banco, backend, interface e evidências pertinentes.

| Ordem | Épico | SDD | Prioridade | Dependência | Status |
|---|---|---|---|---|---|
| 1 | Conciliar dump e código; baseline de testes e restore | 001 | P0 | Nenhuma | ⚠️ Análise estática; restore isolado pendente |
| 2 | DREs, vínculos, produtor e políticas de acesso | 002 | P0 | 1 | ⚠️ Parcial: código e testes sem banco; fluxos e E2E pendentes |
| 3 | Demandas escolares e oferta por período | 003 | P1 | 2 | 📋 Pendente |
| 4 | Publicação estruturada, versões e retificações | 004 | P1 | 2/3 | 📋 Pendente |
| 5 | Portal público e painel de oportunidades | 005 | P1 | 4 | 📋 Pendente |
| 6 | Projeto de venda e protocolo/documentos | 006 | P1 | 2/4/5 | 📋 Pendente |
| 7 | Habilitação, seleção e resultado formal | 007 | P1 | 6 | 📋 Pendente |
| 8 | Contratos, distribuição e limites | 008 | P1 | 2/7 | 📋 Pendente |
| 9 | Solicitação direta com reserva de saldo | 009 | P1 | 8 | 📋 Pendente |
| 10 | Entregas, aceites, recusas e ajustes | 010 | P1 | 9 | 📋 Pendente |
| 11 | Faturamento, pagamento e estorno | 011 | P1 | 8/10 | 📋 Pendente |
| 12 | Evolução, alertas e dossiê | 012 | P1 | 2/8–11 | 📋 Pendente |

## Status SDD-002

**Implementado no código:** modelo EEx/DRE/vínculos, perfil PRODUTOR, representação com permissões e vigência, políticas de escopo para escola, edital, produtor, proposta, documento e dashboard; APIs e telas iniciais de organização e vínculos. Os testes unitários e a checagem de tipos passam. Nenhuma migração foi aplicada.

**Pendente:** validação de migrações e backfill em MySQL isolado; fluxos E2E por perfil; políticas completas de importação, balizamento, composição e relatórios (temporariamente ADMIN); telas administrativas de edição/revogação; auditoria transacional; validação dinâmica do SDD-001. Não classificar SDD-002 como concluído.

Ver `docs/plataforma-pnae/SDD-002-IMPLEMENTACAO.md` para detalhes completos.

## Pacotes de entrega
- A — Base confiável: 001/002; comprovar isolamento antes de disponibilizar painéis operacionais.
- B — Chamadas e participação: 003–007; produtor encontra oportunidade e prepara/apresenta projeto conforme modelo institucional aprovado.
- C — Execução física: 008–010; contrato permite solicitação e recebimento com saldo protegido.
- D — Execução financeira: 011/012; conciliação e indicadores demonstram os fatos físicos e financeiros.

Um piloto de execução de contratos já existentes pode antecipar 008–012 mediante importação histórica conciliada, sem simular etapas passadas. Isso exige definição D-06 e não elimina a evolução do ciclo de chamadas.

## Definition of Done
- Requisito e SDD relacionados à mudança.
- Migração validada em base isolada quando houver alteração persistente.
- Autorização e transições verificadas no backend.
- Testes proporcionais ao risco, incluindo concorrência nos saldos.
- Interface utilizável nos tamanhos definidos para o piloto.
- Evidências, limitações e pendências documentadas.
- Publicação/implantação institucional tratadas separadamente do desenvolvimento.

Não atribuir prazo em dias sem conhecer equipe, baseline de falhas, dados e responsabilidades operacionais.
