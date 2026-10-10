import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography, Pagination, Tooltip, Divider, TableContainer,
} from '@mui/material';
import { Add, Download, Visibility, CheckCircle, Cancel, PictureAsPdf, Description } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import PropostaDocumentosDialog from '../components/PropostaDocumentosDialog';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

interface Proposta {
  id: string;
  numero?: string;
  tipoDocumento: string;
  status: string;
  validadeDias: number;
  prazoEntrega: number;
  valorTotal?: number;
  arquivoPdfPath?: string;
  arquivoDocxPath?: string;
  observacao?: string;
  createdAt: string;
  edital: { id: string; numero: string; ano: number; titulo: string; municipio?: { nome: string; uf: string } | null };
  produtor?: { id: string; nome: string; cpfCnpj?: string; municipio?: { nome: string } | null } | null;
  itens: Array<{
    id: string; produto: string; especificacao?: string; marca?: string;
    quantidade?: number; unidade?: string; precoUnitario?: number; valorTotal?: number;
  }>;
}

interface Edital { id: string; numero: string; ano: number; titulo: string; status: string; }
interface Produtor { id: string; nome: string; cpfCnpj?: string; municipio?: { nome: string } | null; }

interface PreviewData {
  numeroProposta: string;
  tipoDocumento: string;
  edital: { numero: string; ano: number; titulo: string; objeto?: string; municipio?: { nome: string; uf: string } };
  produtor: { nome: string; cpfCnpj?: string; telefone?: string; endereco?: string; municipio?: { nome: string; uf: string } };
  itens: Array<{ produto: string; especificacao?: string; marca?: string; quantidade?: number; unidade?: string; precoUnitario?: number; valorTotal?: number }>;
  valorTotal: number;
  validadeDias: number;
  prazoEntrega: number;
  observacao?: string;
  dataGeracao: string;
}

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  RASCUNHO: 'default', GERADA: 'info', FINALIZADA: 'success', CANCELADA: 'error',
};

const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho', GERADA: 'Gerada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada',
};

const tipoLabels: Record<string, string> = {
  ANEXO_III: 'Anexo III', PROJETO_VENDA: 'Projeto de Venda',
};

