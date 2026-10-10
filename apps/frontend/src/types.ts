export type UserRole = 'ADMIN' | 'ESCOLA' | 'EXTENSIONISTA' | 'DRE' | 'PRODUTOR';

export interface UserContext {
  pendencias: string[];
  vinculos: Array<{ id: string; funcao: UserRole; dre?: { id: string; nome: string } | null; escola?: { id: string; nome: string } | null; produtor?: { id: string; nome: string } | null }>;
  representacoes: Array<{ id: string; produtor: { id: string; nome: string }; permissoes: string }>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  escolaId?: string | null;
  municipioId?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ImportacaoItem {
  id: string;
  numeroItem?: number;
  produtoOriginal: string;
  especificacao?: string | null;
  quantidade?: number | null;
  unidade?: string | null;
  precoUnitario?: number | null;
  valorTotal?: number | null;
  observacoes?: string | null;
  status: string;
  pendenteEdicao: boolean;
}

export interface Importacao {
  id: string;
  editalId?: string | null;
  arquivoNome: string;
  arquivoCaminho: string;
  origem: string;
  status: string;
  tituloExtraido?: string | null;
  numeroExtraido?: string | null;
  anoExtraido?: number | null;
  municipioNome?: string | null;
  escolaNome?: string | null;
  objeto?: string | null;
  resumo?: string | null;
  quantidadeItens: number;
  tempoProcessamentoMs?: number | null;
  mensagemErro?: string | null;
  createdAt: string;
  processadoEm?: string | null;
  confirmadoEm?: string | null;
  edital?: {
    id: string;
    numero: string;
    ano: number;
    titulo: string;
    objeto?: string | null;
    descricao?: string | null;
    observacoes?: string | null;
    municipio?: { id: string; nome: string } | null;
    escola?: { id: string; nome: string } | null;
    escolasVinculadas?: Array<{
      id: string;
      escola: { id: string; nome: string; municipio?: { id: string; nome: string } | null };
    }>;
    itens: ImportacaoItem[];
  } | null;
}
