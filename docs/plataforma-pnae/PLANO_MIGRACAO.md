# Plano de Migração SDD-001

**Objetivo:** Reconciliar o dump `merenda.sql` com o schema Prisma atual, aplicar migrações pendentes e validar integridade sem perda de dados.

**Premissas:**
- Dump reflete estado do banco até 09/10/2026 01:32 UTC
- Ambiente de destino: MySQL 5.7+ ou MariaDB 10.4+
- Timezone do servidor: UTC (conversão para America/Cuiaba na aplicação)
- Backup do banco ativo existe e foi testado antes de qualquer operação

**Restrições:**
- ❌ Não executar no banco ativo sem validação prévia
- ❌ Não usar `prisma migrate reset` (destrutivo)
- ❌ Não executar seed destrutivo
- ❌ Não versionar o dump ou arquivos `storage/`

---

## 1. Preparação do ambiente isolado

### 1.1. Criar banco de testes

```sql
-- Conectar ao MySQL como root ou admin
CREATE DATABASE IF NOT EXISTS `merenda_pnae_test` 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'merenda_test'@'localhost' 
  IDENTIFIED BY 'senha_forte_aqui';

GRANT ALL PRIVILEGES ON `merenda_pnae_test`.* 
  TO 'merenda_test'@'localhost';

FLUSH PRIVILEGES;
```

### 1.2. Configurar connection string isolada

```bash
# No diretório apps/backend, criar .env.test
cp .env .env.test
```

Editar `.env.test`:
```env
DATABASE_URL="mysql://merenda_test:senha_forte_aqui@localhost:3306/merenda_pnae_test"
```

**Importante:** Nunca commitar `.env.test` com credenciais reais.

### 1.3. Validar conexão

```bash
cd apps/backend
DATABASE_URL="mysql://merenda_test:senha_forte_aqui@localhost:3306/merenda_pnae_test" \
  npx prisma db execute --stdin < /dev/null
```

Se conectar sem erro, ambiente está pronto.

---

## 2. Aplicar correções ao schema antes da restauração

### 2.1. Criar migração de compatibilização

**Objetivo:** Garantir que todas as estruturas esperadas pelo schema existam antes de aplicar as migrações pendentes.

**Arquivo:** `apps/backend/prisma/migrations/20261010000000_compatibilidade_dump/migration.sql`

