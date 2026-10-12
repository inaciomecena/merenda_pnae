# SDD-005 — PRÓXIMOS PASSOS PARA CONCLUSÃO

**Status Atual:** 25% concluído  
**Fundação:** ✅ Sólida e pronta para expansão  
**Migração:** ❌ Criada mas não aplicada  
**Backend:** ⏳ Serviços core implementados  
**Frontend:** ❌ Não iniciado  
**Testes:** ❌ Não implementados  

---

## CHECKLIST DE CONTINUAÇÃO

### Fase 1: Aplicação da Migração (CRÍTICO)

```bash
# 1. Criar backup do banco
mysqldump -u root -p merenda_pnae > backup_pre_sdd005_$(date +%Y%m%d).sql

# 2. Revisar migração
cat apps/backend/prisma/migrations/20261011130000_sdd_005_fiscal_atesto_financeiro/migration.sql

# 3. Aplicar migração
cd apps/backend
npx prisma migrate deploy

# 4. Verificar status
npx prisma migrate status

# 5. Gerar Prisma Client
npx prisma generate
```

**Validações Pós-Migração:**
- [ ] Todas as 9 tabelas criadas
- [ ] Todos os índices criados
- [ ] Todas as foreign keys criadas
- [ ] Dados existentes intactos
- [ ] Aplicação compila sem erros

---

### Fase 2: Completar Serviços Backend

#### 2.1 NotaFiscalService

**Arquivo:** `apps/backend/src/modules/fiscal/application/services/nota-fiscal.service.ts`

**Funcionalidades:**
- `create(dto, files, user)` - Criar nota fiscal com upload
  - Validar CNPJ/CPF fornecedor
  - Validar contrato
  - Upload de XML (obrigatório)
  - Upload de PDF (opcional)
  - Extrair dados do XML
  - Criar NotaFiscal
  - Criar NotaFiscalItem[]
  - Salvar documentos
  - Auditar
- `findAll(filtros, user)` - Listar notas com filtros e paginação
- `findOne(id, user)` - Consultar nota com detalhes
- `validarDuplicidade(chaveAcesso)` - Verificar se chave já existe
- `identificarFornecedor(cnpjCpf)` - Buscar fornecedor por documento

**Dependências:**
- PrismaService
- XmlFiscalService
- PdfFiscalService
- FiscalDocumentoService
- AuditService

#### 2.2 ConciliacaoFiscalService

**Arquivo:** `apps/backend/src/modules/fiscal/application/services/conciliacao-fiscal.service.ts`

**Funcionalidades:**
- `conciliar(notaFiscalId, user)` - Executar conciliação completa
  - Buscar contrato e itens
  - Buscar entregas aceitas não vinculadas
  - Comparar fornecedor (CNPJ/CPF)
  - Comparar produtos
  - Comparar quantidades
  - Comparar valores
  - Identificar divergências
  - Sugerir vínculos
  - Registrar resultado
- `vincularRecebimento(notaItemId, entregaItemId, quantidade, user)` - Vínculo manual
- `calcularSaldoVinculavel(entregaItemId)` - Quantidade ainda não faturada

**Lógica de Matching:**
```typescript
for (const itemNota of itensNota) {
  // Buscar item contratual correspondente
  const itemContrato = buscarPorCodigoOuDescricao(itemNota);
  
  if (!itemContrato) {
    registrarDivergencia('PRODUTO_DIVERGENTE');
    continue;
  }
  
  // Buscar recebimentos aceitos deste item
  const recebimentos = buscarRecebimentosAceitos(itemContrato);
  
  for (const recebimento of recebimentos) {
    const saldo = calcularSaldoNaoFaturado(recebimento);
    
    if (saldo >= itemNota.quantidade) {
      // Vínculo automático
      criarVinculo(itemNota, recebimento, itemNota.quantidade);
    } else if (saldo > 0) {
      // Vínculo parcial
      criarVinculo(itemNota, recebimento, saldo);
    }
  }
}
```

#### 2.3 DivergenciaFiscalService

**Arquivo:** `apps/backend/src/modules/fiscal/application/services/divergencia-fiscal.service.ts`

**Funcionalidades:**
- `registrar(notaFiscalId, tipo, severidade, descricao, ...)` - Criar divergência
- `listar(filtros)` - Listar divergências
- `resolver(id, justificativa, user)` - Resolver divergência
- `bloquearAtesto(notaFiscalId)` - Verificar divergências impeditivas

