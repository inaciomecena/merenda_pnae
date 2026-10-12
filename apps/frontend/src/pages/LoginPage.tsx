import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useScreenTracker } from '../hooks/useScreenTracker';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  const { screenCode } = useScreenTracker();
  const [email, setEmail] = useState('admin@seaf.gov.br');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha no login');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f4f8' }}>
      <Card sx={{ width: 420, p: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src="/logo.png" alt="SEAF PNAE" style={{ height: 70 }} />
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>Acesse o sistema PNAE</Typography>
          <Chip label={screenCode} size="small" variant="outlined" sx={{ mb: 2, fontFamily: 'monospace', fontSize: 10 }} />
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" fullWidth required />
              <TextField label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" fullWidth required />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Entrar'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
