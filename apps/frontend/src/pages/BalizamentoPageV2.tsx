import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle, Delete, PlayArrow, ThumbDown, Tune } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';

type EditalOption = { id: string; numero: string; ano: number; titulo: string; municipio?: { nome: string } | null; escola?: { nome: string } | null };
type ProdutorOption = { id: string; nome: string; municipio?: { nome: string } | null };
type ProdutoReferenciaOption = { id: string; nome: string };
type ProdutorProdutoOption = { id: string; produto: string; capacidade?: string | null; unidade?: string | null; periodoProducao?: string | null };

type MatchItem = {
  id: string;
  scoreMatch: number;
  status: string;
  motivoScore?: string | null;
  observacoes?: string | null;
  editalItem: { id: string; produtoOriginal: string; quantidade?: number | string | null; unidade?: string | null };
  produtoReferencia?: { id: string; nome: string } | null;
  produtor?: { id: string; nome: string; municipio?: { nome: string } | null } | null;
  produtorProduto?: { id: string; produto: string; capacidade?: string | null; unidade?: string | null; periodoProducao?: string | null } | null;
};

function scoreColor(score: number): 'success' | 'warning' | 'default' | 'error' {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  if (score === 0) return 'default';
  return 'error';
}

function statusColor(status: string): 'success' | 'warning' | 'default' | 'error' | 'info' {
  if (status === 'APROVADO' || status === 'MATCH_AUTOMATICO') return 'success';
  if (status === 'SUGESTAO') return 'warning';
  if (status === 'REJEITADO') return 'error';
  if (status === 'PENDENTE') return 'info';
  return 'default';
}

