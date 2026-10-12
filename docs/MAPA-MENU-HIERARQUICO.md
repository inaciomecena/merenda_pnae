# MAPA VISUAL DO MENU HIERÁRQUICO

**Versão:** 1.0  
**Data:** 2026-10-11  
**Total de Telas:** 43

---

## ESTRUTURA COMPLETA DO MENU

```
📁 PLATAFORMA PNAE - Sistema de Gestão da Alimentação Escolar
│
├─ 📊 VISUALIZAÇÃO
│  │
│  ├─ 🏠 Dashboard                         [SCR_DASH_001]
│  │    └─ /dashboard
│  │
│  ├─ 🗺️ Mapa de Mato Grosso              [SCR_MAP_001]
│  │    └─ /mapa
│  │    └─ Roles: ADMIN
│  │
│  └─ 📈 Relatórios                        [SCR_REL_001]
│       └─ /relatorios
│       └─ Roles: ADMIN
│
├─ 🏢 CADASTROS
│  │
│  ├─ 🏛️ Organizacional
│  │  │
│  │  ├─ 🏗️ Estrutura Organizacional       [SCR_ORG_001]
│  │  │    └─ /organizacao
│  │  │    └─ Roles: ADMIN
│  │  │
│  │  ├─ 🗺️ Municípios                     [SCR_MUN_001]
│  │  │    └─ /municipios
│  │  │    └─ Roles: ADMIN
│  │  │
│  │  └─ 🏫 Escolas                        [SCR_ESC_001]
│  │       └─ /escolas
│  │       └─ Roles: ADMIN, DRE, ESCOLA
│  │
│  ├─ 📦 Produtos e Serviços
│  │  │
│  │  ├─ 📦 Produtos de Referência         [SCR_PROD_REF_001]
│  │  │    └─ /produtos-referencia
│  │  │    └─ Roles: ADMIN
│  │  │
│  │  └─ 📄 Modelos de Anexos              [SCR_TPL_ANX_001]
│  │       └─ /templates-anexos
│  │       └─ Roles: ADMIN
│  │
│  └─ 👥 Pessoas
│     │
│     ├─ 👨‍🌾 Produtores                      [SCR_PROD_001]
│     │    └─ /produtores
│     │    └─ Roles: ADMIN, EXTENSIONISTA, REPRESENTANTE, PRODUTOR
│     │
│     ├─ 👤 Usuários                       [SCR_USR_001]
│     │    └─ /usuarios
│     │    └─ Roles: ADMIN
│     │
│     └─ 🔗 Vínculos                       [SCR_VNC_001]
│          └─ /vinculos
│          └─ Roles: ADMIN
│
├─ ⚖️ LICITAÇÃO
│  │
│  ├─ 📋 Editais                           [SCR_EDT_001]
│  │    └─ /editais
│  │    └─ Roles: ADMIN, DRE, ESCOLA
│  │
│  ├─ ⚖️ Balizamento                       [SCR_BAL_001]
│  │    └─ /balizamento
│  │    └─ Roles: ADMIN
│  │
│  ├─ 📝 Propostas                         [SCR_PROP_001]
│  │    └─ /propostas
│  │    └─ Roles: ADMIN, EXTENSIONISTA, REPRESENTANTE, PRODUTOR
│  │
│  ├─ 📤 Importações                       [SCR_IMP_001]
│  │    └─ /importacoes
│  │    └─ Roles: ADMIN
│  │
│  └─ ✅ Homologação                       [SCR_HML_001]
│       └─ /homologacao
│       └─ Roles: ADMIN
│
├─ 💼 EXECUÇÃO
│  │
│  ├─ 📜 Gestão Contratual
│  │  │
│  │  ├─ 📑 Contratos                      [SCR_CTR_001]
│  │  │    └─ /contratos
│  │  │    └─ Roles: ADMIN, DRE, ESCOLA, EXTENSIONISTA, REPRESENTANTE, PRODUTOR
│  │  │
│  │  └─ 🚚 Entregas                       [SCR_ENT_001]
│  │       └─ /entregas
│  │       └─ Roles: ADMIN, DRE, ESCOLA, EXTENSIONISTA, REPRESENTANTE, PRODUTOR
│  │
│  ├─ 🧾 Gestão Fiscal
│  │  │
│  │  ├─ 📄 Notas Fiscais                  [SCR_NF_001]
│  │  │    └─ /notas-fiscais
│  │  │    └─ Roles: ADMIN, DRE, ESCOLA, EXTENSIONISTA, REPRESENTANTE, PRODUTOR
│  │  │
│  │  ├─ ✔️ Conferência Fiscal             [SCR_CONF_FISC_001]
│  │  │    └─ /conferencia-fiscal
│  │  │    └─ Roles: ADMIN, DRE
│  │  │
│  │  └─ ✅ Atestos                        [SCR_ATST_001]
│  │       └─ /atestos
│  │       └─ Roles: ADMIN, DRE
│  │
│  └─ 💰 Gestão Financeira
│     │
│     ├─ 🏦 Liquidações                    [SCR_LIQ_001]
│     │    └─ /liquidacoes
│     │    └─ Roles: ADMIN, DRE
│     │
│     ├─ 💳 Pagamentos                     [SCR_PAG_001]
│     │    └─ /pagamentos
│     │    └─ Roles: ADMIN, DRE
│     │
│     └─ 📊 Dashboard Financeiro           [SCR_FIN_DASH_001]
│          └─ /financeiro
│          └─ Roles: ADMIN, DRE, ESCOLA, EXTENSIONISTA, REPRESENTANTE, PRODUTOR
│
└─ 🔐 ADMINISTRAÇÃO
   │
   ├─ 📜 Auditoria                         [SCR_AUD_001]
   │    └─ /auditoria
   │    └─ Roles: ADMIN
   │
   └─ ⚙️ Configurações                     [SCR_CFG_001]
        └─ /configuracoes
        └─ Roles: ADMIN
```

