# Fase 4 - Importador de PDFs PNAE

## Arquitetura

Foi criado o módulo `ImportadorEditaisModule` no backend com a seguinte divisão:

- `presentation/controllers/importacoes.controller.ts`
  - expõe os endpoints de upload, listagem, detalhes, processamento e confirmação.
- `application/services/importador-editais.service.ts`
  - coordena sincronização da pasta `docs`, processamento, persistência e confirmação final.
- `application/services/parser.service.ts`
  - abstração para permitir futuras implementações com OCR sem mudar o fluxo principal.
- `application/services/searchable-pdf-edital-parser.service.ts`
  - parser atual para PDFs pesquisáveis.
- `application/repositories/importacoes.repository.ts`
  - centraliza operações Prisma para `ImportLog`, `Edital` e `EditalItem`.
- `presentation/dto`
  - contratos do upload, reprocessamento e confirmação.
- `presentation/validators/pdf-file.validator.ts`
  - valida extensão e MIME de PDF.

No frontend foram criadas quatro telas:

- `Importar Edital`
- `Lista de Importações`
- `Detalhes da Importação`
- `Tela de Conferência dos Itens`

## Fluxo

1. O backend sincroniza automaticamente os PDFs de `C:\Projetos\sagae_pnae\docs`.
2. Cada arquivo gera um registro em `pnae_import_logs`.
3. O parser lê o texto do PDF pesquisável.
4. O serviço extrai cabeçalho, metadados e itens da tabela.
5. O sistema resolve município e escola com base no cadastro local.
6. O edital é criado ou atualizado.
7. Os itens são gravados em `pnae_edital_itens`.
8. Itens incompletos ficam com `PENDENTE_CONFERENCIA`.
9. O usuário revisa pela tela de conferência.
10. A confirmação final atualiza os itens e marca a importação como `CONFIRMADO`.

## Bibliotecas

- `pdf-parse`
  - leitura do texto pesquisável e base da extração.
- `pdfjs-dist`
  - instalada para evolução do parser e inspeção futura por página/coordenadas.
- `pdf-lib`
  - suporte utilitário para evoluções futuras de manipulação PDF.
- `pdf2table`
  - instalada para experimentação futura com tabelas, embora o parser final desta fase use heurística textual.
- `multer`
  - upload seguro do PDF.

## Parser

O parser atual trabalha com heurística textual, sem IA externa:

- limpa quebras de página, numeração de página e ruídos do texto extraído;
- detecta o início da tabela pelo cabeçalho `PRODUTO COM`;
- identifica o fim da seção de itens quando encontra a próxima seção numerada do edital;
- monta blocos por item a partir do número sequencial;
- extrai a linha-resumo do item com unidade, quantidade, preço unitário e valor total;
- separa `produtoOriginal`, `especificacao` e `observacoes`;
- converte datas e valores monetários;
- marca itens parciais para conferência manual.

## Normalizações

### Unidades

- `Kg`, `Kilo`, `Quilo`, `Quilograma` -> `KG`
- `Unidade`, `Un` -> `UN`
- `Pacote` -> `PCT`
- `Litro` -> `L`
- `Mililitro`, `ML` -> `ML`
- também foram previstos `CX`, `MACO`, `BDJ` e `DZ` para variações comuns encontradas em editais.

### Monetário

- `5.362,75` -> `5362.75`
- `11,29` -> `11.29`

### Status

- importação processada sem pendências: `PROCESSADO`
- importação com item incompleto: `PENDENTE_CONFERENCIA`
- conferência final concluída: `CONFIRMADO`
- falha de leitura/processamento: `ERRO`

## Estratégia futura para OCR

OCR ainda não foi implementado nesta fase.

A arquitetura já deixa o caminho preparado:

- `ParserService` abstrai a origem da extração;
- o parser atual é apenas a implementação para PDFs pesquisáveis;
- uma implementação futura pode usar OCR para PDFs digitalizados, mantendo os mesmos DTOs, endpoints e persistência;
- o módulo já diferencia falhas de texto pesquisável insuficiente, o que facilita o fallback futuro.

## Endpoints

- `POST /api/v1/importacoes/pdf`
  - upload manual do PDF.
- `GET /api/v1/importacoes`
  - lista importações e sincroniza a pasta `docs`.
- `GET /api/v1/importacoes/:id`
  - detalhes da importação, edital gerado e itens.
- `POST /api/v1/importacoes/:id/processar`
  - processa ou reprocessa o arquivo salvo.
