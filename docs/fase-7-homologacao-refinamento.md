# Fase 7 — Homologacao e Refinamento

## Visao Geral

Fase de maturidade do sistema SAGAE PNAE, focada em seguridad, auditoria, performance e configuracao antes de producao.

## 1. Auditoria + Logs

### Backend

**Schema AuditLog:**
- Tabela `pnae_audit_logs` com indices em userId, action, entity, createdAt
- Campos: userId, userName, userEmail, userRole, action, entity, entityId, entityLabel, oldValues, newValues, ipAddress, userAgent, endpoint, method, statusCode, durationMs, metadata

**AuditService:**
- `log(data)` — Registra evento de auditoria (com tratamento de erro silencioso)
- `findAll(query)` — Lista logs com filtros (action, entity, userId, startDate, endDate)
- `getStats()` — Estatisticas (total, hoje, acoes frequentes, top usuarios, top entidades)

**AuditInterceptor:**
- Interceptor NestJS que registra automaticamente todas as operacoes CRUD
- Captura: usuario, acao, entidade, dados anteriores/novos, IP, user-agent, endpoint, duracao
- Filtra: rotas de auth, health, docs e consultas GET
- Sanitiza: senhas e tokens nos logs

**AuditController:**
- `GET /api/v1/audit` — Listar logs (filtros: page, limit, action, entity, userId, startDate, endDate)
- `GET /api/v1/audit/stats` — Estatisticas de auditoria

### Frontend — LogsPage

- Dashboard com metricas (total, hoje, acoes frequentes, entidades)
- Tabela paginada com filtros (acao, entidade, periodo)
- Dialog de detalhes com JSON formatado
- Cores semanticas por tipo de acao

## 2. Seguranca

### Rate Limiting

- `@nestjs/throttler` configurado globalmente
- 100 requisicoes por minuto por IP
- Protecao contra brute force

### Validacao

- `ValidationPipe` com `forbidNonWhitelisted: true` — rejeita propriedades nao esperadas
- `whitelist: true` — remove propriedades nao declaradas no DTO
- `transform: true` — converte tipos automaticamente

### CORS

- Configuravel via variavel de ambiente `CORS_ORIGIN`
- Credenciais habilitadas

### Upload

- Validacao de tipo via `upload.tipos_permitidos` (configuravel)
- Validacao de tamanho via `upload.tamanho_maximo_mb` (configuravel)

## 3. UX/UI

### Lazy Loading

- Todas as paginas usam `React.lazy()` + `Suspense`
- Bundle principal reduzido de 686KB para 492KB (28% menor)
- Carregamento sob demanda por rota

### Loading States

- `CircularProgress` centralizado durante carregamento
- Botoes com loading indicator durante operacoes

### Feedback

- Alerts de sucesso/erro com `onClose` para dismiss
- Mensagens de erro padronizadas do backend
- Toasts de confirmacao em operacoes criticas

### Responsividade

- `Grid` com `xs` e `md` breakpoints
- Tabelas com `size="small"` para telas compactas
- Stack com `direction="row"` que quebra em coluna em mobile

## 4. Performance

### Bundle Splitting

- Lazy loading de todas as paginas (16 chunks separados)
- Chunk principal: 492KB (antes: 686KB)
- Paginas pesadas: PropostasPage (16KB), BalizamentoPage (8KB)

### MySQL

- Indices em `pnae_audit_logs`: userId, action, entity, createdAt
- Consultas Prisma com `select` e `include` otimizados

### Backend

- `skipLibCheck: true` no tsconfig (build mais rapido)
- `incremental: true` para builds incrementais

## 5. Homologacao

### Fluxos Testados

- [ ] Login/Logout (3 perfis)
- [ ] CRUD Municipios
- [ ] CRUD Escolas
- [ ] CRUD Editais
- [ ] CRUD Produtos Referencia
- [ ] CRUD Produtores
- [ ] Importacao de PDF
- [ ] Conferencia de itens
- [ ] Balizamento (match automatico/manual)
- [ ] Aprovacao/Rejeicao de matches
- [ ] Criacao de propostas
- [] Geracao de PDF/DOCX
- [ ] Download de documentos
- [ ] Finalizacao de propostas
- [ ] Auditoria de acoes
- [ ] Configuracoes do sistema

### Cenarios de Erro

- [ ] Login com senha errada
- [ ] Acesso sem token
- [ ] Acesso com perfil inadequado
- [ ] Upload de arquivo invalido
- [ ] Proposta sem itens
- [ ] Proposta duplicada
- [ ] Finalizar proposta ja finalizada

## 6. Configuracao

### Backend

**Schema SystemConfig:**
- Tabela `pnae_system_config` com unique em `chave`
- Campos: chave, valor, descricao, tipo

**ConfigService:**
- `findAll()` — Lista todas as configuracoes
- `get(chave)` — Busca por chave
- `set(chave, valor)` — Cria ou atualiza (upsert)
- `setMany(configs)` — Atualiza multiplos
- `initDefaults()` — Inicializa padroes do sistema

**ConfigController:**
- `GET /api/v1/config` — Listar todas
- `GET /api/v1/config/:chave` — Buscar por chave
- `PUT /api/v1/config/:chave` — Atualizar (ADMIN)
- `PUT /api/v1/config` — Atualizar multiplos (ADMIN)
- `POST /api/v1/config/init` — Inicializar padroes (ADMIN)

### Configuracoes Padrao

| Chave | Valor | Descricao |
|-------|-------|-----------|
| sistema.nome | SAGAE PNAE | Nome do sistema |
| sistema.versao | 1.0.0 | Versao |
| orgao.nome | Governo do Estado de MT | Orgao |
| orgao.secretaria | Secretaria de Estado de Educacao | Secretaria |
| orgao.programa | Programa Nacional de Alimentacao Escolar | Programa |
| documento.validade_padrao | 30 | Validade padrao (dias) |
| documento.prazo_entrega_padrao | 15 | Prazo entrega (dias) |
| upload.tamanho_maximo_mb | 50 | Tamanho max upload |
| upload.tipos_permitidos | .pdf | Tipos permitidos |

### Frontend — ConfigPage

- Formularios agrupados (Sistema, Orgao, Documentos, Upload)
- Edicao inline com botao salvar global
- Adicao de novas configuracoes
- Restauracao de padroes

## Arquivos Importantes

| Arquivo | Descricao |
|---------|-----------|
| `prisma/schema.prisma` | AuditLog + SystemConfig models |
| `modules/audit/` | Modulo completo de auditoria |
| `modules/config/` | Modulo de configuracoes |
| `common/interceptors/audit.interceptor.ts` | Interceptor automatico |
| `main.ts` | Throttler + AuditInterceptor |
| `app.module.ts` | AuditModule + ConfigModule + Throttler |
| `frontend/src/pages/LogsPage.tsx` | Tela de auditoria |
| `frontend/src/pages/ConfigPage.tsx` | Tela de configuracoes |
| `frontend/src/App.tsx` | Lazy loading + novas rotas |
| `frontend/src/components/Layout.tsx` | Menu com Auditoria e Configuracoes |

## Dependencias Adicionadas

- `@nestjs/throttler` — Rate limiting

## Metricas

| Metrica | Antes | Depois |
|---------|-------|--------|
| Bundle principal | 686KB | 492KB |
| Reducao | — | 28% |
| Paginas lazy | 0 | 16 |
| Endpoints API | ~35 | ~42 |
| Tabelas DB | 12 | 14 |
