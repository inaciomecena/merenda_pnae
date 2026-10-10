# SDD-001 — Compatibilidade e preservação da base

Requisitos: RF-01, RF-13. Dependências: nenhuma. Status: especificado, não implementado.

## Objetivo
Estabelecer baseline verificável entre código, schema Prisma, histórico de migrações, dump e arquivos legados antes de adicionar funcionalidades.

## Design
Inventariar tabelas, colunas, enums, índices, FKs e migrações aplicadas. Comparar com `apps/backend/prisma/schema.prisma` e migrações do repositório. Foram observadas ausências de `dadosDocumentais`, `codigoModelo` e da tabela mapeada por `SystemConfig` no dump; verificar integralmente outras diferenças.

Restaurar o dump somente em banco isolado compatível; documentar contagens, órfãos, dados inválidos e referências a arquivos. Avaliar migrações pendentes em ordem, sem manipular histórico para esconder divergência. Criar plano de backfill e reconciliação para relações incompletas.

## Entregas
Relatório de comparação, migrações corretivas/aditivas, inventário de arquivos e roteiro de restauração. Não requer nova API de produto.

## Aceite e testes
- CA-001-A: todos os modelos persistidos possuem estrutura compatível após as migrações.
- CA-001-B: contagens anteriores/posteriores conciliadas e relações existentes preservadas.
- CA-001-C: leitura e geração dos documentos legados selecionados permanecem funcionais.
- CA-001-D: restauração do backup testada; nenhum reset ou seed destrutivo executado no banco ativo.

Registrar falhas preexistentes separadamente. Baseline não significa que o sistema inteiro está homologado.
