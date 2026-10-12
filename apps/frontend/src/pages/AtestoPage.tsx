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

type NotaFiscal = {
  id: string;
  numero: string;
  serie: string | null;
  dataEmissao: string;
  valorTotal: string;
  status: string;
  fornecedor: { nome: string };
  contrato: { numero: string; exercicio: number };
  atestos: Array<{ id: string; status: string; valorAtestado: string; dataAtesto: string; justificativa?: string | null }>;
};

type Atesto = {
  id: string;
  notaFiscalId: string;
  tipo: string;
  valorAtestado: string;
  dataAtesto: string;
  status: string;
  justificativa?: string | null;
  comprovante?: { id: string; titulo: string; versao: number } | null;
};

const statusCores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  AGUARDANDO_ATESTO: 'warning',
  ATESTADA: 'success',
  REJEITADA: 'error',
};

const moeda = (valor: string | number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

export default function AtestoPage() {
  const { user } = useAuth();
  const podeAtestar = user?.role === 'ADMIN' || user?.role === 'DRE';

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<PaginationResponse<NotaFiscal> | null>(null);
  const [selecionada, setSelecionada] = useState<NotaFiscal | null>(null);
  const [atestos, setAtestos] = useState<Atesto[]>([]);
  const [tipoAtesto, setTipoAtesto] = useState<'INTEGRAL' | 'PARCIAL'>('INTEGRAL');
  const [valorAtestado, setValorAtestado] = useState('');
  const [dataAtesto, setDataAtesto] = useState(new Date().toISOString().slice(0, 10));
  const [justificativa, setJustificativa] = useState('');
  const [comprovante, setComprovante] = useState<File | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const q = new URLSearchParams({ page: String(pagina), limit: '20' });
      if (status) q.set('status', status);
      const { data } = await api.get<ApiResponse<PaginationResponse<NotaFiscal>>>(`/notas-fiscais?${q}`);
      setLista(data.data);
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  }, [pagina, status]);

  useEffect(() => { void carregar(); }, [carregar]);

  const abrirNota = async (id: string) => {
    setLoading(true);
    setErro('');
    try {
      const { data } = await api.get<ApiResponse<NotaFiscal>>(`/notas-fiscais/${id}`);
      setSelecionada(data.data);
      setValorAtestado(data.data.valorTotal);
      const atest = await api.get<ApiResponse<Atesto[]>>(`/notas-fiscais/${id}/atestos`);
      setAtestos(atest.data.data);
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  };

  const registrarAtesto = async () => {
    if (!selecionada) return;
    if (!valorAtestado || Number(valorAtestado) <= 0) {
      setErro('Informe um valor válido para o atesto.');
      return;
    }
    setLoading(true);
    setErro('');
    setAviso('');
    try {
      const form = new FormData();
      form.append('tipo', tipoAtesto);
      form.append('valorAtestado', valorAtestado);
      form.append('dataAtesto', dataAtesto);
      if (justificativa) form.append('justificativa', justificativa);
      if (comprovante) form.append('comprovante', comprovante);
      await api.post(`/notas-fiscais/${selecionada.id}/atestos`, form);
      setAviso('Atesto registrado com sucesso.');
      setJustificativa('');
      setComprovante(null);
      await abrirNota(selecionada.id);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  };

  const baixarComprovante = async (atestoId: string) => {
    if (!selecionada) return;
    try {
      const resposta = await api.get(`/notas-fiscais/${selecionada.id}/atestos/${atestoId}/comprovante`, { responseType: 'blob' });
      const url = URL.createObjectURL(resposta.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprovante-atesto-${atestoId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(erroApi(e));
    }
  };

  return (
    <Stack spacing={2} sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4">Atestos</Typography>

      {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}
      {aviso && <Alert severity="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {loading && <CircularProgress size={25} />}

      {!selecionada && (
        <Stack spacing={2}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPagina(1); }}>
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="AGUARDANDO_ATESTO">Aguardando Atesto</MenuItem>
              <MenuItem value="ATESTADA">Atestada</MenuItem>
              <MenuItem value="REJEITADA">Rejeitada</MenuItem>
            </Select>
          </FormControl>

          {!lista?.items.length && !loading && (
            <Typography color="text.secondary">Nenhuma nota fiscal encontrada.</Typography>
          )}

          {lista?.items.map(nota => (
            <Card key={nota.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="h6">NF {nota.numero} {nota.serie && `- Série ${nota.serie}`}</Typography>
                    <Typography color="text.secondary">{nota.fornecedor?.nome} · Contrato {nota.contrato?.numero}/{nota.contrato?.exercicio}</Typography>
                    <Typography color="text.secondary">Emissão: {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')} · Valor: {moeda(nota.valorTotal)}</Typography>
                  </Box>
                  <Stack alignItems="flex-start" spacing={1}>
                    <Chip label={humanizeSystemValue(nota.status)} color={statusCores[nota.status] || 'default'} size="small" />
                    <Button size="small" startIcon={<Visibility />} onClick={() => void abrirNota(nota.id)}>Atestar</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Pagination count={Math.max(1, lista?.totalPages || 1)} page={pagina} onChange={(_, p) => setPagina(p)} />
        </Stack>
      )}

      {selecionada && (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="h6">NF {selecionada.numero} {selecionada.serie && `- Série ${selecionada.serie}`}</Typography>
                  <Typography color="text.secondary">{selecionada.fornecedor?.nome} · Contrato {selecionada.contrato?.numero}/{selecionada.contrato?.exercicio}</Typography>
                  <Typography color="text.secondary">Emissão: {new Date(selecionada.dataEmissao).toLocaleDateString('pt-BR')} · Valor: {moeda(selecionada.valorTotal)}</Typography>
                </Box>
                <Button onClick={() => { setSelecionada(null); setAtestos([]); }}>Voltar</Button>
              </Stack>
            </CardContent>
          </Card>

          {podeAtestar && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">Registrar Atesto</Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Atesto</InputLabel>
                      <Select value={tipoAtesto} label="Tipo de Atesto" onChange={e => setTipoAtesto(e.target.value as 'INTEGRAL' | 'PARCIAL')}>
                        <MenuItem value="INTEGRAL">Integral</MenuItem>
                        <MenuItem value="PARCIAL">Parcial</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Valor Atestado"
                      type="number"
                      inputProps={{ min: 0, step: '0.01' }}
                      value={valorAtestado}
                      onChange={e => setValorAtestado(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Data do Atesto"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={dataAtesto}
                      onChange={e => setDataAtesto(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Justificativa"
                      multiline
                      minRows={2}
                      value={justificativa}
                      onChange={e => setJustificativa(e.target.value)}
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
                  onClick={() => void registrarAtesto()}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={18} color="inherit" /> : 'Registrar Atesto'}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Histórico de Atestos</Typography>
              <Divider sx={{ my: 1 }} />
              {atestos.length === 0 ? (
                <Typography color="text.secondary">Nenhum atesto registrado.</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Justificativa</TableCell>
                        <TableCell align="right">Comprovante</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {atestos.map(atesto => (
                        <TableRow key={atesto.id}>
                          <TableCell>{new Date(atesto.dataAtesto).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell><Chip size="small" label={humanizeSystemValue(atesto.tipo)} /></TableCell>
                          <TableCell align="right">{moeda(atesto.valorAtestado)}</TableCell>
                          <TableCell><Chip size="small" label={humanizeSystemValue(atesto.status)} color={atesto.status === 'ATESTADO' ? 'success' : 'default'} /></TableCell>
                          <TableCell>{atesto.justificativa || '—'}</TableCell>
                          <TableCell align="right">
                            {atesto.comprovante && (
                              <Button size="small" startIcon={<Download />} onClick={() => void baixarComprovante(atesto.id)}>
                                Baixar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
