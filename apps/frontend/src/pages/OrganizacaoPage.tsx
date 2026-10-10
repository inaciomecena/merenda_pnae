import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import api from '../services/api';
import type { ApiResponse } from '../types';

type Entidade = { id: string; nome: string; uf: string };
type Dre = { id: string; nome: string; codigo?: string; entidadeExecutoraId: string };

export default function OrganizacaoPage() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [dres, setDres] = useState<Dre[]>([]);
  const [nomeEntidade, setNomeEntidade] = useState('');
  const [uf, setUf] = useState('MT');
  const [nomeDre, setNomeDre] = useState('');
  const [entidadeId, setEntidadeId] = useState('');
  const [escolaId, setEscolaId] = useState('');
  const [dreId, setDreId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    const [e, d] = await Promise.all([
      api.get<ApiResponse<Entidade[]>>('/entidades-executoras'),
      api.get<ApiResponse<Dre[]>>('/dres'),
    ]);
    setEntidades(e.data.data); setDres(d.data.data);
  }
  useEffect(() => { void refresh().catch(() => setError('Não foi possível consultar a organização.')); }, []);
  async function run(task: () => Promise<unknown>, success: string) {
    setError(''); setMessage('');
    try { await task(); await refresh(); setMessage(success); }
    catch { setError('Operação não concluída. Confira os IDs e a autorização.'); }
  }
  return <Stack spacing={2}>
    <Typography variant="h4">Organização</Typography>
    <Typography color="text.secondary">Entidades executoras, DREs e vínculos de escolas. IDs devem ser conferidos antes de salvar.</Typography>
    {message && <Alert severity="success">{message}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">Entidades executoras</Typography>
      <Box>{entidades.map(e => <Typography key={e.id}>{e.nome} ({e.uf}) · {e.id}</Typography>)}</Box>
      <TextField label="Nome" value={nomeEntidade} onChange={e => setNomeEntidade(e.target.value)} />
      <TextField label="UF" value={uf} onChange={e => setUf(e.target.value)} />
      <Button variant="contained" disabled={!nomeEntidade || !uf} onClick={() => void run(() => api.post('/entidades-executoras', { nome: nomeEntidade, uf }), 'Entidade criada.')}>Criar entidade</Button>
    </Stack></CardContent></Card>
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">DREs</Typography>
      <Box>{dres.map(d => <Typography key={d.id}>{d.nome} · {d.id}</Typography>)}</Box>
      <TextField label="Nome da DRE" value={nomeDre} onChange={e => setNomeDre(e.target.value)} />
      <TextField select label="Entidade executora" value={entidadeId} onChange={e => setEntidadeId(e.target.value)}>
        {entidades.map(e => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}
      </TextField>
      <Button variant="contained" disabled={!nomeDre || !entidadeId} onClick={() => void run(() => api.post('/dres', { nome: nomeDre, entidadeExecutoraId: entidadeId }), 'DRE criada.')}>Criar DRE</Button>
    </Stack></CardContent></Card>
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">Vincular escola</Typography>
      <TextField label="ID da escola" value={escolaId} onChange={e => setEscolaId(e.target.value)} />
      <TextField select label="DRE" value={dreId} onChange={e => setDreId(e.target.value)}>
        {dres.map(d => <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>)}
      </TextField>
      <Button variant="contained" disabled={!escolaId || !dreId} onClick={() => void run(() => api.post(`/escolas/${encodeURIComponent(escolaId)}/vincular-dre`, { dreId, vigenciaInicio: new Date().toISOString() }), 'Escola vinculada.')}>Vincular</Button>
    </Stack></CardContent></Card>
  </Stack>;
}
