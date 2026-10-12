import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, IconButton,
  MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography, Pagination, Tooltip, FormControl, InputLabel, Select,
  Dialog, DialogActions, DialogContent, DialogTitle,
} from '@mui/material';
import { Add, Search, FilterList, Visibility, Edit, Download, ContentCopy, Refresh } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Contrato {
  id: string;
  numero: string;
  exercicio: number;
  status: string;
  valorInicial: string;
  valorAtualizado: string;
  vigenciaInicio?: string | null;
  vigenciaFim?: string | null;
  dataAssinatura?: string | null;
  objeto?: string | null;
  createdAt: string;
  edital: { id: string; numero: string; ano: number; titulo: string };
  produtor: { id: string; nome: string } | null;
  escola?: { id: string; nome: string } | null;
  dre?: { id: string; nome: string; codigo: string } | null;
  municipio?: { id: string; nome: string; uf: string } | null;
  itens?: Array<{ id: string; produto: string; quantidadeContratada: string; valorTotal: string }>;
}

interface Edital { id: string; numero: string; ano: number; titulo: string; }
interface Produtor { id: string; nome: string; }
interface DRE { id: string; nome: string; codigo?: string; }
interface Municipio { id: string; nome: string; uf: string; }

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  RASCUNHO: 'default', EM_CONFERENCIA: 'warning', AGUARDANDO_ASSINATURA: 'info',
  VIGENTE: 'success', SUSPENSO: 'warning', ENCERRADO: 'default',
  RESCINDIDO: 'error', CANCELADO: 'error',
};

const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho', EM_CONFERENCIA: 'Em conferência', AGUARDANDO_ASSINATURA: 'Aguardando assinatura',
  VIGENTE: 'Vigente', SUSPENSO: 'Suspenso', ENCERRADO: 'Encerrado',
  RESCINDIDO: 'Rescindido', CANCELADO: 'Cancelado',
};

