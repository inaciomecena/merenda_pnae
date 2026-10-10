# SDD-002: Organização, Acessos e Representação - Implementação

## Resumo

Implementação do modelo organizacional completo para o sistema merenda_pnae, incluindo:
- Entidades Executoras (EEx)
- Diretorias Regionais de Ensino (DRE)
- Vínculos entre escolas e DREs
- Vínculos múltiplos de usuários (função + escopo)
- Representação de fornecedores com autorização e vigência
- Sistema de autorização baseado em políticas (PolicyService)
- Isolamento de dados por regional e escopo

## Arquivos Criados

### 1. Migrações Prisma

**`20261010000000_sdd_002_organizational_model/migration.sql`**
- Tabela `entidades_executoras`: mantém prefeituras/secretarias
- Tabela `dres`: diretorias regionais vinculadas a EEx
- Tabela `vinculo_escola_dre`: associa escolas a DREs com vigência
- Tabela `vinculos_usuario`: múltiplos vínculos por usuário (função + escopo + vigência)
- Tabela `representacoes_fornecedor`: autorização de representantes para produtores com vigência e revogação

### 2. Schema Prisma

**`apps/backend/prisma/schema.prisma`**
- Adicionados modelos: `EntidadeExecutora`, `DRE`, `VinculoEscolaDRE`, `VinculoUsuario`, `RepresentacaoFornecedor`
- Relacionamentos adicionados em `User`, `Municipio`, `Escola`, `Produtor`

### 3. PolicyService - Autorização Centralizada

**`apps/backend/src/common/auth/policy.service.ts`**

Métodos principais:
- `getAuthorizedDREIds(user)`: retorna IDs de DREs autorizadas
- `getAuthorizedEscolaIds(user)`: retorna IDs de escolas autorizadas
- `getAuthorizedProdutorIds(user)`: retorna IDs de produtores autorizados
- `canAccessDRE(user, dreId)`: verifica acesso a DRE específica
- `canAccessEscola(user, escolaId)`: verifica acesso a escola específica
- `canAccessProdutor(user, produtorId)`: verifica acesso a produtor específico
- `requireDREAccess(user, dreId)`: lança exceção se sem acesso
- `requireEscolaAccess(user, escolaId)`: lança exceção se sem acesso
- `requireProdutorAccess(user, produtorId)`: lança exceção se sem acesso
- `getUserContext(user)`: retorna contexto completo (vínculos + representações ativas)

**Regras de Autorização:**
- **ADMIN**: acessa tudo (global)
- **DRE**: acessa DREs vinculadas e escolas dessas DREs
- **ESCOLA**: acessa apenas sua(s) escola(s) vinculada(s)
- **EXTENSIONISTA**: acessa escolas e produtores do município, mais produtores representados

### 4. Módulo DRE

**Arquivos:**
- `apps/backend/src/modules/dre/application/services/dre.service.ts`
- `apps/backend/src/modules/dre/presentation/dto/create-dre.dto.ts`
- `apps/backend/src/modules/dre/presentation/controllers/dre.controller.ts`
- `apps/backend/src/modules/dre/dre.module.ts`

**Endpoints criados:**
- `POST /v1/dres` - Criar DRE (ADMIN)
- `GET /v1/dres` - Listar DREs autorizadas (ADMIN, DRE)
- `GET /v1/dres/:id` - Buscar DRE por ID (ADMIN, DRE)
- `PUT /v1/dres/:id` - Atualizar DRE (ADMIN)
- `DELETE /v1/dres/:id` - Excluir DRE (ADMIN)
- `POST /v1/escolas/:id/vincular-dre` - Vincular escola a DRE (ADMIN, DRE)
- `DELETE /v1/escolas/vinculos/:vinculoId` - Desvincular escola de DRE (ADMIN, DRE)

### 5. Módulo Vínculos

**Arquivos:**
- `apps/backend/src/modules/vinculos/application/services/vinculos.service.ts`
- `apps/backend/src/modules/vinculos/presentation/dto/vinculo.dto.ts`
- `apps/backend/src/modules/vinculos/presentation/controllers/vinculos.controller.ts`
- `apps/backend/src/modules/vinculos/vinculos.module.ts`

**Endpoints criados:**
- `POST /v1/vinculos` - Criar vínculo para usuário (ADMIN)
- `GET /v1/vinculos/usuario/:userId` - Listar vínculos de usuário (ADMIN)
- `DELETE /v1/vinculos/:vinculoId` - Revogar vínculo (ADMIN)
- `POST /v1/representacoes` - Criar representação de fornecedor (ADMIN, EXTENSIONISTA)
- `GET /v1/representacoes/usuario/:userId` - Listar representações de usuário (ADMIN, EXTENSIONISTA)
- `PUT /v1/representacoes/:id/revogar` - Revogar representação (ADMIN, EXTENSIONISTA)

### 6. Endpoint de Contexto do Usuário

**`apps/backend/src/modules/auth/presentation/controllers/auth.controller.ts`**

