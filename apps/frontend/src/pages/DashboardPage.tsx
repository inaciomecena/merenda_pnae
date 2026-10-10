import { useCallback, useEffect, useState } from 'react';
import { Alert, Card, CardContent, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiResponse } from '../types';

interface DashboardData {
  kpis: {
    editais: { total: number; abertos: number; concluidos: number; confirmados: number };
    escolas: number; produtores: number; propostas: { total: number; finalizadas: number; rascunho: number };
    valorTotal: number;
  };
  graficos: { produtosSolicitados: Array<{ nome: string; quantidade: number }> };
}

export default function DashboardPage() {
  const { user, context } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
      setData(response.data.data);
    } catch { setError('Não foi possível carregar o painel autorizado.'); }
  }, []);
  useEffect(() => { if (!context?.pendencias.length) void fetchData(); }, [context, fetchData]);
  if (context?.pendencias.length) return <Alert severity="warning">Seu acesso depende de um vínculo autorizado. Procure o administrador.</Alert>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;
  const role = user?.role;
  const cards = [
    ...(role === 'PRODUTOR' || role === 'EXTENSIONISTA' ? [] : [
      { label: 'Editais no escopo', value: data.kpis.editais.total },
      { label: 'Escolas no escopo', value: data.kpis.escolas },
    ]),
    ...(role === 'DRE' || role === 'ESCOLA' ? [] : [
      { label: 'Produtores no escopo', value: data.kpis.produtores },
      { label: 'Propostas no escopo', value: data.kpis.propostas.total },
      { label: 'Valor das propostas', value: data.kpis.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    ]),
  ];
  return <Stack spacing={3}>
    <Typography variant="h4">Painel {role === 'DRE' ? 'da DRE' : role === 'ESCOLA' ? 'da escola' : role === 'PRODUTOR' ? 'do produtor' : role === 'EXTENSIONISTA' ? 'do representante' : 'administrativo'}</Typography>
    <Grid container spacing={2}>{cards.map(card => <Grid item xs={12} sm={6} md={3} key={card.label}>
      <Card><CardContent><Typography color="text.secondary">{card.label}</Typography><Typography variant="h5">{card.value}</Typography></CardContent></Card>
    </Grid>)}</Grid>
    {role !== 'PRODUTOR' && role !== 'EXTENSIONISTA' && <Card><CardContent>
      <Typography variant="h6">Produtos solicitados em editais do escopo</Typography>
      <ResponsiveContainer width="100%" height={300}><BarChart data={data.graficos.produtosSolicitados}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="nome" /><YAxis /><Tooltip /><Bar dataKey="quantidade" fill="#01287C" />
      </BarChart></ResponsiveContainer>
    </CardContent></Card>}
  </Stack>;
}
