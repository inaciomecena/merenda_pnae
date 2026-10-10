# SDD-011 — Faturamento, obrigações, pagamentos e estornos

Requisitos: RF-11, RF-13. Dependências: SDD-008/010.

## Design
Documento fiscal pode cobrir várias entregas; alocação por item relaciona quantidades/valores a aceites disponíveis. Conferir emissor, identificação fiscal, itens, preço e total. Divergência mantém pendência com motivo, sem gerar obrigação aprovada automaticamente.

Fluxo fiscal: RECEBIDO → EM_CONFERENCIA → DIVERGENTE/APROVADO; cancelamento e substituição preservam vínculos. Documento aprovado gera obrigação com vencimento. Pagamento confirmado tem data, valor, referência e comprovante, com alocação entre obrigações.

Pagamentos parciais são permitidos dentro do saldo. Estornos parciais/totais referenciam o pagamento e não excedem seu valor líquido. Não executar movimentação bancária na primeira versão. Correções documentais e financeiras devem preservar conciliação.

## API/interface
`GET/POST /documentos-fiscais`, `POST /documentos-fiscais/:id/conferir`, `GET /obrigacoes`, `POST /pagamentos`, `POST /pagamentos/:id/estornos`; fila financeira por contrato/escola/fornecedor.

## Aceite
- CA-011-A: documento duplicado ou faturamento cumulativo acima do aceite disponível é bloqueado.
- CA-011-B: obrigação de R$ 900 com pagamento de R$ 500 mantém R$ 400 pendentes.
- CA-011-C: pagamento repetido com mesma chave não duplica valores; chave com outro conteúdo gera conflito.
- CA-011-D: pagamentos concorrentes não ultrapassam saldo da obrigação.
- CA-011-E: estorno recompõe saldo e mantém original e comprovantes.
- CA-011-F: diferenças de preço/quantidade são apresentadas por item e tratadas por usuário autorizado.