- `POST /api/v1/importacoes/:id/confirmar`
  - envia os itens conferidos e fecha a importação.

## Banco de dados

O schema Prisma foi expandido com:

- enum `StatusImportacao`
- novo status `PENDENTE_CONFERENCIA` em `StatusItemEdital`
- campos adicionais em `pnae_import_logs`
- novos campos em `pnae_editais`
- novos campos em `pnae_edital_itens`

## Testes realizados

- `npm install`
- `npm run prisma:generate` em `apps/backend`
- `npm run build` em `apps/backend`
- `npx tsc -b` em `apps/frontend`
- `npm run build --workspace apps/frontend`
- smoke test manual do parser com os PDFs reais presentes em `docs/`

## Pendências

- aplicar migração real no banco de destino antes de subir em ambiente compartilhado;
- melhorar o parser para casos extremos de quebra de página que dividam unidade e quantidade em linhas separadas;
- adicionar testes automatizados do parser com fixtures fixos;
- implementar OCR em nova implementação de `ParserService` para PDFs somente imagem.
# Fase 4.1 - Validacao com banco real

Status final em 07/07/2026:

- MySQL atualmente configurado para execucao local/externa sem Docker.
- Porta local atual: `3306`.
- `DATABASE_URL` atual em `apps/backend/.env`: `mysql://sagae:sagae123@127.0.0.1:3306/sagae_pnae?charset=utf8mb4`.
- `npx prisma generate` executado com sucesso.
- `npx prisma migrate deploy` executado com sucesso.
- `npx prisma db seed` executado com sucesso.
- Backend validado em modo real via `node dist/main.js`.

Migrations aplicadas/registradas:

- `20260707133000_baseline_pre_fase_4`
- `20260707133640_fase_4_importador_pdf`
- `20260707142051_fase_4_1_campos_texto_importador`

Observacao: `npx prisma migrate status` tentou baixar binario do Prisma e falhou por bloqueio de rede local (`127.0.0.1:9`). A aplicacao das migrations foi validada por execucao real da API e consulta direta no MySQL.

## Endpoints validados na Fase 4.1

- `GET /api/v1/importacoes`: retornou logs reais.
- `POST /api/v1/importacoes/sincronizar-docs`: encontrou 2 PDFs em `docs` e nao duplicou logs existentes.
- `POST /api/v1/importacoes/pdf`: upload manual do PDF de Alto Paraguai retornou `201`.
- `GET /api/v1/importacoes/:id`: retornou detalhe com edital e 56 itens.
- `POST /api/v1/importacoes/:id/processar`: reprocessou Alto Paraguai com 56 itens e sem erro.
- `POST /api/v1/importacoes/:id/confirmar`: confirmou o lote validado, marcando 56 itens como `CONFIRMADO`.

## Resultado do PDF de Alto Paraguai

Arquivo testado:

- `CHAMADA PÚBLICA 2026 001 2025 - ALTO PARAGUAI.pdf`

Resultado validado:

- `ImportLog`: criado.
- `Edital`: criado.
- `Itens ativos`: 56.
- `Status apos processamento`: `PENDENTE_CONFERENCIA`.
- `Status apos confirmacao`: `CONFIRMADO`.
- `Tempo de processamento observado`: entre 549 ms e 761 ms.
- `Municipio vinculado`: Alto Paraguai.
- `Escola extraida`: Escola Estadual Dr. Arnaldo Estevao De Figueiredo.
- `Escola vinculada`: pendente, pois a escola nao existe no seed/cadastro local.

Validacao monetaria no MySQL:

- `ABACAXI PÉROLA`: quantidade `475`, unidade `KG`, preco unitario `11.29`, valor total `5362.75`.
- `ABÓBORA CABOTIÃ`: quantidade `66`, unidade `KG`, preco unitario `5.99`, valor total `395.34`.

## Builds executados na Fase 4.1

- `npm run build` em `apps/backend`: sucesso.
- `npm run build` em `apps/frontend`: sucesso fora do sandbox. Dentro do sandbox falhou por `spawn EPERM` ao iniciar esbuild/Vite.

## Pendencias restantes da Fase 4.1

- Implementar OCR somente em fase futura.
- Criar fixtures e testes automatizados do parser para formatos variados de edital.
- Cadastrar escolas reais no seed/base para permitir vinculo automatico quando a escola for extraida do PDF.
- Avaliar code splitting no frontend: o build passou, mas o Vite avisou que o bundle principal ficou acima de 500 kB.
