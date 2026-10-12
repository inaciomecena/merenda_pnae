import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, List, ListItem, ListItemText, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Refresh, CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import api from '../services/api';

type ApiResponse<T> = { data: T };
type Dashboard = { indicadores: Record<string, number>; escopo: string; atualizadoEm: string };
type Pending = { items: Array<{ id: string; tipo: string; quantidade: number; prioridade: string; situacao: string }>; total: number };
type Diagnostic = { status: string; checks: Array<{ nome: string; status: string }>; indicadores: Record<string, number>; verificadoEm: string };
const labels: Record<string, string> = { editaisEmElaboracao: 'Editais em elaboração', editaisPublicados: 'Editais publicados', chamadasAbertas: 'Chamadas abertas', inscricoesPendentes: 'Inscrições pendentes', contratosEmRascunho: 'Contratos em rascunho', entregasPendentes: 'Entregas pendentes', prestacoesContasPendentes: 'Prestações de contas pendentes' };

export default function GestaoOperacionalPage() {
  const [tab, setTab] = useState(0); const [dashboard, setDashboard] = useState<Dashboard | null>(null); const [pending, setPending] = useState<Pending | null>(null); const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const [d, p] = await Promise.all([api.get<ApiResponse<Dashboard>>('/gestao-operacional/dashboard'), api.get<ApiResponse<Pending>>('/gestao-operacional/pendencias')]); setDashboard(d.data.data); setPending(p.data.data); } catch { setError('Não foi possível carregar os indicadores operacionais.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const cards = useMemo(() => Object.entries(dashboard?.indicadores || {}), [dashboard]);
  const loadDiagnostic = async () => { try { const response = await api.get<ApiResponse<Diagnostic>>('/monitoramento/diagnostico'); setDiagnostic(response.data.data); } catch { setError('Diagnóstico restrito ou indisponível.'); } };
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}><Box><Typography variant="h5" fontWeight={700}>Gestão operacional</Typography><Typography color="text.secondary">Indicadores e pendências derivados dos processos reais.</Typography></Box><Button startIcon={<Refresh />} variant="outlined" onClick={() => void load()}>Atualizar</Button></Stack>
    {error ? <Alert severity="warning">{error}</Alert> : null}
    <Tabs value={tab} onChange={(_, value) => { setTab(value); if (value === 2 && !diagnostic) void loadDiagnostic(); }} variant="scrollable" allowScrollButtonsMobile><Tab label="Painel operacional" /><Tab label="Central de pendências" /><Tab label="Monitoramento" /></Tabs>
    {tab === 0 ? <Grid container spacing={2}>{cards.map(([key, value]) => <Grid item xs={12} sm={6} md={3} key={key}><Card variant="outlined"><CardContent><Typography variant="body2" color="text.secondary">{labels[key] || key}</Typography><Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>{value}</Typography><Chip size="small" label={dashboard?.escopo || 'GLOBAL'} sx={{ mt: 1 }} /></CardContent></Card></Grid>)}</Grid> : null}
    {tab === 1 ? <Card variant="outlined"><CardContent><Typography variant="h6">Pendências que exigem ação humana</Typography>{pending?.items.length ? <List>{pending.items.map(item => <ListItem key={item.id} divider><ListItemText primary={labels[item.tipo] || item.tipo} secondary={`${item.quantidade} registro(s) • prioridade ${item.prioridade}`} /><Chip label={item.situacao} color="warning" size="small" /></ListItem>)}</List> : <Alert severity="success" sx={{ mt: 2 }}>Nenhuma pendência derivada no escopo atual.</Alert>}</CardContent></Card> : null}
    {tab === 2 ? <Card variant="outlined"><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">Diagnóstico restrito</Typography><Button onClick={() => void loadDiagnostic()} startIcon={<Refresh />}>Verificar</Button></Stack>{diagnostic ? <><Chip label={diagnostic.status} color={diagnostic.status === 'ok' ? 'success' : 'warning'} sx={{ my: 2 }} /><List>{diagnostic.checks.map(check => <ListItem key={check.nome}><ListItemText primary={check.nome} />{check.status === 'ok' ? <CheckCircleOutline color="success" /> : <ErrorOutline color="error" />}</ListItem>)}</List></> : <Typography color="text.secondary" sx={{ mt: 2 }}>Execute a verificação para consultar a saúde operacional.</Typography>}</CardContent></Card> : null}
  </Stack>;
}
