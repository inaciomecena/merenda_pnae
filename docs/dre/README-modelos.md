# Modelos editáveis e documentos do produtor

Os 15 PDFs desta pasta são as referências dos modelos iniciais: edital, anexos I a VII e sete declarações de produção própria e controle de limite. As cláusulas do edital e do contrato foram extraídas; os formulários foram reconstruídos com campos nomeados. O PDF do edital usa o layout institucional da referência: brasão, Times New Roman, margens, ementa à direita, parágrafos justificados, destaques, grades e numeração das páginas. O PDF original pode ser consultado no editor.

## Impressão do edital

O botão **Gerar edital** imprime o texto editável e os valores atuais, sem copiar o PDF original por cima. A tabela principal possui número, produto com especificação, unidade, quantidade, preço unitário e valor total. Suas páginas saem em A4 horizontal, com 51% da largura reservada ao produto/especificação e cabeçalho repetido nas continuações. A abertura, as cláusulas e os anexos continuam na vertical. Os modelos de projetos e a minuta do contrato saem com grades em branco; a lista completa de compras não se repete em cada formulário. Cada anexo começa em uma página própria. A quantidade de páginas acompanha o texto e os produtos selecionados.

A impressão usa Chrome/Chromium instalado no servidor. No Windows, o caminho padrão do Google Chrome é detectado automaticamente. Em outros ambientes, instale Chromium e as fontes Times New Roman ou Liberation Serif; se necessário, configure `PNAE_CHROME_PATH` (ou `PUPPETEER_EXECUTABLE_PATH`). Inclua `apps/backend/assets/dre/seduc-mt.png` no backend distribuído. A impressão bloqueia scripts e recursos externos dos modelos.

O layout dos modelos padrão antigos é recuperado durante a impressão, sem alterar os vínculos e as versões salvas. Edições próprias continuam sendo impressas com seu conteúdo e os elementos HTML permitidos. O DOCX e os documentos preenchidos do produtor mantêm seus fluxos de geração existentes.

Para reconstruir os parágrafos formatados a partir dos PDFs, instale `pymupdf` apenas no ambiente de desenvolvimento e execute `python apps/backend/scripts/extract-dre-layout.py`. O resultado versionado fica em `layout-dre-extraido.ts` e no PNG do brasão; Python não é necessário no servidor. A prévia local, sem alterar o edital nem seu histórico, pode ser gerada com `node scripts/preview-layout-edital.cjs ID_DO_EDITAL` na pasta do backend.

## Uso

1. **DRE → Templates de Anexos → Editar texto:** altere os textos, insira variáveis pelo catálogo, escolha a finalidade e o perfil do fornecedor e salve. Cada alteração do texto gera uma versão. O cadastro também permite criar modelos próprios.
2. **Extensionista → Produtores → Editar:** cadastre CAF/DAP, RG, CEP, dados bancários e os dados aplicáveis do grupo e do representante. Esses campos são reutilizados nos projetos.
3. **Propostas → Novo projeto / proposta:** escolha edital e produtor com balizamento aprovado; confira os itens e ajuste a quantidade ofertada.
4. **Anexos e declarações:** selecione o perfil e os modelos, complete os campos pendentes e use **Salvar e conferir** ou **Gerar PDF e DOCX**. O arquivo conjunto começa cada documento em uma página própria, pronto para assinatura.

O projeto guarda uma cópia da versão selecionada e dos valores preenchidos. Alterações posteriores no modelo da DRE não modificam esse texto salvo. A geração exige os campos obrigatórios, produtos com quantidade/preço/unidade e versões vigentes. Identificação e totais são conferidos contra o cadastro e os itens da proposta. Projetos finalizados não podem ser alterados.

Os dados complementares preenchidos no projeto são salvos na própria proposta. Para reutilizá-los em outros projetos, preencha o cadastro do produtor. Grupos usam os campos de participantes e de produtos por agricultor previstos nos PDFs; o extensionista deve conferir essas relações.

## Arquivos e manutenção

- `apps/backend/src/modules/composicao-editais/application/domain/templates-dre.ts`: formulários parametrizados dos anexos e declarações.
- `textos-extraidos.json`: extração dos PDFs de referência.
- `apps/backend/scripts/extract-dre.cjs`: atualiza essa extração.
- `apps/backend/scripts/build-dre-texts.cjs`: reconstrói o texto editável do edital e do contrato.
- `apps/backend/src/modules/composicao-editais/application/domain/campos-produtor.ts`: catálogo dos campos pedidos pelos formulários.

A inicialização semeia os modelos uma única vez, identificados por `codigoModelo`. Ela não sobrescreve edições, reativa modelos nem recria modelos excluídos. Versões já vinculadas a editais são mantidas; selecione a nova versão na composição do edital quando precisar atualizar um vínculo anterior. Versões antigas de PDF preservado não servem para preencher projetos: nesse caso, a seleção do extensionista oferece a versão editável atual.

Execute as migrações antes de iniciar o backend (`npm run dev --workspace apps/backend` já executa `prisma migrate deploy`). Os scripts de geração do cliente Prisma rodam antes de `dev` e `build`.

## Verificação

- `npm test --workspace apps/backend`
- `npm test --workspace apps/frontend`
- `node scripts/smoke-modelos-dre.cjs` (na pasta `apps/backend`): gera e lê PDFs/DOCXs com dados fictícios para os quatro perfis, sem alterar o banco.
- `node scripts/smoke-fluxo-dre.cjs` (backend local em `localhost:3000`): testa o fluxo autenticado entre DRE e extensionista com registros temporários no banco local, removidos ao final.
- `node scripts/smoke-editor-dre.cjs` (backend local, frontend em `localhost:5173`, Chrome instalado): confere a edição e o versionamento no navegador com registros temporários. A captura fica em `apps/backend/storage/validacao-editor/editor-dre.png`.

Os scripts que usam banco são destinados ao ambiente local de desenvolvimento. Não devem ser executados apontando para produção.
