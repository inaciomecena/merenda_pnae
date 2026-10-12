import { lazy, Suspense } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { CircularProgress, Box } from '@mui/material';
import type { UserRole } from './types';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const RelatoriosPage = lazy(() => import('./pages/RelatoriosPage'));
const MunicipiosPage = lazy(() => import('./pages/MunicipiosPageV2'));
const EscolasPage = lazy(() => import('./pages/EscolasPageV2'));
const EscolaDetalhesPage = lazy(() => import('./pages/EscolaDetalhesPage'));
const EditaisPage = lazy(() => import('./pages/EditaisPage'));
const EditalComposicaoPage = lazy(() => import('./pages/EditalComposicaoPage'));
const TemplatesAnexosPage = lazy(() => import('./pages/TemplatesAnexosPage'));
const EngenhariaReversaPage = lazy(() => import('./pages/EngenhariaReversaPage'));
const ProdutosReferenciaPage = lazy(() => import('./pages/ProdutosReferenciaPage'));
const ProdutoresPage = lazy(() => import('./pages/ProdutoresPageV2'));
const BalizamentoPage = lazy(() => import('./pages/BalizamentoPageV2'));
const PropostasPage = lazy(() => import('./pages/PropostasPage'));
const ImportacoesPage = lazy(() => import('./pages/ImportacoesPage'));
const ImportarEditalPage = lazy(() => import('./pages/ImportarEditalPage'));
const ImportacaoDetalhesPage = lazy(() => import('./pages/ImportacaoDetalhesPage'));
const ImportacaoConferenciaPage = lazy(() => import('./pages/ImportacaoConferenciaPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const ConfigPage = lazy(() => import('./pages/ConfigPage'));
const HomologacaoPage = lazy(() => import('./pages/HomologacaoPage'));
const OrganizacaoPage = lazy(() => import('./pages/OrganizacaoPage'));
const DreEscolasPage = lazy(() => import('./pages/DreEscolasPage'));
const VinculosPage = lazy(() => import('./pages/VinculosPage'));
const EditalConsultaPage = lazy(() => import('./pages/EditalConsultaPage'));
const ContratosPage = lazy(() => import('./pages/ContratosPage'));
const ContratoDetalhesPage = lazy(() => import('./pages/ContratoDetalhesPage'));
const ContratoFormPage = lazy(() => import('./pages/ContratoFormPage'));
const EntregasPage = lazy(() => import('./pages/EntregasPage'));
const NotasFiscaisPage = lazy(() => import('./pages/NotasFiscaisPage'));
const NotaFiscalFormPage = lazy(() => import('./pages/NotaFiscalFormPage'));
const NotaFiscalDetalhesPage = lazy(() => import('./pages/NotaFiscalDetalhesPage'));
const ConferenciaFiscalPage = lazy(() => import('./pages/ConferenciaFiscalPage'));
const AtestoPage = lazy(() => import('./pages/AtestoPage'));
const LiquidacaoPage = lazy(() => import('./pages/LiquidacaoPage'));
const PagamentosPage = lazy(() => import('./pages/PagamentosPage'));
const DashboardFinanceiroPage = lazy(() => import('./pages/DashboardFinanceiroPage'));
const PrestacaoContasPage = lazy(() => import('./pages/PrestacaoContasPage'));
const ChamadasPublicasPage = lazy(() => import('./pages/ChamadasPublicasPage'));
const GestaoOperacionalPage = lazy(() => import('./pages/GestaoOperacionalPage'));

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <CircularProgress />
    </Box>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/mapa" element={<ProtectedRoute allowedRoles={['ADMIN']}><MapPage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['ADMIN']}><RelatoriosPage /></ProtectedRoute>} />
          <Route path="/municipios" element={<ProtectedRoute allowedRoles={['ADMIN']}><MunicipiosPage /></ProtectedRoute>} />
          <Route path="/escolas" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><EscolasPage /></ProtectedRoute>} />
          <Route path="/escolas/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><EscolaDetalhesPage /></ProtectedRoute>} />
          <Route path="/editais" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><EditaisPage /></ProtectedRoute>} />
          <Route path="/editais/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><EditalComposicaoPage /></ProtectedRoute>} />
          <Route path="/editais/:id/consulta" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><EditalConsultaPage /></ProtectedRoute>} />
          <Route path="/templates-anexos" element={<ProtectedRoute allowedRoles={['ADMIN']}><TemplatesAnexosPage /></ProtectedRoute>} />
          <Route path="/produtos-referencia" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProdutosReferenciaPage /></ProtectedRoute>} />
          <Route path="/produtores" element={<ProtectedRoute allowedRoles={['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><ProdutoresPage /></ProtectedRoute>} />
          <Route path="/balizamento" element={<ProtectedRoute allowedRoles={['ADMIN']}><BalizamentoPage /></ProtectedRoute>} />
          <Route path="/propostas" element={<ProtectedRoute allowedRoles={['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><PropostasPage /></ProtectedRoute>} />
          <Route path="/importacoes" element={<ProtectedRoute allowedRoles={['ADMIN']}><ImportacoesPage /></ProtectedRoute>} />
          <Route path="/importacoes/importar" element={<ProtectedRoute allowedRoles={['ADMIN']}><ImportarEditalPage /></ProtectedRoute>} />
          <Route path="/importacoes/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><ImportacaoDetalhesPage /></ProtectedRoute>} />
          <Route path="/importacoes/:id/conferencia" element={<ProtectedRoute allowedRoles={['ADMIN']}><ImportacaoConferenciaPage /></ProtectedRoute>} />
          <Route path="/importacoes/:id/estrutura" element={<ProtectedRoute allowedRoles={['ADMIN']}><EngenhariaReversaPage /></ProtectedRoute>} />
          <Route path="/organizacao" element={<ProtectedRoute allowedRoles={['ADMIN']}><OrganizacaoPage /></ProtectedRoute>} />
          <Route path="/organizacao/dres/:id/escolas" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><DreEscolasPage /></ProtectedRoute>} />
          <Route path="/vinculos" element={<ProtectedRoute allowedRoles={['ADMIN']}><VinculosPage /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsuariosPage /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute allowedRoles={['ADMIN']}><LogsPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={['ADMIN']}><ConfigPage /></ProtectedRoute>} />
          <Route path="/homologacao" element={<ProtectedRoute allowedRoles={['ADMIN']}><HomologacaoPage /></ProtectedRoute>} />
          <Route path="/contratos" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><ContratosPage /></ProtectedRoute>} />
          <Route path="/contratos/novo" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><ContratoFormPage /></ProtectedRoute>} />
          <Route path="/contratos/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><ContratoDetalhesPage /></ProtectedRoute>} />
          <Route path="/contratos/:id/editar" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><ContratoFormPage /></ProtectedRoute>} />
          <Route path="/contratos/:id/auditoria" element={<ProtectedRoute allowedRoles={['ADMIN']}><ContratoDetalhesPage /></ProtectedRoute>} />
          <Route path="/entregas" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><EntregasPage /></ProtectedRoute>} />
          <Route path="/notas-fiscais" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><NotasFiscaisPage /></ProtectedRoute>} />
          <Route path="/notas-fiscais/nova" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><NotaFiscalFormPage /></ProtectedRoute>} />
          <Route path="/notas-fiscais/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><NotaFiscalDetalhesPage /></ProtectedRoute>} />
          <Route path="/conferencia-fiscal" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><ConferenciaFiscalPage /></ProtectedRoute>} />
          <Route path="/atestos" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><AtestoPage /></ProtectedRoute>} />
          <Route path="/liquidacoes" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><LiquidacaoPage /></ProtectedRoute>} />
          <Route path="/pagamentos" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE']}><PagamentosPage /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR']}><DashboardFinanceiroPage /></ProtectedRoute>} />
          <Route path="/prestacao-contas" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><PrestacaoContasPage /></ProtectedRoute>} />
          <Route path="/chamadas-publicas" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><ChamadasPublicasPage /></ProtectedRoute>} />
          <Route path="/gestao-operacional" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><GestaoOperacionalPage /></ProtectedRoute>} />
          <Route path="/pendencias" element={<ProtectedRoute allowedRoles={['ADMIN', 'DRE', 'ESCOLA']}><GestaoOperacionalPage /></ProtectedRoute>} />
          <Route path="/monitoramento" element={<ProtectedRoute allowedRoles={['ADMIN']}><GestaoOperacionalPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

