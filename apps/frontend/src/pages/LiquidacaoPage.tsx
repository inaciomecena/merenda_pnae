import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, FormControl,
  Grid, InputLabel, MenuItem, Pagination, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Add, Download, Visibility } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { humanizeSystemValue } from '../lib/display-text';

type Liquidacao = {
  id: string;
  numeroProcesso: string;
  notaFiscalId: string;
  notaFiscal: { numero: string; serie: string | null; fornecedor: { nome: string } };
  atestoId: string | null;
  atesto: { valorAtestado: string; dataAtesto: string } | null;
  valorLiquidado: string;
  dataLiquidacao: string;
  status: string;
  comprovante?: { id: string; titulo: string; versao: number } | null;
};

type NotaFiscal = {
  id: string;
  numero: string;
  serie: string | null;
  valorTotal: string;
  status: string;
  fornecedor: { nome: string };
  atestos: Array<{ id: string; status: string; valorAtestado: string; dataAtesto: string }>;
};

const statusCores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  REGISTRADA: 'warning',
  CONFIRMADA: 'success',
  RETIFICADA: 'info',
  CANCELADA: 'default',
};

const moeda = (valor: string | number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

export default function LiquidacaoPage() {
  const { user } = useAuth();
  const podeGerenciar = user?.role === 'ADMIN' || user?.role === 'DRE';

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<PaginationResponse<Liquidacao> | null>(null);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [selecionada, setSelecionada] = useState<NotaFiscal | null>(null);
  const [notaFiscalId, setNotaFiscalId] = useState('');
  const [atestoId, setAtestoId] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [valorLiquidado, setValorLiquidado] = useState('');
  const [dataLiquidacao, setDataLiquidacao] = useState(new Date().toISOString().slice(0, 10));
  const [comprovante, setComprovante] = useState<File | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const q = new URLSearchParams({ page: String(pagina), limit: '20' });
      if (status) q.set('status', status);
      const { data } = await api.get<ApiResponse<PaginationResponse<Liquidacao>>>(`/liquidacoes?${q}`);
      setLista(data.data);
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  }, [pagina, status]);

  const carregarNotas = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<PaginationResponse<NotaFiscal>>>('/notas-fiscais?status=ATESTADA&limit=100');
      setNotas(data.data.items);
    } catch (e) {
      setErro(erroApi(e));
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => { if (podeGerenciar) void carregarNotas(); }, [podeGerenciar, carregarNotas]);

  const escolherNota = (id: string) => {
    setNotaFiscalId(id);
    const nota = notas.find(n => n.id === id);
    setSelecionada(nota || null);
    setAtestoId('');
    if (nota?.atestos.length === 1) {
      setAtestoId(nota.atestos[0].id);
      setValorLiquidado(nota.atestos[0].valorAtestado);
    }
  };

  const registrarLiquidacao = async () => {
    if (!notaFiscalId) {
      setErro('Selecione uma nota fiscal.');
      return;
    }
    if (!numeroProcesso.trim()) {
      setErro('Informe o número do processo.');
      return;
    }
    if (!valorLiquidado || Number(valorLiquidado) <= 0) {
      setErro('Informe um valor válido para a liquidação.');
      return;
    }
    setLoading(true);
    setErro('');
    setAviso('');
    try {
      const form = new FormData();
      form.append('notaFiscalId', notaFiscalId);
      if (atestoId) form.append('atestoId', atestoId);
      form.append('numeroProcesso', numeroProcesso);
      form.append('valorLiquidado', valorLiquidado);
      form.append('dataLiquidacao', dataLiquidacao);
      if (comprovante) form.append('comprovante', comprovante);
      await api.post('/liquidacoes', form);
      setAviso('Liquidação registrada com sucesso.');
      setNotaFiscalId('');
      setAtestoId('');
      setNumeroProcesso('');
      setValorLiquidado('');
      setComprovante(null);
      setSelecionada(null);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  };

  const baixarComprovante = async (liquidacaoId: string) => {
    try {
      const resposta = await api.get(`/liquidacoes/${liquidacaoId}/comprovante`, { responseType: 'blob' });
      const url = URL.createObjectURL(resposta.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprovante-liquidacao-${liquidacaoId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(erroApi(e));
    }
  };

  return (
    <Stack spacing={2} sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4">Registro de Liquidação</Typography>

      {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}
      {aviso && <Alert severity="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {loading && <CircularProgress size={25} />}

      {podeGerenciar && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Registrar Liquidação</Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Nota Fiscal</InputLabel>
                  <Select value={notaFiscalId} label="Nota Fiscal" onChange={e => escolherNota(e.target.value)}>
                    <MenuItem value="">Selecione</MenuItem>
                    {notas.map(n => (
                      <MenuItem key={n.id} value={n.id}>NF {n.numero} - {n.fornecedor?.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!selecionada || selecionada.atestos.length === 0}>
                  <InputLabel>Atesto</InputLabel>
                  <Select value={atestoId} label="Atesto" onChange={e => setAtestoId(e.target.value)}>
                    <MenuItem value="">Selecione</MenuItem>
                    {selecionada?.atestos.map(a => (
                      <MenuItem key={a.id} value={a.id}>{new Date(a.dataAtesto).toLocaleDateString('pt-BR')} - {moeda(a.valorAtestado)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número do Processo"
                  value={numeroProcesso}
                  onChange={e => setNumeroProcesso(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor Liquidado"
                  type="number"
                  inputProps={{ min: 0, step: '0.01' }}
                  value={valorLiquidado}
                  onChange={e => setValorLiquidado(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data da Liquidação"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={dataLiquidacao}
                  onChange={e => setDataLiquidacao(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button component="label" variant="outlined" startIcon={<Add />}>
                  Anexar Comprovante
                  <input hidden type="file" accept="application/pdf" onChange={e => setComprovante(e.target.files?.[0] || null)} />
                </Button>
                {comprovante && <Typography variant="caption" sx={{ ml: 1 }}>{comprovante.name}</Typography>}
              </Grid>
            </Grid>
            <Button
              variant="contained"
              disabled={loading}
              onClick={() => void registrarLiquidacao()}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : 'Registrar Liquidação'}
            </Button>
          </CardContent>
        </Card>
      )}

      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel>Status</InputLabel>
        <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPagina(1); }}>
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="REGISTRADA">Registrada</MenuItem>
          <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
          <MenuItem value="RETIFICADA">Retificada</MenuItem>
          <MenuItem value="CANCELADA">Cancelada</MenuItem>
        </Select>
      </FormControl>

      {!lista?.items.length && !loading && (
        <Typography color="text.secondary">Nenhuma liquidação encontrada.</Typography>
      )}

      {lista?.items.map(liq => (
        <Card key={liq.id} variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="h6">Processo {liq.numeroProcesso}</Typography>
                <Typography color="text.secondary">NF {liq.notaFiscal?.numero} - {liq.notaFiscal?.fornecedor?.nome}</Typography>
                <Typography color="text.secondary">Liquidação: {new Date(liq.dataLiquidacao).toLocaleDateString('pt-BR')} · Valor: {moeda(liq.valorLiquidado)}</Typography>
                {liq.atesto && (
                  <Typography variant="caption" color="text.secondary">
                    Atesto: {new Date(liq.atesto.dataAtesto).toLocaleDateString('pt-BR')} · {moeda(liq.atesto.valorAtestado)}
                  </Typography>
                )}
              </Box>
              <Stack alignItems="flex-start" spacing={1}>
                <Chip label={humanizeSystemValue(liq.status)} color={statusCores[liq.status] || 'default'} size="small" />
                {liq.comprovante && (
                  <Button size="small" startIcon={<Download />} onClick={() => void baixarComprovante(liq.id)}>
                    Comprovante
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Pagination count={Math.max(1, lista?.totalPages || 1)} page={pagina} onChange={(_, p) => setPagina(p)} />
    </Stack>
  );
}
