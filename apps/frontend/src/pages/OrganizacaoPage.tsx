import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Link, MenuItem, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Add, Business, Link as LinkIcon, Refresh, School } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';

type Entidade = { id: string; nome: string; uf: string; tipo?: string };
type Dre = {
  id: string; nome: string; codigo?: string; municipioSede?: string; entidadeExecutoraId: string;
  entidadeExecutora?: { id: string; nome: string }; _count?: { vinculosEscolas: number };
};

export default function OrganizacaoPage() {
  const navigate = useNavigate();
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [dres, setDres] = useState<Dre[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<'entidade' | 'dre' | null>(null);
  const [nomeEntidade, setNomeEntidade] = useState('');
  const [nomeDre, setNomeDre] = useState('');
  const [codigoDre, setCodigoDre] = useState('');
  const [municipioSede, setMunicipioSede] = useState('');
  const [entidadeId, setEntidadeId] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [entidadesResponse, dresResponse] = await Promise.all([
        api.get<ApiResponse<Entidade[]>>('/entidades-executoras'),
        api.get<ApiResponse<Dre[]>>('/dres'),
      ]);
      setEntidades(entidadesResponse.data.data);
      setDres(dresResponse.data.data);
    } catch {
      setError('Não foi possível consultar a estrutura organizacional.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function run(task: () => Promise<unknown>, success: string) {
    setError(''); setMessage('');
    try { await task(); await refresh(); setMessage(success); }
    catch (reason: any) { setError(reason?.response?.data?.message || 'Operação não concluída.'); }
  }

  const totalVinculos = useMemo(
    () => dres.reduce((sum, dre) => sum + (dre._count?.vinculosEscolas ?? 0), 0),
    [dres],
  );

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return <Stack spacing={3}>
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
        <Box><Typography variant="h4">Organização educacional</Typography><Typography color="text.secondary">Entidades executoras, Diretorias Regionais de Educação e escolas vinculadas.</Typography></Box>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Button startIcon={<Refresh />} onClick={() => void refresh()}>Atualizar</Button>
          <Button startIcon={<Add />} variant="outlined" onClick={() => setDialog('entidade')}>Nova entidade</Button>
          <Button startIcon={<Add />} variant="contained" onClick={() => setDialog('dre')}>Nova DRE</Button>
        </Stack>
      </Stack>
      <Typography variant="body2" mt={1}>Fonte institucional: <Link href="https://www3.seduc.mt.gov.br/dres-apresentacao" target="_blank" rel="noreferrer">SEDUC Mato Grosso</Link>.</Typography>
    </Box>
    {message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}
    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}><Card><CardContent><Business color="primary" /><Typography variant="h5">{entidades.length}</Typography><Typography color="text.secondary">Entidades executoras</Typography></CardContent></Card></Grid>
      <Grid item xs={12} sm={4}><Card><CardContent><LinkIcon color="primary" /><Typography variant="h5">{dres.length}</Typography><Typography color="text.secondary">DREs cadastradas</Typography></CardContent></Card></Grid>
      <Grid item xs={12} sm={4}><Card><CardContent><School color="primary" /><Typography variant="h5">{totalVinculos}</Typography><Typography color="text.secondary">Vínculos escolares ativos</Typography></CardContent></Card></Grid>
    </Grid>
    <Card><CardContent>
      <Typography variant="h6" gutterBottom>Diretorias Regionais de Educação</Typography>
      <Typography color="text.secondary" variant="body2" mb={2}>Abra uma DRE para consultar ou administrar suas escolas.</Typography>
      <TableContainer><Table size="small">
        <TableHead><TableRow><TableCell>Código</TableCell><TableCell>DRE</TableCell><TableCell>Município sede</TableCell><TableCell>Entidade executora</TableCell><TableCell align="center">Escolas</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead>
        <TableBody>{dres.map(dre => <TableRow key={dre.id} hover>
          <TableCell><Chip label={dre.codigo || 'Sem código'} size="small" variant="outlined" /></TableCell>
          <TableCell>{dre.nome}</TableCell><TableCell>{dre.municipioSede || 'Não informado'}</TableCell><TableCell>{dre.entidadeExecutora?.nome || 'Não informada'}</TableCell>
          <TableCell align="center">{dre._count?.vinculosEscolas ?? 0}</TableCell>
          <TableCell align="right"><Button size="small" onClick={() => navigate(`/organizacao/dres/${dre.id}/escolas`)}>Gerenciar escolas</Button></TableCell>
        </TableRow>)}</TableBody>
      </Table></TableContainer>
    </CardContent></Card>
    <Dialog open={dialog === 'entidade'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
      <DialogTitle>Nova entidade executora</DialogTitle><DialogContent><Stack spacing={2} mt={1}><TextField label="Nome da entidade" value={nomeEntidade} onChange={e => setNomeEntidade(e.target.value)} /><TextField label="UF" value="MT" disabled /></Stack></DialogContent>
      <DialogActions><Button onClick={() => setDialog(null)}>Cancelar</Button><Button variant="contained" disabled={!nomeEntidade.trim()} onClick={() => void run(async () => { await api.post('/entidades-executoras', { nome: nomeEntidade.trim(), uf: 'MT' }); setNomeEntidade(''); setDialog(null); }, 'Entidade executora criada.')}>Salvar</Button></DialogActions>
    </Dialog>
    <Dialog open={dialog === 'dre'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
      <DialogTitle>Nova Diretoria Regional de Educação</DialogTitle><DialogContent><Stack spacing={2} mt={1}>
        <TextField label="Nome da DRE" value={nomeDre} onChange={e => setNomeDre(e.target.value)} /><TextField label="Código" value={codigoDre} onChange={e => setCodigoDre(e.target.value.toUpperCase())} /><TextField label="Município sede" value={municipioSede} onChange={e => setMunicipioSede(e.target.value)} />
        <TextField select label="Entidade executora" value={entidadeId} onChange={e => setEntidadeId(e.target.value)}>{entidades.map(item => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}</TextField>
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setDialog(null)}>Cancelar</Button><Button variant="contained" disabled={!nomeDre.trim() || !codigoDre.trim() || !entidadeId} onClick={() => void run(async () => { await api.post('/dres', { nome: nomeDre.trim(), codigo: codigoDre.trim(), municipioSede: municipioSede.trim() || undefined, entidadeExecutoraId: entidadeId }); setNomeDre(''); setCodigoDre(''); setMunicipioSede(''); setDialog(null); }, 'DRE criada.')}>Salvar</Button></DialogActions>
    </Dialog>
  </Stack>;
}
