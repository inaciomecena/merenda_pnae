# SDD-009 — Solicitações diretas e ordens de fornecimento

Requisitos: RF-09, RF-13, RF-14. Dependência: SDD-008.

## Design
Escola/DRE autorizada seleciona contrato vigente e itens, quantidade, local, data e observações. Rascunho não reserva saldo. Emissão reserva atomicamente o saldo global e a alocação escolar aplicável. Produtor confirma programação ou comunica impossibilidade; alteração requer responsável competente.

Estados: RASCUNHO → EMITIDA → CONFIRMADA → PARCIALMENTE_ATENDIDA → ATENDIDA. Cancelamento libera apenas reserva ainda aberta; execução já aceita permanece registrada.

Consulta de disponibilidade fora de contrato é um recurso de planejamento separado; não utiliza a rota de emissão de ordem.

## API/interface
`GET/POST /ordens`, `POST /ordens/:id/emitir`, `/confirmar`, `/solicitar-alteracao`, `/cancelar`; painel escolar e caixa de solicitações do fornecedor. Comandos críticos exigem idempotência.

## Aceite
- CA-009-A: dois pedidos concorrentes acima do saldo não são ambos aprovados.
- CA-009-B: contrato vencido/suspenso ou escola não vinculada bloqueia emissão.
- CA-009-C: cancelamento parcial libera somente o saldo não executado.
- CA-009-D: confirmação repetida não duplica reservas ou notificações.
- CA-009-E: mudança de data tem histórico; produtor não altera preço/quantidade unilateralmente.

Teste de concorrência deve usar o banco real suportado, não somente mocks do Prisma.
