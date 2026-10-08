# Fase 6 — Geração de Propostas e Documentos Oficiais

## Visão Geral

Implementação da geração automática dos documentos oficiais a partir dos matches aprovados no balizamento:

1. **ANEXO III — Modelo de Proposta de Preços**
2. **Projeto de Venda da Agricultura Familiar**

## Arquitetura

```
propostas/
├── propostas.module.ts
├── application/services/
│   ├── propostas.service.ts
│   ├── document-generator.service.ts
│   ├── pdf-generator.service.ts
│   └── docx-generator.service.ts
└── presentation/
    ├── controllers/propostas.controller.ts
    └── dto/proposta.dto.ts
```

### Fluxo

```
Balizamento (matches aprovados)
    → Usuário seleciona edital + produtor
    → Pré-visualização dos dados
    → Criação da proposta (RASCUNHO)
    → Adiciona itens dos matches aprovados
    → Gera PDF/DOCX (status → GERADA)
    → Finaliza proposta (status → FINALIZADA)
    → Download dos documentos
```

## Banco de Dados

### Tabelas

- `pnae_propostas` — Dados da proposta
- `pnae_proposta_itens` — Itens vinculados a proposta

### Enums

```prisma
enum StatusProposta {
  RASCUNHO
  GERADA
  FINALIZADA
  CANCELADA
}

enum TipoProposta {
  ANEXO_III
  PROJETO_VENDA
}
```

### Campos Principais (pnae_propostas)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| editalId | FK | Edital vinculado |
| produtorId | FK | Produtor vinculado (opcional) |
| numero | String | Número da proposta (auto-gerado) |
| tipoDocumento | Enum | ANEXO_III ou PROJETO_VENDA |
| status | Enum | RASCUNHO, GERADA, FINALIZADA, CANCELADA |
| validadeDias | Int | Validade em dias (padrão: 30) |
| prazoEntrega | Int | Prazo de entrega em dias (padrão: 15) |
| valorTotal | Decimal | Valor total calculado automaticamente |
| arquivoPdfPath | String | Caminho do arquivo PDF gerado |
| arquivoDocxPath | String | Caminho do arquivo DOCX gerado |
| observacao | Text | Observações livres |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/propostas` | Listar propostas (filtros: page, limit, status, editalId, produtorId) |
| GET | `/api/v1/propostas/:id` | Detalhes da proposta |
| POST | `/api/v1/propostas/preview` | Pré-visualizar proposta antes de criar |
| POST | `/api/v1/propostas` | Criar proposta |
| PUT | `/api/v1/propostas/:id` | Atualizar proposta |
| POST | `/api/v1/propostas/:id/itens` | Adicionar itens à proposta |
| POST | `/api/v1/propostas/:id/gerar` | Gerar PDF e DOCX |
| GET | `/api/v1/propostas/:id/download/pdf` | Baixar PDF |
| GET | `/api/v1/propostas/:id/download/docx` | Baixar DOCX |
| PUT | `/api/v1/propostas/:id/finalizar` | Finalizar proposta |
| DELETE | `/api/v1/propostas/:id` | Cancelar proposta |
| GET | `/api/v1/propostas/produtores/:editalId` | Listar produtores com matches aprovados |

## Frontend

### Tela: `/propostas`

**Funcionalidades:**

1. **Listagem** — Tabela com propostas, filtros por edital/produtor/status
2. **Criar proposta** — Selecionar edital → produtor → tipo → revisar → criar
3. **Pré-visualização** — Dados completos antes da criação (edital, produtor, itens, totais)
4. **Detalhes** — Visualizar todos os dados da proposta
5. **Gerar documentos** — Gerar PDF e DOCX
6. **Baixar** — Download direto dos arquivos gerados
7. **Finalizar** — Marcar como FINALIZADA
8. **Cancelar** — Soft delete com status CANCELADA

### Componentes

- Filtros dinâmicos (carrega editais e produtores via API)
- Dialog de criação com preview integrado
- Dialog de detalhes com tabela de itens
- Botões de ação contextuais por status
- Download via fetch com autenticação

## Geração de Documentos

### PDF (pdfkit)

- Cabeçalho institucional (Governo/SEED/Programa)
- Título do documento (Anexo III ou Projeto de Venda)
- Dados da licitação/chamada pública
- Dados do produtor/licitante
- Tabela de itens (Item, Produto, Marca, Qtd., Valor Unit., Valor Total)
- Valor total
- Condições (validade, prazo, observações)
- Local, data e campo de assinatura

### DOCX (docx)

- Mesmo layout do PDF
- Editável pelo usuário
- Formatação profissional com headers institucionais
- Tabela de itens com cabeçalho estilizado (fundo azul #01287C)

### Armazenamento

```
apps/backend/storage/propostas/{ano}/{edital}/{produtor}/
├── anexo_iii.pdf
├── anexo_iii.docx
├── projeto_venda.pdf
└── projeto_venda.docx
```

## Validações

- Não é possível gerar proposta sem matches aprovados para o produtor
- Não é possível criar proposta duplicada (mesmo edital + produtor + tipo)
- Itens são vinculados aos matches aprovados
- Valor total é calculado automaticamente (qtd × preço unitário)
- Proposta finalizada não pode ser editada
- Aviso se produtor não tiver dados bancários/DAP

## Dependências

- `pdfkit` — Geração de PDF
- `docx` — Geração de DOCX

## Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `prisma/schema.prisma` | Schema com modelos Proposta e PropostaItem |
| `modules/propostas/propostas.module.ts` | Módulo NestJS |
| `modules/propostas/application/services/propostas.service.ts` | Lógica de negócio principal |
| `modules/propostas/application/services/document-generator.service.ts` | Orquestração de geração |
| `modules/propostas/application/services/pdf-generator.service.ts` | Geração de PDF |
| `modules/propostas/application/services/docx-generator.service.ts` | Geração de DOCX |
| `modules/propostas/presentation/controllers/propostas.controller.ts` | Endpoints REST |
| `modules/propostas/presentation/dto/proposta.dto.ts` | DTOs e validações |
| `frontend/src/pages/PropostasPage.tsx` | Tela completa do frontend |

## Pendências

- [ ] Adicionar campos bancários ao modelo Produtor (banco, agência, conta, PIX)
- [ ] Adicionar campo DAP/CAF ao modelo Produtor
- [ ] Adicionar campo email ao modelo Produtor
- [ ] Adicionar campo RG ao modelo Produtor
- [ ] Validação de campos obrigatórios antes de finalizar
- [ ] Envio de email com documentos anexados
- [ ] Histórico de versões de propostas
- [ ] Relatório consolidado de propostas por edital
