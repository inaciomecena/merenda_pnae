# SDD-010 — Entregas, aceites, recusas e reposições

Requisitos: RF-10, RF-13. Dependência: SDD-009.

## Design
Produtor informa expedição/entrega; escola/fiscal confere. Registrar quantidade fisicamente entregue, aceita e recusada, qualidade, data, responsável e justificativas. O que não foi entregue permanece pendente, sem ser classificado automaticamente como recusa.

Conferência confirmada transfere reserva para execução aceita na mesma transação e gera comprovante. Recusas podem demandar reposição; liberação/cancelamento da pendência exige decisão. Substituição de alimento segue fluxo próprio de aprovação e documentação, sem editar o item original silenciosamente.

Correções posteriores têm referência ao aceite original. Se já houver faturamento/pagamento, exigir tratamento coordenado no financeiro e impedir alteração que deixe obrigações sem base.

## API/interface
`POST /ordens/:id/entregas`, `POST /entregas/:id/conferir`, `POST /recebimentos/:id/ajustes`; tela de conferência e comprovante autorizado.

## Aceite
- CA-010-A: solicitação de 100, entrega de 90 e aceite de 85 resulta em 5 recusados e 15 ainda devidos, até tratamento explícito.
- CA-010-B: aceite cumulativo não excede ordem/contrato sem procedimento formal.
- CA-010-C: confirmação repetida não aumenta execução.
- CA-010-D: ajuste não apaga comprovante anterior e recalcula saldos conforme decisão.
- CA-010-E: unidades e casas decimais são consistentes; quantidades negativas não entram como entrega normal.