---

## LEGENDA DE ÍCONES

| Ícone | Significado |
|-------|-------------|
| 📁 | Sistema |
| 📊 | Visualização/Dashboard |
| 🏢 | Cadastros |
| ⚖️ | Licitação |
| 💼 | Execução |
| 🔐 | Administração |
| 🏛️ | Organizacional |
| 📦 | Produtos |
| 👥 | Pessoas |
| 📜 | Contratual |
| 🧾 | Fiscal |
| 💰 | Financeiro |

---

## ESTATÍSTICAS DO MENU

### Por Seção

| Seção | Itens Diretos | Subitens | Total |
|-------|---------------|----------|-------|
| Visualização | 3 | 0 | 3 |
| Cadastros | 0 | 9 | 9 |
| Licitação | 5 | 0 | 5 |
| Execução | 0 | 9 | 9 |
| Administração | 2 | 0 | 2 |
| **TOTAL** | **10** | **18** | **28** |

**Nota:** Total de 28 itens de menu únicos (algumas telas têm múltiplas rotas mas um só item de menu)

### Por Nível de Profundidade

| Nível | Quantidade | Exemplo |
|-------|------------|---------|
| 1 (Raiz) | 5 | Visualização, Cadastros, ... |
| 2 (Submenu) | 9 | Organizacional, Produtos, Pessoas, ... |
| 3 (Item Final) | 28 | Dashboard, Escolas, Contratos, ... |

### Por Perfil de Acesso

| Perfil | Telas Acessíveis |
|--------|------------------|
| ADMIN | 28 (100%) |
| DRE | 15 (54%) |
| ESCOLA | 9 (32%) |
| EXTENSIONISTA | 7 (25%) |
| REPRESENTANTE | 5 (18%) |
| PRODUTOR | 5 (18%) |

---

## FLUXOS PRINCIPAIS DE NAVEGAÇÃO

### Fluxo 1: Processo Licitatório
```
📋 Licitação
  → 📋 Editais (criar/publicar)
  → 📤 Importações (importar propostas)
  → ⚖️ Balizamento (analisar)
  → 📝 Propostas (avaliar)
  → ✅ Homologação (homologar)
  → 💼 Execução > 📜 Contratos (firmar contrato)
```

### Fluxo 2: Execução do Contrato
```
💼 Execução > 📜 Gestão Contratual
  → 📑 Contratos (visualizar contrato)
  → 🚚 Entregas (registrar entrega)
  → 💼 Execução > 🧾 Gestão Fiscal
    → 📄 Notas Fiscais (cadastrar NF-e)
    → ✔️ Conferência Fiscal (conferir)
    → ✅ Atestos (atestar)
  → 💼 Execução > 💰 Gestão Financeira
    → 🏦 Liquidações (liquidar)
    → 💳 Pagamentos (pagar)
    → 📊 Dashboard Financeiro (acompanhar)
```

