import { useCallback, useEffect, useState } from 'react';
import { Alert, Card, CardContent, Chip, Grid, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Gavel, Refresh } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';

type Chamada = { id: string; numero: string; exercicio: number; objeto: string; status: string; inscricoesInicio: string; inscricoesFim: string; _count?: { inscricoes: number; projetos: number } };
type Page = { items: Chamada[]; total: number; page: number; limit: number; totalPages: number };
const labels: Record<string, string> = { RASCUNHO: 'Rascunho', PUBLICADA: 'Publicada', INSCRICOES_ABERTAS: 'Inscrições abertas', INSCRICOES_ENCERRADAS: 'Inscrições encerradas', EM_HABILITACAO: 'Em habilitação', EM_SELECAO: 'Em seleção', RESULTADO_PRELIMINAR: 'Resultado preliminar', EM_RECURSO: 'Em recurso', HOMOLOGADA: 'Homologada', CANCELADA: 'Cancelada' };

export default function ChamadasPublicasPage() {
  const [dados, setDados] = useState<Page | null>(null); const [status, setStatus] = useState(''); const [busca, setBusca] = useState(''); const [erro, setErro] = useState(''); const [loading, setLoading] = useState(false);
  const carregar = useCallback(async () => { setLoading(true); setErro(''); try { const { data } = await api.get<ApiResponse<Page>>('/chamadas-publicas', { params: status ? { status } : {} }); setDados(data.data); } catch (e: any) { setErro(e?.response?.data?.message || 'Nao foi possivel carregar as chamadas publicas.'); } finally { setLoading(false); } }, [status]);
  useEffect(() => { void carregar(); }, [carregar]);
  const filtradas = (dados?.items || []).filter(item => !busca || `${item.numero} ${item.objeto}`.toLowerCase().includes(busca.toLowerCase()));
  return <Stack spacing={2} sx={{ p: { xs: 1, md: 3 } }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}><Stack direction="row" spacing={1} alignItems="center"><Gavel color="primary" /><Typography variant="h4">Chamadas publicas</Typography></Stack><Stack direction="row" spacing={1}><button type="button" onClick={() => void carregar()} disabled={loading}><Refresh /> Atualizar</button></Stack></Stack>
    {erro && <Alert severity="error">{erro}</Alert>}
    <Card><CardContent><Grid container spacing={2} alignItems="center"><Grid item xs={12} md={7}><TextField fullWidth size="small" label="Buscar numero ou objeto" value={busca} onChange={e => setBusca(e.target.value)} /></Grid><Grid item xs={12} md={5}><Select fullWidth size="small" displayEmpty value={status} onChange={e => setStatus(e.target.value)}><MenuItem value="">Todos os status</MenuItem>{Object.entries(labels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</Select></Grid></Grid></CardContent></Card>
    <Grid container spacing={2}>{[['Chamadas', dados?.total || 0], ['Inscricoes', (dados?.items || []).reduce((s, x) => s + (x._count?.inscricoes || 0), 0)], ['Projetos recebidos', (dados?.items || []).reduce((s, x) => s + (x._count?.projetos || 0), 0)], ['Homologadas', (dados?.items || []).filter(x => x.status === 'HOMOLOGADA').length]].map(([label, value]) => <Grid item xs={6} md={3} key={label as string}><Card><CardContent><Typography variant="caption">{label}</Typography><Typography variant="h5">{value}</Typography></CardContent></Card></Grid>)}</Grid>
    <Card><Table size="small"><TableHead><TableRow>{['Numero', 'Objeto', 'Periodo de inscricao', 'Inscritos', 'Projetos', 'Situacao'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead><TableBody>{filtradas.map(item => <TableRow hover key={item.id}><TableCell>{item.numero}/{item.exercicio}</TableCell><TableCell>{item.objeto}</TableCell><TableCell>{new Date(item.inscricoesInicio).toLocaleDateString('pt-BR')} a {new Date(item.inscricoesFim).toLocaleDateString('pt-BR')}</TableCell><TableCell>{item._count?.inscricoes || 0}</TableCell><TableCell>{item._count?.projetos || 0}</TableCell><TableCell><Chip size="small" label={labels[item.status] || item.status} color={item.status === 'HOMOLOGADA' ? 'success' : 'primary'} /></TableCell></TableRow>)}{!filtradas.length && <TableRow><TableCell colSpan={6}><Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Nenhuma chamada publica encontrada.</Typography></TableCell></TableRow>}</TableBody></Table></Card>
  </Stack>;
}
