import { Box, Breadcrumbs, Container, CssBaseline, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Stack, Chip } from '@mui/material';
import { Home, School, Map, Description, Inventory2, People, Gavel, Assignment, Group, UploadFile, History, Settings, Science, Assessment, Map as MapIcon } from '@mui/icons-material';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const routes = [
  { label: 'Dashboard', path: '/dashboard', icon: <Home /> },
  { label: 'Mapa MT', path: '/mapa', icon: <MapIcon /> },
  { label: 'Relatorios', path: '/relatorios', icon: <Assessment /> },
  { label: 'Municipios', path: '/municipios', icon: <Map /> },
  { label: 'Escolas', path: '/escolas', icon: <School /> },
  { label: 'Editais', path: '/editais', icon: <Description /> },
  { label: 'Produtos de referencia', path: '/produtos-referencia', icon: <Inventory2 /> },
  { label: 'Produtores', path: '/produtores', icon: <People /> },
  { label: 'Balizamento', path: '/balizamento', icon: <Gavel /> },
  { label: 'Propostas', path: '/propostas', icon: <Assignment /> },
  { label: 'Importacoes', path: '/importacoes', icon: <UploadFile /> },
  { label: 'Usuarios', path: '/usuarios', icon: <Group /> },
  { label: 'Auditoria', path: '/auditoria', icon: <History /> },
  { label: 'Configuracoes', path: '/configuracoes', icon: <Settings /> },
  { label: 'Homologacao', path: '/homologacao', icon: <Science /> },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, ' '));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f8fc' }}>
      <CssBaseline />

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'white',
            borderRight: '1px solid #e8e8e8',
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Box component="img" src="/logo.png" alt="SAGAE" sx={{ height: 50, width: 'auto', objectFit: 'contain' }} />
        </Box>

        <Box sx={{ flex: 1, pt: 1 }}>
          <List sx={{ px: 1 }}>
            {routes.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    mb: 0.25,
                    minHeight: 38,
                    px: 1.5,
                    '&.Mui-selected': {
                      bgcolor: '#e8eaf6',
                      '&:hover': { bgcolor: '#c5cae9' },
                      '& .MuiListItemIcon-root': { color: '#01287C' },
                      '& .MuiListItemText-primary': { color: '#01287C', fontWeight: 600 },
                    },
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#01287C' : '#666' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#01287C' : '#333' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ mx: 2 }} />
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" sx={{ color: '#999', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Fluxos por perfil
          </Typography>
          <Stack spacing={0.3} sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: 11 }}>
              <Box component="span" sx={{ fontWeight: 600 }}>Admin:</Box> acesso total
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', fontSize: 11 }}>
              <Box component="span" sx={{ fontWeight: 600 }}>Escola:</Box> editais e conferencia
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', fontSize: 11 }}>
              <Box component="span" sx={{ fontWeight: 600 }}>Extensionista:</Box> balizamento e propostas
            </Typography>
          </Stack>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            height: 56,
            minHeight: 56,
            bgcolor: 'white',
            borderBottom: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 3,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={user?.role || 'VISITANTE'}
              size="small"
              sx={{
                bgcolor: '#e8eaf6',
                color: '#01287C',
                fontWeight: 600,
                fontSize: 11,
                height: 24,
              }}
            />
            <Typography variant="body2" sx={{ color: '#333', fontWeight: 500, fontSize: 13 }}>
              {user?.name || 'Usuario'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', fontSize: 12 }}>
              ▾
            </Typography>
            <Box sx={{ width: 1, height: 20, bgcolor: '#e0e0e0' }} />
            <Typography
              variant="body2"
              onClick={() => { logout(); navigate('/login'); }}
              sx={{ color: '#666', cursor: 'pointer', fontSize: 13, '&:hover': { color: '#d32f2f' } }}
            >
              Sair
            </Typography>
          </Stack>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          <Container maxWidth="xl" sx={{ px: 0 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
              <Link
                to="/dashboard"
                style={{ textDecoration: 'none', color: '#01287C', fontSize: 13, fontWeight: 500 }}
              >
                Inicio
              </Link>
              {breadcrumbs.map((item, index) => (
                <Typography key={index} color="text.primary" textTransform="capitalize" sx={{ fontSize: 13 }}>
                  {item}
                </Typography>
              ))}
            </Breadcrumbs>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