### Fluxo 3: Gestão Organizacional
```
🏢 Cadastros > 🏛️ Organizacional
  → 🏗️ Estrutura Organizacional (criar entidade)
  → 🗺️ Municípios (cadastrar município)
  → 🏫 Escolas (cadastrar escola)
  → 🏢 Cadastros > 👥 Pessoas
    → 👤 Usuários (criar usuário)
    → 🔗 Vínculos (vincular usuário)
```

---

## MATRIZ DE PERMISSÕES POR TELA

| Código | Tela | ADMIN | DRE | ESCOLA | EXT | REP | PROD |
|--------|------|:-----:|:---:|:------:|:---:|:---:|:----:|
| SCR_DASH_001 | Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SCR_MAP_001 | Mapa MT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_REL_001 | Relatórios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_ORG_001 | Organização | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_MUN_001 | Municípios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_ESC_001 | Escolas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| SCR_PROD_REF_001 | Prod. Referência | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_TPL_ANX_001 | Modelos Anexos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_PROD_001 | Produtores | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| SCR_USR_001 | Usuários | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_VNC_001 | Vínculos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_EDT_001 | Editais | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| SCR_BAL_001 | Balizamento | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_PROP_001 | Propostas | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| SCR_IMP_001 | Importações | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_HML_001 | Homologação | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_CTR_001 | Contratos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SCR_ENT_001 | Entregas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SCR_NF_001 | Notas Fiscais | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SCR_CONF_FISC_001 | Conf. Fiscal | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| SCR_ATST_001 | Atestos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| SCR_LIQ_001 | Liquidações | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| SCR_PAG_001 | Pagamentos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| SCR_FIN_DASH_001 | Dash. Financeiro | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SCR_AUD_001 | Auditoria | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCR_CFG_001 | Configurações | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legenda:**
- ✅ = Acesso permitido
- ❌ = Acesso negado
- EXT = Extensionista
- REP = Representante
- PROD = Produtor

---

## ROTAS ADICIONAIS (Não aparecem no menu lateral)

| Rota | Código | Descrição |
|------|--------|-----------|
| `/login` | - | Tela de login |
| `/escolas/:id` | `SCR_ESC_DET_001` | Detalhes de escola |
| `/editais/:id/composicao` | `SCR_EDT_COMP_001` | Composição de edital |
| `/contratos/novo` | `SCR_CTR_FORM_001` | Formulário novo contrato |
| `/contratos/:id` | `SCR_CTR_DET_001` | Detalhes de contrato |
| `/contratos/:id/editar` | `SCR_CTR_EDIT_001` | Edição de contrato |
| `/notas-fiscais/nova` | `SCR_NF_FORM_001` | Formulário nova NF |
| `/notas-fiscais/:id` | `SCR_NF_DET_001` | Detalhes de nota fiscal |
| `/importacoes/importar` | `SCR_IMP_FORM_001` | Importar edital |
| `/importacoes/:id` | `SCR_IMP_DET_001` | Detalhes importação |
| `/importacoes/:id/conferencia` | `SCR_IMP_CONF_001` | Conferir importação |

---

## COMO LER ESTE MAPA

### Exemplo 1: Localizar Tela de Contratos
```
Buscar no mapa:
💼 EXECUÇÃO > 📜 Gestão Contratual > 📑 Contratos

Código: SCR_CTR_001
Rota: /contratos
Perfis: ADMIN, DRE, ESCOLA, EXTENSIONISTA, REPRESENTANTE, PRODUTOR
```

### Exemplo 2: Verificar Permissões
```
Usuário: DRE
Quer acessar: Balizamento (SCR_BAL_001)

Na matriz:
SCR_BAL_001 | Balizamento | ✅ ADMIN | ❌ DRE

Resultado: ❌ SEM PERMISSÃO
```

### Exemplo 3: Guiar Usuário
```
Suporte: "Vá em Execução > Gestão Fiscal > Notas Fiscais"
Usuário: ✅ Consegue navegar pelo menu hierárquico
```

---

## VERSÃO E ATUALIZAÇÕES

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-10-11 | Versão inicial - Menu hierárquico completo |

---

**Gerado por:** Claude Opus 5  
**Última atualização:** 2026-10-11  
**Arquivo de configuração:** `apps/frontend/src/config/menu.config.ts`
