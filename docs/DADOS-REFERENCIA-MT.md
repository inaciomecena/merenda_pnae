# Dados de referência de Mato Grosso

Atualização executada em 11/10/2026 no ambiente local de desenvolvimento.

## Fontes

- Produtos: Chamada Pública 2026 nº 001/2025 de Alto Paraguai, fornecida para esta implementação.
- Municípios: base IBGE de Mato Grosso já versionada em `docs/inep/ibge-municipios-mt-2026-07-08.json`.
- Diretorias Regionais de Educação e escolas: páginas públicas da SEDUC Mato Grosso, iniciando em <https://www3.seduc.mt.gov.br/dres-apresentacao>.

## Conteúdo versionado

- 142 municípios de Mato Grosso com código IBGE.
- 56 produtos normalizados do edital, com unidade, categoria e termos de busca.
- 13 DREs oficiais, com código, município sede e fonte.
- 624 nomes de escolas publicados nas páginas das DREs.

Os dados ficam em `apps/backend/prisma/reference-data.ts`. O carregador idempotente fica em `apps/backend/prisma/seed-reference.ts` e é executado também pelo seed principal.

## Execução

No diretório `apps/backend`:

```powershell
npm run seed:reference
```

Ou, para executar todo o seed de desenvolvimento:

```powershell
npm run seed
```

O seed usa `upsert`, não apaga municípios, DREs, escolas ou vínculos e pode ser repetido. Produtos antigos criados pelo seed são apenas desativados quando não pertencem ao edital atual e não possuem dependências.

## Migração

A migração `20261011150000_reference_data_mt`:

- corrige o código IBGE de Alto Paraguai para `5100508`;
- normaliza e completa os 142 municípios;
- cria ou atualiza a entidade executora da SEDUC;
- cria ou atualiza as 13 DREs.

A migração foi aplicada no banco local de desenvolvimento. Nenhuma migração de produção foi executada.

## Resultado da vinculação escolar

Após o seed:

- 497 vínculos escola–DRE estão ativos no banco local;
- 494 escolas da fonte foram reconhecidas pelo carregador na última execução idempotente;
- 116 nomes não foram encontrados na base escolar local;
- 14 nomes possuem mais de uma correspondência possível.

O carregador não cria código INEP fictício e não escolhe automaticamente entre homônimos. A lista completa das pendências fica em `output/seed-reference-report.json`. Para ampliar a vinculação, atualize a base de escolas com a fonte oficial do INEP e execute novamente `npm run seed:reference`.

Antes da aplicação foi criado o backup lógico `output/backups/reference-data-before-20261011.json`.

## Interface de organização

A tela **Organização educacional** (`PNAE-ORG-001`) apresenta:

- totais de entidades, DREs e vínculos ativos;
- relação das DREs com código, sede, entidade executora e quantidade de escolas;
- busca de escola por nome, INEP ou município;
- vinculação por seleção, sem digitação de identificadores internos;
- consulta das escolas vinculadas e encerramento explícito do vínculo.
