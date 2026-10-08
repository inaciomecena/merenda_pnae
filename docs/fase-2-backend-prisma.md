# Fase 2 — Backend, Prisma e Banco

## Resumo
A Fase 2 foi concluída parcialmente com o backend compilando corretamente e o ambiente MySQL local configurado via Docker Compose para o projeto.

## Configuração do Docker MySQL
- Arquivo de composição: [docker/docker-compose.yml](../docker/docker-compose.yml)
- Serviço: `mysql`
- Imagem: `mysql:8.0`
- Banco criado: `sagae_pnae`
- Usuário criado: `sagae`
- Senha: `sagae123`
- Senha do root: `root123`
- Porta mapeada para o host: `3307:3306`

## DATABASE_URL utilizada
- Valor configurado em [apps/backend/.env](../apps/backend/.env)
- `DATABASE_URL="mysql://sagae:sagae123@localhost:3307/sagae_pnae"`

## Migração aplicada
- O schema Prisma foi convertido em estrutura SQL e aplicado diretamente no banco do container MySQL.
- O resultado foi a criação das tabelas principais do sistema, incluindo usuários, municípios, escolas, editais, itens, produtos de referência, produtores, matches, propostas e itens de propostas.

## Seed executado
- O seed foi executado com sucesso no container e populou os dados iniciais do banco.
- Registros criados:
  - 1 usuário administrador
  - 3 municípios
  - 3 produtos de referência

## Build validado
- Comando executado: `npm --prefix apps/backend run build`
- Resultado: sucesso, sem erros de compilação.

## Pendências restantes
- O Prisma CLI ainda apresentou falha de autenticação ao tentar aplicar a migration via TCP a partir do host Windows, mesmo com o MySQL do Docker rodando normalmente.
- Como ajuste de contingência, a estrutura do banco foi aplicada diretamente pelo SQL do schema e o seed foi executado dentro do container.
- Não houve alteração em regras de negócio.
