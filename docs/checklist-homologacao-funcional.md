# Checklist de Homologacao Funcional

## Status

- [ ] Pendente
- [ ] Em andamento
- [x] Concluido
- [ ] Bloqueado

---

## ADMIN

### Login
- [x] Acessar `/login`
- [x] Digitar email `admin@sagae.gov.br`
- [x] Digitar senha `Admin@123`
- [x] Clicar em "Entrar"
- [x] Verificar redirecionamento para `/dashboard`
- [x] Verificar nome do usuario no AppBar
- [x] Verificar selo de perfil (ADMIN)

### Cadastrar Municipio
- [x] Acessar `/municipios`
- [x] Clicar em "Novo"
- [x] Preencher nome
- [x] Preencher UF (MT)
- [x] Preencher codigo IBGE
- [x] Salvar
- [x] Verificar mensagem de sucesso
- [x] Verificar registro na tabela

### Cadastrar Escola
- [x] Acessar `/escolas`
- [x] Clicar em "Novo"
- [x] Selecionar municipio
- [x] Preencher nome
- [x] Preencher codigo INEP
- [x] Salvar
- [x] Verificar mensagem de sucesso

### Cadastrar Usuario
- [x] Acessar `/usuarios`
- [x] Clicar em "Novo"
- [x] Preencher nome
- [x] Preencher email
- [x] Selecionar perfil
- [x] Definir senha
- [x] Salvar
- [x] Verificar mensagem de sucesso

### Cadastrar Produto Referencia
- [x] Acessar `/produtos-referencia`
- [x] Clicar em "Novo"
- [x] Preencher nome
- [x] Preencher categoria
- [x] Preencher unidade padrao
- [x] Salvar
- [x] Verificar mensagem de sucesso

### Visualizar Auditoria
- [x] Acessar `/auditoria`
- [x] Verificar dashboard com metricas
- [x] Verificar tabela de logs
- [x] Aplicar filtros (acao, entidade, periodo)
- [x] Verificar detalhes de um log
- [x] Verificar pagina

### Visualizar Configuracoes
- [x] Acessar `/configuracoes`
- [x] Verificar configuracoes carregadas
- [x] Alterar uma configuracao
- [x] Salvar
- [x] Verificar mensagem de sucesso
- [x] Restaurar padroes
- [x] Verificar mensagem de sucesso

### Homologacao
- [x] Acessar `/homologacao`
- [x] Verificar status do banco
- [x] Verificar contadores
- [x] Verificar matches por status
- [x] Verificar propostas por status
- [x] Exportar CSV (itens, matches, propostas)
- [x] Baixar relatorio

---

## ESCOLA

### Login
- [x] Acessar `/login`
- [x] Digitar email `escola@sagae.gov.br`
- [x] Digitar senha `Admin@123`
- [x] Clicar em "Entrar"
- [x] Verificar redirecionamento para `/dashboard`

### Cadastrar Edital
- [x] Acessar `/editais`
- [x] Clicar em "Novo"
- [x] Preencher numero
- [x] Preencher ano
- [x] Preencher titulo
- [x] Selecionar municipio
- [x] Salvar
- [x] Verificar mensagem de sucesso

### Importar PDF
- [x] Acessar `/importacoes`
- [x] Clicar em "Importar"
- [x] Selecionar arquivo PDF
- [x] Enviar
- [x] Verificar mensagem de sucesso

### Processar PDF
- [x] Acessar `/importacoes`
- [x] Clicar em "Processar" na importacao
- [x] Verificar progresso
- [x] Verificar status "PROCESSADO" ou "PENDENTE_CONFERENCIA"

### Conferir Itens
- [x] Acessar detalhes da importacao
- [x] Verificar itens extraidos
- [x] Verificar itens com pendencia
- [x] Editar item pendente
- [x] Corrigir dados

### Confirmar Edital
- [x] Apos conferencia
- [x] Clicar em "Confirmar"
- [x] Verificar status "CONFIRMADO"
- [x] Verificar edital criado

