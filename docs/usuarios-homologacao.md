# Usuarios de Homologacao

## Credenciais de Teste

**IMPORTANTE:** Estas sao credenciais de HOMOLOGACAO. Nao utilizar em producao.

### ADMIN

| Campo | Valor |
|-------|-------|
| Email | admin@sagae.gov.br |
| Senha | Admin@123 |
| Perfil | ADMIN |
| Nome | Administrador SAGAE |

### EXTENSIONISTA

| Campo | Valor |
|-------|-------|
| Email | extensionista@sagae.gov.br |
| Senha | Admin@123 |
| Perfil | EXTENSIONISTA |
| Nome | Extensionista EMPAER |

### ESCOLA

| Campo | Valor |
|-------|-------|
| Email | escola@sagae.gov.br |
| Senha | Admin@123 |
| Perfil | ESCOLA |
| Nome | Escola Teste |

## Fluxos por Perfil

### ADMIN
- Acesso total ao sistema
- Gerenciamento de usuarios
- Gerenciamento de municipios e escolas
- Visualizacao de auditoria
- Configuracoes do sistema
- Homologacao

### EXTENSIONISTA
- Cadastramento de produtores
- Cadastramento de producao
- Execucao de balizamento
- Aprovacao/rejeicao de matches
- Criacao de propostas
- Download de documentos

### ESCOLA
- Cadastramento de editais
- Importacao de PDFs
- Conferencia de itens
- Confirmacao de editais
- Visualizacao de propostas

## Dados de Teste

### Editais Disponiweiris

O sistema ja possui editais importados dos seguintes PDFs:
1. CHAMADA PUBLICA 2026 001 2025 - ALTO PARAGUAI (56 itens)
2. CHAMADA PUBLICA 2026 003 2025 - DIAMANTINO (56 itens)
3. PREGAO PRESENCIAL (115 itens)

### Produtores Disponiveis

- Joao da Silva - Alto Paraguai (20 itens)
- Maria Oliveira - Pontes e Lacerda (25 itens)
- Jose Santos - Caceres (30 itens)

## Regras de Seguranca

1. Alterar senhas apos homologacao
2. Revogar tokens de teste
3. Limpar dados de teste antes de producao
4. Nao exportar dados reais em ambiente de homologacao