```sql
-- SDD-001: Migração de compatibilização do dump merenda.sql
-- Garante existência de pnae_system_config (ausente no dump)

CREATE TABLE IF NOT EXISTS `pnae_system_config` (
  `id` VARCHAR(191) NOT NULL,
  `chave` VARCHAR(191) NOT NULL,
  `valor` TEXT NOT NULL,
  `descricao` VARCHAR(191) NULL,
  `tipo` VARCHAR(191) NOT NULL DEFAULT 'texto',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pnae_system_config_chave_key`(`chave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configurações padrão (se a tabela estava vazia)
INSERT IGNORE INTO `pnae_system_config` (`id`, `chave`, `valor`, `descricao`, `tipo`, `createdAt`, `updatedAt`) VALUES
  (UUID(), 'versao_sistema', '1.0.0', 'Versão atual do sistema', 'texto', NOW(3), NOW(3)),
  (UUID(), 'ambiente', 'desenvolvimento', 'Ambiente de execução', 'texto', NOW(3), NOW(3));
```

**Não criar essa migração ainda.** Primeiro validamos o processo completo.

---

## 3. Processo de restauração e migração

### 3.1. Restaurar dump no banco isolado

```bash
# Limpar banco isolado (se necessário)
mysql -u merenda_test -p merenda_pnae_test -e "DROP DATABASE IF EXISTS merenda_pnae_test; CREATE DATABASE merenda_pnae_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Restaurar dump
mysql -u merenda_test -p merenda_pnae_test < merenda.sql

# Validar restauração
mysql -u merenda_test -p merenda_pnae_test -e "SHOW TABLES; SELECT COUNT(*) as migrações FROM _prisma_migrations;"
```

**Resultado esperado:** 25 tabelas, 12 migrações.

### 3.2. Aplicar migração de compatibilização

```bash
cd apps/backend

# Gerar cliente Prisma
npx prisma generate

# Criar e aplicar migração de compatibilização manualmente
mysql -u merenda_test -p merenda_pnae_test <<EOF
CREATE TABLE IF NOT EXISTS \`pnae_system_config\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`chave\` VARCHAR(191) NOT NULL,
  \`valor\` TEXT NOT NULL,
  \`descricao\` VARCHAR(191) NULL,
  \`tipo\` VARCHAR(191) NOT NULL DEFAULT 'texto',
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pnae_system_config_chave_key\`(\`chave\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registrar na tabela de migrações
INSERT INTO \`_prisma_migrations\` 
  (\`id\`, \`checksum\`, \`finished_at\`, \`migration_name\`, \`started_at\`, \`applied_steps_count\`)
VALUES
  (UUID(), 'compatibilidade_manual', NOW(3), '20261010000000_compatibilidade_dump', NOW(3), 1);
EOF
```

### 3.3. Aplicar migrações pendentes

```bash
# Aplicar as 2 migrações pendentes
DATABASE_URL="mysql://merenda_test:senha_forte_aqui@localhost:3306/merenda_pnae_test" \
  npx prisma migrate deploy

# Validar estado final
DATABASE_URL="mysql://merenda_test:senha_forte_aqui@localhost:3306/merenda_pnae_test" \
  npx prisma migrate status
```

**Resultado esperado:**
```
Database schema is up to date!
```

### 3.4. Verificar schema final

```bash
DATABASE_URL="mysql://merenda_test:senha_forte_aqui@localhost:3306/merenda_pnae_test" \
  npx prisma db pull --print

# Comparar com schema.prisma atual
diff <(cat prisma/schema.prisma) <(DATABASE_URL="..." npx prisma db pull --print)
```

Se não houver divergências, schema está compatível.

---

## 4. Validação de integridade

### 4.1. Queries de validação

Execute as queries abaixo no banco isolado para detectar problemas:

```sql
-- 4.1.1. Contagens por tabela (antes/depois)
SELECT 'escolas' as tabela, COUNT(*) as registros FROM escolas
UNION ALL SELECT 'municipios', COUNT(*) FROM municipios
UNION ALL SELECT 'produtores', COUNT(*) FROM produtores
UNION ALL SELECT 'pnae_editais', COUNT(*) FROM pnae_editais
UNION ALL SELECT 'pnae_edital_itens', COUNT(*) FROM pnae_edital_itens
UNION ALL SELECT 'pnae_propostas', COUNT(*) FROM pnae_propostas
UNION ALL SELECT 'pnae_matches', COUNT(*) FROM pnae_matches
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'pnae_system_config', COUNT(*) FROM pnae_system_config
UNION ALL SELECT 'pnae_audit_logs', COUNT(*) FROM pnae_audit_logs;

-- 4.1.2. Validar integridade referencial (órfãos)
-- Escolas sem município
SELECT e.id, e.nome, e.municipioId 
FROM escolas e
LEFT JOIN municipios m ON e.municipioId = m.id
WHERE m.id IS NULL;

-- Produtores sem município
SELECT p.id, p.nome, p.municipioId
FROM produtores p
LEFT JOIN municipios m ON p.municipioId = m.id
WHERE m.id IS NULL;

-- EditalItem sem edital
SELECT ei.id, ei.editalId
FROM pnae_edital_itens ei
LEFT JOIN pnae_editais e ON ei.editalId = e.id
WHERE e.id IS NULL;

-- Matches sem editalItem
SELECT m.id, m.editalItemId
FROM pnae_matches m
LEFT JOIN pnae_edital_itens ei ON m.editalItemId = ei.id
WHERE ei.id IS NULL;

-- Users com escolaId inválido
SELECT u.id, u.name, u.escolaId
FROM users u
LEFT JOIN escolas e ON u.escolaId = e.id
WHERE u.escolaId IS NOT NULL AND e.id IS NULL;

-- Users com municipioId inválido
SELECT u.id, u.name, u.municipioId
FROM users u
LEFT JOIN municipios m ON u.municipioId = m.id
WHERE u.municipioId IS NOT NULL AND m.id IS NULL;

-- 4.1.3. Validar novas colunas (devem existir e aceitar NULL)
SELECT 
  COUNT(*) as total_produtores,
  SUM(CASE WHEN dadosDocumentais IS NOT NULL THEN 1 ELSE 0 END) as com_dados_documentais
FROM produtores;

SELECT 
  COUNT(*) as total_templates,
  SUM(CASE WHEN codigoModelo IS NOT NULL THEN 1 ELSE 0 END) as com_codigo_modelo,
  SUM(CASE WHEN finalidade IS NOT NULL THEN 1 ELSE 0 END) as com_finalidade
FROM pnae_templates_documento;

SELECT 
  COUNT(*) as total_propostas,
  SUM(CASE WHEN documentosJson IS NOT NULL THEN 1 ELSE 0 END) as com_documentos_json
FROM pnae_propostas;

-- 4.1.4. Validar enums (não devem ter valores inválidos)
SELECT DISTINCT status FROM pnae_editais;
SELECT DISTINCT status FROM pnae_edital_itens;
SELECT DISTINCT status FROM pnae_propostas;
SELECT DISTINCT role FROM users;

-- 4.1.5. Validar timestamps (não devem estar no futuro)
SELECT 'editais' as tabela, COUNT(*) as futuros
FROM pnae_editais
WHERE createdAt > NOW()
UNION ALL
SELECT 'propostas', COUNT(*)
FROM pnae_propostas
WHERE createdAt > NOW();

-- 4.1.6. Validar soft deletes
SELECT 'escolas' as tabela, COUNT(*) as deletados
FROM escolas WHERE deletedAt IS NOT NULL
UNION ALL
SELECT 'produtores', COUNT(*) FROM produtores WHERE deletedAt IS NOT NULL
UNION ALL
SELECT 'pnae_editais', COUNT(*) FROM pnae_editais WHERE deletedAt IS NOT NULL;
```

**Critérios de aceite:**
- ✓ Nenhum órfão (FKs inválidas)
- ✓ Enums contêm apenas valores válidos
- ✓ Timestamps não estão no futuro (tolerância: 1 hora para timezone)
- ✓ Novas colunas existem e aceitam NULL

Se houver órfãos, documentar e decidir: corrigir manualmente ou aceitar como estado histórico.

---

## 5. Recuperação de arquivos storage/

### 5.1. Inventário de arquivos referenciados

**Extrair lista completa do dump:**

```bash
grep -oE "storage\\\\[^'\"]+\.(pdf|docx|png|jpg)" merenda.sql | sort -u > storage_refs.txt
```

**Arquivos identificados (amostra):**
```
storage\templates\dre-02_Anexo_I_Grupos_Formais.pdf
storage\templates\dre-03_Anexo_II_Grupos_Informais.pdf
storage\templates\dre-04_Anexo_III_Agricultor_Individual.pdf
storage\templates\dre-05_Anexo_IV_Empreendimento_Familiar.pdf
storage\templates\dre-06_Anexo_V_Unidades_Escolares.pdf
storage\templates\dre-07_Anexo_VI_Resultado_Chamada_Publica.pdf
storage\templates\dre-08_Anexo_VII_Relacao_Habilitados.pdf
storage\importacoes\1791504835554-CHAMADA PÃBLICA 2026 001 2025 - ALTO PARAGUAI.pdf
```

### 5.2. Plano de recuperação

**Opção A: Restaurar de backup**
```bash
# Se existe backup de storage/ do ambiente original
rsync -avz user@servidor-origem:/path/to/storage/ ./apps/backend/storage/
```

**Opção B: Recriar templates base**

Se os arquivos de templates da DRE Diamantino não estiverem disponíveis:

1. Baixar documentos originais de:
   - https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
   - https://drive.google.com/embeddedfolderview?id=1bk-jQ8YnjWwHmi1sWNFlzwCM-YmRjqbU

2. Renomear conforme padrão:
   ```
   02_Anexo_I_Grupos_Formais.pdf → storage/templates/dre-02_Anexo_I_Grupos_Formais.pdf
   03_Anexo_II_Grupos_Informais.pdf → storage/templates/dre-03_Anexo_II_Grupos_Informais.pdf
   ...
   ```

3. Validar hash (se houver registro anterior):
   ```bash
   sha256sum storage/templates/*.pdf > checksums.txt
   ```

**Opção C: Aceitar ausência temporária**

Se o sistema não depende criticamente dos arquivos para funcionar:
- Marcar templates como "arquivo base ausente" no banco
- Permitir re-upload ou configuração posterior
- Logar avisos mas não falhar ao iniciar

### 5.3. Estrutura de diretórios

```bash
mkdir -p apps/backend/storage/{templates,importacoes,documentos,exports}
chmod 755 apps/backend/storage
chmod 644 apps/backend/storage/templates/*.pdf
```

Adicionar ao `.gitignore`:
```
apps/backend/storage/*
!apps/backend/storage/.gitkeep
```

---

## 6. Testes de funcionalidade

### 6.1. Testes automatizados

```bash
cd apps/backend

# Executar testes contra banco isolado
DATABASE_URL="mysql://merenda_test:senha_forte_aqui@localhost:3306/merenda_pnae_test" \
  npm test

# Testes específicos de módulos afetados
DATABASE_URL="..." npm test -- match-engine.service.spec.ts
DATABASE_URL="..." npm test -- proposta-documentos.spec.ts
DATABASE_URL="..." npm test -- validacao-geracao.spec.ts
```

**Resultado esperado:** Todos os testes passam ou falhas são documentadas como "estado legado do dump".

### 6.2. Testes manuais críticos

| Funcionalidade | Endpoint/método | Validação |
|----------------|-----------------|-----------|
| Criar município | POST /municipios | 201, registro criado |
| Criar escola | POST /escolas | 201, FK para município válida |
| Criar produtor com dadosDocumentais | POST /produtores | 201, JSON armazenado |
| Listar templates com codigoModelo | GET /templates | 200, campo presente |
| Criar proposta com documentosJson | POST /propostas | 201, JSON armazenado |
| Gerar documento PDF | POST /editais/:id/gerar-documento | 200 ou 404 se template ausente |
| Ler SystemConfig | GET /system-config | 200, configurações padrão |

### 6.3. Smoke test do sistema completo

```bash
# Iniciar backend contra banco isolado
cd apps/backend
DATABASE_URL="mysql://merenda_test:senha_forte_aqui@localhost:3306/merenda_pnae_test" \
  npm run dev

# Em outro terminal, testar endpoints principais
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha"}'

# Se login funciona, testar criação de registro
curl -X POST http://localhost:3000/municipios \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Diamantino","uf":"MT","codigoIbge":"5103502"}'
```

---

## 7. Migração para produção (quando validado)

### 7.1. Pré-requisitos

- [ ] Todas as validações da seção 4 passaram
- [ ] Testes da seção 6 executados com sucesso
- [ ] Backup do banco ativo criado e testado (restore em banco separado)
- [ ] Arquivos `storage/` recuperados ou plano de contingência definido
- [ ] Janela de manutenção agendada (se necessário parar o sistema)
- [ ] Rollback plan documentado e testado

### 7.2. Procedimento de migração

**Cenário A: Banco ativo está vazio ou pode ser substituído**

```bash
# 1. Backup do banco ativo
mysqldump -u root -p merenda_pnae > backup_pre_migracao_$(date +%Y%m%d_%H%M%S).sql

# 2. Parar aplicação
pm2 stop merenda_pnae  # ou docker-compose down

# 3. Limpar banco ativo
mysql -u root -p -e "DROP DATABASE merenda_pnae; CREATE DATABASE merenda_pnae CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Restaurar dump
mysql -u root -p merenda_pnae < merenda.sql

# 5. Aplicar correções e migrações
mysql -u root -p merenda_pnae < compatibilidade.sql
DATABASE_URL="mysql://user:pass@localhost:3306/merenda_pnae" npx prisma migrate deploy

# 6. Copiar storage/
rsync -avz storage_backup/ apps/backend/storage/

# 7. Validar
DATABASE_URL="..." npx prisma migrate status

# 8. Reiniciar aplicação
pm2 start merenda_pnae
pm2 logs merenda_pnae --lines 50
```

**Cenário B: Banco ativo tem dados mais recentes (não coberto pelo dump)**

⚠ **ATENÇÃO:** Se o banco ativo foi modificado após a criação do dump, restaurar o dump causará **PERDA DE DADOS**.

Nesse caso:
1. **Não restaurar o dump diretamente**
2. Aplicar apenas as migrações pendentes no banco ativo:
   ```bash
   DATABASE_URL="<banco_ativo>" npx prisma migrate deploy
   ```
3. Se necessário, importar dados específicos do dump com `INSERT INTO ... SELECT` seletivos

### 7.3. Validação pós-migração

```bash
# Executar queries de validação da seção 4.1
mysql -u root -p merenda_pnae < validacao_integridade.sql

# Testar login e endpoints críticos
curl http://localhost:3000/health
curl -X POST http://localhost:3000/auth/login ...

# Monitorar logs por 10 minutos
tail -f logs/application.log | grep -i error
```

### 7.4. Rollback (se algo falhar)

```bash
# Parar aplicação
pm2 stop merenda_pnae

# Restaurar backup
mysql -u root -p -e "DROP DATABASE merenda_pnae; CREATE DATABASE merenda_pnae;"
mysql -u root -p merenda_pnae < backup_pre_migracao_<timestamp>.sql

# Reverter código (se migrações foram commitadas)
git revert <commit_hash>
npm install
npm run build

# Reiniciar aplicação
pm2 start merenda_pnae
```

---

## 8. Ordem de execução recomendada

### Fase 1: Validação (não altera banco ativo)
1. ✓ Executar `validate-schema-compatibility.js` (concluído)
2. ✓ Ler RELATORIO_COMPATIBILIDADE.md (concluído)
3. Criar banco MySQL isolado (seção 1.1)
4. Restaurar dump no banco isolado (seção 3.1)
5. Aplicar compatibilização e migrações (seções 3.2-3.3)
6. Executar validações (seção 4)
7. Executar testes (seção 6)
8. Documentar resultados

### Fase 2: Recuperação de arquivos
9. Inventariar storage/ (seção 5.1)
10. Recuperar ou recriar arquivos (seção 5.2)
11. Validar templates e importações (seção 5.3)

### Fase 3: Migração (quando aprovado)
12. Criar backup do banco ativo (seção 7.1)
13. Escolher cenário A ou B (seção 7.2)
14. Executar migração em horário de baixo uso
15. Validar integridade e funcionalidade (seção 7.3)
16. Monitorar sistema por 24h

---

## 9. Correções específicas por divergência

### 9.1. SystemConfig ausente

**Migração:** Criar tabela e seed

```sql
-- Já incluído na compatibilização (seção 2.1)
CREATE TABLE IF NOT EXISTS `pnae_system_config` (...);

-- Seed de configurações essenciais
INSERT IGNORE INTO `pnae_system_config` 
  (`id`, `chave`, `valor`, `descricao`, `tipo`)
VALUES
  (UUID(), 'limite_individual_ano', '40000', 'Limite anual por agricultor individual (R$)', 'decimal'),
  (UUID(), 'limite_grupo_ano', '200000', 'Limite anual por grupo (R$)', 'decimal'),
  (UUID(), 'percentual_minimo_pnae', '30', 'Percentual mínimo de recursos do PNAE para agricultura familiar', 'inteiro'),
  (UUID(), 'vigencia_resolucao', '2026-02-26', 'Data de vigência da Resolução CD/FNDE nº 4/2026', 'data');
```

**Validação:**
```sql
SELECT * FROM pnae_system_config;
-- Deve retornar pelo menos 4 registros
```

### 9.2. dadosDocumentais em Produtor

**Migração:** Já incluída em `20261009091000_dados_documentais_produtor`

```sql
ALTER TABLE `produtores` ADD COLUMN `dadosDocumentais` JSON NULL;
```

**Backfill (se necessário):**
```sql
-- Se existirem produtores com dados estruturados em outras tabelas legadas:
UPDATE produtores SET dadosDocumentais = JSON_OBJECT(
  'dap', NULL,
  'rg', NULL,
  'cpf', cpfCnpj,
  'endereco_completo', endereco
)
WHERE dadosDocumentais IS NULL;
```

**Validação:**
```typescript
// Em teste ou seed
await prisma.produtor.create({
  data: {
    nome: 'João Silva',
    cpfCnpj: '123.456.789-00',
    municipioId: '<uuid>',
    dadosDocumentais: {
      dap: 'MT-123456-7',
      rg: '1234567 SSP/MT',
      dataEmissaoDAP: '2025-01-15'
    }
  }
});
```

### 9.3. codigoModelo em TemplateDocumento

**Migração:** Já incluída em `20261009091000_dados_documentais_produtor`

```sql
ALTER TABLE `pnae_templates_documento` ADD COLUMN `codigoModelo` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `pnae_templates_documento_codigoModelo_key` 
  ON `pnae_templates_documento`(`codigoModelo`);
```

**Backfill:**
```sql
-- Atribuir códigos aos templates existentes
UPDATE pnae_templates_documento 
SET codigoModelo = CONCAT('ANEXO_', UPPER(REPLACE(tipo, 'ANEXO_', '')), '_V1')
WHERE codigoModelo IS NULL AND tipo LIKE 'ANEXO_%';

UPDATE pnae_templates_documento
SET codigoModelo = 'EDITAL_PRINCIPAL_V1'
WHERE codigoModelo IS NULL AND tipo = 'EDITAL_PRINCIPAL';
```

**Validação:**
```sql
SELECT id, tipo, codigoModelo FROM pnae_templates_documento;
-- Todos devem ter codigoModelo único
```

### 9.4. documentosJson em Proposta

**Migração:** Já incluída em `20261009090000_modelos_propostas`

```sql
ALTER TABLE `pnae_propostas` ADD COLUMN `documentosJson` LONGTEXT NULL;
```

**Estrutura esperada (exemplo):**
```json
{
  "dap": {
    "arquivo": "storage/propostas/123/dap.pdf",
    "hash": "sha256:abc...",
    "validade": "2027-12-31"
  },
  "comprovante_residencia": {
    "arquivo": "storage/propostas/123/comprovante.pdf",
    "hash": "sha256:def..."
  }
}
```

**Validação:**
```typescript
await prisma.proposta.update({
  where: { id: '<uuid>' },
  data: {
    documentosJson: JSON.stringify({
      dap: { arquivo: 'teste.pdf', hash: 'abc123' }
    })
  }
});
```

### 9.5. finalidade e perfilFornecedor em TemplateDocumento

**Migração:** Já incluída em `20261009090000_modelos_propostas`

```sql
ALTER TABLE `pnae_templates_documento`
  ADD COLUMN `finalidade` VARCHAR(191) NOT NULL DEFAULT 'EDITAL',
  ADD COLUMN `perfilFornecedor` VARCHAR(191) NULL;
```

**Backfill:**
```sql
-- Atribuir finalidade correta aos templates
UPDATE pnae_templates_documento
SET finalidade = CASE
  WHEN tipo = 'EDITAL_PRINCIPAL' THEN 'EDITAL'
  WHEN tipo LIKE 'ANEXO_I%' OR tipo LIKE 'ANEXO_II%' THEN 'PROPOSTA'
  WHEN tipo LIKE 'ANEXO_III%' THEN 'PROPOSTA'
  WHEN tipo LIKE 'ANEXO_VI%' THEN 'RESULTADO'
  ELSE 'EDITAL'
END
WHERE finalidade = 'EDITAL'; -- Se todos foram criados com default

-- Atribuir perfil de fornecedor
UPDATE pnae_templates_documento
SET perfilFornecedor = CASE
  WHEN titulo LIKE '%Grupo%formal%' THEN 'grupo_formal'
  WHEN titulo LIKE '%Grupo%informal%' THEN 'grupo_informal'
  WHEN titulo LIKE '%Empreendimento%' THEN 'empreendimento'
  WHEN titulo LIKE '%Individual%' THEN 'individual'
  ELSE NULL
END
WHERE finalidade = 'PROPOSTA';
```

**Validação:**
```sql
SELECT tipo, titulo, finalidade, perfilFornecedor 
FROM pnae_templates_documento;

-- Verificar que templates de proposta têm perfil adequado
```

---

## 10. Scripts auxiliares

### 10.1. Script de validação completa

**Arquivo:** `apps/backend/scripts/validar-migracao.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validarMigracao() {
  console.log('=== Validação de Migração SDD-001 ===\n');

  // 1. Contagens
  const contagens = {
    municipios: await prisma.municipio.count(),
    escolas: await prisma.escola.count(),
    produtores: await prisma.produtor.count(),
    editais: await prisma.edital.count(),
    propostas: await prisma.proposta.count(),
    systemConfig: await prisma.systemConfig.count(),
  };
  
  console.log('Contagens:', contagens);

  // 2. Validar novas colunas
  const produtorComDados = await prisma.produtor.findFirst({
    where: { dadosDocumentais: { not: null } }
  });
  console.log('Produtor com dadosDocumentais:', produtorComDados ? '✓' : '⚠ nenhum');

  const templateComCodigo = await prisma.templateDocumento.findFirst({
    where: { codigoModelo: { not: null } }
  });
  console.log('Template com codigoModelo:', templateComCodigo ? '✓' : '⚠ nenhum');

  // 3. Órfãos
  const escolaSemMunicipio = await prisma.escola.count({
    where: { municipio: null }
  });
  console.log('Escolas sem município:', escolaSemMunicipio === 0 ? '✓' : `⚠ ${escolaSemMunicipio}`);

  // 4. SystemConfig
  const configs = await prisma.systemConfig.findMany();
  console.log('SystemConfig entries:', configs.length);
  
  console.log('\n✓ Validação concluída');
}

validarMigracao()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Executar:**
```bash
DATABASE_URL="..." npx ts-node scripts/validar-migracao.ts
```

### 10.2. Script de backup automático

```bash
#!/bin/bash
# backup-pre-migracao.sh

DB_NAME="merenda_pnae"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Criando backup de $DB_NAME..."
mysqldump -u root -p "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
  echo "✓ Backup criado: $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
  
  # Testar restore em banco temporário
  echo "Testando restore..."
  mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME}_test_restore;"
  mysql -u root -p "${DB_NAME}_test_restore" < "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
  
  if [ $? -eq 0 ]; then
    echo "✓ Restore validado com sucesso"
    mysql -u root -p -e "DROP DATABASE ${DB_NAME}_test_restore;"
  else
    echo "✗ ERRO: Restore falhou. Backup pode estar corrompido."
    exit 1
  fi
else
  echo "✗ ERRO: Backup falhou"
  exit 1
fi
```

---

## 11. Checklist final

Antes de considerar o SDD-001 concluído:

### Validação técnica
- [ ] Dump restaurado em banco isolado sem erros
- [ ] Todas as 14 migrações aplicadas com sucesso
- [ ] Schema final idêntico ao `schema.prisma`
- [ ] Nenhum órfão detectado nas queries de validação
- [ ] Novas colunas existem e aceitam dados
- [ ] Testes automatizados passam
- [ ] Smoke test manual executado

### Arquivos e documentação
- [ ] storage/ recuperado ou ausência documentada
- [ ] Inventário de arquivos completo
- [ ] RELATORIO_COMPATIBILIDADE.md finalizado
- [ ] PLANO_MIGRACAO.md finalizado (este documento)
- [ ] Scripts de validação testados
- [ ] Backup do banco ativo criado e validado

### Preparação para produção
- [ ] Procedimento de migração documentado
- [ ] Rollback plan testado
- [ ] Janela de manutenção acordada (se necessário)
- [ ] Equipe de suporte notificada
- [ ] Monitoramento configurado

---

**Plano aprovado por:** _________________  
**Data de execução planejada:** _________________  
**Responsável pela execução:** _________________
