# SDD-009 - Requisitos atendidos

## Operação

- Configuração por `GLOBAL`, `DRE`, `ESCOLA` e `MUNICIPIO`, com responsável, vigência, origem, versão e histórico.
- Parâmetros operacionais com código, tipo, unidade, fonte, status e versões imutáveis.
- Notificações internas por usuário, referência, link, leitura e `dedupeKey` único.
- Painel e central de pendências derivados de editais, chamadas, propostas, contratos, entregas e prestações.
- Diagnóstico restrito de banco, migrações, serviços, armazenamento e itens críticos.
- Checklist institucional com estado, evidência, responsável, prazo, observação e pendência.

## Segurança

- Rotas protegidas pelos guards globais existentes.
- Escrita de configuração e checklist valida escopo com `PolicyService`.
- Diagnóstico restrito a `ADMIN`.
- Notificações não podem ser criadas para outro usuário por perfis não administrativos.
- Nenhum segredo ou stack trace é retornado pelo health público.

## Ressalvas administrativas

`HOMOLOGADO_OPERACIONALMENTE` indica conclusão técnica do checklist. Não representa aceite institucional ou autorização de produção.