#### 2.4 ConferenciaFiscalService

**Arquivo:** `apps/backend/src/modules/fiscal/application/services/conferencia-fiscal.service.ts`

**Funcionalidades:**
- `conferir(notaFiscalId, decisao, observacoes, user)` - Registrar conferência
- `aprovar(notaFiscalId, user)` - Aprovar nota
- `rejeitar(notaFiscalId, motivo, user)` - Rejeitar nota
- `pendenciasConferencia()` - Listar pendências

#### 2.5 AtestoService

**Arquivo:** `apps/backend/src/modules/fiscal/application/services/atesto.service.ts`

**Funcionalidades:**
- `calcularValorElegivel(notaFiscalId)` - Calcular valor atestável
- `atestar(notaFiscalId, valorAtestado, user)` - Registrar atesto
- `validarSegregacaoFuncoes(notaFiscalId, user)` - Verificar se user pode atestar
- `retificar(atestoId, novoValor, justificativa, user)` - Retificar atesto
- `gerarDocumento(atestoId)` - Gerar PDF de atesto

#### 2.6 LiquidacaoService & PagamentoService

**Arquivos:** 
- `liquidacao.service.ts`
- `pagamento.service.ts`

**Funcionalidades:**
- Registro de liquidações informadas
- Registro de pagamentos parciais/totais
- Estornos auditáveis
- Cálculo de saldos

#### 2.7 FinanceiroConsolidadoService

**Arquivo:** `financeiro-consolidado.service.ts`

**Funcionalidades:**
- `calcularSaldosContrato(contratoId)` - Todos os saldos financeiros
  - Valor contratado
  - Valor faturado
  - Valor atestado
  - Valor liquidado
  - Valor pago
  - Saldos (a faturar, a atestar, a liquidar, a pagar)

**Fórmulas:**
```typescript
saldoAFaturar = valorAceitoElegivel - valorFaturadoElegivel
saldoAAtesar = valorFaturadoElegivel - valorAtestadoLiquido
saldoALiquidar = valorAtestadoLiquido - valorLiquidadoLiquido
saldoAPagar = valorLiquidadoLiquido - valorPagoLiquido
```

---

### Fase 3: Controllers e DTOs

#### 3.1 NotaFiscalController

**Arquivo:** `apps/backend/src/modules/fiscal/presentation/controllers/nota-fiscal.controller.ts`

**Endpoints:**
```typescript
@Controller('notas-fiscais')
export class NotaFiscalController {
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'xml', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]))
  async create(@UploadedFiles() files, @Body() dto, @Request() req) {}

  @Get()
  async findAll(@Query() filtros, @Request() req) {}

  @Get(':id')
  async findOne(@Param('id') id, @Request() req) {}

  @Post(':id/conciliar')
  async conciliar(@Param('id') id, @Request() req) {}

  @Get(':id/divergencias')
  async divergencias(@Param('id') id) {}

  @Get(':id/documentos/:documentoId')
  async download(@Param('id') id, @Param('documentoId') docId, @Res() res) {}
}
```

#### 3.2 DTOs de Validação

**Arquivo:** `apps/backend/src/modules/fiscal/presentation/dto/nota-fiscal.dto.ts`

```typescript
export class CreateNotaFiscalDto {
  @IsUUID()
  contratoId: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class ConferenciaFiscalDto {
  @IsEnum(StatusConferenciaFiscal)
  status: StatusConferenciaFiscal;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class AtestoDto {
  @IsUUID()
  notaFiscalId: string;

  @IsDecimal()
  valorAtestado: number;

  @IsOptional()
  @IsString()
  justificativa?: string;
}
```

---

### Fase 4: Módulo e Registro

#### 4.1 FiscalModule

