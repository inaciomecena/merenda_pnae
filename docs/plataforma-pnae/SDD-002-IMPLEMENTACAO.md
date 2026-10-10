# SDD-002 — implementação e evidências (10/10/2026)

**Estado: parcial, sem validação dinâmica em banco isolado.** O rascunho anterior foi preservado em `SDD-002-IMPLEMENTACAO-RASCUNHO_PREVIO.md`. Este documento registra apenas o que o código e os comandos desta execução demonstram. Não houve operação no banco ativo, commit, push ou deploy.

## Modelo e migrações

O schema Prisma acrescenta `EntidadeExecutora`, `DRE`, `VinculoEscolaDRE`, `VinculoUsuario` e `RepresentacaoFornecedor`, mantendo `User`, `Escola` e `Produtor` legados. Produtor tem perfil `PRODUTOR` e vínculo `VinculoUsuario.produtorId`; o acesso aponta para o cadastro existente. Representações têm vigência, revogação, autorizador (`createdBy`) e permissões `CONSULTAR`, `EDITAR_PRODUTOR` e `EDITAR_PROPOSTA`. O histórico de concessões permanece nas tabelas e no log de auditoria.

Migrações incrementais **criadas, não aplicadas**:

- `20261010000000_sdd_002_organizational_model`: entidades, DREs, vínculos e representações. Já existia como alteração local no início desta execução e foi preservada.
- `20261010001000_sdd_002_produtor_access`: role `PRODUTOR`, vínculo direto do usuário ao produtor e permissões da representação.

`backfill-sdd-002-preview.sql` lista usuários sem vínculos e identifica escopo escolar legado verificável. `backfill-sdd-002-apply.sql` faz tentativa transacional **com ROLLBACK por padrão**, somente para escola explicitamente ligada pelo `users.escolaId`. Não concede ADMIN, DRE, PRODUTOR ou representação por inferência. Admin precisa de concessão global explícita, revisada por responsável institucional, para bootstrap; usuários sem vínculo recebem pendência em `/auth/me/contexto` e as operações com `@Roles` são negadas. O `users.municipioId` legado de extensionista permanece no cadastro, mas não concede acesso a produtor sem representação.

## Backend: acesso efetivo

`JwtAuthGuard` consulta o usuário ativo no banco em cada requisição, ignorando role e escopos antigos no JWT. `RolesGuard` consulta vínculo ativo, vigente e compatível com a role atual. `UsersService` revoga vínculos e representações ativos quando a role muda ou o usuário é desativado. `PolicyService` fornece IDs autorizados e verificações por recurso. O cabeçalho opcional `X-Contexto-Vinculo` seleciona um vínculo vigente da mesma função; o guard recusa ID não autorizado e a política limita DRE, escola e produtor ao vínculo selecionado. Filtros do cliente só reduzem a lista.

| Perfil | Consultas e comandos implementados | Restrições |
|---|---|---|
| ADMIN | Administração de EEx, DRE, vínculo escola–DRE, vínculo de usuário e representação; módulos legados | Exige vínculo global `ADMIN` vigente |
| DRE | DRE própria, escolas ligadas e editais dessas escolas; dashboard e exportação resumidos | Não administra vínculos; módulos legados sem escopo foram fechados |
| ESCOLA | Escola própria, edital com `escolaId` legado ou `EditalEscola`, dashboard resumido | Propostas e documentos privados de fornecedor não são liberados apenas pela participação no edital |
| PRODUTOR | Próprio cadastro e produtos, propostas e documentos ligados ao produtor; dashboard resumido | Exige vínculo direto com produtor existente |
| EXTENSIONISTA | Fornecedores expressamente representados, propostas e documentos desses fornecedores; dashboard resumido | Cadastro, produtos e propostas só podem ser alterados com a permissão específica, dentro da vigência |

Endpoints disponíveis: `GET/POST/PUT /api/v1/entidades-executoras`, `GET/POST/PUT/DELETE /api/v1/dres`, `POST /api/v1/escolas/:id/vincular-dre`, `DELETE /api/v1/escolas/vinculos/:id`, `GET/POST/DELETE /api/v1/vinculos`, `GET/POST/PUT /api/v1/representacoes` conforme controllers, e `GET /api/v1/auth/me/contexto`. As rotas legadas de editais, escolas, produtores, propostas, documentos, dashboard e exportação receberam verificações de escopo nos caminhos indicados acima. O detalhamento da URI de vínculos e representações está nos controllers.

Módulos de importação, balizamento, relatórios e composição documental de edital ficaram **ADMIN** enquanto seus serviços não verificam integralmente IDs diretos e indiretos. A interface foi alinhada, mas isto impede a conclusão integral dos fluxos DRE/escola. `municipios` e `produtos-referencia` ainda expõem dados de catálogo aos perfis antigos. A navegação e o dashboard não apresentam contratos, entregas ou financeiro como módulos existentes.

