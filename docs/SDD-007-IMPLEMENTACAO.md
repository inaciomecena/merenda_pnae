# SDD-007 - Implementacao

## Banco

- Backup anterior a migracao: `backups/sdd007-before-20261012-114329.sql`.
- SHA-256: `C16575104584C1843DF797C99D00EA454A445C265A97FFB7AEBFA7B0F13F67BA`.
- Migration: `20261012130000_sdd_007_chamadas_publicas`.
- `prisma migrate deploy`: 24 migracoes aplicadas, nenhuma pendente.
- Migration aditiva: novas tabelas, colunas, indices e FKs; sem `DROP`, `TRUNCATE` ou exclusao de dados.

## APIs principais

`/api/v1/chamadas-publicas` lista/cria/edita chamadas; `/transicoes/:status` controla o fluxo; `/:id/inscricoes` registra participantes; `/:id/projetos` cria projetos; `/projetos/:id/enviar` envia; `/projetos/:id/habilitacao` habilita/inabilita; `/:id/classificacoes` classifica; `/classificacoes/:id/selecao` aloca; `/:id/recursos` e `/recursos/:id/decisao` tratam recursos; `/:id/homologacao` homologa; `/projetos/:id/encaminhar-contrato` cria rascunho idempotente.

## Frontend

Painel `ChamadasPublicasPage` integrado ao menu e protegido para ADMIN, DRE e ESCOLA. As telas existentes de editais, propostas e contratos continuam sendo utilizadas para as etapas especializadas.