### Visualizar Propostas
- [x] Acessar `/propostas`
- [x] Verificar propostas listadas
- [x] Filtrar por edital/produtor/status
- [x] Visualizar detalhes
- [x] Baixar PDF/DOCX (se gerado)

---

## EXTENSIONISTA

### Login
- [x] Acessar `/login`
- [x] Digitar email `extensionista@sagae.gov.br`
- [x] Digitar senha `Admin@123`
- [x] Clicar em "Entrar"
- [x] Verificar redirecionamento para `/dashboard`

### Cadastrar Produtor
- [x] Acessar `/produtores`
- [x] Clicar em "Novo"
- [x] Preencher nome
- [x] Preencher CPF/CNPJ
- [x] Selecionar municipio
- [x] Preencher endereco
- [x] Preencher telefone
- [x] Salvar
- [x] Verificar mensagem de sucesso

### Cadastrar Producao
- [x] Acessar detalhes do produtor
- [x] Adicionar produto
- [x] Preencher nome do produto
- [x] Preencher capacidade
- [x] Preencher periodo de producao
- [x] Preencher preco sugerido
- [x] Salvar
- [x] Verificar mensagem de sucesso

### Executar Balizamento
- [x] Acessar `/balizamento`
- [x] Selecionar edital
- [x] Executar match automatico
- [x] Verificar matches gerados
- [x] Verificar scores

### Revisar Matches
- [x] Verificar tabela de matches
- [x] Verificar detalhes de um match
- [x] Verificar score e motivo

### Aprovar Match
- [x] Selecionar match pendente
- [x] Clicar em "Aprovar"
- [x] Verificar status "APROVADO"
- [x] Verificar mensagem de sucesso

### Rejeitar Match
- [x] Selecionar match pendente
- [x] Clicar em "Rejeitar"
- [x] Informar motivo
- [x] Verificar status "REJEITADO"

### Criar Match Manual
- [x] Clicar em "Novo Match"
- [x] Selecionar item do edital
- [x] Selecionar produtor
- [x] Selecionar produto do produtor
- [x] Confirmar
- [x] Verificar match criado com status "APROVADO"

### Gerar Proposta
- [x] Acessar `/propostas`
- [x] Clicar em "Nova Proposta"
- [x] Selecionar edital
- [x] Selecionar produtor (com matches aprovados)
- [x] Selecionar tipo (Anexo III ou Projeto de Venda)
- [x] Visualizar preview
- [x] Criar proposta
- [x] Verificar proposta criada (status RASCUNHO)

### Baixar PDF
- [x] Acessar proposta gerada
- [x] Clicar em "Gerar documentos"
- [x] Aguardar geracao
- [x] Clicar em "Baixar PDF"
- [x] Verificar arquivo baixado

### Baixar DOCX
- [x] Acessar proposta gerada
- [x] Clicar em "Baixar DOCX"
- [x] Verificar arquivo baixado
- [x] Abrir e verificar conteudo editavel

---

## Validacao Geral

### Seguranca
- [x] Testar acesso sem token (deve redirecionar para login)
- [x] Testar acesso com perfil inadequado (deve bloquear)
- [x] Testar upload de arquivo invalido (deve rejeitar)
- [x] Testar tentativa de brute force (rate limit)

### Performance
- [x] Verificar tempo de carregamento das paginas
- [x] Verificar tempo de processamento de PDFs
- [x] Verificar tempo de geracao de documentos

### Usabilidade
- [x] Verificar mensagens de erro claras
- [x] Verificar feedback de sucesso
- [x] Verificar estados vazios
- [x] Verificar responsividade mobile

### Dados
- [x] Processar CHAMADA PUBLICA 2026 001 2025 - ALTO PARAGUAI
- [x] Processar CHAMADA PUBLICA 2026 003 2025 - DIAMANTINO
- [x] Processar PREGAO PRESENCIAL
- [x] Gerar pelo menos 1 proposta completa
- [x] Baixar PDF e DOCX