**Arquivo:** `apps/backend/src/modules/fiscal/fiscal.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { XmlFiscalService } from './application/services/xml-fiscal.service';
import { PdfFiscalService } from './application/services/pdf-fiscal.service';
import { FiscalDocumentoService } from './application/services/fiscal-documento.service';
import { NotaFiscalService } from './application/services/nota-fiscal.service';
import { ConciliacaoFiscalService } from './application/services/conciliacao-fiscal.service';
import { DivergenciaFiscalService } from './application/services/divergencia-fiscal.service';
import { ConferenciaFiscalService } from './application/services/conferencia-fiscal.service';
import { AtestoService } from './application/services/atesto.service';
import { LiquidacaoService } from './application/services/liquidacao.service';
import { PagamentoService } from './application/services/pagamento.service';
import { FinanceiroConsolidadoService } from './application/services/financeiro-consolidado.service';
import { NotaFiscalController } from './presentation/controllers/nota-fiscal.controller';
import { ConferenciaFiscalController } from './presentation/controllers/conferencia-fiscal.controller';
import { AtestoController } from './presentation/controllers/atesto.controller';
import { LiquidacaoController } from './presentation/controllers/liquidacao.controller';
import { PagamentoController } from './presentation/controllers/pagamento.controller';
import { DashboardFinanceiroController } from './presentation/controllers/dashboard-financeiro.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [
    XmlFiscalService,
    PdfFiscalService,
    FiscalDocumentoService,
    NotaFiscalService,
    ConciliacaoFiscalService,
    DivergenciaFiscalService,
    ConferenciaFiscalService,
    AtestoService,
    LiquidacaoService,
    PagamentoService,
    FinanceiroConsolidadoService,
  ],
  controllers: [
    NotaFiscalController,
    ConferenciaFiscalController,
    AtestoController,
    LiquidacaoController,
    PagamentoController,
    DashboardFinanceiroController,
  ],
  exports: [
    NotaFiscalService,
    ConciliacaoFiscalService,
    AtestoService,
    FinanceiroConsolidadoService,
  ],
})
export class FiscalModule {}
```

#### 4.2 Registrar no AppModule

**Arquivo:** `apps/backend/src/app.module.ts`

```typescript
import { FiscalModule } from './modules/fiscal/fiscal.module';

@Module({
  imports: [
    // ... outros módulos
    FiscalModule,
  ],
})
export class AppModule {}
```

---

### Fase 5: Frontend

#### 5.1 Páginas Principais

**NotasFiscaisPage.tsx:**
- Listagem com filtros
- Card de cada nota
- Indicadores de status e conciliação

**NotaFiscalFormPage.tsx:**
- Upload de XML (obrigatório)
- Upload de PDF (opcional)
- Seleção de contrato
- Preview de dados extraídos

**NotaFiscalDetalhesPage.tsx:**
- Abas: Resumo, Itens, Documentos, Conciliação, Divergências, Atestos, Liquidações, Pagamentos
- Painel lado-a-lado (contrato vs recebimento vs fiscal)

**ConferenciaFiscalPage.tsx:**
- Lista de notas pendentes
- Detalhes da conferência
- Aprovação/rejeição

**AtestoPage.tsx:**
- Lista de notas aguardando atesto
- Formulário de atesto
- Histórico de atestos

**DashboardFinanceiroPage.tsx:**
- Indicadores consolidados
- Gráficos de execução
- Notas pendentes
- Divergências abertas

#### 5.2 Componentes

**NotaFiscalCard.tsx:**
```tsx
interface Props {
  nota: NotaFiscal;
  onClick: () => void;
}

<Card>
  <CardHeader>
    <Badge>{nota.status}</Badge>
    <Badge color={getConciliacaoColor(nota.resultadoConciliacao)}>
      {nota.resultadoConciliacao}
    </Badge>
  </CardHeader>
  <CardContent>
    <Text>NF {nota.numero}/{nota.serie}</Text>
    <Text>Fornecedor: {nota.fornecedor.nome}</Text>
    <Text>Valor: {formatCurrency(nota.valorTotal)}</Text>
    <Text>Emissão: {formatDate(nota.dataEmissao)}</Text>
  </CardContent>
</Card>
```

**ConciliacaoPanel.tsx:**
- Três colunas: Contrato | Recebimento | Nota Fiscal
- Destacar divergências em vermelho
- Sugerir vínculos

---

### Fase 6: Testes

#### 6.1 Testes Unitários

**xml-fiscal.service.spec.ts:**
```typescript
describe('XmlFiscalService', () => {
  it('deve extrair dados de NF-e válida');
  it('deve validar chave de acesso de 44 dígitos');
  it('deve rejeitar XML inválido');
  it('deve extrair múltiplos itens');
});
```

**conciliacao-fiscal.service.spec.ts:**
```typescript
describe('ConciliacaoFiscalService', () => {
  it('deve conciliar nota exata');
  it('deve identificar quantidade divergente');
  it('deve identificar valor divergente');
  it('deve identificar produto divergente');
  it('deve bloquear atesto com divergência impeditiva');
});
```

**atesto.service.spec.ts:**
```typescript
describe('AtestoService', () => {
  it('deve calcular valor elegível');
  it('deve atestar valor válido');
  it('deve rejeitar atesto acima do elegível');
  it('deve validar segregação de funções');
  it('deve permitir retificação');
});
```

