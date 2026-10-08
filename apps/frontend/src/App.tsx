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

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <CircularProgress />
    </Box>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuth();
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
          <Route path="/mapa" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
          <Route path="/municipios" element={<ProtectedRoute allowedRoles={['ADMIN']}><MunicipiosPage /></ProtectedRoute>} />
          <Route path="/escolas" element={<ProtectedRoute allowedRoles={['ADMIN', 'ESCOLA']}><EscolasPage /></ProtectedRoute>} />
          <Route path="/escolas/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'ESCOLA']}><EscolaDetalhesPage /></ProtectedRoute>} />
          <Route path="/editais" element={<ProtectedRoute allowedRoles={['ADMIN', 'ESCOLA']}><EditaisPage /></ProtectedRoute>} />
          <Route path="/produtos-referencia" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProdutosReferenciaPage /></ProtectedRoute>} />
          <Route path="/produtores" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProdutoresPage /></ProtectedRoute>} />
          <Route path="/balizamento" element={<ProtectedRoute allowedRoles={['ADMIN', 'EXTENSIONISTA']}><BalizamentoPage /></ProtectedRoute>} />
          <Route path="/propostas" element={<ProtectedRoute allowedRoles={['ADMIN', 'EXTENSIONISTA', 'ESCOLA']}><PropostasPage /></ProtectedRoute>} />
          <Route path="/importacoes" element={<ProtectedRoute allowedRoles={['ADMIN', 'ESCOLA']}><ImportacoesPage /></ProtectedRoute>} />
          <Route path="/importacoes/importar" element={<ProtectedRoute allowedRoles={['ADMIN', 'ESCOLA']}><ImportarEditalPage /></ProtectedRoute>} />
          <Route path="/importacoes/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'ESCOLA']}><ImportacaoDetalhesPage /></ProtectedRoute>} />
          <Route path="/importacoes/:id/conferencia" element={<ProtectedRoute allowedRoles={['ADMIN', 'ESCOLA']}><ImportacaoConferenciaPage /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsuariosPage /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute allowedRoles={['ADMIN']}><LogsPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={['ADMIN']}><ConfigPage /></ProtectedRoute>} />
          <Route path="/homologacao" element={<ProtectedRoute allowedRoles={['ADMIN']}><HomologacaoPage /></ProtectedRoute>} />
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