export default function ContratosPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const podeCriar = user?.role === 'ADMIN' || user?.role === 'DRE';
  const podeVerAuditoria = user?.role === 'ADMIN';

  const [items, setItems] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterNumero, setFilterNumero] = useState(searchParams.get('numero') || '');
  const [filterExercicio, setFilterExercicio] = useState(searchParams.get('exercicio') || '');
  const [filterEditalId, setFilterEditalId] = useState(searchParams.get('editalId') || '');
  const [filterProdutorId, setFilterProdutorId] = useState(searchParams.get('produtorId') || '');
  const [filterDreId, setFilterDreId] = useState(searchParams.get('dreId') || '');
  const [filterMunicipioId, setFilterMunicipioId] = useState(searchParams.get('municipioId') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterVigenciaInicio, setFilterVigenciaInicio] = useState(searchParams.get('vigenciaInicio') || '');
  const [filterVigenciaFim, setFilterVigenciaFim] = useState(searchParams.get('vigenciaFim') || '');
  const [ordenar, setOrdenar] = useState(searchParams.get('ordenar') || 'criacao');
  const [ordem, setOrdem] = useState<'asc' | 'desc'>((searchParams.get('ordem') as 'asc' | 'desc') || 'desc');

  const [editais, setEditais] = useState<Edital[]>([]);
  const [produtores, setProdutores] = useState<Produtor[]>([]);
  const [dres, setDres] = useState<DRE[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterNumero) params.set('numero', filterNumero);
      if (filterExercicio) params.set('exercicio', filterExercicio);
      if (filterEditalId) params.set('editalId', filterEditalId);
      if (filterProdutorId) params.set('produtorId', filterProdutorId);
      if (filterDreId) params.set('dreId', filterDreId);
      if (filterMunicipioId) params.set('municipioId', filterMunicipioId);
      if (filterStatus) params.set('status', filterStatus);
      if (filterVigenciaInicio) params.set('vigenciaInicio', filterVigenciaInicio);
      if (filterVigenciaFim) params.set('vigenciaFim', filterVigenciaFim);
      if (ordenar) params.set('ordenar', ordenar);
      params.set('ordem', ordem);
      const { data } = await api.get<ApiResponse<PaginationResponse<Contrato>>>(`/contratos?${params}`);
      setItems(data.data.items ?? []);
      setTotal(data.data.total ?? 0);
      setTotalPages(data.data.totalPages ?? 1);
    } catch {
      setError('Não foi possível carregar os contratos.');
    } finally {
      setLoading(false);
    }
  }, [page, filterNumero, filterExercicio, filterEditalId, filterProdutorId, filterDreId, filterMunicipioId, filterStatus, filterVigenciaInicio, filterVigenciaFim, ordenar, ordem]);

  const fetchFiltros = useCallback(async () => {
    try {
      const [{ data: editalData }, { data: produtorData }, { data: dreData }, { data: municipioData }] = await Promise.all([
        api.get<ApiResponse<PaginationResponse<Edital>>>('/editais?limit=200'),
        api.get<ApiResponse<PaginationResponse<Produtor>>>('/produtores?limit=500'),
        api.get<ApiResponse<DRE[]>>('/dres'),
        api.get<ApiResponse<PaginationResponse<Municipio>>>('/municipios?limit=500'),
      ]);
      setEditais(editalData.data.items ?? []);
      setProdutores(produtorData.data.items ?? []);
      setDres(dreData.data ?? []);
      setMunicipios(municipioData.data.items ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void fetchItems(); }, [fetchItems]);
  useEffect(() => { void fetchFiltros(); }, [fetchFiltros]);

  const handleVer = (id: string) => navigate(`/contratos/${id}`);
  const handleNovo = () => navigate('/contratos/novo');

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <div>
          <Typography variant="h4" fontWeight={700}>Contratos</Typography>
          <Typography color="text.secondary">Gestão de contratos PNAE — listagem, filtros e ações.</Typography>
        </div>
        {podeCriar && (
          <Button component={RouterLink} to="/contratos/novo" variant="contained" startIcon={<Add />}>Novo Contrato</Button>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <TextField fullWidth label="Número" size="small" value={filterNumero} onChange={e => setFilterNumero(e.target.value)} placeholder="Filtrar por número" variant="outlined" />
            <TextField fullWidth label="Exercício" type="number" size="small" value={filterExercicio} onChange={e => setFilterExercicio(e.target.value)} placeholder="Ex: 2026" variant="outlined" />
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel shrink id="edital-label">Edital</InputLabel>
              <Select labelId="edital-label" value={filterEditalId} label="Edital" onChange={e => setFilterEditalId(e.target.value)} displayEmpty>
                <MenuItem value="">Todos</MenuItem>
                {editais.map(e => <MenuItem key={e.id} value={e.id}>{e.numero}/{e.ano} — {e.titulo}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel shrink id="produtor-label">Fornecedor</InputLabel>
              <Select labelId="produtor-label" value={filterProdutorId} label="Fornecedor" onChange={e => setFilterProdutorId(e.target.value)} displayEmpty>
                <MenuItem value="">Todos</MenuItem>
                {produtores.map(p => <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel shrink id="dre-label">DRE</InputLabel>
              <Select labelId="dre-label" value={filterDreId} label="DRE" onChange={e => setFilterDreId(e.target.value)} displayEmpty>
                <MenuItem value="">Todas</MenuItem>
                {dres.map(d => <MenuItem key={d.id} value={d.id}>{d.codigo ? `${d.codigo} — ` : ''}{d.nome}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel shrink id="municipio-label">Município</InputLabel>
              <Select labelId="municipio-label" value={filterMunicipioId} label="Município" onChange={e => setFilterMunicipioId(e.target.value)} displayEmpty>
                <MenuItem value="">Todos</MenuItem>
                {municipios.map(m => <MenuItem key={m.id} value={m.id}>{m.nome}/{m.uf}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel shrink id="status-label">Situação</InputLabel>
              <Select labelId="status-label" value={filterStatus} label="Situação" onChange={e => setFilterStatus(e.target.value)} displayEmpty>
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Vigência início" type="date" size="small" value={filterVigenciaInicio} onChange={e => setFilterVigenciaInicio(e.target.value)} variant="outlined" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Vigência fim" type="date" size="small" value={filterVigenciaFim} onChange={e => setFilterVigenciaFim(e.target.value)} variant="outlined" InputLabelProps={{ shrink: true }} />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchItems}
              disabled={loading}
              sx={{ minHeight: 40, justifySelf: { xs: 'stretch', sm: 'start' } }}
            >
              Atualizar
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Exercício</TableCell>
                <TableCell>Edital</TableCell>
                <TableCell>Fornecedor</TableCell>
                <TableCell>DRE</TableCell>
                <TableCell>Unidade</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Vigência</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={10} align="center"><CircularProgress size={24} /></TableCell></TableRow>}
              {!loading && items.length === 0 && <TableRow><TableCell colSpan={10} align="center"><Typography color="text.secondary">Nenhum contrato encontrado.</Typography></TableCell></TableRow>}
              {items.map(item => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{item.numero}</Typography></TableCell>
                  <TableCell>{item.exercicio}</TableCell>
                  <TableCell>{item.edital.numero}/{item.edital.ano}</TableCell>
                  <TableCell>{item.produtor?.nome || '—'}</TableCell>
                  <TableCell>{item.dre?.nome || '—'}</TableCell>
                  <TableCell>{item.escola?.nome || '—'}</TableCell>
                  <TableCell align="right">{Number(item.valorAtualizado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell>
                    {item.vigenciaInicio ? new Date(item.vigenciaInicio).toLocaleDateString('pt-BR') : '—'}
                    {' — '}
                    {item.vigenciaFim ? new Date(item.vigenciaFim).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={statusLabels[item.status] || item.status} color={statusColors[item.status] || 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar"><IconButton size="small" onClick={() => handleVer(item.id)}><Visibility /></IconButton></Tooltip>
                    {podeCriar && item.status === 'RASCUNHO' && <Tooltip title="Editar"><IconButton size="small" onClick={() => navigate(`/contratos/${item.id}/editar`)}><Edit /></IconButton></Tooltip>}
                    {podeVerAuditoria && <Tooltip title="Auditoria"><IconButton size="small" onClick={() => navigate(`/contratos/${item.id}/auditoria`)}><ContentCopy /></IconButton></Tooltip>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, novaPagina) => setPage(novaPagina)} color="primary" showFirstButton showLastButton boundaryCount={1} siblingCount={1} />
        )}
        <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
          Total: {total} contrato(s)
        </Typography>
      </Card>
    </Stack>
  );
}