#### 6.2 Testes de Integração

**nota-fiscal.integration.spec.ts:**
```typescript
describe('Upload de Nota Fiscal', () => {
  it('deve criar nota a partir de XML válido');
  it('deve vincular automaticamente ao fornecedor');
  it('deve executar conciliação automática');
  it('deve identificar divergências');
  it('deve salvar documentos com hash correto');
});
```

#### 6.3 Testes de Concorrência

**atesto.concurrency.spec.ts:**
```typescript
describe('Concorrência de Atesto', () => {
  it('deve prevenir duplo atesto do mesmo valor');
  it('deve validar saldo disponível sob concorrência');
  it('deve registrar apenas um atesto quando simultâneos');
});
```

---

### Fase 7: Documentação

#### 7.1 Swagger/OpenAPI

Adicionar decorators nos controllers:

```typescript
@ApiTags('Notas Fiscais')
@ApiBearerAuth()
@Controller('notas-fiscais')
export class NotaFiscalController {
  @Post()
  @ApiOperation({ summary: 'Upload de nota fiscal' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Nota criada' })
  @ApiResponse({ status: 400, description: 'XML inválido' })
  async create(@UploadedFiles() files, @Body() dto) {}
}
```

#### 7.2 Guia de Usuário

**docs/USER-GUIDE-FISCAL.md:**
- Como fazer upload de nota fiscal
- Como resolver divergências
- Como realizar atesto
- Como registrar liquidação
- Como registrar pagamento

---

## ESTIMATIVA DE ESFORÇO

| Fase | Descrição | Estimativa |
|------|-----------|------------|
| 1 | Aplicar migração | 1h |
| 2 | Serviços backend | 25-30h |
| 3 | Controllers e DTOs | 5-6h |
| 4 | Módulo e registro | 1h |
| 5 | Frontend | 12-15h |
| 6 | Testes | 10-12h |
| 7 | Documentação | 3-4h |
| **TOTAL** | | **57-69h** |

---

## COMANDOS ÚTEIS

```bash
# Gerar Prisma Client
cd apps/backend && npx prisma generate

# Aplicar migração
cd apps/backend && npx prisma migrate deploy

# Criar novo serviço (exemplo)
cd apps/backend/src/modules/fiscal/application/services
touch nota-fiscal.service.ts

# Compilar backend
cd apps/backend && npm run build

# Executar backend
cd apps/backend && npm run start:dev

# Executar frontend
cd apps/frontend && npm run dev

# Executar testes
cd apps/backend && npm test

# Executar testes com cobertura
cd apps/backend && npm run test:cov
```

---

## VALIDAÇÃO DE CONCLUSÃO

O SDD-005 estará completo quando:

- [ ] Migração aplicada com sucesso
- [ ] Upload de XML funcional
- [ ] Extração de dados funcionando
- [ ] Identificação de fornecedor automática
- [ ] Conciliação executando corretamente
- [ ] Divergências sendo identificadas
- [ ] Conferência documental funcional
- [ ] Atesto implementado
- [ ] Liquidação registrando corretamente
- [ ] Pagamentos funcionais
- [ ] Dashboard financeiro operacional
- [ ] Frontend de listagem funcionando
- [ ] Frontend de upload funcionando
- [ ] Frontend de detalhes funcionando
- [ ] Testes backend aprovados (≥80% cobertura)
- [ ] Testes frontend aprovados
- [ ] Regressão dos SDDs anteriores OK
- [ ] Backend compilando sem erros
- [ ] Frontend compilando sem erros
- [ ] Documentação completa

---

## CONTATO E SUPORTE

Para dúvidas sobre a implementação, consultar:
- `docs/SDD-005-DIAGNOSTICO.md` - Análise inicial
- `docs/SDD-005-IMPLEMENTACAO.md` - Detalhes técnicos
- `docs/SDD-005-RELATORIO-FINAL.md` - Status e decisões
- Código existente em `apps/backend/src/modules/fiscal/`

**Padrões a seguir:**
- Controllers: `apps/backend/src/modules/entregas/presentation/controllers/entrega.controller.ts`
- Services: `apps/backend/src/modules/entregas/application/services/entrega.service.ts`
- DTOs: `apps/backend/src/modules/entregas/presentation/dto/entrega.dto.ts`

---

**Boa sorte na continuação da implementação!**

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