export default function PropostasPage() {
  const [searchParams] = useSearchParams();
  const { user, context } = useAuth();
  const podeElaborar = user?.role === 'ADMIN' || user?.role === 'PRODUTOR' || (user?.role === 'EXTENSIONISTA' && Boolean(context?.representacoes.some(r => r.permissoes.split(',').includes('EDITAR_PROPOSTA'))));
  const [documentosId, setDocumentosId] = useState<string | null>(null);
  const [items, setItems] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editais, setEditais] = useState<Edital[]>([]);
  const [produtores, setProdutores] = useState<Produtor[]>([]);

  const [filterEdital, setFilterEdital] = useState('');
  const [filterProdutor, setFilterProdutor] = useState(searchParams.get('produtorId') || '');
  const [produtoresFiltro, setProdutoresFiltro] = useState<Produtor[]>([]);
  const [filterStatus, setFilterStatus] = useState('');

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ editalId: '', produtorId: '', tipoDocumento: 'ANEXO_III', validadeDias: 30, prazoEntrega: 15, observacao: '' });

  const [openPreview, setOpenPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Proposta | null>(null);
  const [detailProposta, setDetailProposta] = useState<Proposta | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterEdital) params.set('editalId', filterEdital);
      if (filterProdutor) params.set('produtorId', filterProdutor);
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get<ApiResponse<PaginationResponse<Proposta>>>(`/propostas?${params}`);
      setItems(data.data.items ?? []);
      setTotalPages(data.data.totalPages ?? 1);
    } catch {
      setError('Não foi possível carregar as propostas.');
    } finally {
      setLoading(false);
    }
  }, [page, filterEdital, filterProdutor, filterStatus]);

  const fetchEditais = async () => {
    try {
      const { data } = await api.get<ApiResponse<PaginationResponse<Edital>>>('/editais?limit=100');
      setEditais(data.data.items ?? []);
    } catch { /* ignore */ }
  };

  const fetchProdutores = async (editalId: string) => {
    if (!editalId) { setProdutores([]); return; }
    try {
      const { data } = await api.get<ApiResponse<Produtor[]>>(`/propostas/produtores/${editalId}`);
      setProdutores(data.data || []);
    } catch { setProdutores([]); }
  };

  useEffect(() => { void fetchItems(); }, [fetchItems]);
  useEffect(() => { void fetchEditais(); }, []);
  useEffect(() => {
    if (podeElaborar) api.get('/produtores?limit=500').then(({ data }) => setProdutoresFiltro(data.data.items || [])).catch(() => setError('Não foi possível carregar os produtores.'));
  }, [podeElaborar]);

  useEffect(() => {
    if (openCreate) void fetchProdutores(form.editalId);
  }, [openCreate, form.editalId]);
  useEffect(() => { setPreviewData(null); }, [form.editalId, form.produtorId, form.tipoDocumento]);

  const handlePreview = async (editalId: string, produtorId: string, tipoDocumento: string) => {
    setPreviewLoading(true);
    try {
      const { data } = await api.post<ApiResponse<PreviewData>>('/propostas/preview', { editalId, produtorId, tipoDocumento, validadeDias: form.validadeDias, prazoEntrega: form.prazoEntrega, observacao: form.observacao });
      setPreviewData(data.data);
      setOpenPreview(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao gerar pré-visualização');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const payload = { ...form, itens: (previewData?.itens || []).map((i: any) => ({ produto: i.produto, especificacao: i.especificacao, marca: i.marca, quantidade: i.quantidade, unidade: i.unidade, precoUnitario: i.precoUnitario, matchId: i.matchId })) };
      const { data } = await api.post('/propostas', payload);
      const proposta = data.data;
      setSuccess('Proposta criada com sucesso!');
      setOpenCreate(false);
      setOpenPreview(false);
      setPreviewData(null);
      setDocumentosId(proposta.id);
      setForm({ editalId: '', produtorId: '', tipoDocumento: 'ANEXO_III', validadeDias: 30, prazoEntrega: 15, observacao: '' });
      void fetchItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar proposta');
    }
  };

  const handleGenerate = async (proposta: Proposta) => {
    setDocumentosId(proposta.id);
  };

  const handleFinalize = async (proposta: Proposta) => {
    try {
      await api.put(`/propostas/${proposta.id}/finalizar`);
      setSuccess('Proposta finalizada!');
      void fetchItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao finalizar proposta');
    }
  };

  const handleDelete = async (proposta: Proposta) => {
    try {
      await api.delete(`/propostas/${proposta.id}`);
      setSuccess('Proposta cancelada!');
      setConfirmDelete(null);
      void fetchItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao cancelar proposta');
    }
  };

  const handleDownload = async (propostaId: string, tipo: 'pdf' | 'docx') => {
    try {
      const { data } = await api.get(`/propostas/${propostaId}/download/${tipo}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data); const a = document.createElement('a');
      a.href = url; a.download = `projeto-anexos-declaracoes.${tipo}`; a.click(); URL.revokeObjectURL(url);
    } catch { setError('Não foi possível baixar o documento.'); }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>Propostas</Typography>
        {podeElaborar && <Button variant="contained" startIcon={<Add />} onClick={() => { setPreviewData(null); setOpenCreate(true); }}>Novo projeto / proposta</Button>}
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {success ? <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert> : null}

      <Card>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField select label="Edital" fullWidth size="small" value={filterEdital} onChange={e => { setFilterEdital(e.target.value); setPage(1); }}>
                <MenuItem value="">Todos</MenuItem>
                {editais.map(e => <MenuItem key={e.id} value={e.id}>{e.numero}/{e.ano} — {e.titulo}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select label="Produtor" fullWidth size="small" value={filterProdutor} onChange={e => { setFilterProdutor(e.target.value); setPage(1); }}>
                <MenuItem value="">Todos</MenuItem>
                {produtoresFiltro.map(p => <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select label="Status" fullWidth size="small" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          {loading ? <CircularProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Edital</TableCell>
                    <TableCell>Produtor</TableCell>
                    <TableCell>Itens</TableCell>
                    <TableCell>Valor Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? items.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{p.numero || p.id}</Typography></TableCell>
                      <TableCell><Chip size="small" label={tipoLabels[p.tipoDocumento] || p.tipoDocumento} /></TableCell>
                      <TableCell>{p.edital.numero}/{p.edital.ano}</TableCell>
                      <TableCell>{p.produtor?.nome || '—'}</TableCell>
                      <TableCell>{p.itens.length}</TableCell>
                      <TableCell>{p.valorTotal ? `R$ ${Number(p.valorTotal).toFixed(2)}` : '—'}</TableCell>
                      <TableCell><Chip size="small" color={statusColors[p.status] || 'default'} label={statusLabels[p.status] || p.status} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Detalhes"><IconButton size="small" onClick={() => setDetailProposta(p)}><Visibility fontSize="small" /></IconButton></Tooltip>
                          {p.status !== 'CANCELADA' && <Button size="small" onClick={() => setDocumentosId(p.id)}>Anexos e declarações</Button>}
                          {podeElaborar && p.status === 'RASCUNHO' && (
                            <>
                              <Tooltip title="Gerar documentos"><IconButton size="small" color="primary" onClick={() => handleGenerate(p)}><Description fontSize="small" /></IconButton></Tooltip>
                              {user?.role === 'ADMIN' && <Tooltip title="Cancelar"><IconButton size="small" color="error" onClick={() => setConfirmDelete(p)}><Cancel fontSize="small" /></IconButton></Tooltip>}
                            </>
                          )}
                          {p.status === 'GERADA' && (
                            <>
                              <Tooltip title="Baixar PDF"><IconButton size="small" onClick={() => handleDownload(p.id, 'pdf')}><PictureAsPdf fontSize="small" /></IconButton></Tooltip>
                              <Tooltip title="Baixar DOCX"><IconButton size="small" onClick={() => handleDownload(p.id, 'docx')}><Download fontSize="small" /></IconButton></Tooltip>
                              {podeElaborar && <Tooltip title="Finalizar"><IconButton size="small" color="success" onClick={() => handleFinalize(p)}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
                            </>
                          )}
                          {p.status === 'FINALIZADA' && (
                            <>
                              <Tooltip title="Baixar PDF"><IconButton size="small" onClick={() => handleDownload(p.id, 'pdf')}><PictureAsPdf fontSize="small" /></IconButton></Tooltip>
                              <Tooltip title="Baixar DOCX"><IconButton size="small" onClick={() => handleDownload(p.id, 'docx')}><Download fontSize="small" /></IconButton></Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={8} align="center">Nenhuma proposta encontrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {totalPages > 1 && <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />}
        </CardContent>
      </Card>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nova Proposta</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField select label="Edital" fullWidth required value={form.editalId} onChange={e => setForm({ ...form, editalId: e.target.value, produtorId: '' })}>
                {editais.filter(e => e.status !== 'CANCELADO').map(e => (
                  <MenuItem key={e.id} value={e.id}>{e.numero}/{e.ano} — {e.titulo}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Produtor (com matches aprovados)" fullWidth required value={form.produtorId} onChange={e => setForm({ ...form, produtorId: e.target.value })} disabled={!form.editalId}>
                {produtores.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.nome} {p.cpfCnpj ? `— ${p.cpfCnpj}` : ''}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select label="Tipo de Documento" fullWidth value={form.tipoDocumento} onChange={e => setForm({ ...form, tipoDocumento: e.target.value })}>
                <MenuItem value="ANEXO_III">Anexo III — Fornecedor individual</MenuItem>
                <MenuItem value="PROJETO_VENDA">Projeto de Venda</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Validade (dias)" fullWidth type="number" value={form.validadeDias} onChange={e => setForm({ ...form, validadeDias: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Prazo de entrega (dias)" fullWidth type="number" value={form.prazoEntrega} onChange={e => setForm({ ...form, prazoEntrega: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Observações" fullWidth multiline rows={2} value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} />
            </Grid>
          </Grid>
          {form.editalId && form.produtorId && (
            <Stack sx={{ mt: 2 }}>
              <Button variant="outlined" disabled={previewLoading} onClick={() => handlePreview(form.editalId, form.produtorId, form.tipoDocumento)}>
                {previewLoading ? <CircularProgress size={20} /> : 'Pré-visualizar proposta'}
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCreate(false); setPreviewData(null); }}>Cancelar</Button>
          <Button variant="contained" disabled={!form.editalId || !form.produtorId} onClick={() => { if (previewData) handleCreate(); else handlePreview(form.editalId, form.produtorId, form.tipoDocumento); }}>
            {previewData ? 'Criar Proposta' : 'Visualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Pré-visualização — {previewData?.tipoDocumento === 'ANEXO_III' ? 'Anexo III' : 'Projeto de Venda'}</DialogTitle>
        <DialogContent>
          {previewData && (
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">DADOS DA LICITAÇÃO</Typography>
                  <Typography>Número: {previewData.edital.numero}/{previewData.edital.ano}</Typography>
                  <Typography>Objeto: {previewData.edital.objeto || previewData.edital.titulo}</Typography>
                  <Typography>Município: {previewData.edital.municipio?.nome}-{previewData.edital.municipio?.uf}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">DADOS DO PRODUTOR</Typography>
                  <Typography>Nome: {previewData.produtor.nome}</Typography>
                  <Typography>CPF/CNPJ: {previewData.produtor.cpfCnpj || '—'}</Typography>
                  <Typography>Telefone: {previewData.produtor.telefone || '—'}</Typography>
                  <Typography>Endereço: {previewData.produtor.endereco || '—'}</Typography>
                  <Typography>Município: {previewData.produtor.municipio?.nome}-{previewData.produtor.municipio?.uf}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>ITENS DA PROPOSTA</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Produto</TableCell>
                          <TableCell>Marca</TableCell>
                          <TableCell>Qtd.</TableCell>
                          <TableCell>Un.</TableCell>
                          <TableCell>Valor Unit.</TableCell>
                          <TableCell>Valor Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.itens.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>{item.produto}</TableCell>
                            <TableCell>{item.marca || '—'}</TableCell>
                            <TableCell><TextField type="number" size="small" label="Quantidade ofertada" value={item.quantidade ?? ''} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} onChange={e => {
                              const quantidade = Number(e.target.value);
                              const itens = previewData.itens.map((atual, index) => index === i ? { ...atual, quantidade, valorTotal: quantidade * Number(atual.precoUnitario || 0) } : atual);
                              setPreviewData({ ...previewData, itens, valorTotal: itens.reduce((sum, atual) => sum + Number(atual.valorTotal || 0), 0) });
                            }} /></TableCell>
                            <TableCell>{item.unidade || '—'}</TableCell>
                            <TableCell>{item.precoUnitario ? `R$ ${Number(item.precoUnitario).toFixed(2)}` : '—'}</TableCell>
                            <TableCell>{item.valorTotal ? `R$ ${Number(item.valorTotal).toFixed(2)}` : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" align="right">Total: R$ {previewData.valorTotal.toFixed(2)}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">CONDIÇÕES</Typography>
                  <Typography>Validade: {previewData.validadeDias} dias</Typography>
                  <Typography>Prazo de entrega: {previewData.prazoEntrega} dias</Typography>
                  {previewData.observacao && <Typography>Observações: {previewData.observacao}</Typography>}
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenPreview(false); setPreviewData(null); }}>Fechar</Button>
          <Button variant="contained" onClick={handleCreate}>Criar Proposta</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailProposta} onClose={() => setDetailProposta(null)} maxWidth="lg" fullWidth>
        <DialogTitle>Detalhes da Proposta — {detailProposta?.numero}</DialogTitle>
        <DialogContent>
          {detailProposta && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Tipo</Typography><Typography>{tipoLabels[detailProposta.tipoDocumento]}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Status</Typography><Chip color={statusColors[detailProposta.status]} label={statusLabels[detailProposta.status]} /></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Edital</Typography><Typography>{detailProposta.edital.numero}/{detailProposta.edital.ano}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Produtor</Typography><Typography>{detailProposta.produtor?.nome || '—'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary">Validade</Typography><Typography>{detailProposta.validadeDias} dias</Typography></Grid>
                <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary">Prazo Entrega</Typography><Typography>{detailProposta.prazoEntrega} dias</Typography></Grid>
                <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary">Valor Total</Typography><Typography fontWeight={700}>{detailProposta.valorTotal ? `R$ ${Number(detailProposta.valorTotal).toFixed(2)}` : '—'}</Typography></Grid>
              </Grid>
              <Divider />
              <Typography variant="subtitle2" color="text.secondary">ITENS</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell><TableCell>Produto</TableCell><TableCell>Marca</TableCell>
                      <TableCell>Qtd.</TableCell><TableCell>Un.</TableCell><TableCell>Valor Unit.</TableCell><TableCell>Valor Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailProposta.itens.map((item, i) => (
                      <TableRow key={item.id}>
                        <TableCell>{i + 1}</TableCell><TableCell>{item.produto}</TableCell><TableCell>{item.marca || '—'}</TableCell>
                        <TableCell>{item.quantidade || '—'}</TableCell><TableCell>{item.unidade || '—'}</TableCell>
                        <TableCell>{item.precoUnitario ? `R$ ${Number(item.precoUnitario).toFixed(2)}` : '—'}</TableCell>
                        <TableCell>{item.valorTotal ? `R$ ${Number(item.valorTotal).toFixed(2)}` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {detailProposta.observacao && <><Divider /><Typography variant="subtitle2" color="text.secondary">Observações</Typography><Typography>{detailProposta.observacao}</Typography></>}
              {(detailProposta.status === 'GERADA' || detailProposta.status === 'FINALIZADA') && (
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() => handleDownload(detailProposta.id, 'pdf')}>Baixar PDF</Button>
                  <Button size="small" startIcon={<Download />} onClick={() => handleDownload(detailProposta.id, 'docx')}>Baixar DOCX</Button>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailProposta(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <PropostaDocumentosDialog id={documentosId} readOnly={!podeElaborar} onClose={() => { setDocumentosId(null); void fetchItems(); }} onGenerated={() => { setSuccess('Projeto, anexos e declarações gerados em PDF e DOCX.'); void fetchItems(); }} />

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Confirmar cancelamento</DialogTitle>
        <DialogContent>
          <Typography>Deseja cancelar a proposta <strong>{confirmDelete?.numero}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Voltar</Button>
          <Button color="error" variant="contained" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Cancelar Proposta</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
