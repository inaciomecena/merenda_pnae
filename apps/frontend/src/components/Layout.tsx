import {
  Alert, Box, Breadcrumbs, Chip, Container, CssBaseline, Divider, Drawer,
  IconButton, MenuItem, Select, Stack, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { Menu } from '@mui/icons-material';
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuthorizedMenuItems, keepMenuPath } from '../config/menu.config';
import { HierarchicalMenu } from './HierarchicalMenu';
import { useScreenTracker } from '../hooks/useScreenTracker';
import { humanizeSystemValue } from '../lib/display-text';

const drawerWidth = 292;

export default function Layout() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, context, selectedVinculo, selectVinculo, logout } = useAuth();
  const { screenCode, screenLabel } = useScreenTracker();

  const authorizedItems = getAuthorizedMenuItems(user?.role);
  const visibleItems = context?.pendencias.length
    ? keepMenuPath(authorizedItems, '/dashboard')
    : authorizedItems;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f8fc' }}>
      <CssBaseline />
      <Drawer
        variant={compact ? 'temporary' : 'permanent'}
        open={compact ? menuOpen : true}
        onClose={() => setMenuOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: compact ? 0 : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#fff',
            borderRight: '1px solid #e4e7ec',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e4e7ec' }}>
          <Box component="img" src="/logo.png" alt="SEAF PNAE" sx={{ display: 'block', height: 48, maxWidth: '100%', mx: 'auto', objectFit: 'contain' }} />
          <Typography align="center" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            Gestão da Alimentação Escolar
          </Typography>
        </Box>

        <Box component="nav" aria-label="Menu principal" sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
          <HierarchicalMenu items={visibleItems} onItemClick={() => setMenuOpen(false)} />
        </Box>

        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #e4e7ec', bgcolor: '#fafafa' }}>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            Perfil atual
          </Typography>
          <Typography variant="body2" fontWeight={600}>{humanizeSystemValue(user?.role || 'VISITANTE')}</Typography>
          <Typography variant="caption" color="text.secondary">
            As opções exibidas respeitam suas permissões e seu vínculo institucional.
          </Typography>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            minHeight: 64,
            bgcolor: '#fff',
            borderBottom: '1px solid #e4e7ec',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: { xs: 2, md: 3 },
          }}
        >
          {compact ? <IconButton aria-label="Abrir menu" onClick={() => setMenuOpen(true)} sx={{ mr: 'auto' }}><Menu /></IconButton> : null}
          <Stack direction="row" spacing={1.25} alignItems="center">
            {context && context.vinculos.filter(v => v.funcao === user?.role).length > 1 ? (
              <Select
                size="small"
                displayEmpty
                value={selectedVinculo}
                onChange={event => { selectVinculo(event.target.value); window.location.reload(); }}
                aria-label="Vínculo institucional ativo"
              >
                <MenuItem value="">Todos os vínculos</MenuItem>
                {context.vinculos.filter(v => v.funcao === user?.role).map(v => (
                  <MenuItem key={v.id} value={v.id}>{v.dre?.nome || v.escola?.nome || v.produtor?.nome || v.funcao}</MenuItem>
                ))}
              </Select>
            ) : null}
            <Chip label={humanizeSystemValue(user?.role || 'VISITANTE')} size="small" sx={{ bgcolor: '#e8eaf6', color: '#01287c', fontWeight: 700 }} />
            <Typography variant="body2" fontWeight={500}>{user?.name || 'Usuário'}</Typography>
            <Divider orientation="vertical" flexItem />
            <Typography
              component="button"
              type="button"
              onClick={() => { logout(); navigate('/login'); }}
              sx={{ border: 0, bgcolor: 'transparent', color: 'text.secondary', cursor: 'pointer', fontSize: 13, '&:hover': { color: 'error.main' } }}
            >
              Sair
            </Typography>
          </Stack>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          <Container maxWidth={false} sx={{ px: '0 !important', width: '100%' }}>
            {context?.pendencias.length ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {context.pendencias.join('. ')}. Solicite ao administrador a regularização.
              </Alert>
            ) : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
              <Breadcrumbs aria-label="Navegação estrutural">
                <Link to="/dashboard" style={{ textDecoration: 'none', color: '#01287c', fontSize: 13, fontWeight: 500 }}>
                  Início
                </Link>
                <Typography color="text.primary" sx={{ fontSize: 13 }}>{screenLabel}</Typography>
              </Breadcrumbs>
              <Chip
                label={screenCode}
                size="small"
                variant="outlined"
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontFamily: 'monospace', fontSize: 11, color: '#344054' }}
              />
            </Stack>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
