# SDD-008 — Contratos, limites e alterações

Requisitos: RF-08, RF-13. Dependências: SDD-001/002/007.

## Design
Contrato identifica contratante, EEx, fornecedor, resultado de origem, vigência, valor, responsáveis, escolas, itens e documentos. Distribuição por escola pode ser fixa ou compartilhada sob regra explícita; nunca duplicar saldo global.

Estados: RASCUNHO → EM_FORMALIZACAO → VIGENTE → ENCERRADO; SUSPENSO/RESCINDIDO seguem eventos próprios. Ativação exige instrumento formal e dados obrigatórios. Carga de contratos ativos mantém origem histórica e saldos conciliados, sem inventar chamada ou resultado.

Controle de limite considera dimensão normativa vigente, agricultor/CAF, EEx e período, inclusive participação em organizações. Compromissos existentes fora da plataforma exigem declaração/importação identificada; o sistema não garante visão nacional completa.

Aditivos e outros instrumentos registram tipo, fundamento, efeitos e vigência. Alterações aprovadas não reescrevem preços históricos. Encerramento verifica ordens, pendências físicas e financeiras e produz dossiê.

## API/interface
`GET/POST /contratos`, detalhe com abas; comandos `/ativar`, `/alteracoes`, `/suspender`, `/encerrar`; acompanhamento por escola e fornecedor.

## Aceite
- CA-008-A: itens derivam do resultado e preservam a origem.
- CA-008-B: alocações não excedem quantidades vigentes.
- CA-008-C: limite é verificado na dimensão correta, incluindo agricultor participante.
- CA-008-D: alteração com efeito futuro mantém ordens anteriores coerentes.
- CA-008-E: encerramento não apaga pendências nem histórico.
