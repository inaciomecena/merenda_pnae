import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import api from '../services/api';
import type { ApiResponse } from '../types';

type Entidade = { id: string; nome: string; uf: string };
type Dre = { id: string; nome: string; codigo?: string; entidadeExecutoraId: string };
type VinculoEscola = { id: string; escola: { id: string; nome: string } };

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
  const [editingEntidadeId, setEditingEntidadeId] = useState('');
  const [editingDreId, setEditingDreId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [vinculosEscolas, setVinculosEscolas] = useState<VinculoEscola[]>([]);

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
  async function loadVinculos(id: string) {
    setDreId(id);
    const response = await api.get<ApiResponse<Dre & { vinculosEscolas: VinculoEscola[] }>>(`/dres/${id}`);
    setVinculosEscolas(response.data.data.vinculosEscolas);
  }
  return <Stack spacing={2}>
    <Typography variant="h4">Organização</Typography>
    <Typography color="text.secondary">Entidades executoras, DREs e vínculos de escolas. IDs devem ser conferidos antes de salvar.</Typography>
    {message && <Alert severity="success">{message}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">Entidades executoras</Typography>
      <Box>{entidades.map(e => <Stack key={e.id} direction="row" spacing={1} alignItems="center">
        <Typography>{e.nome} ({e.uf}) · {e.id}</Typography>
        <Button size="small" onClick={() => { setEditingEntidadeId(e.id); setEditingDreId(''); setEditingName(e.nome); }}>Editar</Button>
      </Stack>)}</Box>
      {editingEntidadeId && <Stack direction="row" spacing={1}><TextField label="Novo nome da entidade" value={editingName} onChange={e => setEditingName(e.target.value)} />
        <Button disabled={!editingName} onClick={() => void run(() => api.put(`/entidades-executoras/${editingEntidadeId}`, { nome: editingName }).then(() => setEditingEntidadeId('')), 'Entidade atualizada.')}>Salvar</Button></Stack>}
      <TextField label="Nome" value={nomeEntidade} onChange={e => setNomeEntidade(e.target.value)} />
      <TextField label="UF" value={uf} onChange={e => setUf(e.target.value)} />
      <Button variant="contained" disabled={!nomeEntidade || !uf} onClick={() => void run(() => api.post('/entidades-executoras', { nome: nomeEntidade, uf }), 'Entidade criada.')}>Criar entidade</Button>
    </Stack></CardContent></Card>
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">DREs</Typography>
      <Box>{dres.map(d => <Stack key={d.id} direction="row" spacing={1} alignItems="center">
        <Typography>{d.nome} · {d.id}</Typography>
        <Button size="small" onClick={() => { setEditingDreId(d.id); setEditingEntidadeId(''); setEditingName(d.nome); }}>Editar</Button>
      </Stack>)}</Box>
      {editingDreId && <Stack direction="row" spacing={1}><TextField label="Novo nome da DRE" value={editingName} onChange={e => setEditingName(e.target.value)} />
        <Button disabled={!editingName} onClick={() => void run(() => api.put(`/dres/${editingDreId}`, { nome: editingName }).then(() => setEditingDreId('')), 'DRE atualizada.')}>Salvar</Button></Stack>}
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
      <Button variant="outlined" disabled={!dreId} onClick={() => void loadVinculos(dreId).catch(() => setError('Não foi possível consultar os vínculos da DRE.'))}>Consultar escolas da DRE</Button>
      {vinculosEscolas.map(v => <Stack key={v.id} direction="row" spacing={1} alignItems="center">
        <Typography>{v.escola.nome}</Typography>
        <Button color="error" onClick={() => void run(() => api.delete(`/escolas/vinculos/${v.id}`).then(() => loadVinculos(dreId)), 'Vínculo escolar revogado.')}>Revogar vínculo</Button>
      </Stack>)}
    </Stack></CardContent></Card>
  </Stack>;
}