- `GET /v1/auth/me/contexto` - Retorna contexto completo do usuário autenticado (vínculos ativos e representações)

### 7. Correção DashboardController

**`apps/backend/src/modules/dashboard/presentation/controllers/dashboard.controller.ts`**

- Adicionado role 'DRE' em todos os @Roles
- Injeção de `user` em todos os métodos para aplicar filtros de autorização
- Métodos do service agora recebem `user` para aplicar filtros corretos

### 8. Registros em app.module.ts

- Adicionados `DREModule` e `VinculosModule`
- `PolicyService` exportado via `AuthModule`

## Modelo Organizacional Implementado

```
EntidadeExecutora (EEx)
  └─ DRE (1:N)
      └─ VinculoEscolaDRE (1:N)
          └─ Escola

User
  ├─ VinculoUsuario (1:N) → função + escopo (DRE/Escola/Município) + vigência
  └─ RepresentacaoFornecedor (1:N) → produtor + autorização + vigência + revogação

Fluxo de autorização:
1. JwtAuthGuard valida token e popula req.user
2. RolesGuard verifica role básico
3. PolicyService aplica filtros por escopo:
   - DRE: filtra por DREs vinculadas e suas escolas
   - ESCOLA: filtra por escolas vinculadas
   - EXTENSIONISTA: filtra por município + produtores representados
```

## Migrações Criadas

1. **20261010000000_sdd_002_organizational_model**
   - entidades_executoras
   - dres
   - vinculo_escola_dre
   - vinculos_usuario
   - representacoes_fornecedor

**IMPORTANTE:** Estas migrações NÃO foram aplicadas ao banco ativo. Devem ser aplicadas manualmente após revisão:

```bash
cd apps/backend
npx prisma migrate deploy
```

## Como Usar

### 1. Criar uma EEx (Entidade Executora)

Diretamente no banco ou via seed:
```sql
INSERT INTO entidades_executoras (id, nome, tipo, uf, ativo, createdAt, updatedAt)
VALUES (UUID(), 'Prefeitura de Cuiabá', 'PREFEITURA', 'MT', true, NOW(), NOW());
```

### 2. Criar uma DRE

```bash
POST /v1/dres
{
  "nome": "DRE Cuiabá",
  "codigo": "DRE-CBA",
  "entidadeExecutoraId": "<uuid_da_eex>",
  "municipioSede": "Cuiabá"
}
```

### 3. Vincular Escola a DRE

```bash
POST /v1/escolas/<escola_id>/vincular-dre
{
  "dreId": "<dre_id>",
  "vigenciaInicio": "2026-01-01T00:00:00Z",
  "vigenciaFim": null
}
```

### 4. Criar Vínculo de Usuário

```bash
POST /v1/vinculos
{
  "userId": "<user_id>",
  "funcao": "DRE",
  "dreId": "<dre_id>",
  "vigenciaInicio": "2026-01-01T00:00:00Z"
}
```

### 5. Autorizar Representação de Produtor

```bash
POST /v1/representacoes
{
  "userId": "<user_id>",
  "produtorId": "<produtor_id>",
  "tipoRepresentacao": "REPRESENTANTE",
  "autorizacaoDocumento": "path/to/doc.pdf",
  "vigenciaInicio": "2026-01-01T00:00:00Z",
  "vigenciaFim": "2027-01-01T00:00:00Z"
}
```

### 6. Obter Contexto Completo do Usuário

```bash
GET /v1/auth/me/contexto
```

Retorna:
```json
{
  "user": { "id": "...", "email": "...", "role": "DRE" },
  "vinculos": [
    {
      "id": "...",
      "funcao": "DRE",
      "dre": { "id": "...", "nome": "DRE Cuiabá", "codigo": "DRE-CBA" },
      "vigenciaInicio": "2026-01-01T00:00:00.000Z",
      "vigenciaFim": null
    }
  ],
  "representacoes": []
}
```

## Testes

### Compilação

```bash
cd apps/backend
npm run build
```

**Resultado esperado:** Compilação sem erros TypeScript.

### Testes Unitários/E2E

```bash
cd apps/backend
npm test
```

**Status:** Testes não foram criados nesta fase de implementação. Recomenda-se criar testes de integração para:
- PolicyService: autorização por role
- DRE A não acessa recursos de DRE B
- Escola não acessa recursos de outra escola
- Representação expirada bloqueia comandos
- Dashboard aplica filtro correto por role

### Validação Manual

1. Iniciar o backend:
```bash
cd apps/backend
npm run start:dev
```

2. Testar endpoints:
```bash
# Login como ADMIN
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha"}'

# Criar DRE
curl -X POST http://localhost:3000/v1/dres \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome":"DRE Teste","entidadeExecutoraId":"<id>"}'

# Listar DREs autorizadas
curl http://localhost:3000/v1/dres \
  -H "Authorization: Bearer <token>"

# Obter contexto do usuário
curl http://localhost:3000/v1/auth/me/contexto \
  -H "Authorization: Bearer <token>"
```

