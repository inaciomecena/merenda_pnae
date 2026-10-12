# SDD-010 — relatório de execução (12/10/2026)

## Estado

**PARCIAL — sem aceite integral.** O fluxo principal do produtor passou em E2E isolado. Permanecem lacunas funcionais e de regressão listadas abaixo.

## Entrega realizada

- Reaproveitados `Produtor`, `ProdutorProduto`, `ProdutoReferencia`, `Proposta`, `Contrato`, autenticação JWT, `RolesGuard`, `PolicyService` e `AuditService`.
- A migração `20261012150000_sdd_010_produtor_painel` já estava aplicada no banco local quando esta execução começou. Não houve nova migração nem escrita no banco principal nesta execução.
- A rota `/meu-campo` usa APIs reais para unidades, produtos, safras, sazonalidade, disponibilidade, logística e catálogo. O painel apresenta contagens de propostas e contratos existentes e separa saldo por unidade de medida.
- O backend impede autoconcessão de assistência pelo extensionista, exige vínculo ativo para atuação assistida, valida coordenadas e impede reserva sem operação real. A assistência é concedida por administrador, inicialmente pendente, e ativada administrativamente.
- O E2E criou um banco isolado, aplicou as 26 migrações e passou 34 verificações HTTP/JWT com persistência MySQL. Veja `SDD-010-TESTES.md`.

## Backup

Backup preexistente: `output/backups/merenda_pnae-sdd010-before-migration-20261012150000.json`, 4.368.580 bytes, SHA-256 `0582825BD5351BCA072C0B6DAC0245C6769DF7195AAD8BCABECBF624501EBD1F`. Este arquivo já existia antes desta execução; seu conteúdo não foi alterado.

## Pendências para aceite

- A regressão SDD-005 a 009 passou em bancos isolados: 69/69, 38/38, 25/25, 80/80 e 28/28, respectivamente. A primeira tentativa SDD-005 em banco antigo falhou por fixture acumulado e foi repetida em banco novo.
- Adicionar edição guiada de unidades, produtos e logística no frontend; o novo painel cadastra, consulta e atualiza colheita/perdas de safras. Os demais endpoints PATCH existem no backend.
- Completar modelo temporal da sazonalidade por ano e unidade; atualmente armazena mês e produto, com safra opcional.
- Vincular reservas e compromissos exclusivamente a operações reais de proposta/contrato com transação e concorrência. Até lá, a criação manual desses estados é bloqueada.
- Completar indicadores de pendências cadastrais, desatualização e chamadas vinculadas.
- Paginar listagens produtivas e ampliar o catálogo com revisão de duplicatas, sinônimos e novas solicitações na interface.
- Revisar catálogo técnico e nutrição com competência institucional e fontes validadas; nenhum valor nutricional foi inventado.
- Validar responsividade em dispositivos Android, tablet e Safari iPhone.
- Ampliar testes concorrentes de atualização de safra, unidade e logística; os três endpoints PATCH exigem versão e condicionam a escrita atomicamente.

O resultado não deve ser classificado como PASS integral enquanto essas pendências afetarem os critérios de aceite.
