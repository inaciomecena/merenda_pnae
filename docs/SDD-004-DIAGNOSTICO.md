# SDD-004 — DIAGNÓSTICO INICIAL

> **Revisão de 11/10/2026:** este arquivo foi iniciado antes da inspeção completa. Na branch atual já havia serviços, controladores e módulo de entregas, além da migração SDD-004; eles não compilavam e tinham consultas sem escopo institucional e reserva/aceite sem proteção suficiente. O frontend não tinha telas de entregas. O SDD-003 tinha schema, endpoints e telas de contratos, mas as telas apresentavam erros TypeScript. O estado abaixo descreve o início da execução, não a situação final. A situação final está em `docs/SDD-004-IMPLEMENTACAO.md`.

**Data:** 2026-10-10  
**Sistema:** Plataforma PNAE Digital  
**Repositório:** `merenda_pnae`

---

## 1. SITUAÇÃO ATUAL DO SCHEMA

### ✅ Completo e validado

O `schema.prisma` contém **todas** as entidades necessárias para SDD-004:

- ✅ `ProgramacaoEntrega` com estados, vinculação institucional e de contrato
- ✅ `ProgramacaoEntregaItem` com quantidades e valores
- ✅ `Entrega` com registro de conferência e aceite
- ✅ `EntregaItem` com quantidades informadas, aceitas e rejeitadas
- ✅ `OcorrenciaEntrega` com tipos e status
- ✅ `EntregaDocumento` para comprovantes e anexos
- ✅ Enums completos (status, tipos de ocorrência, tipos de documentos)
- ✅ Relacionamentos com `Contrato`, `ContratoItem`, `Produtor`, `Escola`, `DRE`, `Municipio`
- ✅ Índices para performance
- ✅ Campos de auditoria (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`)

### Migração existente

Migração `20261010120001_sdd_004_entregas` detectada no histórico.

---

## 2. SITUAÇÃO ATUAL DO BACKEND

### Estrutura criada mas incompleta

**Diretório:** `apps/backend/src/modules/entregas/`

#### ✅ Existente e validado:

1. **Domain logic**:
   - `entrega-estado.ts`: Máquinas de estado com transições explícitas para programações, entregas e ocorrências
   - `entrega-saldos.ts`: Cálculo de saldo contratual, execução física e financeira, reservas
   - `entrega-validacao.ts`: Validações de negócio (presumivelmente existe)

2. **DTOs**:
   - `entrega.dto.ts`: DTOs completos para criação, atualização, confirmação, cancelamento, conferência, aceite, ocorrências, anexos

#### ❌ Faltando:

1. **Services**: Nenhum serviço implementado
2. **Controllers**: Nenhum controller implementado
3. **Module**: `entregas.module.ts` não existe
4. **Integração**: Módulo não está registrado no `app.module.ts`

---

## 3. ARQUITETURA ATUAL DO SISTEMA

### Módulos similares para referência:

- **ContratosMod**:
  - Controller: `contratos.controller.ts`
  - Service: `contratos.service.ts`
  - Isolamento institucional aplicado
  - Integração com auditoria

### Padrões identificados:

1. **Injeção de dependências**: NestJS com `@Injectable()` e `@Module()`
2. **Autenticação**: `AuthModule` com guards
3. **Auditoria**: `AuditModule` registra operações críticas
4. **Prisma**: ORM centralizado via `PrismaModule`
5. **RBAC**: Função `Role` e vínculos institucionais (`VinculoUsuario`, `VinculoEscolaDRE`)
6. **DTOs**: Class-validator + class-transformer
7. **Swagger**: Documentação automática via `@ApiProperty`
8. **Isolamento institucional**: Queries filtradas por DRE, escola, fornecedor conforme papel do usuário

---

## 4. FRONTEND

### Situação desconhecida

- Frontend não inspecionado neste diagnóstico
- A confirmar: Existência de componentes parciais

---

## 5. PLANO DE IMPLEMENTAÇÃO

### O que será **reutilizado**:

1. ✅ Schema completo (`ProgramacaoEntrega`, `Entrega`, etc.)
2. ✅ Domain logic (`entrega-estado.ts`, `entrega-saldos.ts`)
3. ✅ DTOs (`entrega.dto.ts`)
4. ✅ Infraestrutura existente (`PrismaModule`, `AuthModule`, `AuditModule`)
5. ✅ Padrões arquiteturais (módulos NestJS, guards, isolamento institucional)

### O que será **criado**:

#### Backend:

1. **Services**:
   - `programacao-entrega.service.ts`: CRUD de programações, controle de reserva de saldo
   - `entrega.service.ts`: CRUD de entregas, conferência, aceite, cálculo de saldos
   - `ocorrencia-entrega.service.ts`: CRUD de ocorrências, tratativa
   - `saldo-contrato.service.ts`: Consulta de saldos agregados por contrato
   - `entrega-documento.service.ts`: Upload e gerenciamento de comprovantes

2. **Controllers**:
   - `programacao-entrega.controller.ts`: Endpoints REST
   - `entrega.controller.ts`: Endpoints REST
   - `ocorrencia-entrega.controller.ts`: Endpoints REST
   - `saldo-contrato.controller.ts`: Endpoints de consulta

3. **Module**:
   - `entregas.module.ts`: Registro de providers e controllers

4. **Integração**:
   - Registro no `app.module.ts`

#### Frontend:

1. Listagem de programações
2. Cadastro/edição de programação
3. Calendário de entregas
4. Painel de recebimento
5. Registro de ocorrências
6. Dashboard de execução
7. Consulta de saldos

#### Testes:

1. Testes unitários de services
2. Testes de integração de controllers
3. Testes end-to-end
4. Testes de regressão dos SDDs anteriores

---

## 6. RISCOS E PENDÊNCIAS

### Riscos identificados:

1. **Concorrência de reservas**: Múltiplos usuários programando simultaneamente o mesmo item contratual
   - Mitigação: Transação isolada + bloqueio otimista com `versao`

2. **Recálculo de saldos**: Performance com muitas entregas
   - Mitigação: Queries agregadas otimizadas, índices adequados

3. **Frontend desconhecido**: Pode haver trabalho duplicado ou incompatível
   - Mitigação: Verificar antes de implementar

### Pendências técnicas:

1. Validar se migração foi aplicada ao banco
2. Verificar se existem dados de teste ou produção
3. Confirmar estrutura do frontend

---

## 7. CRITÉRIOS DE PRONTO

O SDD-004 estará completo quando:

- ✅ Schema validado (completo)
- ⏳ Serviços implementados
- ⏳ Controllers implementados
- ⏳ Module registrado
- ⏳ Frontend funcional
- ⏳ Testes aprovados
- ⏳ Documentação de implementação criada

---

## 8. CONCLUSÃO

**Status:** Fundação sólida existente, implementação de lógica de negócio pendente.

**Próximos passos:**

1. Implementar `programacao-entrega.service.ts`
2. Implementar `entrega.service.ts`
3. Implementar controllers
4. Registrar módulo
5. Implementar testes
6. Implementar frontend
7. Validar integração completa
