import { useState } from 'react';
import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import api from '../services/api';
import type { ApiResponse, UserRole } from '../types';

type Vinculo = { id: string; funcao: UserRole; ativo: boolean; dreId?: string; escolaId?: string; produtorId?: string };
type Representacao = { id: string; produtorId: string; ativo: boolean; permissoes: string; revogadoEm?: string | null };

export default function VinculosPage() {
  const [userId, setUserId] = useState('');
  const [funcao, setFuncao] = useState<UserRole>('ESCOLA');
  const [escopoId, setEscopoId] = useState('');
  const [produtorId, setProdutorId] = useState('');
  const [documento, setDocumento] = useState('');
  const [permissoes, setPermissoes] = useState('CONSULTAR');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [representacoes, setRepresentacoes] = useState<Representacao[]>([]);
  async function load() {
    if (!userId) return;
    const [v, r] = await Promise.all([
      api.get<ApiResponse<Vinculo[]>>(`/vinculos/usuario/${encodeURIComponent(userId)}`),
      api.get<ApiResponse<Representacao[]>>(`/representacoes/usuario/${encodeURIComponent(userId)}`),
    ]);
    setVinculos(v.data.data); setRepresentacoes(r.data.data);
  }
  async function submit(task: () => Promise<unknown>, label: string) {
    setMessage(''); setError('');
    try { await task(); await load(); setMessage(label); } catch { setError('Operação recusada. Confira os IDs, datas e permissões.'); }
  }
  const scopeField = funcao === 'DRE' ? 'dreId' : funcao === 'ESCOLA' ? 'escolaId' : funcao === 'PRODUTOR' ? 'produtorId' : funcao === 'EXTENSIONISTA' ? 'municipioId' : null;
  return <Stack spacing={2}>
    <Typography variant="h4">Funções e representações</Typography>
    <Typography color="text.secondary">Conceda vínculos apenas após conferir a autorização e o cadastro correspondente. A revogação pode ser feita pela API administrativa.</Typography>
    {message && <Alert severity="success">{message}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">Vínculo de usuário</Typography>
      <TextField label="ID do usuário" value={userId} onChange={e => setUserId(e.target.value)} />
      <TextField select label="Função" value={funcao} onChange={e => setFuncao(e.target.value as UserRole)}>
        {(['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR'] as UserRole[]).map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
      </TextField>
      {scopeField && <TextField label={`ID do escopo (${scopeField})`} value={escopoId} onChange={e => setEscopoId(e.target.value)} />}
      <Button variant="contained" disabled={!userId || Boolean(scopeField && !escopoId)} onClick={() => void submit(() => api.post('/vinculos', { userId, funcao, ...(scopeField ? { [scopeField]: escopoId } : {}), vigenciaInicio: new Date().toISOString() }), 'Vínculo criado.')}>Conceder função</Button>
    </Stack></CardContent></Card>
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">Representação autorizada</Typography>
      <TextField label="ID do representante" value={userId} onChange={e => setUserId(e.target.value)} />
      <TextField label="ID do produtor" value={produtorId} onChange={e => setProdutorId(e.target.value)} />
      <TextField label="Referência do documento de autorização" value={documento} onChange={e => setDocumento(e.target.value)} />
      <TextField select label="Permissões" value={permissoes} onChange={e => setPermissoes(e.target.value)}>
        <MenuItem value="CONSULTAR">Consultar</MenuItem>
        <MenuItem value="CONSULTAR,EDITAR_PRODUTOR">Consultar e editar cadastro</MenuItem>
        <MenuItem value="CONSULTAR,EDITAR_PROPOSTA">Consultar e editar proposta</MenuItem>
        <MenuItem value="CONSULTAR,EDITAR_PRODUTOR,EDITAR_PROPOSTA">Todas as ações do fornecedor</MenuItem>
      </TextField>
      <Button variant="contained" disabled={!userId || !produtorId || !documento} onClick={() => void submit(() => api.post('/representacoes', { userId, produtorId, autorizacaoDocumento: documento, permissoes, vigenciaInicio: new Date().toISOString() }), 'Representação autorizada.')}>Autorizar representação</Button>
    </Stack></CardContent></Card>
    <Card><CardContent><Stack spacing={2}>
      <Typography variant="h6">Consultar e revogar</Typography>
      <Button variant="outlined" disabled={!userId} onClick={() => void load().catch(() => setError('Consulta indisponível.'))}>Consultar usuário informado</Button>
      {vinculos.map(v => <Stack key={v.id} direction="row" spacing={2} alignItems="center">
        <Typography>{v.funcao} · {v.dreId || v.escolaId || v.produtorId || 'global'} · {v.ativo ? 'ativo' : 'revogado'}</Typography>
        {v.ativo && <Button color="error" onClick={() => void submit(() => api.delete(`/vinculos/${v.id}`), 'Vínculo revogado.')}>Revogar</Button>}
      </Stack>)}
      {representacoes.map(r => <Stack key={r.id} direction="row" spacing={2} alignItems="center">
        <Typography>Produtor {r.produtorId} · {r.permissoes}</Typography>
        {r.ativo && !r.revogadoEm && <Button color="error" onClick={() => void submit(() => api.put(`/representacoes/${r.id}/revogar`, { motivo: 'Revogação administrativa' }), 'Representação revogada.')}>Revogar</Button>}
      </Stack>)}
    </Stack></CardContent></Card>
  </Stack>;
}
