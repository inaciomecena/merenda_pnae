# MELHORIAS: Menu Hierárquico, Códigos de Tela e Normalização

**Data:** 2026-10-11  
**Objetivo:** Organizar menu, adicionar códigos de tela, corrigir ortografia e normalizar textos

---

## RESUMO DAS MELHORIAS

### 1. ✅ Sistema de Códigos de Identificação de Telas

**Benefício:** Facilita suporte técnico - usuário informa código da tela atual

**Implementação:**
- Cada tela possui código único (ex: `SCR_DASH_001`, `SCR_CTR_001`)
- Código exibido no rodapé do menu lateral
- Código adiciona do ao HTML: `<body data-screen-code="SCR_XXX_001">`
- Hook `useScreenTracker()` gerencia automaticamente

**Padrão de Códigos:**
```
Formato: SCR_[CONTEXTO]_[NÚMERO]

Contextos:
- DASH = Dashboard
- MAP = Mapas
- REL = Relatórios
- ORG = Organização
- MUN = Municípios
- ESC = Escolas
- PROD_REF = Produtos de Referência
- TPL_ANX = Templates de Anexos
- PROD = Produtores
- USR = Usuários
- VNC = Vínculos
- EDT = Editais
- BAL = Balizamento
- PROP = Propostas
- IMP = Importações
- HML = Homologação
- CTR = Contratos
- ENT = Entregas
- NF = Notas Fiscais
- CONF_FISC = Conferência Fiscal
- ATST = Atestos
- LIQ = Liquidações
- PAG = Pagamentos
- FIN_DASH = Dashboard Financeiro
- AUD = Auditoria
- CFG = Configurações

Menus (sem tela própria):
- MENU_VISUALIZACAO
- MENU_CADASTROS
- MENU_ORGANIZACIONAL
- MENU_PRODUTOS
- MENU_PESSOAS
- MENU_LICITACAO
- MENU_EXECUCAO
- MENU_CONTRATUAL
- MENU_FISCAL
- MENU_FINANCEIRO
- MENU_ADMIN
```

### 2. ✅ Menu Hierárquico Organizado

**Estrutura Nova:**

```
📊 Visualização
  ├─ Dashboard
  ├─ Mapa de Mato Grosso
  └─ Relatórios

🏢 Cadastros
  ├─ Organizacional
  │   ├─ Estrutura Organizacional
  │   ├─ Municípios
  │   └─ Escolas
  ├─ Produtos e Serviços
  │   ├─ Produtos de Referência
  │   └─ Modelos de Anexos
  └─ Pessoas
      ├─ Produtores
      ├─ Usuários
      └─ Vínculos

⚖️ Licitação
  ├─ Editais
  ├─ Balizamento
  ├─ Propostas
  ├─ Importações
  └─ Homologação

💼 Execução
  ├─ Gestão Contratual
  │   ├─ Contratos
  │   └─ Entregas
  ├─ Gestão Fiscal
  │   ├─ Notas Fiscais
  │   ├─ Conferência Fiscal
  │   └─ Atestos
  └─ Gestão Financeira
      ├─ Liquidações
      ├─ Pagamentos
      └─ Dashboard Financeiro

🔐 Administração
  ├─ Auditoria
  └─ Configurações
```

**Benefícios:**
- Contexto claro (por tipo de atividade)
- Navegação mais intuitiva
- Suporta até 3 níveis de profundidade
- Expansão/colapso de submenus

### 3. ✅ Correções Ortográficas Identificadas

**Erros Corrigidos:**

| Antes | Depois |
|-------|--------|
| Relatorios | Relatórios |
| Municipios | Municípios |
| Produtos de referencia | Produtos de Referência |
| Importacoes | Importações |
| Usuarios | Usuários |
| Configuracoes | Configurações |
| Homologacao | Homologação |
| Liquidações | Liquidações (já correto) |
| Usuario | Usuário |
| Inicio | Início |

### 4. ✅ Normalização de Textos

**Padrão Adotado:**
- ❌ `NOME_COM_UNDERSCORE`
- ✅ `Nome Com Espaços`

**Exemplos:**
- `Templates_Anexos` → `Modelos de Anexos`
- `Produtos_Referencia` → `Produtos de Referência`
- `Notas_Fiscais` → `Notas Fiscais`

---

## ARQUIVOS CRIADOS/MODIFICADOS

### Novos Arquivos

1. **`apps/frontend/src/config/menu.config.ts`**
   - Configuração centralizada do menu
   - Códigos de tela
   - Hierarquia de menus
   - Funções utilitárias

2. **`apps/frontend/src/hooks/useScreenTracker.ts`**
   - Hook de rastreamento automático de telas
   - Adiciona código ao `<body>`
   - Atualiza título da página
   - Prepara para analytics

3. **`apps/frontend/src/components/HierarchicalMenu.tsx`**
   - Componente de menu hierárquico
   - Suporte a submenus
   - Expansão/colapso
   - Badges e tooltips

4. **`apps/frontend/src/components/LayoutNew.tsx`**
   - Layout atualizado usando novo menu
   - Exibe código da tela
   - Breadcrumbs melhorados

5. **`docs/MELHORIAS-MENU-ORGANIZACAO.md`** (este arquivo)

---

## COMO USAR

### 1. Atualizar Layout Principal

```bash
# Substituir Layout.tsx pelo novo
cd apps/frontend/src/components
mv Layout.tsx Layout.old.tsx
mv LayoutNew.tsx Layout.tsx
```

### 2. Usar Hook de Rastreamento em Páginas

**Automático (via Layout):**
```tsx
// Não precisa fazer nada! O Layout já aplica automaticamente
```

