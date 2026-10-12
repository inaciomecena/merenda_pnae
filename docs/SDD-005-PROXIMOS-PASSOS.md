# SDD-005 — Próximos passos verificados

**Data de atualização:** 2026-10-11 — fechamento funcional (ver `docs/SDD-005-RELATORIO-FINAL.md`, status **PASS**).

## Etapas concluídas

1. ✅ Schema reconciliado com as migrações e com os módulos de contratos/entregas (etapa P0 concluída para SDD-003/004; diferenças históricas de outros modelos em `docs/SDD-005-RECUPERACAO-P0.md`).
2. ✅ SQL fiscal revisado: `pnae_contratos.status` não é alterado; migração `20261011130000_sdd_005_fiscal_atesto_financeiro` estritamente aditiva; validada em banco isolado (`merenda_pnae_sdd005`) com 20 migrações up to date.
3. ✅ Cadastro (manual e upload), preservação e associação de notas; conciliação, conferência documental, atesto, registro de liquidação, acompanhamento de pagamentos e dashboard entregues — operação **100% manual e administrativa**, conforme decisão de escopo (integrações SEFAZ/bancos **FORA DO ESCOPO, por decisão do responsável**).
4. ✅ Controllers, DTOs, módulo, RBAC, escopo institucional, idempotência, auditoria e as oito áreas da interface entregues; nomenclatura operacional: Notas Fiscais, Conferência Documental, Atestos, Registro de Liquidação, Acompanhamento de Pagamentos, Dashboard Financeiro.
5. ✅ Fluxos reais, concorrência, autorização, regressão e cobertura testados: backend **42 suítes / 387 testes PASS**, módulo fiscal **23 suítes / 312 testes** (aplicação 98,4% statements / 92,25% branches), frontend **9/9 testes** + build, E2E **69/69 asserções** (grupos A–J) em banco isolado.

## Próximos passos (apenas operacionais)

1. **Com autorização do responsável**, executar o bootstrap no ambiente de homologação ativo (`POST /api/v1/vinculos/bootstrap` com `BOOTSTRAP_ADMIN_TOKEN` forte) e popular vínculos institucionais (DRE/ESCOLA/EXTENSIONISTA — este com `municipioId`).
2. Remover a env `BOOTSTRAP_ADMIN_TOKEN` após o bootstrap e realizar backup do banco antes da homologação.
3. Opcional: orelhada de observabilidade sobre os eventos de auditoria fiscais já gravados.

O estado detalhado está em `docs/SDD-005-IMPLEMENTACAO.md`. O SDD-006 permanece fora do escopo.
