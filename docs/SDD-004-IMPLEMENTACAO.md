# SDD-004 — Implementação e validação

**Data:** 11/10/2026  
**Branch:** `main`  
**Status de aceite:** **FAIL** — implementação funcional em código, ainda sem validação integrada em banco isolado nem testes automatizados da nova interface.

## 1. Objetivo e diagnóstico inicial

O SDD-004 programa entregas de contratos vigentes, registra recebimentos parciais, controla reservas e aceites, registra ocorrências e documentos e mostra execução física e financeira. Foram reutilizados contrato, item contratual, aditivo formalizado, fornecedor (`Produtor`), escola, DRE, auditoria, RBAC, storage e PDFKit do projeto.

Antes desta execução, a branch já continha schema, migração `20261010120001_sdd_004_entregas`, serviços e controladores SDD-004 parciais. A compilação backend falhava por imports, enum e consulta Prisma; a frontend falhava em páginas preexistentes de contratos. A documentação inicial não refletia todo o código disponível. O SDD-003 foi confirmado por schema, endpoints e telas de contratos, mas suas telas ainda tinham erros de compilação antes dos ajustes desta execução.

## 2. Arquitetura, entidades e relações

O módulo NestJS `EntregasModule` concentra programação, recebimento, ocorrências, saldo, documentos e acesso institucional. `ProgramacaoEntrega` pertence a `Contrato`, `Produtor`, `Escola` e `DRE`; seus itens referenciam `ContratoItem`. `Entrega` pertence a uma programação; seus itens referenciam itens programados. `OcorrenciaEntrega` referencia entrega e, opcionalmente, item entregue. `EntregaDocumento` guarda metadados, hash e versão dos arquivos. `EntregaEstorno` registra motivo, autor e snapshot das quantidades da entrega estornada, com unicidade por entrega.

Não foram recriadas tabelas existentes. O schema inclui relação e tabela novas apenas para `EntregaEstorno`. A migração `20261011120000_sdd_004_estornos` é aditiva e está **pendente** no MySQL configurado em `localhost:3306/merenda_pnae`. A migração preexistente do SDD-004 já constava como aplicada na consulta somente de leitura `prisma migrate status`. Nenhuma migração foi aplicada nesta execução. Antes de qualquer aplicação, validar em banco isolado, inspecionar backup e plano de rollback; o rollback da tabela de estornos não deve ser usado após haver registros.

## 3. Serviços, APIs e interfaces

### Programações

- `GET /api/v1/programacoes-entrega` — listagem paginada com filtros e escopo institucional.
- `GET /api/v1/programacoes-entrega/calendario/mes?mes=AAAA-MM` — eventos do mês, com sinal de truncamento acima de 1.000.
- `GET /api/v1/programacoes-entrega/:id` e `GET /:id/historico` — detalhes e histórico de auditoria para gestores.
- `POST /api/v1/programacoes-entrega` — rascunho; `PUT /:id` — edição ou reprogramação motivada sem entregas; `PATCH /:id/status`, `POST /:id/confirmar`, `POST /:id/cancelar` — transições.

### Entregas, ocorrências e documentos

- `GET /api/v1/entregas` e `GET /:id` — consultas com escopo; `POST /` — registro; `PATCH /:id/status`, `POST /:id/conferir`, `POST /:id/aceitar` — conferência e aceite.
- `POST /api/v1/entregas/:id/estornar` — estorno integral de aceite por ADMIN/DRE, com motivo obrigatório e registro imutável.
- `POST /api/v1/entregas/:id/ocorrencias`, `GET /.../ocorrencias`, `GET /api/v1/ocorrencias-entrega`, `POST /.../:id/tratar` e `PATCH /.../:id/status` — divergências e tratativas.
- `POST /api/v1/entregas/:id/documentos/termo` — PDF do termo; `POST /.../documentos` — anexo PDF/JPG/PNG até 10 MB; `GET /.../documentos/:documentoId` — download autorizado com conferência SHA-256. Cada geração e anexo cria nova versão. O PDF gerado traz campos para assinatura externa e não alega assinatura digital. Um PDF de termo ou recibo assinado fora do sistema pode ser anexado e identificado como `EXTERNA_DOCUMENTAL`.
- `GET /api/v1/saldos-contratos/:contratoId`, `GET /:contratoId/periodo` e `GET /execucao/geral` — saldos, período e painel agregado.