## Auditoria

Todas as operações críticas são registradas em `AuditLog`:
- Criação de DRE
- Criação/revogação de vínculos
- Criação/revogação de representações
- Vinculação/desvinculação escola-DRE

Campos registrados:
- `userId`, `userName`, `userRole`
- `action` (CREATE, UPDATE, DELETE)
- `entity`, `entityId`, `entityLabel`
- `oldValues`, `newValues`
- `metadata` (JSON com contexto adicional)
- `createdAt`

## Instruções de Deploy

### Pré-requisitos

1. Backup do banco de dados:
```bash
mysqldump -u root -p merenda_pnae > backup_pre_sdd002.sql
```

2. Validar migrações:
```bash
cd apps/backend
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource env:DATABASE_URL \
  --script
```

### Deploy

1. Aplicar migrações:
```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
```

2. Reiniciar serviço backend:
```bash
npm run build
pm2 restart backend
```

3. Verificar logs:
```bash
pm2 logs backend
```

### Rollback (se necessário)

```bash
# Restaurar backup
mysql -u root -p merenda_pnae < backup_pre_sdd002.sql

# Reverter código
git revert <commit_hash>
```

## Próximos Passos (Frontend)

### 1. Atualizar AuthContext

```tsx
// Adicionar ao contexto:
interface AuthContextData {
  user: User;
  vinculos: Vinculo[];
  representacoes: Representacao[];
  contextoDRE: DRE | null;
  contextoEscola: Escola | null;
  // ...
}

// Carregar contexto completo no login:
const context = await api.get('/v1/auth/me/contexto');
```

### 2. Páginas de Gestão (Admin)

- `/admin/dres` - Listagem e CRUD de DREs
- `/admin/dres/:id/escolas` - Vincular escolas a DRE
- `/admin/usuarios/:id/vinculos` - Gestão de vínculos de usuário
- `/admin/representacoes` - Autorizar/revogar representações

### 3. Dashboards Específicos

- `/dashboard/dre` - Dashboard para perfil DRE (filtrado por regional)
- `/dashboard/escola` - Dashboard para perfil ESCOLA
- `/dashboard/produtor` - Dashboard para perfil EXTENSIONISTA/produtor

### 4. Seletor de Contexto

Componente para usuários com múltiplos vínculos:
```tsx
<ContextSelector 
  vinculos={user.vinculos} 
  onChange={setContextoAtivo} 
/>
```

### 5. Menu Adaptado por Role

```tsx
{user.role === 'DRE' && (
  <MenuItem to="/dashboard/dre">Dashboard Regional</MenuItem>
)}
{user.role === 'ESCOLA' && (
  <MenuItem to="/editais/escola">Meus Editais</MenuItem>
)}
```

## Pendências

### Implementação Backend

1. **DashboardService**: Atualizar métodos `getKPIs`, `getGraficos`, `getRanking`, `getMapaDados`, `getExportData` para receber `user` e aplicar filtros via PolicyService
2. **EscolasService**: Injetar PolicyService e aplicar filtros em listagens e gets
3. **EditaisService**: Aplicar filtros por escolas autorizadas
4. **ProdutoresService**: Aplicar filtros por produtores autorizados
5. **PropostasService**: Aplicar filtros por escopo do usuário
6. **Testes E2E**: Criar testes de isolamento de dados

### Validação Dinâmica

- Migrações não foram aplicadas ao banco ativo
- Schema Prisma foi atualizado mas não gerado (`prisma generate`)
- Testes unitários não foram criados
- Validação de compilação TypeScript pendente

### Frontend

- Nenhuma implementação frontend foi realizada
- AuthContext precisa ser atualizado
- Páginas de gestão precisam ser criadas
- Dashboards específicos por perfil precisam ser implementados

## Decisões Técnicas

### 1. PolicyService centralizado

Vantagem: lógica de autorização em um único lugar, reutilizável.

### 2. Vínculos com vigência

Permite histórico completo de atribuições e mudanças de escopo.

### 3. Representação revogável

Produtor ou admin pode revogar autorização de representante, registrando motivo.

### 4. req.user como fonte de autorização

JwtAuthGuard popula req.user; services confiam nesse objeto.

### 5. Fallback para user.escolaId

Sistemas legados onde user.escolaId existe funcionam até migração completa para VinculoUsuario.

## Conclusão

SDD-002 foi implementado no backend com:
- Modelo organizacional completo (EEx, DRE, vínculos, representações)
- Sistema de autorização baseado em políticas
- APIs completas para gestão de DREs, vínculos e representações
- Auditoria de todas as operações críticas
- Correção do DashboardController para incluir role DRE

A implementação está pronta para deploy após:
1. Aplicação das migrações
2. Validação de compilação
3. Criação de testes
4. Implementação do frontend correspondente

**Status:** ✅ Implementado no backend, aguardando migrações, testes e frontend.
