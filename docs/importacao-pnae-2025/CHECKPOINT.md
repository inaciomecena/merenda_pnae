# CHECKPOINT — Importação histórica PNAE MT 2025

## Fase atual

**Fase 2 concluída (validação do pacote) / Fase 1 em andamento (mapeamento da implementação).**
Nenhuma alteração no banco de dados. Nenhuma migração aplicada. Nenhuma importação definitiva.

## Contexto

- Raiz do projeto: `C:\Projetos\merenda_pnae`
- Raiz do pacote (PACKAGE_DIR): `C:\Projetos\merenda_pnae\docs\PNAE_MT_2025_PACOTE_IMPORTACAO`
- Manifesto encontrado **diretamente** em PACKAGE_DIR: `PACKAGE_DIR\MANIFESTO_DOCUMENTOS.json`
- Área de entrega: `C:\Projetos\merenda_pnae\docs\importacao-pnae-2025`

## Caminhos reais confirmados

- `PACKAGE_DIR\MANIFESTO_DOCUMENTOS.json` (864.285 bytes)
- `PACKAGE_DIR\INVENTARIO_EDITAIS_PNAE_MT_2025.xlsx` (8 abas)
- `PACKAGE_DIR\RELATORIO_PESQUISA_PNAE_MT_2025.md`
- `PACKAGE_DIR\PENDENCIAS_PESQUISA.md`
- `PACKAGE_DIR\EVIDENCIAS_ACESSO_PORTAIS.json`
- `PACKAGE_DIR\MAPEAMENTO_TERRITORIAL_PARCIAL.md`
- `PACKAGE_DIR\CONTROLE_INTEGRIDADE.md`
- `PACKAGE_DIR\LEIA_ME.md`
- `PACKAGE_DIR\PROMPTS_POR_DRE\` (13 arquivos)
- `PACKAGE_DIR\PNAE_MT_2025\` (12 subpastas de DRE, 128 PDF + 128 TXT)
- `PACKAGE_DIR\DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES\` (08_METROPOLITANA, 10_PRIMAVERA_DO_LESTE)

Caminhos Linux citados nos documentos do pacote (`/workspace/scratch/6c61238d1c73/outputs/pnae2025/`) foram desconsiderados; os arquivos foram resolvidos pelos caminhos Windows acima.

## Arquivos lidos nesta execução

- `package.json` (raiz) e `apps\backend\package.json`
- `apps\backend\prisma\schema.prisma` (em inspeção via agente)
- `apps\backend\prisma\migrations\*` (listagem: 27 migrations, da mais antiga 20260707133000 até 20261012130000)
- `docs\PNAE_MT_2025_PACOTE_IMPORTACAO\LEIA_ME.md`
- `docs\PNAE_MT_2025_PACOTE_IMPORTACAO\MAPEAMENTO_TERRITORIAL_PARCIAL.md`
- `docs\PNAE_MT_2025_PACOTE_IMPORTACAO\CONTROLE_INTEGRIDADE.md`
- `docs\PNAE_MT_2025_PACOTE_IMPORTACAO\RELATORIO_PESQUISA_PNAE_MT_2025.md`
- `docs\PNAE_MT_2025_PACOTE_IMPORTACAO\PENDENCIAS_PESQUISA.md`
- `docs\PNAE_MT_2025_PACOTE_IMPORTACAO\MANIFESTO_DOCUMENTOS.json` (estrutura e totais)

Não existe `AGENTS.md` nem `CLAUDE.md` no repositório (verificado por glob). As instruções reais disponíveis são a documentação em `docs\` e os próprios prompts do pacote.

## Hash do manifesto

- Arquivo: `MANIFESTO_DOCUMENTOS.json`
- SHA-256: `800d0f833c16b102a723abccd27c583e98ba1dc5b3b4fd5d65ab3b2836d72f16`
- Tamanho: 864.285 bytes

## Resultado da validação do pacote (Etapa 2)

Executado `node docs/importacao-pnae-2025/scripts\validate-package.js` → `VALIDACAO_PACOTE.json`.

| Classificação | Qtd |
|---|---:|
| INTEIRO (hash confere, %PDF- ok) | 128 |
| AUSENTE (sem arquivo; 7× HTTP 404, Tangará da Serra) | 7 |
| ALTERADO | 0 |
| INVÁLIDO | 0 |
| FORA_DO_PACOTE (traversal) | 0 |

- Reconciliação manifesto ↔ planilha: 13 portais, 125 procedimentos, 135 URLs de documentos, 553 itens, 312 anexos, 44 pendências — **idênticos nas duas fontes**.
- 122 hashes únicos; 4 grupos de duplicados binários: DOC-0019/0020, DOC-0026/0027, DOC-0055/0059/0060, DOC-0056/0057/0058.
- Distribuição de elegibilidade dos 125 editais: 52 ELEGIVEL_2025, 27 PREGAO_2025, 19 CONFLITO_EXERCICIO, 11 FORA_ESCOPO_2026, 7 PENDENTE_ARQUIVO, 5 PENDENTE_EDITAL_COMPLETO, 4 REFERENCIA_HISTORICA.

## Decisões registradas

1. Trabalhar no checkout atual, sem branches, sem worktrees, sem commits automáticos.
2. Pacote tratado como **levantamento com lacunas**; classificação de elegibilidade não substitui conferência administrativa.
3. Reaproveitar importador/extração/versionamento existentes (mapeamento em `MAPEAMENTO_IMPLEMENTACAO.md`); não duplicar módulos.
4. Dry-run somente em memória/arquivos de staging; nenhum `prisma migrate`, seed ou escrita no banco ativo.
5. Pregões segregados de chamadas públicas da agricultura familiar.
6. Valores monetários preservados como texto bruto + normalização decimal revisável; divergências numéricas não são corrigidas silenciosamente.

## Alterações realizadas até aqui

Arquivos criados (novos, sem tocar em código existente ainda):

- `docs\importacao-pnae-2025\CHECKPOINT.md` (este arquivo)
- `docs\importacao-pnae-2025\scripts\validate-package.js`
- `docs\importacao-pnae-2025\scripts\dump-inventario.js`
- `docs\importacao-pnae-2025\VALIDACAO_PACOTE.json`

Nenhum arquivo do pacote documental foi alterado. Nenhum arquivo do backend foi alterado nesta fase.

## Comandos executados

```
node docs/importacao-pnae-2025/scripts/validate-package.js
node docs/importacao-pnae-2025/scripts/dump-inventario.js ALL 2
```

## Bloqueios

Nenhum bloqueio impeditivo até aqui. Pendências conhecidas do pacote (Tangará 404, conflitos de exercício, extração parcial de itens) são tratadas como classificação explícita, não como falha da execução.

## Próxima ação

1. Concluir o mapeamento da implementação existente (agente de exploração em andamento).
2. Escrever `MAPEAMENTO_IMPLEMENTACAO.md` e `MAPEAMENTO_CAMPOS.md`.
3. Gerar staging por DRE, executar dry-run e escrever relatórios finais.
