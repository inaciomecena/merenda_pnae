# SDD-005 — Portal público e recomendação de oportunidades

Requisitos: RF-05, RF-14. Dependências: SDD-003/004.

## Design
Publicar listagem por município, DRE, escola, produto, período e situação. Cartões mostram produto, especificação, unidade, quantidade, preço publicado, prazo e locais. Consulta sem login; participação requer autenticação.

Reaproveitar normalização e compatibilidade de produtos para recomendações explicáveis. Score não constitui seleção formal nem obrigação de fornecimento. Mesmo produto com variedades diferentes exige atenção à especificação. “Tenho interesse” registra manifestação, sem gerar projeto protocolado ou contrato.

## API e interface
`GET /publico/chamadas`, `GET /publico/chamadas/:id`, `GET /publico/chamadas/:id/itens`; `GET /me/oportunidades`, `POST /chamadas/:id/interesses`. DTO público com allowlist de campos, sem reutilizar resposta administrativa completa.

## Aceite
- CA-005-A: busca por produto encontra itens publicados com paginação e filtros consistentes.
- CA-005-B: rascunhos, documentos pessoais e contatos privados não aparecem na resposta pública.
- CA-005-C: chamada encerrada pode ser consultada no histórico, mas não aceita novos projetos fora do procedimento autorizado.
- CA-005-D: produtor distingue interesse, rascunho e projeto apresentado.
- CA-005-E: recomendação informa motivo e não atribui ao score status jurídico de classificação.