export default function BalizamentoPageV2() {
  const [editalId, setEditalId] = useState('');
  const [status, setStatus] = useState('');
  const [scoreMinimo, setScoreMinimo] = useState('');
  const [produto, setProduto] = useState('');
  const [produtor, setProdutor] = useState('');
  const [error, setError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ editalItemId: '', produtoReferenciaId: '', produtorId: '', produtorProdutoId: '', observacoes: '' });

  const editais = useQuery({
    queryKey: ['editais-balizamento'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginationResponse<EditalOption>>>('/editais?limit=100');
      return response.data.data.items;
    },
  });

  useEffect(() => {
    if (!editalId && editais.data?.length) setEditalId(editais.data[0].id);
  }, [editalId, editais.data]);

  const matches = useQuery({
    queryKey: ['balizamento', editalId, status, scoreMinimo, produto, produtor],
    enabled: Boolean(editalId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (scoreMinimo) params.set('scoreMinimo', scoreMinimo);
      if (produto) params.set('produto', produto);
      if (produtor) params.set('produtor', produtor);
      const response = await api.get<ApiResponse<{ items: MatchItem[]; total: number }>>(`/balizamento/editais/${editalId}?${params.toString()}`);
      return response.data.data;
    },
  });

  const produtosReferencia = useQuery({
    queryKey: ['produtos-referencia-manual'],
    enabled: manualOpen,
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginationResponse<ProdutoReferenciaOption>>>('/produtos-referencia?limit=200&ativo=true');
      return response.data.data.items;
    },
  });

  const produtores = useQuery({
    queryKey: ['produtores-manual'],
    enabled: manualOpen,
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginationResponse<ProdutorOption>>>('/produtores?limit=200');
      return response.data.data.items;
    },
  });

  const produtosProdutor = useQuery({
    queryKey: ['produtor-produtos-manual', manual.produtorId],
    enabled: manualOpen && Boolean(manual.produtorId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProdutorProdutoOption[]>>(`/produtores/${manual.produtorId}/produtos`);
      return response.data.data;
    },
  });

  const executar = async () => {
    if (!editalId) return;
    setError('');
    try {
      await api.post(`/balizamento/editais/${editalId}/executar`);
      await matches.refetch();
    } catch {
      setError('Não foi possível executar o balizamento para este edital.');
    }
  };

  const atualizarStatus = async (matchId: string, action: 'aprovar' | 'rejeitar') => {
    await api.put(`/balizamento/matches/${matchId}/${action}`, {});
    await matches.refetch();
  };

  const remover = async (matchId: string) => {
    await api.delete(`/balizamento/matches/${matchId}`);
    await matches.refetch();
  };

  const criarManual = async () => {
    await api.post('/balizamento/matches/manual', { ...manual, editalId });
    setManualOpen(false);
    setManual({ editalItemId: '', produtoReferenciaId: '', produtorId: '', produtorProdutoId: '', observacoes: '' });
    await matches.refetch();
  };

  const selectedEdital = editais.data?.find((item) => item.id === editalId);
  const itemOptions = Array.from(new Map((matches.data?.items ?? []).map((item) => [item.editalItem.id, item.editalItem])).values());

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Balizamento</Typography>
          <Typography color="text.secondary">Motor de match entre item do edital, produto de referência e produção cadastrada do produtor.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Tune />} onClick={() => setManualOpen(true)} disabled={!editalId}>Match manual</Button>
          <Button variant="contained" startIcon={<PlayArrow />} onClick={() => void executar()} disabled={!editalId || matches.isFetching}>Executar balizamento</Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Edital</InputLabel>
              <Select label="Edital" value={editalId} onChange={(event) => setEditalId(event.target.value)}>
                {(editais.data ?? []).map((edital) => (
                  <MenuItem key={edital.id} value={edital.id}>{edital.numero}/{edital.ano} - {edital.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Produto" value={produto} onChange={(event) => setProduto(event.target.value)} />
            <TextField label="Produtor" value={produtor} onChange={(event) => setProdutor(event.target.value)} />
            <TextField label="Score mínimo" type="number" value={scoreMinimo} onChange={(event) => setScoreMinimo(event.target.value)} />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {['MATCH_AUTOMATICO', 'SUGESTAO', 'PENDENTE', 'SEM_MATCH', 'APROVADO', 'REJEITADO'].map((value) => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {selectedEdital ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Município: {selectedEdital.municipio?.nome ?? '-'} | Escola: {selectedEdital.escola?.nome ?? '-'}
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {matches.isLoading ? <CircularProgress /> : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item do edital</TableCell>
                  <TableCell>Produto referência</TableCell>
                  <TableCell>Produtor</TableCell>
                  <TableCell>Capacidade</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(matches.data?.items ?? []).map((match) => (
                  <TableRow key={match.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{match.editalItem.produtoOriginal}</Typography>
                      <Typography variant="body2" color="text.secondary">{match.editalItem.quantidade ?? '-'} {match.editalItem.unidade ?? ''}</Typography>
                    </TableCell>
                    <TableCell>{match.produtoReferencia?.nome ?? '-'}</TableCell>
                    <TableCell>
                      <Typography>{match.produtor?.nome ?? '-'}</Typography>
                      <Typography variant="body2" color="text.secondary">{match.produtor?.municipio?.nome ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      {match.produtorProduto ? (
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{match.produtorProduto.capacidade ?? '-'} {match.produtorProduto.unidade ?? ''}</Typography>
                          <Typography variant="caption" color="text.secondary">Periodo: {match.produtorProduto.periodoProducao ?? 'Nao informado'}</Typography>
                        </Stack>
                      ) : '-'}
                    </TableCell>
                    <TableCell><Chip color={scoreColor(match.scoreMatch)} label={match.scoreMatch} /></TableCell>
                    <TableCell><Chip color={statusColor(match.status)} label={match.status} /></TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>{match.motivoScore || match.observacoes || '-'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" startIcon={<CheckCircle />} onClick={() => void atualizarStatus(match.id, 'aprovar')}>Aprovar</Button>
                        <Button size="small" color="warning" startIcon={<ThumbDown />} onClick={() => void atualizarStatus(match.id, 'rejeitar')}>Rejeitar</Button>
                        <Button size="small" color="error" startIcon={<Delete />} onClick={() => void remover(match.id)}>Remover</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!matches.data?.items?.length ? (
                  <TableRow>
                    <TableCell colSpan={8}>Nenhum match encontrado. Selecione um edital e execute o balizamento.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Criar match manual</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Item do edital</InputLabel>
              <Select label="Item do edital" value={manual.editalItemId} onChange={(event) => setManual({ ...manual, editalItemId: event.target.value })}>
                {itemOptions.map((item) => <MenuItem key={item.id} value={item.id}>{item.produtoOriginal}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Produto referência</InputLabel>
              <Select label="Produto referência" value={manual.produtoReferenciaId} onChange={(event) => setManual({ ...manual, produtoReferenciaId: event.target.value })}>
                {(produtosReferencia.data ?? []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Produtor</InputLabel>
              <Select label="Produtor" value={manual.produtorId} onChange={(event) => setManual({ ...manual, produtorId: event.target.value, produtorProdutoId: '' })}>
                {(produtores.data ?? []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nome} - {item.municipio?.nome ?? '-'}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Produto produzido</InputLabel>
              <Select label="Produto produzido" value={manual.produtorProdutoId} onChange={(event) => setManual({ ...manual, produtorProdutoId: event.target.value })}>
                {(produtosProdutor.data ?? []).map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.produto} ({item.capacidade ?? '-'} {item.unidade ?? ''}) - {item.periodoProducao ?? 'periodo nao informado'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Observação" multiline minRows={3} value={manual.observacoes} onChange={(event) => setManual({ ...manual, observacoes: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void criarManual()} disabled={!manual.editalItemId || !manual.produtorId || !manual.produtorProdutoId}>Salvar match</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
