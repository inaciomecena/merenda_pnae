# Relatório de Compatibilidade SDD-001

**Data:** 10/10/2026  
**Commit base:** `4fb165648cef9b1b340fb70478cd994015d93c6e`  
**Dump analisado:** `merenda.sql` (1024 linhas, 25 tabelas, 12 migrações aplicadas)  
**Status:** Análise estática concluída; validação em banco isolado pendente

---

## 1. Sumário executivo

O dump `merenda.sql` está **parcialmente compatível** com o schema Prisma atual. Identificamos **2 migrações pendentes** e **6 divergências de estrutura** que impedem a restauração direta sem perda de dados ou conflitos de schema.

**Principais achados:**
- ✓ 24 das 25 tabelas do schema existem no dump
- ✗ Tabela `pnae_system_config` ausente no dump
- ✗ 2 migrações aplicadas no código mas não no dump (09/10/2026)
- ⚠ 17 referências a arquivos em `storage\` não versionados
- ✓ Nenhuma migração aplicada no dump está ausente no repositório

**Risco de perda de dados:** Baixo — divergências são aditivas (colunas e tabela novas), não destrutivas.

---

## 2. Análise detalhada

### 2.1. Inventário de migrações

| Status | Migração | Aplicada no dump | No repositório |
|--------|----------|------------------|----------------|
| ✓ | 20260707133000_baseline_pre_fase_4 | Sim | Sim |
| ✓ | 20260707133640_fase_4_importador_pdf | Sim | Sim |
| ✓ | 20260707142051_fase_4_1_campos_texto_importador | Sim | Sim |
| ✓ | 20260707150500_fase_5_balizamento | Sim | Sim |
| ✓ | 20260708090000_inep_mt_municipios_escolas | Sim | Sim |
| ✓ | 20260708101000_fix_propostas_schema_local_mysql | Sim | Sim |
| ✓ | 20261008000000_user_scope | Sim | Sim |
| ✓ | 20261008010000_escola_inep_fields | Sim | Sim |
| ✓ | 20261008020000_create_audit_logs | Sim | Sim |
| ✓ | 20261008120000_add_edital_escolas_relation | Sim | Sim |
| ✓ | 20261008150000_composicao_documental_editais | Sim | Sim |
| ✓ | 20261008170000_template_pdf_format | Sim | Sim |
| **⚠** | **20261009090000_modelos_propostas** | **Não** | **Sim** |
| **⚠** | **20261009091000_dados_documentais_produtor** | **Não** | **Sim** |

**Conclusão:** O dump reflete o estado do banco até **09/10/2026 01:32 UTC** (última migração aplicada: `template_pdf_format`). As duas migrações subsequentes foram criadas no repositório mas não aplicadas no banco que originou o dump.

### 2.2. Divergências de estrutura

#### 2.2.1. Tabela `pnae_system_config` — AUSENTE

**Situação:** Model `SystemConfig` existe no `schema.prisma` (linhas 410-420) mas a tabela não está no dump.

**Estrutura esperada:**
```sql
CREATE TABLE `pnae_system_config` (
  `id` VARCHAR(191) NOT NULL,
  `chave` VARCHAR(191) NOT NULL,
  `valor` TEXT NOT NULL,
  `descricao` VARCHAR(191) NULL,
  `tipo` VARCHAR(191) NOT NULL DEFAULT 'texto',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pnae_system_config_chave_key`(`chave`)
);
```

**Causa provável:** Tabela criada manualmente no ambiente de desenvolvimento após o dump ou pela migração baseline mas não populada/exportada.

**Impacto:** Se o código existente depende de `SystemConfig` para configurações do sistema (ex: limites, versões de regras), queries falharão. Não há evidência no dump de uso ativo dessa tabela.

**Recomendação:** Incluir `CREATE TABLE IF NOT EXISTS pnae_system_config` na migração corretiva (ver Plano de Migração).

---

#### 2.2.2. Coluna `produtores.dadosDocumentais` — AUSENTE

**Situação:** Model `Produtor` no schema declara `dadosDocumentais Json?` (linha 242), mas a coluna não está na tabela `produtores` do dump.

**Estrutura do dump:**
```sql
CREATE TABLE IF NOT EXISTS `produtores` (
  `id` varchar(191) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `cpfCnpj` varchar(191) DEFAULT NULL,
  `municipioId` varchar(191) NOT NULL,
  `endereco` varchar(191) DEFAULT NULL,
  `telefone` varchar(191) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  -- createdAt, updatedAt, deletedAt, createdBy, updatedBy...
  -- SEM dadosDocumentais
);
```

**Origem da divergência:** Migração `20261009091000_dados_documentais_produtor` adiciona a coluna:
```sql
ALTER TABLE `produtores` ADD COLUMN `dadosDocumentais` JSON NULL;
```

Essa migração **não** está aplicada no dump.

**Impacto:** 
- Código que tenta gravar ou ler `produtor.dadosDocumentais` falhará.
- Seed scripts e testes que populam esse campo causarão erro.
- Módulo de propostas (`proposta-documentos.spec.ts`) possivelmente depende desse campo.

**Recomendação:** Aplicar a migração pendente antes de restaurar o dump em produção ou usar o dump somente após aplicar as 2 migrações pendentes.

---

#### 2.2.3. Coluna `pnae_templates_documento.codigoModelo` — AUSENTE

**Situação:** Model `TemplateDocumento` declara `codigoModelo String? @unique` (linha 463), mas a coluna não está no dump.

**Origem:** Mesma migração `20261009091000_dados_documentais_produtor`:
```sql
ALTER TABLE `pnae_templates_documento` ADD COLUMN `codigoModelo` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `pnae_templates_documento_codigoModelo_key` 
  ON `pnae_templates_documento`(`codigoModelo`);
```

**Impacto:** Se o sistema usa `codigoModelo` para identificar templates (ex: "ANEXO_III_GRUPO_FORMAL_V2"), queries e lookups falharão. A especificação menciona `codigoModelo` em MODELO_DADOS.md como identificador de versão de template.

**Recomendação:** Aplicar migração pendente.

---

#### 2.2.4. Coluna `pnae_propostas.documentosJson` — AUSENTE

**Situação:** Model `Proposta` declara `documentosJson String? @db.LongText` (linha 319), mas a coluna não está no dump.

**Origem:** Migração `20261009090000_modelos_propostas`:
```sql
ALTER TABLE `pnae_propostas` ADD COLUMN `documentosJson` LONGTEXT NULL;
```

**Estrutura do dump (pnae_propostas):**
```sql
-- Campos presentes: id, editalId, numero, status, observacao, 
-- createdAt, updatedAt, deletedAt, createdBy, updatedBy, produtorId, 
-- tipoDocumento, validadeDias, prazoEntrega, valorTotal, 
-- arquivoPdfPath, arquivoDocxPath
-- SEM documentosJson
```

**Impacto:** Se o módulo de propostas armazena metadados de documentos anexos (DAP, RG, comprovantes) em JSON nesse campo, a funcionalidade está quebrada. Spec `proposta-documentos.spec.ts` pode depender disso.

**Recomendação:** Aplicar migração pendente.

---

#### 2.2.5. Colunas `pnae_templates_documento.finalidade` e `.perfilFornecedor` — AUSENTES

**Situação:** Model declara:
```prisma
finalidade      String   @default("EDITAL")
perfilFornecedor String?
```

Mas o dump não contém essas colunas.

**Origem:** Migração `20261009090000_modelos_propostas`:
```sql
ALTER TABLE `pnae_templates_documento`
  ADD COLUMN `finalidade` VARCHAR(191) NOT NULL DEFAULT 'EDITAL',
  ADD COLUMN `perfilFornecedor` VARCHAR(191) NULL;
```

**Impacto:** 
- `finalidade` diferencia templates de edital, proposta, contrato, etc.
- `perfilFornecedor` filtra templates por "grupo_formal", "grupo_informal", "empreendimento".

Sem esses campos, o sistema não consegue selecionar o template correto para cada tipo de documento.

**Recomendação:** Aplicar migração pendente.

---

### 2.3. Referências a arquivos externos

O dump contém **17 referências** a caminhos de arquivo em `storage\templates\` e `storage\importacoes\`:

**Exemplos extraídos:**
```
storage\templates\dre-02_Anexo_I_Grupos_Formais.pdf
storage\templates\dre-03_Anexo_II_Grupos_Informais.pdf
storage\templates\dre-07_Anexo_VI_Resultado_Chamada_Publica.pdf
C:\Projetos\merenda_pnae\apps\backend\storage\importacoes\1791504835554-CHAMADA PÃBLICA 2026 001 2025 - ALTO PARAGUAI.pdf
```

**Situação atual:**
- Diretório `storage/` **NÃO EXISTE** no repositório
- Arquivos não versionados (correto, conforme boas práticas)
- Dump não inclui conteúdo binário dos arquivos

**Impacto:**
- Restauração do dump requer **recuperação manual** dos arquivos referenciados
- Geração de documentos e leitura de templates falharão se os PDFs/templates base não existirem
- Upload de editais importados terá referências órfãs

**Recomendação:**
1. Documentar localização original dos arquivos `storage/`
2. Incluir inventário de arquivos no plano de migração
3. Configurar backup de `storage/` separado do banco
4. Validar hash/integridade dos arquivos críticos (templates oficiais)

---

## 3. Compatibilidade de dados

### 3.1. Contagens (segundo dump)

| Tabela | Registros (aprox.) | Observação |
|--------|--------------------| -----------|
| `_prisma_migrations` | 12 | Histórico completo até 08/10 |
| `escolas` | 0 | Vazio |
| `municipios` | Não contado | Provavelmente carga INEP/MT |
| `pnae_template_versoes` | ~8 | Templates DRE Diamantino |
| `pnae_templates_documento` | ~8 | Modelos de anexos |
| `pnae_import_logs` | 1+ | Pelo menos 1 PDF importado |
| `produtores` | 2 (aprox.) | Poucos registros |
| Outras tabelas | 0 ou poucos | Sem carga volumosa |

**Conclusão:** Dump parece ser de **ambiente de desenvolvimento/testes**, não produção. Carga de dados é mínima.

### 3.2. Integridade referencial

**Não foi possível validar** órfãos, FKs quebradas ou dados inválidos sem restaurar o dump em banco isolado. A análise estática confirma:

- ✓ Todas as FKs declaradas no dump correspondem às relações do schema
- ✓ Enums do dump coincidem com os enums do Prisma
- ⚠ Não validado: registros com `deletedAt` não-nulo, timestamps futuros, CPF/CNPJ inválidos

**Recomendação:** Executar queries de validação após restauração em banco isolado (ver Plano de Migração, seção 4).

---

## 4. Checks executados (modo estático)

| Check | Método | Resultado |
|-------|--------|-----------|
| Tabelas do dump vs schema | Regex em SQL + parse schema | 24/25 compatíveis |
| Migrações aplicadas | Parse `_prisma_migrations` | 12/14 aplicadas |
| Colunas críticas | Grep em dump | 6 ausentes |
| Enums | Comparação textual | Compatíveis |
| FKs | Parse `CONSTRAINT` | Compatíveis |
| Índices | Parse `CREATE INDEX` | Compatíveis |
| Arquivos referenciados | Grep `storage` | 17 refs, dir ausente |

**Limitações da análise estática:**
- Não validou **tipos de dados** precisos (DECIMAL scale, TEXT vs LONGTEXT)
- Não detectou **dados inválidos** ou **órfãos**
- Não testou **performance de queries** com dados reais
- Não verificou **colisões de chave** ou **duplicatas**

---

## 5. Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Falha ao aplicar migrações pendentes | Baixa | Alto | Testar em banco isolado antes |
| Arquivos `storage/` perdidos | Alta | Médio | Recuperar backup ou recriar templates |
| Dados órfãos (FKs inválidas) | Média | Médio | Executar validação pós-restauração |
| `pnae_system_config` vazia causa erro | Média | Baixo | Seed após migração |
| Timestamps em timezone incorreto | Baixa | Baixo | Validar `America/Cuiaba` vs UTC |
| Colisão de IDs ao repovoar banco | Baixa | Alto | Não usar seed destrutivo |

---

## 6. O que está compatível

✓ **Estrutura base (12 migrações):** Municipios, Escolas, Editais, EditalItem, Produtor, ProdutorProduto, Proposta, PropostaItem, Match, ImportLog, AuditLog, EditalDocumento, templates, versões, campos, variáveis, anexos, importação estruturada.

✓ **Relações:** Todas as FKs do dump correspondem às relações Prisma.

✓ **Enums:** StatusEdital, StatusItemEdital, StatusImportacao, StatusMatch, OrigemMatch, StatusProposta, TipoProposta, Role, TipoDocumentoTemplate, FormatoTemplate, StatusComposicaoEdital, StatusGeracaoDocumento — todos compatíveis.

✓ **Índices:** Todos os índices declarados no dump estão presentes no schema ou são criados pelas migrações.

✓ **Auditoria:** Tabela `pnae_audit_logs` compatível; campos de rastreabilidade (createdBy, updatedBy, deletedAt) presentes.

---

## 7. O que requer correção

### 7.1. Antes de restaurar o dump

1. **Aplicar migrações pendentes** no código (ver Plano de Migração)
2. **Criar tabela `pnae_system_config`** se ainda não existir
3. **Recuperar arquivos `storage/`** ou documentar ausência

### 7.2. Após restaurar o dump

1. **Executar seed para `pnae_system_config`** se necessário
2. **Validar integridade referencial** (queries na seção 4 do Plano)
3. **Testar leitura/gravação** de todas as tabelas novas
4. **Verificar geração de documentos** (templates, PDFs)

---

## 8. Pendências para concluir SDD-001

- [ ] **Restaurar dump em banco MySQL isolado** (não no banco ativo)
- [ ] **Aplicar as 2 migrações pendentes** e validar schema resultante
- [ ] **Executar queries de validação de dados** (órfãos, inválidos)
- [ ] **Testar leitura de templates** e geração de PDFs
- [ ] **Documentar estado e localização de `storage/`** original
- [ ] **Conciliar contagens** antes/depois da restauração
- [ ] **Executar testes automatizados** contra banco restaurado
- [ ] **Gerar inventário de arquivos** em `storage/` e validar integridade
- [ ] **Confirmar timezone** de timestamps (UTC vs America/Cuiaba)
- [ ] **Testar rollback** (restore de backup pré-migração)

---

## 9. Conclusões e próximos passos

**Conclusão:** O dump `merenda.sql` está **apto para restauração** após aplicação das 2 migrações pendentes e recuperação dos arquivos `storage/`. Não há perda de dados prevista; as divergências são **aditivas**.

**Próximos passos (ordem recomendada):**

1. Criar banco MySQL isolado (ex: `merenda_pnae_test`)
2. Aplicar script de compatibilização (Plano de Migração, seção 2)
3. Restaurar dump no banco isolado
4. Aplicar migrações pendentes
5. Executar validações (Plano de Migração, seção 4)
6. Documentar resultados e atualizar este relatório

**Não executar no banco ativo:**
- `prisma migrate reset`
- `prisma migrate deploy` (até validar em isolado)
- `prisma db push`
- `prisma db seed` com flag destructive

---

**Relatório gerado por:** Script `validate-schema-compatibility.js`  
**Última atualização:** 10/10/2026
