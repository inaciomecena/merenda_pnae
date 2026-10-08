import { useState, useCallback } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Grid, MenuItem, Select, Stack, Typography, FormControl, InputLabel, TextField, Divider,
} from '@mui/material';
import { Download, Assessment, School, People, Assignment, LocalShipping, Person } from '@mui/icons-material';
import api from '../services/api';

const REPORT_TYPES = [
  { value: 'geral', label: 'Relatorio Geral', icon: <Assessment /> },
  { value: 'municipio', label: 'Por Municipio', icon: <Assessment /> },
  { value: 'escola', label: 'Por Escola', icon: <School /> },
  { value: 'edital', label: 'Por Edital', icon: <Assignment /> },
  { value: 'produtor', label: 'Por Produtor', icon: <People /> },
  { value: 'produto', label: 'Por Produto', icon: <LocalShipping /> },
  { value: 'extensionista', label: 'Por Extensionista', icon: <Person /> },
];

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState('geral');
  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<any>(null);

  const gerarRelatorio = useCallback(async () => {
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const params = new URLSearchParams();
      if (id) params.append('id', id);
      if (nome) params.append('nome', nome);
      if (ano) params.append('ano', String(ano));
      const { data } = await api.get(`/reports/${tipo}?${params.toString()}`);
      setResultado(data);
    } catch {
      setError('Erro ao gerar relatorio.');
    } finally {
      setLoading(false);
    }
  }, [tipo, id, nome, ano]);

  const exportarCSV = useCallback(async () => {
    const params = new URLSearchParams();
    if (id) params.append('id', id);
    if (nome) params.append('nome', nome);
    const token = localStorage.getItem('seaf_token');
    const url = `http://localhost:3000/api/v1/reports/exportar/${tipo}?${params.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `relatorio-${tipo}.csv`;
        a.click();
      });
  }, [tipo, id, nome]);

  const exportarJSON = useCallback(() => {
    if (!resultado) return;
    const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-${tipo}.json`;
    a.click();
  }, [resultado, tipo]);

  const showIdField = ['municipio', 'escola', 'edital', 'produtor', 'extensionista'].includes(tipo);
  const showNomeField = tipo === 'produto';

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>Relatorios Gerenciais</Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Configurar Relatorio</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Relatorio</InputLabel>
                  <Select value={tipo} label="Tipo de Relatorio" onChange={e => { setTipo(e.target.value); setId(''); setNome(''); }}>
                    {REPORT_TYPES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {showIdField && (
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" label="ID" value={id} onChange={e => setId(e.target.value)} placeholder="UUID do registro" />
                </Grid>
              )}
              {showNomeField && (
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" label="Nome do Produto" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: abacaxi" />
                </Grid>
              )}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ano</InputLabel>
                  <Select value={ano} label="Ano" onChange={e => setAno(Number(e.target.value))}>
                    {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="contained" onClick={gerarRelatorio} disabled={loading} sx={{ height: 40 }}>
                  {loading ? <CircularProgress size={20} /> : 'Gerar'}
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {resultado && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Resultado</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<Download />} onClick={exportarCSV}>CSV</Button>
                <Button variant="outlined" startIcon={<Download />} onClick={exportarJSON}>JSON</Button>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {resultado.erro ? (
              <Alert severity="warning">{resultado.erro}</Alert>
            ) : (
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
                {JSON.stringify(resultado, null, 2)}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Tipos de Relatorio Disponiveis</Typography>
          <Grid container spacing={2}>
            {REPORT_TYPES.map(r => (
              <Grid item xs={12} sm={6} md={4} key={r.value}>
                <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => setTipo(r.value)}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {r.icon}
                      <Typography variant="subtitle1" fontWeight={600}>{r.label}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
