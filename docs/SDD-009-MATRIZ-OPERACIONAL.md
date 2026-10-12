# SDD-009 - Matriz operacional

| Processo | Fonte real | Indicador/pêndencia | Ação |
|---|---|---|---|
| Edital | `Edital.status` | Rascunhos e publicados | Abrir edital |
| Chamada | `ChamadaPublica.status` | Publicadas/abertas | Acompanhar inscrições |
| Projeto | `Proposta.statusHabilitacao` | Habilitação pendente | Analisar documentação |
| Contrato | `Contrato.status` | Rascunhos | Formalizar |
| Entrega | `Entrega.status` | Registro/conferência | Confirmar recebimento |
| Prestação | `PrestacaoContas.status` | Rascunho/devolvida/análise | Corrigir ou analisar |
| Implantação | `ItemChecklistImplantacao.status` | Pendente/bloqueado | Registrar evidência |

Todos os indicadores do painel são consultas de contagem nas entidades existentes. O escopo é derivado do usuário e do `PolicyService`.
