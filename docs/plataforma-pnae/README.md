# Merenda PNAE — pacote de planejamento v1.0

Data: 10/10/2026. Status: especificação inicial para revisão e implementação incremental; não é declaração de implementação ou homologação.

## Objetivo
Evoluir o projeto existente para conectar demandas escolares à agricultura familiar e acompanhar chamada pública, projeto de venda, seleção, contrato, ordem de fornecimento, recebimento, faturamento e pagamento.

## Conteúdo
- [PRD](PRD.md): produto, requisitos e escopo.
- [Arquitetura](ARQUITETURA.md): responsabilidades técnicas e decisões.
- [Modelo de dados](MODELO_DADOS.md): evolução proposta sem apagar a base.
- [Decisões e premissas](DECISOES.md): escolhas técnicas e definições operacionais pendentes.
- [Backlog](BACKLOG.md): sequência de implementação e dependências.
- [Plano de testes](PLANO_TESTES.md): cenários e critérios de liberação.
- [Instrução para implementação](IMPLEMENTACAO_CODEX.md): orientação para trabalhar no repositório.
- Pasta `sdds/`: 12 especificações de design e desenvolvimento, numeradas de SDD-001 a SDD-012.

## Como utilizar
1. Copiar este diretório para `docs/plataforma-pnae/` no repositório.
2. Conferir o estado atual do código e das migrações: a análise que embasa este pacote usou o commit `4fb165648cef9b1b340fb70478cd994015d93c6e`.
3. Resolver primeiro a compatibilidade do dump e o isolamento de acessos.
4. Implementar por SDD, com migrações, APIs, interface e testes necessários para cada fluxo.
5. Atualizar a rastreabilidade: requisito → SDD → mudança → evidência de teste.

## Base da análise
- Repositório: https://github.com/inaciomecena/merenda_pnae
- Código: React/TypeScript/MUI; NestJS/Prisma; datasource MySQL.
- Dump fornecido: `merenda.sql`, 25 tabelas, incluindo a tabela de migrações. Não foi importado em um servidor de banco.
- Foram consultados o schema Prisma, rotas da interface, controles de escopo e serviços/controllers selecionados. Não houve execução do sistema, auditoria integral ou testes de runtime.
- No código existem `SystemConfig`, `dadosDocumentais` e `codigoModelo`; o dump consultado não contém as estruturas correspondentes. A conciliação deve verificar todas as divergências, sem presumir que estas são as únicas.

## Referências externas
- DRE Diamantino: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-p%C3%BAblica
- Anexos da DRE: https://drive.google.com/embeddedfolderview?id=1bk-jQ8YnjWwHmi1sWNFlzwCM-YmRjqbU
- Resolução CD/FNDE nº 4/2026 consultada: https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2026/resolucao-cd_fnde-no-4-de-26-de-fevereiro-de-2026.pdf

Os documentos da DRE servem como referências de estrutura. Modelos antigos não devem determinar automaticamente a legislação de novas chamadas. Antes de ativar regras de seleção, limites e documentos, conferir norma vigente, edital aplicável e orientações institucionais.