**Manual (para telas com lógica específica):**
```tsx
import { useScreenCode } from '../hooks/useScreenTracker';

export default function MinhaTelaCustomizada() {
  // Para tela com ID dinâmico
  const { id } = useParams();
  useScreenCode(`SCR_CTR_DET_${id}`);
  
  return <div>Conteúdo...</div>;
}
```

### 3. Adicionar Nova Tela ao Menu

Editar `apps/frontend/src/config/menu.config.ts`:

```typescript
// Adicionar em uma das seções existentes
{
  screenCode: 'SCR_NOVO_001',  // Código único
  label: 'Nova Funcionalidade', // Nome exibido
  path: '/nova-funcionalidade', // Rota
  icon: <NovoIcon />,           // Ícone Material-UI
  roles: ['ADMIN', 'DRE'],      // Perfis autorizados
  description: 'Descrição para tooltip',
}
```

### 4. Obter Código da Tela Atual (JavaScript)

```javascript
// Via atributo do body
const screenCode = document.body.getAttribute('data-screen-code');
console.log('Código da tela:', screenCode);
```

### 5. Suporte Técnico

Quando usuário reportar problema:

**Suporte:** "Em qual tela você está?"  
**Usuário:** "Tela SCR_CTR_001"  
**Suporte:** ✅ Sabe imediatamente que é a tela de Contratos

---

## BENEFÍCIOS PARA O SUPORTE

### Antes
```
Suporte: Em qual tela você está?
Usuário: Na tela de contratos
Suporte: É a listagem ou os detalhes?
Usuário: Tem uma lista de contratos
Suporte: É a do menu esquerdo?
Usuário: Sim
Suporte: ??? (ainda confuso)
```

### Depois
```
Suporte: Qual o código da tela? (canto superior esquerdo)
Usuário: SCR_CTR_001
Suporte: ✅ Listagem de Contratos, entendido!
```

---

## PRÓXIMAS MELHORIAS SUGERIDAS

### 1. Analytics de Navegação

```typescript
// Em useScreenTracker.ts, adicionar:
import analytics from './analytics';

analytics.track('page_view', {
  screenCode,
  screenLabel,
  userRole: user?.role,
  timestamp: new Date().toISOString(),
});
```

### 2. Busca no Menu

```tsx
// Adicionar campo de busca no topo do menu
<TextField
  placeholder="Buscar no menu..."
  size="small"
  onChange={(e) => filterMenu(e.target.value)}
/>
```

### 3. Favoritos

```tsx
// Permitir marcar telas favoritas
<IconButton onClick={() => toggleFavorite(screenCode)}>
  <Star />
</IconButton>
```

### 4. Atalhos de Teclado

```typescript
// Adicionar navegação por teclado
useHotkeys('ctrl+1', () => navigate('/dashboard'));
useHotkeys('ctrl+2', () => navigate('/contratos'));
```

### 5. Tour Guiado

```tsx
// Tutorial interativo para novos usuários
<Joyride
  steps={[
    {
      target: '[data-screen-code="SCR_DASH_001"]',
      content: 'Esta é a página inicial do sistema',
    },
    // ...
  ]}
/>
```

---

## CHECKLIST DE VALIDAÇÃO

Antes de colocar em produção:

- [ ] Todos os códigos de tela são únicos
- [ ] Todos os textos estão em português correto
- [ ] Nenhum underscore em labels visíveis
- [ ] Menu funciona em mobile
- [ ] Submenus expandem/colapsam corretamente
- [ ] Breadcrumbs atualizados
- [ ] Código da tela aparece no body
- [ ] Título da página atualiza corretamente
- [ ] Permissões por role funcionando
- [ ] Testes de navegação passando
- [ ] Documentação de códigos atualizada

---

## TESTES RECOMENDADOS

### Teste 1: Código de Tela
```javascript
// Navegar para /dashboard
expect(document.body.getAttribute('data-screen-code')).toBe('SCR_DASH_001');
```

### Teste 2: Menu Hierárquico
```javascript
// Clicar em "Cadastros" deve expandir submenu
fireEvent.click(screen.getByText('Cadastros'));
expect(screen.getByText('Organizacional')).toBeVisible();
```

### Teste 3: Permissões
```javascript
// Usuário DRE não deve ver menu "Administração"
render(<Layout />, { user: { role: 'DRE' } });
expect(screen.queryByText('Administração')).toBeNull();
```

---

## SUPORTE E MANUTENÇÃO

### Adicionar Novo Código de Tela

1. Editar `apps/frontend/src/config/menu.config.ts`
2. Adicionar código seguindo padrão `SCR_[CONTEXTO]_[NÚMERO]`
3. Documentar neste arquivo
4. Atualizar testes

### Reorganizar Menu

1. Editar `menuConfig` em `menu.config.ts`
2. Mover itens entre seções
3. Ajustar hierarquia (`children`)
4. Testar navegação

### Troubleshooting

**Problema:** Código de tela não aparece

**Solução:** Verificar se `useScreenTracker()` está sendo chamado no Layout

**Problema:** Menu não expande

**Solução:** Verificar se item tem `children` definido

**Problema:** Tela não aparece no menu

**Solução:** Verificar `roles` do item vs role do usuário

---

## REFERÊNCIAS

- Material-UI Icons: https://mui.com/material-ui/material-icons/
- React Router: https://reactrouter.com/
- TypeScript Enums: https://www.typescriptlang.org/docs/handbook/enums.html

---

**Status:** ✅ Implementação Completa - Pronto para Testes

**Próximo Passo:** Substituir Layout antigo pelo novo e testar navegação