A tela `/entregas` apresenta cronograma paginado, calendário mensal, cadastro, detalhes, reprogramação, recebimentos, ocorrências, documentos e painel. As ações são condicionadas pelo perfil; a autorização efetiva ocorre no backend. O fornecedor usa a mesma tela apenas para consulta de seus próprios registros.

## 4. Regras de negócio e saldos

Somente contratos `VIGENTE`, dentro da vigência, com fornecedor e escola autorizada podem receber programação. Produto deve ser item do contrato. A escola deve pertencer ao contrato ou ao edital e possuir vínculo vigente com a DRE. Quantidade positiva e limite decimal de quatro casas são exigidos. Itens contratuais são bloqueados com `SELECT ... FOR UPDATE` antes de reservar e o saldo é revalidado na transação. Programações canceladas liberam a reserva pendente; reprogramações preservam itens anteriores por exclusão lógica e registram snapshot em auditoria.

O saldo não executado é quantidade contratada atualizada menos quantidade **aceita**. O disponível para nova programação é saldo não executado menos reservas ativas pendentes. Rejeição não baixa definitivamente o contrato: a reserva do item programado permanece até aceite de substituição ou cancelamento. Entregas parciais são aceitas separadamente e o total aceito por item não pode exceder o programado ou o saldo contratual. O aceite usa bloqueio de linha e atualização condicional do estado para impedir dupla contabilização. Estorno repõe quantidade disponível, recalcula reserva e mantém o recebimento original e o snapshot do estorno.

Valor aceito usa o preço capturado no item programado, inclusive após aditivos posteriores. O painel não cria empenho, liquidação nem pagamento. Aditivo de quantidade formalizado não pode reduzir o total abaixo do aceito mais reservado e atualiza o disponível descontando aceites anteriores.

## 5. Segurança e auditoria

As consultas recebem o usuário autenticado e aplicam filtros por DRE, escola ou fornecedor via `PolicyService`; detalhes e downloads verificam o vínculo no backend. As operações de gestão são ADMIN/DRE; recebimento é ADMIN/DRE/ESCOLA. Chaves de idempotência são vinculadas à operação, recurso e usuário. Mudanças críticas registram usuário, entidade, identificador, valores e horário no serviço de auditoria existente. O estorno também é gravado em tabela própria na mesma transação do ajuste de saldo. Arquivos aceitos têm tipo, tamanho e assinatura de conteúdo validados; downloads verificam caminho e hash.

## 6. Validações executadas

- `prisma validate`: **PASS** com URL fictícia, sem conexão ou mutação.
- `prisma migrate status`: consulta **somente de leitura** no MySQL local; migração de estorno pendente.
- Backend: `tsc --noEmit` **PASS** e compilação TypeScript para `.tmp/sdd004-backend` **PASS**.
- Frontend: `tsc --noEmit` **PASS** e build Vite para `.tmp/sdd004-frontend` **PASS**.
- Suíte backend anterior e testes SDD-004: **16 suítes, 57 testes PASS**; os testes específicos cobrem saldo decimal, preço histórico, isolamento de escopo, estorno e geração de PDF.
- Suíte frontend preexistente: 3 testes **PASS**. Não há ainda suíte automatizada de interação para a nova tela.
- Navegador Playwright com APIs simuladas: cronograma, calendário, detalhes/recebimento, formulário e painel exibidos; após ajuste de marcação HTML, zero erros de console no fluxo detalhado. Formulário observado também em viewport de 390 × 844 px. Este ensaio não substitui teste ponta a ponta com backend e banco.
- Consulta somente de leitura do dashboard no banco local: execução com zero contratos vigentes. Isso não valida agregações com dados reais.

## 7. Pendências, riscos e critérios de aceite

Ainda são necessárias migração e validação em banco isolado, testes integrados de concorrência e de autorização por vínculo, testes de interface e navegação, homologação com dados representativos e inspeção visual do termo PDF. O painel SQL com contratos e entregas reais não foi exercitado porque o ambiente consultado retornou zero contratos vigentes. O registro de auditoria genérico ocorre fora de algumas transações e o serviço compartilhado captura falhas de auditoria sem propagá-las; o estorno possui registro transacional específico. A interface usa lista de até 100 contratos/escolas ao cadastrar, exigindo paginação ou busca remota para bases maiores.

Portanto, os critérios de aceite **não estão integralmente comprovados**. Não declarar PASS até executar a migração em ambiente isolado e testes end to end das regras e da interface. O próximo trabalho deve permanecer no SDD-004; o SDD-005 não foi iniciado.
