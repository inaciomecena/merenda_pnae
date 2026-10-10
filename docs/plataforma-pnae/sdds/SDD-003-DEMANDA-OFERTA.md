# SDD-003 — Demandas escolares e oferta dos produtores

Requisitos: RF-03, RF-13. Dependências: SDD-001/002.

## Design
Demanda por escola e período contém itens referenciados ao catálogo, unidade, quantidade, especificação e programação. DRE consolida mantendo a origem por escola. Oferta informa capacidade quantitativa por período, sazonalidade e condições de entrega; preservar o texto legado sem tratá-lo automaticamente como capacidade validada.

Fluxo de demanda: RASCUNHO → ENVIADA → EM_REVISAO → APROVADA; devolução retorna para ajuste. Aprovada pode alimentar a composição de chamada. Revisão nutricional é registrada conforme competência institucional.

## API e interface
`GET/POST /demandas`, `PATCH /demandas/:id`, `POST /demandas/:id/enviar`, `POST /demandas/:id/revisar`; `GET/POST /produtores/:id/ofertas`. Tela da escola e consolidação da DRE com filtros por período e produto.

## Aceite
- CA-003-A: soma consolidada mantém correspondência com demandas de origem e não duplica a mesma demanda.
- CA-003-B: não somar unidades incompatíveis; conversões exigem regra explícita.
- CA-003-C: capacidade informada para um mês não é comparada a quantidade anual sem normalização temporal.
- CA-003-D: demanda aprovada gera itens rastreáveis no edital; edição posterior não altera documentos publicados.

Não gerar reserva contratual a partir de oferta ou demanda: reserva ocorre somente na execução de contrato.
