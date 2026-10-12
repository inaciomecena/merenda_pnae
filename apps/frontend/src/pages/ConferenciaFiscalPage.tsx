import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Divider,
  FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Pagination, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
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
  itens: Array<{ id: string; descricao: string; quantidade: string; valorTotal: string }>;
  documentos: Array<{ id: string; tipo: string; titulo: string; versao: number }>;
};

type Conferencia = {
  id: string;
  notaFiscalId: string;
  status: string;
  dataConferencia: string;
  conferente?: string | null;
  justificativa?: string | null;
  ressalvas?: string | null;
  checklist: Array<{ item: string; conforme: boolean; observacao?: string | null }>;
};

const statusCores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  PENDENTE_CONFERENCIA: 'warning',
  EM_CONFERENCIA: 'info',
  CONFERIDA: 'success',
  REJEITADA: 'error',
};

const checklistPadrao = [
  'Nota fiscal emitida corretamente',
  'Dados do fornecedor corretos',
  'Itens conferidos com o pedido',
  'Quantidades conferidas',
  'Valores unitários corretos',
  'Valor total correto',
  'Documentos anexados',
  'Conformidade com o contrato',
];

const moeda = (valor: string | number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

export default function ConferenciaFiscalPage() {
  const { user } = useAuth();
  const podeConferir = user?.role === 'ADMIN' || user?.role === 'DRE';

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<PaginationResponse<NotaFiscal> | null>(null);
  const [selecionada, setSelecionada] = useState<NotaFiscal | null>(null);
  const [conferencia, setConferencia] = useState<Conferencia | null>(null);
  const [checklist, setChecklist] = useState<Record<string, { conforme: boolean; observacao: string }>>({});
  const [justificativa, setJustificativa] = useState('');
  const [ressalvas, setRessalvas] = useState('');
  const [acao, setAcao] = useState<'APROVAR' | 'REJEITAR'>('APROVAR');

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
      const conf = await api.get<ApiResponse<Conferencia | null>>(`/notas-fiscais/${id}/conferencia`);
      setConferencia(conf.data.data);
      if (conf.data.data?.checklist) {
        setChecklist(Object.fromEntries(conf.data.data.checklist.map((c: { item: string; conforme: boolean; observacao?: string | null }) => [c.item, { conforme: c.conforme, observacao: c.observacao || '' }])));
      } else {
        setChecklist(Object.fromEntries(checklistPadrao.map(item => [item, { conforme: false, observacao: '' }])));
      }
      setJustificativa(conf.data.data?.justificativa || '');
      setRessalvas(conf.data.data?.ressalvas || '');
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  };

  const executarConferencia = async () => {
    if (!selecionada) return;
    if (acao === 'REJEITAR' && !justificativa.trim()) {
      setErro('Informe a justificativa para rejeição.');
      return;
    }
    setLoading(true);
    setErro('');
    setAviso('');
    try {
      await api.post(`/notas-fiscais/${selecionada.id}/conferencia`, {
        acao,
        checklist: Object.entries(checklist).map(([item, valor]) => ({ item, conforme: valor.conforme, observacao: valor.observacao || undefined })),
        justificativa: justificativa || undefined,
        ressalvas: ressalvas || undefined,
      });
      setAviso(acao === 'APROVAR' ? 'Nota aprovada na conferência.' : 'Nota rejeitada.');
      setSelecionada(null);
      setConferencia(null);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4">Conferência Documental</Typography>

      {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}
      {aviso && <Alert severity="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {loading && <CircularProgress size={25} />}

      {!selecionada && (
        <Stack spacing={2}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPagina(1); }}>
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="PENDENTE_CONFERENCIA">Pendente Conferência</MenuItem>
              <MenuItem value="EM_CONFERENCIA">Em Conferência</MenuItem>
              <MenuItem value="CONFERIDA">Conferida</MenuItem>
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
                    <Button size="small" startIcon={<Visibility />} onClick={() => void abrirNota(nota.id)}>Conferir</Button>
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
                <Button onClick={() => { setSelecionada(null); setConferencia(null); }}>Voltar</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Itens da Nota</Typography>
              <Divider sx={{ my: 1 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Descrição</TableCell>
                      <TableCell align="right">Quantidade</TableCell>
                      <TableCell align="right">Valor Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selecionada.itens.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell align="right">{Number(item.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</TableCell>
                        <TableCell align="right">{moeda(item.valorTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Documentos</Typography>
              <Divider sx={{ my: 1 }} />
              {selecionada.documentos.length === 0 ? (
                <Typography color="text.secondary">Nenhum documento anexado.</Typography>
              ) : (
                <Stack spacing={1}>
                  {selecionada.documentos.map(doc => (
                    <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip size="small" label={humanizeSystemValue(doc.tipo)} variant="outlined" />
                      <Typography>{doc.titulo} (v{doc.versao})</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {podeConferir && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">Checklist de Conferência</Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1}>
                  {Object.entries(checklist).map(([item, valor]) => (
                    <Box key={item}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={valor.conforme}
                            onChange={e => setChecklist({ ...checklist, [item]: { ...valor, conforme: e.target.checked } })}
                          />
                        }
                        label={humanizeSystemValue(item)}
                      />
                      {valor.conforme && (
                        <TextField
                          size="small"
                          label="Observação (opcional)"
                          value={valor.observacao}
                          onChange={e => setChecklist({ ...checklist, [item]: { ...valor, observacao: e.target.value } })}
                          sx={{ ml: 4, mb: 1, minWidth: 300 }}
                        />
                      )}
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6">Ação</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    disabled={acao !== 'APROVAR' || loading}
                    onClick={() => setAcao('APROVAR')}
                  >
                    Aprovar
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Cancel />}
                    disabled={acao !== 'REJEITAR' || loading}
                    onClick={() => setAcao('REJEITAR')}
                  >
                    Rejeitar
                  </Button>
                </Stack>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Justificativa"
                      multiline
                      minRows={2}
                      value={justificativa}
                      onChange={e => setJustificativa(e.target.value)}
                      required={acao === 'REJEITAR'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ressalvas"
                      multiline
                      minRows={2}
                      value={ressalvas}
                      onChange={e => setRessalvas(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  disabled={loading}
                  onClick={() => void executarConferencia()}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={18} color="inherit" /> : 'Registrar Conferência'}
                </Button>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </Stack>
  );
}