## Interface

`AuthContext` carrega `/auth/me/contexto`, mostra pendência e permite selecionar vínculo válido quando há mais de um na mesma função. `Layout` filtra o menu por perfil e vínculo. Novas telas: `/organizacao` (cadastro e edição de EEx/DRE, vínculo e revogação escola–DRE) e `/vinculos` (concessão, consulta e revogação de função; autorização, alteração de permissões e revogação de representação), ambas ADMIN. `/editais/:id/consulta` é leitura de edital para DRE e escola sem abrir a composição restrita. Dashboard usa contagens realmente filtradas; indicadores sem implementação de escopo foram retirados da tela.

Limites da interface: edição de EEx/DRE cobre nome; demais campos e datas de vigência são mantidos pela API. A seleção de contexto serve a múltiplos vínculos da role atual; alternância de funções diferentes requer trocar o perfil principal do usuário. A interface de representação aceita referência do documento, sem upload próprio.

## Auditoria

Criação e alteração de EEx/DRE, concessão e revogação de vínculos e representação, e associação escola–DRE usam `AuditService`. Criação, edição e finalização de propostas, edição de cadastro e produtos, e salvamento/geração de documentos registram executor e fornecedor representado em metadados. O log evita copiar credenciais ou `dadosDocumentais`; o conteúdo antigo de auditoria e o rascunho prévio devem ser revisados antes de produção. `AuditService` ainda não é transacional com o comando de negócio e absorve falha de escrita de log: garantia forte de histórico é pendência.

## Testes e verificações realmente executados

- `npx prisma generate`: passou, sem conexão com banco.
- `npx tsc -p tsconfig.build.json --noEmit --incremental false`: passou.
- `npm test -- --silent`: 12 suítes e 47 testes passaram após atualização dos testes legados e inclusão de isolamento da política, edital consolidado, revalidação de vínculo, bloqueio de outra DRE e escopo do dashboard/exportação.
- `npx tsc -b --pretty false` no frontend: passou.
- `npm run build` no frontend: passou após a implementação das telas principais; a repetição final após a inclusão de revogação na tela de vínculos passou pelo `tsc -b`, mas permaneceu em `vite build`/`transforming` por mais de dois minutos e foi interrompida. `npx tsc -b --pretty false` passou após essa alteração.
- `npm run build` no backend: TypeScript compilou, mas a emissão falhou com `TS5033 UNKNOWN` ao gravar três arquivos existentes em `apps/backend/dist`. O `dist` tinha modificações locais desde o início da execução; não foi removido. A checagem sem emissão passou.
- Os builds alteraram artefatos gerados em `dist`. Os artefatos de backend já estavam modificados no início; foram preservados. A limpeza dos arquivos novos não versionados de frontend foi recusada pela revisão automática de comando; eles permanecem no workspace, sem afetar o código-fonte.

**Não executado:** migrações em MySQL isolado, restauração do dump, testes E2E com dois usuários reais por regional, downloads reais, geração PDF/DOCX, análise de desempenho e homologação da interface. O SDD-001 declara pendente sua validação dinâmica e arquivos `storage/`.

## Validação isolada e pendências

1. Provisionar um MySQL descartável em host, porta e banco distintos. Ler `SELECT DATABASE(), @@hostname, @@port` e confirmar que nenhum valor aponta para o banco ativo.
2. Se usar o dump, criar cópia saneada removendo ou substituindo `CREATE DATABASE` e `USE merenda_pnae`; conferir novamente o banco selecionado antes da importação. Não importar o original no servidor ativo.
3. Validar as duas migrações pendentes do SDD-001 e depois as duas do SDD-002 na cópia isolada. Conferir schema, índices, chaves e contagens de registros preservados.
4. Executar `backfill-sdd-002-preview.sql` e revisar nominalmente. Executar o script de aplicação em transação, conferir contagens, e só trocar `ROLLBACK` por `COMMIT` depois de aprovação e conferência da cópia. Conceder ADMIN, DRE, PRODUTOR e representação manualmente com evidência da autorização.
5. Exercitar contas A/B de DRE, escola, produtor e representante em listagens, IDs indiretos, documentos, downloads, dashboard e exportação; repetir após revogação e desativação com token antigo.

Pendências de código antes de concluir SDD-002: ampliar políticas por recurso para importação, balizamento, composição e relatórios; completar telas administrativas de edição/revogação; completar trilha transacional de auditoria; verificar criação de usuário e mudança de role sem ressuscitar vínculos antigos; testes E2E da matriz inteira. Não avançar ao SDD-003 como substituto dessas verificações.
