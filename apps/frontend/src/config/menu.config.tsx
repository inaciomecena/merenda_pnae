import type { ReactNode } from 'react';
import {
  AccountBalance, AdminPanelSettings, Article, Assessment, Assignment, AttachMoney,
  Business, BusinessCenter, Description, FactCheck, Gavel, Group, History, Home,
  Inventory2, LocalShipping, Map, Payment, People, Receipt, School, Science,
  Settings, UploadFile, Verified,
} from '@mui/icons-material';
import type { UserRole } from '../types';

export interface MenuItemConfig {
  screenCode: string;
  label: string;
  path?: string;
  icon: ReactNode;
  roles: UserRole[];
  children?: MenuItemConfig[];
  description?: string;
}

const ALL_ROLES: UserRole[] = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'];

/** Navegação organizada pela finalidade de cada recurso. */
export const menuConfig: MenuItemConfig[] = [
  {
    screenCode: 'MENU-VISAO-GERAL', label: 'Visão geral', icon: <Assessment />, roles: ALL_ROLES,
    children: [
      { screenCode: 'PNAE-DSH-001', label: 'Painel geral', path: '/dashboard', icon: <Home />, roles: ALL_ROLES, description: 'Indicadores gerais da plataforma' },
      { screenCode: 'PNAE-GEO-001', label: 'Mapa de Mato Grosso', path: '/mapa', icon: <Map />, roles: ['ADMIN'], description: 'Distribuição geográfica de escolas e municípios' },
      { screenCode: 'PNAE-REL-001', label: 'Relatórios gerenciais', path: '/relatorios', icon: <Assessment />, roles: ['ADMIN'], description: 'Relatórios operacionais e gerenciais' },
    ],
  },
  {
    screenCode: 'MENU-CADASTROS', label: 'Cadastros', icon: <Business />, roles: ALL_ROLES,
    children: [
      {
        screenCode: 'MENU-ESTRUTURA', label: 'Estrutura institucional', icon: <Business />, roles: ['ADMIN', 'DRE', 'ESCOLA'],
        children: [
          { screenCode: 'PNAE-ORG-001', label: 'Organização', path: '/organizacao', icon: <Business />, roles: ['ADMIN'], description: 'Entidades executoras e diretorias regionais' },
          { screenCode: 'PNAE-MUN-001', label: 'Municípios', path: '/municipios', icon: <Map />, roles: ['ADMIN'], description: 'Cadastro de municípios' },
          { screenCode: 'PNAE-ESC-001', label: 'Escolas', path: '/escolas', icon: <School />, roles: ['ADMIN', 'DRE', 'ESCOLA'], description: 'Cadastro de unidades escolares' },
        ],
      },
      {
        screenCode: 'MENU-FORNECIMENTO', label: 'Fornecedores e produtos', icon: <People />, roles: ['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'],
        children: [
          { screenCode: 'PNAE-PRD-001', label: 'Produtores', path: '/produtores', icon: <People />, roles: ['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'], description: 'Cadastro de produtores rurais' },
          { screenCode: 'PNAE-PRF-001', label: 'Produtos dos editais', path: '/produtos-referencia', icon: <Inventory2 />, roles: ['ADMIN'], description: 'Catálogo padronizado a partir dos editais' },
        ],
      },
      { screenCode: 'PNAE-MOD-001', label: 'Modelos de documentos', path: '/templates-anexos', icon: <Article />, roles: ['ADMIN'], description: 'Modelos de anexos e documentos' },
    ],
  },
  {
    screenCode: 'MENU-CHAMADAS', label: 'Chamadas públicas', icon: <Gavel />, roles: ALL_ROLES,
    children: [
      { screenCode: 'PNAE-CHP-001', label: 'Painel de chamadas', path: '/chamadas-publicas', icon: <Gavel />, roles: ['ADMIN', 'DRE', 'ESCOLA'], description: 'Publicacao e acompanhamento de chamadas publicas' },
      { screenCode: 'PNAE-EDT-001', label: 'Editais', path: '/editais', icon: <Description />, roles: ['ADMIN', 'DRE', 'ESCOLA'], description: 'Gestao de editais de chamada publica' },
      { screenCode: 'PNAE-IMP-001', label: 'Importações de editais', path: '/importacoes', icon: <UploadFile />, roles: ['ADMIN'], description: 'Importação e conferência de editais externos' },
      { screenCode: 'PNAE-BAL-001', label: 'Balizamento', path: '/balizamento', icon: <Gavel />, roles: ['ADMIN'], description: 'Correspondência entre itens e fornecedores' },
      { screenCode: 'PNAE-PRP-001', label: 'Propostas', path: '/propostas', icon: <Assignment />, roles: ['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'], description: 'Elaboração e acompanhamento de propostas' },
    ],
  },
  {
    screenCode: 'MENU-EXECUCAO', label: 'Execução contratual', icon: <BusinessCenter />, roles: ALL_ROLES,
    children: [
      { screenCode: 'PNAE-CTR-001', label: 'Contratos', path: '/contratos', icon: <Description />, roles: ALL_ROLES, description: 'Gestão dos contratos de fornecimento' },
      { screenCode: 'PNAE-ENT-001', label: 'Entregas e recebimentos', path: '/entregas', icon: <LocalShipping />, roles: ALL_ROLES, description: 'Programação, recebimento e ocorrências' },
    ],
  },
  {
    screenCode: 'MENU-FISCAL-FINANCEIRO', label: 'Gestão fiscal e financeira', icon: <Receipt />, roles: ALL_ROLES,
    children: [
      {
        screenCode: 'MENU-FISCAL', label: 'Documentos fiscais', icon: <Receipt />, roles: ALL_ROLES,
        children: [
          { screenCode: 'PNAE-NFS-001', label: 'Notas fiscais', path: '/notas-fiscais', icon: <Description />, roles: ALL_ROLES, description: 'Cadastro e acompanhamento de notas fiscais' },
          { screenCode: 'PNAE-CFD-001', label: 'Conferência documental', path: '/conferencia-fiscal', icon: <FactCheck />, roles: ['ADMIN', 'DRE'], description: 'Conferência documental e divergências' },
          { screenCode: 'PNAE-ATE-001', label: 'Atestos', path: '/atestos', icon: <Verified />, roles: ['ADMIN', 'DRE'], description: 'Registro de atestos administrativos' },
        ],
      },
      {
        screenCode: 'MENU-FINANCEIRO', label: 'Acompanhamento financeiro', icon: <AttachMoney />, roles: ALL_ROLES,
        children: [
          { screenCode: 'PNAE-LIQ-001', label: 'Liquidações', path: '/liquidacoes', icon: <AccountBalance />, roles: ['ADMIN', 'DRE'], description: 'Registros administrativos de liquidação' },
          { screenCode: 'PNAE-PAG-001', label: 'Pagamentos', path: '/pagamentos', icon: <Payment />, roles: ['ADMIN', 'DRE'], description: 'Acompanhamento de pagamentos e estornos' },
          { screenCode: 'PNAE-FIN-001', label: 'Painel financeiro', path: '/financeiro', icon: <Assessment />, roles: ALL_ROLES, description: 'Indicadores financeiros consolidados' },
          { screenCode: 'PNAE-PC-001', label: 'Prestacao de contas', path: '/prestacao-contas', icon: <Assessment />, roles: ['ADMIN', 'DRE', 'ESCOLA'], description: 'Consolidacao, conferencia e exportacao' },
        ],
      },
    ],
  },
  {
    screenCode: 'MENU-ADMINISTRACAO', label: 'Administração', icon: <AdminPanelSettings />, roles: ['ADMIN'],
    children: [
      {
        screenCode: 'MENU-OPERACAO', label: 'Administração e operação', icon: <Assessment />, roles: ['ADMIN', 'DRE', 'ESCOLA'],
        children: [
          { screenCode: 'PNAE-OPS-001', label: 'Painel operacional', path: '/gestao-operacional', icon: <Assessment />, roles: ['ADMIN', 'DRE', 'ESCOLA'], description: 'Indicadores e pendências dos processos' },
          { screenCode: 'PNAE-OPS-002', label: 'Central de pendências', path: '/pendencias', icon: <FactCheck />, roles: ['ADMIN', 'DRE', 'ESCOLA'], description: 'Situações que exigem ação humana' },
          { screenCode: 'PNAE-OPS-003', label: 'Monitoramento', path: '/monitoramento', icon: <Verified />, roles: ['ADMIN'], description: 'Diagnóstico técnico restrito' },
        ],
      },
      {
        screenCode: 'MENU-ACESSOS', label: 'Usuários e acessos', icon: <Group />, roles: ['ADMIN'],
        children: [
          { screenCode: 'PNAE-USR-001', label: 'Usuários', path: '/usuarios', icon: <Group />, roles: ['ADMIN'], description: 'Contas de acesso' },
          { screenCode: 'PNAE-VIN-001', label: 'Vínculos e permissões', path: '/vinculos', icon: <Group />, roles: ['ADMIN'], description: 'Vínculos institucionais e escopos' },
        ],
      },
      {
        screenCode: 'MENU-CONTROLE', label: 'Controle do sistema', icon: <Settings />, roles: ['ADMIN'],
        children: [
          { screenCode: 'PNAE-AUD-001', label: 'Auditoria', path: '/auditoria', icon: <History />, roles: ['ADMIN'], description: 'Histórico de operações' },
          { screenCode: 'PNAE-CFG-001', label: 'Configurações', path: '/configuracoes', icon: <Settings />, roles: ['ADMIN'], description: 'Parâmetros gerais da plataforma' },
          { screenCode: 'PNAE-HML-001', label: 'Homologação técnica', path: '/homologacao', icon: <Science />, roles: ['ADMIN'], description: 'Diagnóstico e recursos de homologação' },
        ],
      },
    ],
  },
];

export function getAuthorizedMenuItems(userRole: UserRole | undefined): MenuItemConfig[] {
  if (!userRole) return [];
  const filter = (items: MenuItemConfig[]): MenuItemConfig[] => items
    .filter(item => item.roles.includes(userRole))
    .map(item => ({ ...item, children: item.children ? filter(item.children) : undefined }))
    .filter(item => !item.children || item.children.length > 0);
  return filter(menuConfig);
}

export function keepMenuPath(items: MenuItemConfig[], path: string): MenuItemConfig[] {
  return items.flatMap(item => {
    if (item.path === path) return [item];
    const children = item.children ? keepMenuPath(item.children, path) : [];
    return children.length ? [{ ...item, children }] : [];
  });
}
