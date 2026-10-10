# SDD-001: Compatibilidade e Preservação da Base — Sumário

**Status:** ✓ Análise estática concluída • ⚠ Validação em banco isolado pendente  
**Data:** 10/10/2026

---

## Trabalho executado

1. ✓ Verificada branch atual (`main`) e estado do repositório
2. ✓ Identificada stack: React/TS/MUI + NestJS/Prisma + MySQL
3. ✓ Comparado dump `merenda.sql` com `schema.prisma` e migrações
4. ✓ Inventariadas 25 tabelas, 12 migrações aplicadas, 2 pendentes
5. ✓ Detectadas 6 divergências de estrutura (aditivas, não destrutivas)
6. ✓ Validada compatibilidade de FKs, enums e índices
7. ✓ Inventariadas 17 referências a arquivos `storage/` não versionados
8. ✓ Criado script de diagnóstico `validate-schema-compatibility.js`
9. ✓ Gerado `RELATORIO_COMPATIBILIDADE.md` (9 seções, 340+ linhas)
10. ✓ Gerado `PLANO_MIGRACAO.md` (11 seções, 600+ linhas)

**Nenhuma operação executada no banco ativo.** Análise foi 100% estática.

---

## Principais achados

### ✓ Compatível
- 24 das 25 tabelas do schema existem no dump
- Histórico de migrações preservado e completo até 08/10/2026
- FKs, enums e índices compatíveis
- Auditoria e soft-delete presentes
- Estrutura base para editais, propostas, matches e importação funcional

### ⚠ Requer ação
- **2 migrações pendentes** (09/10/2026):
  - `20261009090000_modelos_propostas`
  - `20261009091000_dados_documentais_produtor`
- **1 tabela ausente:** `pnae_system_config`
- **6 colunas ausentes:** 
  - `produtores.dadosDocumentais` (JSON)
  - `pnae_templates_documento.codigoModelo` (VARCHAR)
  - `pnae_templates_documento.finalidade` (VARCHAR)
  - `pnae_templates_documento.perfilFornecedor` (VARCHAR)
  - `pnae_propostas.documentosJson` (LONGTEXT)
- **17 arquivos `storage/` não versionados**

### 🔍 Não validado (requer banco isolado)
- Órfãos (FKs inválidas)
- Dados inválidos (CPF/CNPJ, enums incorretos)
- Contagens exatas de registros
- Performance de queries
- Funcionamento de geração de PDFs
- Testes automatizados completos

---

## Risco de perda de dados

**Baixo.** Todas as divergências são **aditivas** (colunas e tabela novas), não destrutivas. O dump pode ser restaurado com segurança após aplicar as migrações pendentes.

**Único risco:** se arquivos `storage/` não forem recuperados, geração de documentos e leitura de templates falhará. Isso é recuperável (re-upload de templates).

---

## Próximos passos

Conforme PLANO_MIGRACAO.md, seção 8:

### Fase 1: Validação (não altera banco ativo)
1. Criar banco MySQL isolado (`merenda_pnae_test`)
2. Restaurar dump no banco isolado
3. Aplicar correção para `pnae_system_config`
4. Aplicar as 2 migrações pendentes
5. Executar queries de validação (seção 4 do Plano)
6. Executar testes automatizados
7. Documentar resultados

### Fase 2: Recuperação de arquivos
8. Inventariar storage/ completo
9. Recuperar ou recriar arquivos de templates DRE
10. Validar integridade (hash, tamanho)

### Fase 3: Migração para produção (quando aprovado)
11. Backup do banco ativo
12. Executar migração em horário de baixo uso
13. Validar integridade e funcionalidade
14. Monitorar sistema por 24h

**Tempo estimado:**
- Fase 1: 2-4 horas (técnico)
- Fase 2: 1-2 horas (recuperação manual)
- Fase 3: 30 min + 24h monitoramento

---

## Documentação gerada

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| [RELATORIO_COMPATIBILIDADE.md](RELATORIO_COMPATIBILIDADE.md) | Análise detalhada de divergências, inventário de migrações, validações executadas | ~340 |
| [PLANO_MIGRACAO.md](PLANO_MIGRACAO.md) | Procedimento passo a passo, queries de validação, scripts auxiliares, rollback | ~600 |
| [scripts/validate-schema-compatibility.js](scripts/validate-schema-compatibility.js) | Script de diagnóstico estático, executável com Node.js | ~200 |
| [SDD-001-SUMARIO.md](SDD-001-SUMARIO.md) | Este documento (resumo executivo) | ~100 |

---

## Como executar a validação

```bash
# 1. Diagnóstico estático (já executado)
node docs/plataforma-pnae/scripts/validate-schema-compatibility.js

# 2. Criar banco isolado (próximo passo)
mysql -u root -p -e "CREATE DATABASE merenda_pnae_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Restaurar dump
mysql -u root -p merenda_pnae_test < merenda.sql

# 4. Seguir PLANO_MIGRACAO.md seções 3-6
```

---

## Decisões tomadas

1. **Não versionar `merenda.sql`:** Dump contém potencialmente dados sensíveis e é grande demais para git.
2. **Não executar no banco ativo:** Toda validação deve ser feita em ambiente isolado primeiro.
3. **Migrações aditivas:** Criar correção manual antes de aplicar pendentes, para garantir `pnae_system_config`.
4. **storage/ não versionado:** Manter fora do git, documentar recuperação.
5. **Análise estática primeiro:** Economizar tempo identificando problemas óbvios antes de restaurar.

---

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Migrações pendentes falharem | Baixa | Alto | Testar em isolado, rollback disponível |
| storage/ irrecuperável | Média | Médio | Recriar templates de fonte pública (DRE) |
| Órfãos no dump | Média | Médio | Queries de validação + decisão de cleanup |
| Dados sensíveis expostos | Baixa | Alto | Não versionar dump, .gitignore storage/ |
| Timezone incorreto | Baixa | Baixo | Validar timestamps, conversão na app |

---

## Pendências para concluir SDD-001

- [ ] Restaurar dump em banco isolado
- [ ] Aplicar correções e migrações pendentes
- [ ] Executar validações de integridade
- [ ] Executar testes automatizados
- [ ] Recuperar ou documentar arquivos storage/
- [ ] Atualizar este sumário com resultados finais
- [ ] Obter aprovação para migração em produção

---

## Contato e suporte

**Responsável técnico:** (definir)  
**Aprovação necessária de:** (definir)  
**Prazo para conclusão:** (definir)

**Documentos de referência:**
- [PRD](PRD.md)
- [ARQUITETURA](ARQUITETURA.md)
- [MODELO_DADOS](MODELO_DADOS.md)
- [SDD-001-COMPATIBILIDADE](sdds/SDD-001-COMPATIBILIDADE.md)

---

**Última atualização:** 10/10/2026 • **Versão:** 1.0
