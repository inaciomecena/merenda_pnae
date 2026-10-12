import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Divider,
  Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import { ArrowBack, Link as LinkIcon } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';

type Escola = { id: string; nome: string; codigo?: string; municipio?: { nome: string } };
type VinculoEscola = { id: string; escola: Escola };
type Dre = {
  id: string; nome: string; codigo?: string; municipioSede?: string;
  entidadeExecutora?: { nome: string }; vinculosEscolas: VinculoEscola[];
};
type EscolaPage = { items: Escola[]; total: number };

export default function DreEscolasPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dre, setDre] = useState<Dre | null>(null);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolaSelecionada, setEscolaSelecionada] = useState<Escola | null>(null);
  const [buscaEscola, setBuscaEscola] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDre = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const response = await api.get<ApiResponse<Dre>>(`/dres/${id}`);
      setDre(response.data.data);
    } catch {
      setError('Não foi possível consultar as escolas vinculadas à DRE.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadDre(); }, [loadDre]);
  useEffect(() => {
    if (buscaEscola.trim().length < 2) { setEscolas([]); return; }
    const timer = window.setTimeout(async () => {
      setLoadingSchools(true);
      try {
        const response = await api.get<ApiResponse<EscolaPage>>('/escolas', { params: { search: buscaEscola, limit: 50 } });
        setEscolas(response.data.data.items);
      } catch {
        setError('Não foi possível pesquisar as escolas.');
      } finally {
        setLoadingSchools(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [buscaEscola]);

  async function run(task: () => Promise<unknown>, success: string) {
    setError(''); setMessage('');
    try { await task(); await loadDre(); setMessage(success); }
    catch (reason: any) { setError(reason?.response?.data?.message || 'Operação não concluída.'); }
  }

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return <Stack spacing={3}>
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/organizacao')} sx={{ mb: 1 }}>Voltar para organização</Button>
      <Typography variant="h4">Escolas da {dre?.nome || 'DRE'}</Typography>
      <Typography color="text.secondary">
        {dre?.codigo ? `Código ${dre.codigo}` : 'DRE sem código'}
        {dre?.municipioSede ? ` · Sede em ${dre.municipioSede}` : ''}
        {dre?.entidadeExecutora?.nome ? ` · ${dre.entidadeExecutora.nome}` : ''}
      </Typography>
    </Box>
    {message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}
    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
    {dre && <Card><CardContent><Stack spacing={2}>
      <Box><Typography variant="h6">Vincular escola</Typography><Typography variant="body2" color="text.secondary">Pesquise por nome, código INEP ou município.</Typography></Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Autocomplete fullWidth options={escolas} value={escolaSelecionada} loading={loadingSchools}
          getOptionLabel={option => `${option.nome}${option.codigo ? ` · INEP ${option.codigo}` : ''}${option.municipio?.nome ? ` · ${option.municipio.nome}` : ''}`}
          onInputChange={(_, value) => setBuscaEscola(value)} onChange={(_, value) => setEscolaSelecionada(value)}
          renderInput={params => <TextField {...params} label="Pesquisar escola" placeholder="Digite pelo menos dois caracteres" />} />
        <Button variant="contained" startIcon={<LinkIcon />} disabled={!escolaSelecionada} sx={{ minWidth: 180 }} onClick={() => void run(async () => {
          await api.post(`/escolas/${escolaSelecionada!.id}/vincular-dre`, { dreId: dre.id, vigenciaInicio: new Date().toISOString() });
          setEscolaSelecionada(null); setBuscaEscola('');
        }, 'Escola vinculada à DRE.')}>Vincular escola</Button>
      </Stack>
      <Divider />
      <Typography variant="h6">Escolas vinculadas ({dre.vinculosEscolas.length})</Typography>
      {dre.vinculosEscolas.length === 0 ? <Alert severity="info">Nenhuma escola vinculada a esta DRE.</Alert> : <TableContainer><Table size="small">
        <TableHead><TableRow><TableCell>Escola</TableCell><TableCell>Código INEP</TableCell><TableCell>Município</TableCell><TableCell align="right">Ação</TableCell></TableRow></TableHead>
        <TableBody>{dre.vinculosEscolas.map(vinculo => <TableRow key={vinculo.id} hover>
          <TableCell><Link component={RouterLink} to={`/escolas/${vinculo.escola.id}`} fontWeight={600} underline="hover">{vinculo.escola.nome}</Link></TableCell>
          <TableCell>{vinculo.escola.codigo || 'Não informado'}</TableCell><TableCell>{vinculo.escola.municipio?.nome || 'Não informado'}</TableCell>
          <TableCell align="right"><Button color="error" size="small" onClick={() => void run(() => api.delete(`/escolas/vinculos/${vinculo.id}`), 'Vínculo escolar encerrado.')}>Encerrar vínculo</Button></TableCell>
        </TableRow>)}</TableBody>
      </Table></TableContainer>}
    </Stack></CardContent></Card>}
  </Stack>;
}
