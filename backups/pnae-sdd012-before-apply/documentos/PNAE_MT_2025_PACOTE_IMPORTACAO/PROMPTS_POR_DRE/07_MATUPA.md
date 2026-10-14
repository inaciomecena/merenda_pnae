# Execução por DRE — Matupá — PNAE 2025

Leia primeiro `PROMPT_MIMO_2_6_IMPORTACAO_PNAE_2025.md`. Todas as regras de preservação, dry-run, idempotência, RBAC e bloqueio de importação definitiva aplicam-se integralmente.

Restrinja este lote a `dre == "Matupá"` no manifesto. Portal de origem: https://www.drematupa.com.br/.

Faça uma etapa por vez: validar hashes → conferir exercício → completar extração → resolver vínculos → simular → testar → relatar → atualizar checkpoint. Não repetir pesquisa se os arquivos já estão disponíveis e íntegros.

Chamadas com PDF integral elegíveis neste pacote: 0. Zero não significa inexistência. Documentos baixados: 1. Não importar pregões, referências, arquivos 404 ou exercícios conflitantes como chamada pública confirmada.

## Lista real do lote

- **ED-0125 — 001/2025 — Matupá — Chamada pública — REFERENCIA_HISTORICA**
  - Arquivo: `PNAE_MT_2025/07_MATUPA/DOC-0135_885190.pdf`
  - Fonte: https://www.iomat.mt.gov.br/legislacao/diario_oficial/download/885190
  - Decisão: Extrato de contrato publicado em 2025. Comprova referência ao procedimento, mas não substitui edital nem prova sozinho o exercício de atendimento.

## Bloqueio deste lote

Não há chamada com PDF integral validada para importar. Preparar apenas diagnóstico e plano de recuperação das pendências. Não gerar registros de substituição nem inferir dados pelo extrato.

## Aceite

Relatório regional com quantidade de candidatos confirmados/bloqueados, hashes, versões, fontes por campo, vínculos resolvidos e pendências. Dry-run repetido sem crescimento, nenhum registro operacional de 2026 alterado e nenhuma escrita definitiva no banco ativo.
