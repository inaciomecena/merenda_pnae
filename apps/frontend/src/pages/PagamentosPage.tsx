import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, FormControl,
  Grid, InputLabel, MenuItem, Pagination, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Add, Download, Visibility, Undo } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { humanizeSystemValue } from '../lib/display-text';

type Pagamento = {
  id: string;
  liquidacaoId: string;
  liquidacao: { numeroProcesso: string; notaFiscal: { numero: string; fornecedor: { nome: string } } };
  valorPago: string;
  dataPagamento: string;
  status: string;
  tipo: string;
  comprovante?: { id: string; titulo: string; versao: number } | null;
};

type Liquidacao = {
  id: string;
  numeroProcesso: string;
  valorLiquidado: string;
  status: string;
  notaFiscal: { numero: string; fornecedor: { nome: string } };
};

const statusCores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  REGISTRADO: 'warning',
  CONFIRMADO: 'success',
  PARCIAL: 'info',
  ESTORNADO: 'error',
  CANCELADO: 'default',
};

const moeda = (valor: string | number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

export default function PagamentosPage() {
  const { user } = useAuth();
  const podeGerenciar = user?.role === 'ADMIN' || user?.role === 'DRE';

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<PaginationResponse<Pagamento> | null>(null);
  const [liquidacoes, setLiquidacoes] = useState<Liquidacao[]>([]);
  const [liquidacaoId, setLiquidacaoId] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<'INTEGRAL' | 'PARCIAL'>('INTEGRAL');
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [estornoId, setEstornoId] = useState('');
  const [motivoEstorno, setMotivoEstorno] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const q = new URLSearchParams({ page: String(pagina), limit: '20' });
      if (status) q.set('status', status);
      const { data } = await api.get<ApiResponse<PaginationResponse<Pagamento>>>(`/pagamentos?${q}`);
      setLista(data.data);
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  }, [pagina, status]);

  const carregarLiquidacoes = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<PaginationResponse<Liquidacao>>>('/liquidacoes?status=REGISTRADA&limit=100');
      setLiquidacoes(data.data.items);
    } catch (e) {
      setErro(erroApi(e));
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => { if (podeGerenciar) void carregarLiquidacoes(); }, [podeGerenciar, carregarLiquidacoes]);

  const registrarPagamento = async () => {
    if (!liquidacaoId) {
      setErro('Selecione uma liquidação.');
      return;
    }
    if (!valorPago || Number(valorPago) <= 0) {
      setErro('Informe um valor válido para o pagamento.');
      return;
    }
    setLoading(true);
    setErro('');
    setAviso('');
    try {
      const form = new FormData();
      form.append('liquidacaoId', liquidacaoId);
      form.append('valorPago', valorPago);
      form.append('dataPagamento', dataPagamento);
      form.append('tipo', tipo);
      if (comprovante) form.append('comprovante', comprovante);
      await api.post('/pagamentos', form);
      setAviso('Pagamento registrado com sucesso.');
      setLiquidacaoId('');
      setValorPago('');
      setComprovante(null);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  };

  const estornarPagamento = async () => {
    if (!estornoId) return;
    if (!motivoEstorno.trim()) {
      setErro('Informe o motivo do estorno.');
      return;
    }
    setLoading(true);
    setErro('');
    setAviso('');
    try {
      await api.post(`/pagamentos/${estornoId}/estornar`, { motivo: motivoEstorno });
      setAviso('Pagamento estornado com sucesso.');
      setEstornoId('');
      setMotivoEstorno('');
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  };

  const baixarComprovante = async (pagamentoId: string) => {
    try {
      const resposta = await api.get(`/pagamentos/${pagamentoId}/comprovante`, { responseType: 'blob' });
      const url = URL.createObjectURL(resposta.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprovante-pagamento-${pagamentoId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(erroApi(e));
    }
  };

  return (
    <Stack spacing={2} sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4">Acompanhamento de Pagamentos</Typography>

      {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}
      {aviso && <Alert severity="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {loading && <CircularProgress size={25} />}

      {podeGerenciar && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Registrar Pagamento</Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Liquidação</InputLabel>
                  <Select value={liquidacaoId} label="Liquidação" onChange={e => setLiquidacaoId(e.target.value)}>
                    <MenuItem value="">Selecione</MenuItem>
                    {liquidacoes.map(l => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.numeroProcesso} - NF {l.notaFiscal?.numero} - {l.notaFiscal?.fornecedor?.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={tipo} label="Tipo" onChange={e => setTipo(e.target.value as 'INTEGRAL' | 'PARCIAL')}>
                    <MenuItem value="INTEGRAL">Integral</MenuItem>
                    <MenuItem value="PARCIAL">Parcial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor Pago"
                  type="number"
                  inputProps={{ min: 0, step: '0.01' }}
                  value={valorPago}
                  onChange={e => setValorPago(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data do Pagamento"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={dataPagamento}
                  onChange={e => setDataPagamento(e.target.value)}
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
              onClick={() => void registrarPagamento()}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : 'Registrar Pagamento'}
            </Button>
          </CardContent>
        </Card>
      )}

      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel>Status</InputLabel>
        <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPagina(1); }}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="REGISTRADO">Registrado</MenuItem>
          <MenuItem value="CONFIRMADO">Confirmado</MenuItem>
          <MenuItem value="PARCIAL">Parcial</MenuItem>
          <MenuItem value="ESTORNADO">Estornado</MenuItem>
        </Select>
      </FormControl>

      {!lista?.items.length && !loading && (
        <Typography color="text.secondary">Nenhum pagamento encontrado.</Typography>
      )}

      {lista?.items.map(pag => (
        <Card key={pag.id} variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="h6">Pagamento {pag.id.slice(0, 8)}</Typography>
                <Typography color="text.secondary">
                  Processo {pag.liquidacao?.numeroProcesso} - NF {pag.liquidacao?.notaFiscal?.numero} - {pag.liquidacao?.notaFiscal?.fornecedor?.nome}
                </Typography>
                <Typography color="text.secondary">
                  Pagamento: {new Date(pag.dataPagamento).toLocaleDateString('pt-BR')} · Valor: {moeda(pag.valorPago)} · Tipo: {pag.tipo}
                </Typography>
              </Box>
              <Stack alignItems="flex-start" spacing={1}>
                <Chip label={humanizeSystemValue(pag.status)} color={statusCores[pag.status] || 'default'} size="small" />
                {pag.comprovante && (
                  <Button size="small" startIcon={<Download />} onClick={() => void baixarComprovante(pag.id)}>
                    Comprovante
                  </Button>
                )}
                {podeGerenciar && pag.status !== 'ESTORNADO' && (
                  <Button size="small" color="error" startIcon={<Undo />} onClick={() => setEstornoId(pag.id)}>
                    Estornar
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {estornoId && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Estornar Pagamento</Typography>
            <Divider sx={{ my: 1 }} />
            <TextField
              fullWidth
              label="Motivo do Estorno"
              multiline
              minRows={2}
              value={motivoEstorno}
              onChange={e => setMotivoEstorno(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="error" disabled={loading} onClick={() => void estornarPagamento()}>
                Confirmar Estorno
              </Button>
              <Button variant="outlined" onClick={() => { setEstornoId(''); setMotivoEstorno(''); }}>
                Cancelar
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Pagination count={Math.max(1, lista?.totalPages || 1)} page={pagina} onChange={(_, p) => setPagina(p)} />
    </Stack>
  );
}
