# Execução por DRE — Metropolitana — PNAE 2025

Leia primeiro `PROMPT_MIMO_2_6_IMPORTACAO_PNAE_2025.md`. Todas as regras de preservação, dry-run, idempotência, RBAC e bloqueio de importação definitiva aplicam-se integralmente.

Restrinja este lote a `dre == "Metropolitana"` no manifesto. Portal de origem: https://www.dmetropolitana.org/.

Faça uma etapa por vez: validar hashes → conferir exercício → completar extração → resolver vínculos → simular → testar → relatar → atualizar checkpoint. Não repetir pesquisa se os arquivos já estão disponíveis e íntegros.

Chamadas com PDF integral elegíveis neste pacote: 0. Zero não significa inexistência. Documentos baixados: 22. Não importar pregões, referências, arquivos 404 ou exercícios conflitantes como chamada pública confirmada.

## Lista real do lote

- **ED-0099 — 003/2025 — Cuiabá — Chamada pública — FORA_ESCOPO_2026**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0109_2004f4_a29852589efd42ed8e069f3abcffbbc7.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_a29852589efd42ed8e069f3abcffbbc7.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0100 — 002/2025 — Várzea Grande — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0110_2004f4_d275f8ff4df34f22aac00f2ef72077a1.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_d275f8ff4df34f22aac00f2ef72077a1.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0101 — 001/2026 — Santo Antônio do Leverger — Chamada pública — FORA_ESCOPO_2026**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0111_2004f4_7e7f9188a88349d28235ca65582376ca.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_7e7f9188a88349d28235ca65582376ca.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0102 — 005/2026 — Nossa Senhora do Livramento — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0112_2004f4_e84cb3a0d1f64507beff5c292c9fac5e.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_e84cb3a0d1f64507beff5c292c9fac5e.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0103 — 006/2026 — Poconé — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0113_2004f4_88a5d1caedc34dde8c02a2ce8321076d.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_88a5d1caedc34dde8c02a2ce8321076d.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0104 — 004/2026 — Jangada — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0114_2004f4_42c1768cd2454f29a14f5e8b51c5c509.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_42c1768cd2454f29a14f5e8b51c5c509.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0105 — 003/2026 — Acorizal — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0115_2004f4_fcf2491bb40c4f5ca34e34cc02490f53.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_fcf2491bb40c4f5ca34e34cc02490f53.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0106 — 002/2026 — Barão de Melgaço — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0116_2004f4_c48619e9ff29426d9ad5922b1a9474d8.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_c48619e9ff29426d9ad5922b1a9474d8.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0107 — 007/2025 — Chapada dos Guimarães — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0117_2004f4_a40cb2d0ef534c7d8b8153fb4c5c9697.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_a40cb2d0ef534c7d8b8153fb4c5c9697.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0108 — 008/2026 — Planalto da Serra — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0118_2004f4_c959216226f846ae8cd20addd9412c18.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_c959216226f846ae8cd20addd9412c18.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0109 — 009/2026 — Nova Brasilândia — Chamada pública — CONFLITO_EXERCICIO**
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0119_2004f4_bd417cb1a36a4509975aedce74924758.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_bd417cb1a36a4509975aedce74924758.pdf
  - Decisão: Portal associa à rodada de fim de 2025; processo/datas 2026 ou normas de setembro de 2025 conflitam com ano letivo 2025 no modelo. Não resolver automaticamente.
- **ED-0110 — 007/2024 — Cuiabá — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0120_2004f4_dea8716823c14c04a061631b6fd19025.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_dea8716823c14c04a061631b6fd19025.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0111 — 008/2024 — Várzea Grande — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0121_2004f4_8bb54366edc047cc91e143616c8418c9.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_8bb54366edc047cc91e143616c8418c9.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0112 — 009/2024 — Santo Antônio do Leverger — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0122_2004f4_87ed7fac89b54734a58548ab9bf6741b.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_87ed7fac89b54734a58548ab9bf6741b.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0113 — 010/2024 — Poconé — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0123_2004f4_f869b5af3e7a42e58206e5a5f70a15f0.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_f869b5af3e7a42e58206e5a5f70a15f0.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0114 — 011/2024 — Nossa Senhora do Livramento — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0124_2004f4_a8813c38b6e34b8880bad6dada1b622d.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_a8813c38b6e34b8880bad6dada1b622d.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0115 — 012/2024 — Jangada — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0125_2004f4_df2e8ee18b594ee6a5b25064c8856c92.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_df2e8ee18b594ee6a5b25064c8856c92.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0116 — 013/2024 — Acorizal — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0126_2004f4_3c327a18a5fc41f89b2df665bfad91f9.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_3c327a18a5fc41f89b2df665bfad91f9.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0117 — 014/2024 — Barão de Melgaço — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0127_2004f4_0c038f727d3b419d8213275738c38c2c.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_0c038f727d3b419d8213275738c38c2c.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0118 — 015/2024 — Chapada dos Guimarães — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0128_2004f4_ee4640c9dee7474fafbf9b9e6778221a.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_ee4640c9dee7474fafbf9b9e6778221a.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0119 — 016/2024 — Planalto da Serra — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0129_2004f4_32158461ac7442b09680f673b655e0c5.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_32158461ac7442b09680f673b655e0c5.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.
- **ED-0120 — 017/2024 — Nova Brasilândia — Pregão — PREGAO_2025**
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0130_2004f4_34e70caf91d04da28c0b0e2a68144bc3.pdf`
  - Fonte: https://www.dmetropolitana.org/_files/ugd/2004f4_34e70caf91d04da28c0b0e2a68144bc3.pdf
  - Decisão: Categoria separada da agricultura familiar. Não importar no módulo de chamadas públicas.

## Bloqueio deste lote

Não há chamada com PDF integral validada para importar. Preparar apenas diagnóstico e plano de recuperação das pendências. Não gerar registros de substituição nem inferir dados pelo extrato.

## Aceite

Relatório regional com quantidade de candidatos confirmados/bloqueados, hashes, versões, fontes por campo, vínculos resolvidos e pendências. Dry-run repetido sem crescimento, nenhum registro operacional de 2026 alterado e nenhuma escrita definitiva no banco ativo.
