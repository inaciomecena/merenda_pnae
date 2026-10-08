import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Box, Card, CardContent, CircularProgress, Grid, Stack, Typography, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  School, People, Assignment, TrendingUp, LocalShipping, CheckCircle, Assessment, Map as MapIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import api from '../services/api';

interface DashboardKPIs {
  editais: { total: number; abertos: number; concluidos: number; confirmados: number };
  valorTotal: number;
  escolas: number;
  produtores: number;
  municipios: number;
  produtosReferencia: number;
  produtosFamilia: number;
  matches: { total: number; automaticos: number; manuais: number };
  propostas: { total: number; finalizadas: number; rascunho: number };
  extensionistas: number;
  percentualAtendimento: number;
  editalItens: number;
  itensComMatch: number;
}

interface Grafico {
  nome: string;
  quantidade: number;
}

interface EvolucaoMes {
  mes: string;
  importacoes: number;
  balizamentos: number;
  propostas: number;
}

interface DashboardData {
  kpis: DashboardKPIs;
  graficos: {
    produtosSolicitados: Grafico[];
    municipiosDemanda: Grafico[];
    municipiosOferta: Grafico[];
    distribuicaoProdutos: Grafico[];
    evolucaoMensal: EvolucaoMes[];
  };
}

const COLORS = ['#01287C', '#0284c7', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [municipioId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (ano) params.append('ano', String(ano));
      if (municipioId) params.append('municipioId', municipioId);
      const { data: res } = await api.get(`/dashboard?${params.toString()}`);
      setData(res.data as DashboardData);
    } catch {
      setError('Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, [ano, municipioId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  if (loading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const kpis = data.kpis;
  const g = data.graficos;

  const kpiCards = [
    { label: 'Total Editais', value: kpis.editais.total, icon: <Assignment />, color: '#01287C' },
    { label: 'Editais Abertos', value: kpis.editais.abertos, icon: <TrendingUp />, color: '#0284c7' },
    { label: 'Editais Concluidos', value: kpis.editais.concluidos, icon: <CheckCircle />, color: '#16a34a' },
    { label: 'Escolas', value: kpis.escolas, icon: <School />, color: '#7c3aed' },
    { label: 'Produtores', value: kpis.produtores, icon: <People />, color: '#ea580c' },
    { label: 'Municipios', value: kpis.municipios, icon: <MapIcon />, color: '#0891b2' },
    { label: 'Produtos Ref.', value: kpis.produtosReferencia, icon: <LocalShipping />, color: '#4f46e5' },
    { label: 'Produtos Familia', value: kpis.produtosFamilia, icon: <CheckCircle />, color: '#16a34a' },
    { label: 'Matches Total', value: kpis.matches.total, icon: <Assessment />, color: '#ca8a04' },
    { label: 'Matches Auto', value: kpis.matches.automaticos, icon: <CheckCircle />, color: '#16a34a' },
    { label: 'Propostas', value: kpis.propostas.total, icon: <Assignment />, color: '#01287C' },
    { label: 'Propostas Finalizadas', value: kpis.propostas.finalizadas, icon: <CheckCircle />, color: '#16a34a' },
    { label: 'Extensionistas', value: kpis.extensionistas, icon: <People />, color: '#7c3aed' },
    { label: '% Atendimento', value: `${kpis.percentualAtendimento}%`, icon: <TrendingUp />, color: kpis.percentualAtendimento >= 70 ? '#16a34a' : '#ea580c' },
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>Dashboard Executivo</Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Ano</InputLabel>
            <Select value={ano} label="Ano" onChange={e => setAno(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {kpiCards.map((kpi, i) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
                    <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{kpi.value}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Produtos Mais Solicitados</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={g.produtosSolicitados}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#01287C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Municipios com Maior Demanda</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={g.municipiosDemanda} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Municipios com Maior Oferta</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={g.municipiosOferta} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Distribuicao dos Produtos</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={g.distribuicaoProdutos} dataKey="quantidade" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                    {g.distribuicaoProdutos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Evolucao Mensal</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={g.evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="importacoes" stroke="#01287C" strokeWidth={2} name="Importacoes" />
                  <Line type="monotone" dataKey="balizamentos" stroke="#0284c7" strokeWidth={2} name="Balizamentos" />
                  <Line type="monotone" dataKey="propostas" stroke="#16a34a" strokeWidth={2} name="Propostas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
