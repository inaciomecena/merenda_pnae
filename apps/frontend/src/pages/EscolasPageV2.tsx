import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { Add, DeleteOutline, Edit, UploadFile } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiResponse, PaginationResponse } from '../types';

type School = {
  id: string; nome: string; codigo?: string | null; municipioId: string; endereco?: string | null;
  telefone?: string | null; responsavel?: string | null; active: boolean;
  localizacao?: string | null; categoriaAdministrativa?: string | null; dependenciaAdministrativa?: string | null;
  restricaoAtendimento?: string | null; municipio?: { id: string; nome: string; uf: string; codigoIbge?: string | null };
};
type Municipality = { id: string; nome: string; uf: string; codigoIbge?: string };
type SchoolForm = { nome: string; codigo: string; municipioId: string; endereco: string; telefone: string; responsavel: string };
const emptyForm: SchoolForm = { nome: '', codigo: '', municipioId: '', endereco: '', telefone: '', responsavel: '' };

export default function EscolasPageV2() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [filters, setFilters] = useState({ nome: '', codigo: '', municipioId: '', localizacao: '', categoriaAdministrativa: '', dependenciaAdministrativa: '', restricaoAtendimento: '', active: '' });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    api.get<ApiResponse<PaginationResponse<Municipality>>>('/municipios?limit=200&uf=MT')
      .then(({ data }) => setMunicipalities(data.data.items ?? []))
      .catch(() => setMunicipalities([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filters.nome.trim()) params.set('search', filters.nome.trim());
      if (filters.codigo.trim()) params.set('codigo', filters.codigo.trim());
      if (filters.municipioId) params.set('municipioId', filters.municipioId);
      if (filters.localizacao.trim()) params.set('localizacao', filters.localizacao.trim());
      if (filters.categoriaAdministrativa.trim()) params.set('categoriaAdministrativa', filters.categoriaAdministrativa.trim());
      if (filters.dependenciaAdministrativa.trim()) params.set('dependenciaAdministrativa', filters.dependenciaAdministrativa.trim());
      if (filters.restricaoAtendimento.trim()) params.set('restricaoAtendimento', filters.restricaoAtendimento.trim());
      if (filters.active) params.set('active', filters.active);
      setLoading(true); setError('');
      api.get<ApiResponse<PaginationResponse<School>>>(`/escolas?${params.toString()}`)
        .then(({ data }) => { setSchools(data.data.items ?? []); setTotalPages(data.data.totalPages || 1); })
        .catch((err) => setError(err?.response?.data?.message || 'Não foi possível carregar as escolas.'))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, filters, refresh]);

  const setFilter = (key: keyof typeof filters, value: string) => {
    setPage(1); setFilters((current) => ({ ...current, [key]: value }));
  };

  const importCsv = async (file?: File) => {
    if (!file) return;
    const body = new FormData(); body.append('arquivo', file);
    setMessage(''); setError(''); setUploadProgress(0); setProcessing(false);
    try {
      const { data } = await api.post('/escolas/importar-csv', body, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0,
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
          if (event.total && event.loaded >= event.total) setProcessing(true);
        },
      });
      const result = data.data;
      setMessage(`Importação concluída: ${result.created} novas, ${result.updated} atualizadas, ${result.skipped} ignoradas.`);
      setUploadProgress(null); setProcessing(false); setRefresh((value) => value + 1);
    } catch (err: any) {
      setUploadProgress(null); setProcessing(false);
      setError(err?.response?.data?.message || 'Falha ao importar CSV.');
    }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (school: School) => {
    setEditing(school);
    setForm({ nome: school.nome, codigo: school.codigo || '', municipioId: school.municipioId, endereco: school.endereco || '', telefone: school.telefone || '', responsavel: school.responsavel || '' });
    setDialogOpen(true);
  };
  const saveSchool = async () => {
    try {
      if (editing) await api.patch(`/escolas/${editing.id}`, form);
      else await api.post('/escolas', form);
      setDialogOpen(false); setMessage(editing ? 'Escola atualizada.' : 'Escola cadastrada.'); setRefresh((value) => value + 1);
    } catch (err: any) { setError(err?.response?.data?.message || 'Não foi possível salvar a escola.'); }
  };
  const deleteSchool = async (school: School) => {
    if (!window.confirm(`Excluir ${school.nome}?`)) return;
    try { await api.delete(`/escolas/${school.id}`); setMessage('Escola excluída.'); setRefresh((value) => value + 1); }
    catch (err: any) { setError(err?.response?.data?.message || 'Não foi possível excluir a escola.'); }
  };

  const inputFilter = (key: keyof typeof filters, placeholder: string) => (
    <TextField size="small" value={filters[key]} onChange={(event) => setFilter(key, event.target.value)} placeholder={placeholder} inputProps={{ 'aria-label': `Filtrar por ${placeholder}` }} />
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box><Typography variant="h5" fontWeight={700}>Escolas</Typography><Typography variant="body2" color="text.secondary">Filtre a lista e abra uma escola para consultar os dados completos.</Typography></Box>
        <Stack direction="row" spacing={1}>
          {isAdmin && <>
            <input ref={inputRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => { void importCsv(event.target.files?.[0]); event.currentTarget.value = ''; }} />
            <Button variant="outlined" startIcon={<UploadFile />} disabled={uploadProgress !== null} onClick={() => inputRef.current?.click()}>Importar CSV</Button>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Nova escola</Button>
          </>}
        </Stack>
      </Stack>

      {uploadProgress !== null && <Stack spacing={0.5} role="status" aria-live="polite">
        <Typography variant="body2">{processing ? 'Arquivo enviado. Importando e compatibilizando as escolas…' : `Enviando CSV: ${uploadProgress}%`}</Typography>
        <LinearProgress variant={processing ? 'indeterminate' : 'determinate'} value={uploadProgress} />
      </Stack>}
      {message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell>Escola</TableCell><TableCell>Código INEP</TableCell><TableCell>Município</TableCell>
              <TableCell>Localização</TableCell><TableCell>Categoria administrativa</TableCell>
              <TableCell>Dependência</TableCell><TableCell>Restrição de atendimento</TableCell>
              <TableCell>Status</TableCell>{isAdmin && <TableCell align="right">Ações</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>{inputFilter('nome', 'Nome')}</TableCell>
              <TableCell>{inputFilter('codigo', 'INEP')}</TableCell>
              <TableCell><TextField select size="small" value={filters.municipioId} onChange={(event) => setFilter('municipioId', event.target.value)} sx={{ minWidth: 160 }}>
                <MenuItem value="">Todos</MenuItem>{municipalities.map((municipality) => <MenuItem key={municipality.id} value={municipality.id}>{municipality.nome}{municipality.codigoIbge ? ` - IBGE ${municipality.codigoIbge}` : ''}</MenuItem>)}
              </TextField></TableCell>
              <TableCell>{inputFilter('localizacao', 'Localização')}</TableCell>
              <TableCell>{inputFilter('categoriaAdministrativa', 'Categoria')}</TableCell>
              <TableCell>{inputFilter('dependenciaAdministrativa', 'Dependência')}</TableCell>
              <TableCell>{inputFilter('restricaoAtendimento', 'Atendimento')}</TableCell>
              <TableCell><TextField select size="small" value={filters.active} onChange={(event) => setFilter('active', event.target.value)} sx={{ minWidth: 115 }}>
                <MenuItem value="">Todos</MenuItem><MenuItem value="true">Ativa</MenuItem><MenuItem value="false">Inativa</MenuItem>
              </TextField></TableCell>
              {isAdmin && <TableCell><Tooltip title="Limpar filtros"><Button size="small" onClick={() => { setFilters({ nome: '', codigo: '', municipioId: '', localizacao: '', categoriaAdministrativa: '', dependenciaAdministrativa: '', restricaoAtendimento: '', active: '' }); setPage(1); }}>Limpar</Button></Tooltip></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={isAdmin ? 9 : 8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              : schools.length ? schools.map((school) => <TableRow key={school.id} hover>
                <TableCell><Link to={`/escolas/${school.id}`} style={{ fontWeight: 600, textDecoration: 'none' }}>{school.nome}</Link></TableCell>
                <TableCell>{school.codigo || '—'}</TableCell><TableCell>{school.municipio?.nome || '—'}{school.municipio?.uf ? ` - ${school.municipio.uf}` : ''}{school.municipio?.codigoIbge ? ` (IBGE ${school.municipio.codigoIbge})` : ''}</TableCell>
                <TableCell>{school.localizacao || '—'}</TableCell><TableCell>{school.categoriaAdministrativa || '—'}</TableCell>
                <TableCell>{school.dependenciaAdministrativa || '—'}</TableCell><TableCell>{school.restricaoAtendimento || '—'}</TableCell>
                <TableCell>{school.active ? 'Ativa' : 'Inativa'}</TableCell>
                {isAdmin && <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}><Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(school)}><Edit fontSize="small" /></IconButton></Tooltip><Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => void deleteSchool(school)}><DeleteOutline fontSize="small" /></IconButton></Tooltip></TableCell>}
              </TableRow>)
              : <TableRow><TableCell colSpan={isAdmin ? 9 : 8} align="center">Nenhuma escola encontrada.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary">Página {page} de {totalPages}</Typography>
          <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} size="small" />
        </Stack>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar escola' : 'Nova escola'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Nome" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required />
          <TextField label="Código INEP" value={form.codigo} onChange={(event) => setForm({ ...form, codigo: event.target.value })} required inputProps={{ maxLength: 8 }} />
          <TextField select label="Município" value={form.municipioId} onChange={(event) => setForm({ ...form, municipioId: event.target.value })} required>{municipalities.map((municipality) => <MenuItem key={municipality.id} value={municipality.id}>{municipality.nome} - {municipality.uf}{municipality.codigoIbge ? ` - IBGE ${municipality.codigoIbge}` : ''}</MenuItem>)}</TextField>
          <TextField label="Endereço" value={form.endereco} onChange={(event) => setForm({ ...form, endereco: event.target.value })} />
          <TextField label="Telefone" value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} />
          <TextField label="Responsável" value={form.responsavel} onChange={(event) => setForm({ ...form, responsavel: event.target.value })} />
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={() => void saveSchool()} disabled={!form.nome || !form.codigo || !form.municipioId}>Salvar</Button></DialogActions>
      </Dialog>
    </Stack>
  );
}
