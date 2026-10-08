# Fase 5 - Balizamento e Match Inteligente

## Arquitetura

A Fase 5 implementa o motor de balizamento entre:

- item do edital;
- produto de referencia;
- producao cadastrada do produtor.

Backend:

- `BalizamentoModule`
- `BalizamentoController`
- `BalizamentoService`
- `MatchEngineService`
- `TextNormalizerService`
- DTOs para match manual e atualizacao de status
- testes unitarios do motor de match

Frontend:

- rota `/balizamento`;
- tela de selecao de edital;
- execucao do balizamento;
- listagem dos matches por item;
- filtros por status, score minimo, produto e produtor;
- acoes de aprovar, rejeitar, remover e criar match manual.

## Regras de score

O score vai de 0 a 100.

Fatores considerados:

- nome do produto;
- tokens do nome;
- palavras-chave;
- sinonimos;
- unidade de medida;
- municipio do produtor;
- capacidade de fornecimento;
- produto de referencia ativo;
- produtor ativo.

Classificacao:

- `90` a `100`: `MATCH_AUTOMATICO`
- `70` a `89`: `SUGESTAO`
- abaixo de `70`: `PENDENTE`
- `0`: `SEM_MATCH`

Produtor do mesmo municipio recebe bonus. Produtor de outro municipio continua aparecendo, mas com score menor e sem bloquear o match.

Capacidade insuficiente nao bloqueia o match. O sistema registra observacao: `Capacidade menor que a quantidade solicitada.`

## Normalizacao de texto

Implementado em `TextNormalizerService`:

- remove acentos;
- converte para caixa baixa;
- remove pontuacao;
- normaliza hifens;
- remove multiplos espacos;
- trata plural simples;
- compara tokens;
- compara sinonimos e palavras-chave.

Exemplos cobertos:

- `ABACAXI PÉROLA` com `abacaxi` e `abacaxi pérola`;
- `BANANA PRATA` com `banana` e `banana prata`;
- `MANDIOCA DESCASCADA` com `mandioca`, `aipim` e `macaxeira`;
- `CHEIRO VERDE` com `cheiro-verde`, `cebolinha` e `salsa`.

## Endpoints

- `POST /api/v1/balizamento/editais/:editalId/executar`
- `GET /api/v1/balizamento/editais/:editalId`
- `GET /api/v1/balizamento/editais/:editalId/itens/:itemId`
- `POST /api/v1/balizamento/matches/manual`
- `PUT /api/v1/balizamento/matches/:matchId/aprovar`
- `PUT /api/v1/balizamento/matches/:matchId/rejeitar`
- `DELETE /api/v1/balizamento/matches/:matchId`

## Banco de dados

Migration aplicada:

- `20260707150500_fase_5_balizamento`

A tabela `pnae_matches` foi ajustada com:

- `editalId`;
- `produtorProdutoId`;
- `origemMatch`;
- `motivoScore`;
- status novos: `MATCH_AUTOMATICO`, `SUGESTAO`, `PENDENTE`, `SEM_MATCH`, `APROVADO`, `REJEITADO`.

Status antigos foram convertidos:

- `SUGERIDO` -> `SUGESTAO`
- `VINCULADO` -> `APROVADO`

## Validacao real

Ambiente:

- MySQL local/externo sem Docker;
- `DATABASE_URL`: `mysql://sagae:sagae123@127.0.0.1:3306/sagae_pnae?charset=utf8mb4`;
- backend compilado e iniciado com `node dist/main.js`;
- frontend dev tem bloqueio de sandbox no Vite/esbuild (`spawn EPERM`), mas build real fora do sandbox passou.

Edital usado:

- `4311ec5c-a392-4b2c-9c08-dc8328cddd8c`
- `001/2025`
- Alto Paraguai

Resultado:

- balizamento executado com sucesso;
- 100 matches criados na primeira execucao;
- `ABACAXI PÉROLA` gerou `MATCH_AUTOMATICO` com score `100`;
- `ABÓBORA CABOTIÃ` gerou `MATCH_AUTOMATICO` com score `100`;
- aprovacao de match validada;
- rejeicao de match validada;
- remocao com soft delete validada;
- match manual validado com origem `MANUAL`, status `APROVADO` e score `100`.

Exemplo de motivo salvo:

```text
nome compativel, produto produzido compativel, unidade compativel, produtor do mesmo municipio, produtor ativo, capacidade suficiente.
```

## Testes executados

- `npx prisma generate`: sucesso usando engine local do Prisma.
- `npx prisma migrate deploy`: sucesso.
- `npx prisma db seed`: sucesso.
- `npm run test` em `apps/backend`: sucesso.
- `npm run build` em `apps/backend`: sucesso.
- `npm run build` em `apps/frontend`: sucesso fora do sandbox.

Testes unitarios cobrem:

- normalizacao de texto;
- comparacao por tokens;
- sinonimos;
- score alto;
- score medio;
- score baixo;
- capacidade insuficiente;
- produtor de outro municipio.

## Pendencias

- Melhorar ranking para reduzir sugestoes amplas quando o produto do produtor nao tem semelhanca direta com o item, mantendo pendencias auditaveis.
- Adicionar filtros de municipio e escola na tela quando houver endpoints/listas auxiliares mais completos.
- Criar testes e2e dos endpoints com banco de teste dedicado.
- Nao foi implementada geracao de Anexo III nesta fase.

## Sazonalidade de producao

Os produtos cadastrados para cada produtor possuem o campo `periodoProducao`, usado para registrar disponibilidade sazonal.

Exemplos:

```text
Ano todo
Jan-Mar
Abr-Jul
Nov-Mar
Safra das aguas
Entressafra
```

O cadastro fica disponivel em:

```text
Produtores > Produtos
```

No balizamento, o periodo de producao aparece na tabela de matches e nas opcoes de match manual. A pontuacao ainda nao bloqueia automaticamente produtos fora de safra, porque os editais importados ainda nao possuem uma janela de entrega estruturada por item. Quando essa data existir, o motor podera comparar `periodoProducao` com a data solicitada e reduzir/rejeitar matches fora de epoca.
