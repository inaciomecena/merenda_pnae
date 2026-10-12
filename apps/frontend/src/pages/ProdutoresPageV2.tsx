import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Agriculture, Delete, Edit } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type MunicipioOption = { label: string; value: string };

type Produtor = {
  id: string;
  nome: string;
  cpfCnpj?: string | null;
  municipioId: string;
  telefone?: string | null;
  endereco?: string | null;
  active: boolean;
  dadosDocumentais?: Record<string, string> | null;
  municipio?: { nome: string; uf: string } | null;
};

type ProdutoProdutor = {
  id: string;
  produto: string;
  capacidade?: string | null;
  unidade?: string | null;
  periodoProducao?: string | null;
  precoSugerido?: number | string | null;
};

const produtorInicial = { nome: '', cpfCnpj: '', municipioId: '', telefone: '', endereco: '', dadosDocumentais: {} as Record<string, string> };
const produtoInicial = { produto: '', capacidade: '', unidade: 'KG', periodoProducao: 'Ano todo', precoSugerido: '' };

export default function ProdutoresPageV2() {
  const navigate = useNavigate();
  const { user, context } = useAuth();
  const canEdit = (id: string) => user?.role === 'ADMIN' || user?.role === 'PRODUTOR' || Boolean(context?.representacoes.some(r => r.produtor.id === id && r.permissoes.split(',').includes('EDITAR_PRODUTOR')));
  const [camposDocumentais, setCamposDocumentais] = useState<Array<{ chave: string; rotulo: string }>>([]);
  useEffect(() => { api.get('/produtores/campos-documentais').then(({ data }) => setCamposDocumentais(data.data)).catch(() => setError('Não foi possível carregar os campos dos anexos.')); }, []);
  const [items, setItems] = useState<Produtor[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produtor | null>(null);
  const [form, setForm] = useState(produtorInicial);
  const [confirmDelete, setConfirmDelete] = useState<Produtor | null>(null);
  const [produtosOpen, setProdutosOpen] = useState(false);
  const [produtorSelecionado, setProdutorSelecionado] = useState<Produtor | null>(null);
  const [produtos, setProdutos] = useState<ProdutoProdutor[]>([]);
  const [produtoForm, setProdutoForm] = useState(produtoInicial);
  const [produtoEditing, setProdutoEditing] = useState<ProdutoProdutor | null>(null);

  const fetchMunicipios = async () => {
    try {
      const { data } = await api.get<ApiResponse<PaginationResponse<any>>>('/municipios?limit=200');
      setMunicipios((data.data.items ?? []).map((m: any) => ({ label: `${m.nome} - ${m.uf}`, value: m.id })));
    } catch {
      setMunicipios([]);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<ApiResponse<PaginationResponse<Produtor>>>(`/produtores?page=${page}&limit=10`);
      setItems(data.data.items ?? []);
      setTotalPages(data.data.totalPages ?? 1);
    } catch {
      setError('Não foi possível carregar os produtores.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProdutos = async (produtorId: string) => {
    const { data } = await api.get<ApiResponse<ProdutoProdutor[]>>(`/produtores/${produtorId}/produtos`);
    setProdutos(data.data ?? []);
  };

  useEffect(() => { void fetchItems(); }, [page]);
  useEffect(() => { void fetchMunicipios(); }, []);

  const submit = async () => {
    setError('');
    try {
      if (editing) await api.patch(`/produtores/${editing.id}`, form);
      else await api.post('/produtores', form);
      setOpen(false);
      setSuccess('Produtor salvo com sucesso.');
      await fetchItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao salvar produtor.');
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/produtores/${confirmDelete.id}`);
      setConfirmDelete(null);
      setSuccess('Produtor removido com sucesso.');
      await fetchItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao remover produtor.');
    }
  };

  const openProdutos = async (produtor: Produtor) => {
    setProdutorSelecionado(produtor);
    setProdutoEditing(null);
    setProdutoForm(produtoInicial);
    setProdutosOpen(true);
    await fetchProdutos(produtor.id);
  };

  const editProduto = (item: ProdutoProdutor) => {
    setProdutoEditing(item);
    setProdutoForm({
      produto: item.produto ?? '',
      capacidade: item.capacidade ?? '',
      unidade: item.unidade ?? 'KG',
      periodoProducao: item.periodoProducao ?? '',
      precoSugerido: item.precoSugerido ? String(item.precoSugerido) : '',
    });
  };

  const submitProduto = async () => {
    if (!produtorSelecionado) return;
    setError('');
    const payload = {
      ...produtoForm,
      precoSugerido: produtoForm.precoSugerido === '' ? undefined : Number(produtoForm.precoSugerido),
    };
    try {
      if (produtoEditing) await api.patch(`/produtores/${produtorSelecionado.id}/produtos/${produtoEditing.id}`, payload);
      else await api.post(`/produtores/${produtorSelecionado.id}/produtos`, payload);
      setProdutoEditing(null);
      setProdutoForm(produtoInicial);
      await fetchProdutos(produtorSelecionado.id);
      setSuccess('Produto do produtor salvo com período de produção.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao salvar produto produzido.');
    }
  };

  const removeProduto = async (produtoId: string) => {
    if (!produtorSelecionado) return;
    await api.delete(`/produtores/${produtorSelecionado.id}/produtos/${produtoId}`);
    await fetchProdutos(produtorSelecionado.id);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...produtorInicial, municipioId: user?.role === 'EXTENSIONISTA' ? user.municipioId || '' : '' });
    setOpen(true);
  };

  const openEdit = (item: Produtor) => {
    setEditing(item);
    setForm({
      nome: item.nome ?? '',
      cpfCnpj: item.cpfCnpj ?? '',
      municipioId: item.municipioId ?? '',
      telefone: item.telefone ?? '',
      endereco: item.endereco ?? '',
      dadosDocumentais: item.dadosDocumentais || {},
    });
    setOpen(true);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>Produtores</Typography>
        {user?.role === 'ADMIN' && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Novo</Button>}
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {success ? <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert> : null}

      <Card>
        <CardContent>
          {loading ? <CircularProgress /> : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produtor</TableCell>
                  <TableCell>Município</TableCell>
                  <TableCell>Contato</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length ? items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{item.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.cpfCnpj || 'Sem CPF/CNPJ'}</Typography>
                    </TableCell>
                    <TableCell>{item.municipio ? `${item.municipio.nome} - ${item.municipio.uf}` : '-'}</TableCell>
                    <TableCell>{item.telefone || '-'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => navigate(`/propostas?produtorId=${item.id}`)}>Projetos e declarações</Button>
                        <Button size="small" startIcon={<Agriculture />} onClick={() => void openProdutos(item)}>Produtos</Button>
                        {canEdit(item.id) && <IconButton onClick={() => openEdit(item)}><Edit /></IconButton>}
                        {user?.role === 'ADMIN' && <IconButton onClick={() => setConfirmDelete(item)}><Delete /></IconButton>}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4}>Nenhum registro encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 ? <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} sx={{ mt: 2 }} /> : null}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Editar produtor' : 'Novo produtor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {error && <Grid item xs={12}><Alert severity="error">{Array.isArray(error) ? error.join(' ') : error}</Alert></Grid>}
            <Grid item xs={12} md={6}><TextField label="Nome" fullWidth value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField label="CPF/CNPJ" fullWidth value={form.cpfCnpj} onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Município" fullWidth disabled={user?.role === 'EXTENSIONISTA'} value={form.municipioId} onChange={(e) => setForm({ ...form, municipioId: e.target.value })}>
                {municipios.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField label="Telefone" fullWidth value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Endereco" fullWidth value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></Grid>
          </Grid>
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Dados para projetos, anexos e declarações</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Preencha os campos aplicáveis ao fornecedor. Esses dados serão reutilizados pelo extensionista na elaboração dos documentos.</Typography>
          <Grid container spacing={2}>
            {camposDocumentais.map(c => <Grid item xs={12} md={6} key={c.chave}><TextField label={c.rotulo} fullWidth multiline={c.chave.startsWith('grupo.')} value={form.dadosDocumentais[c.chave] || ''} onChange={e => setForm({ ...form, dadosDocumentais: { ...form.dadosDocumentais, [c.chave]: e.target.value } })} /></Grid>)}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void submit()}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={produtosOpen} onClose={() => setProdutosOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Produtos produzidos - {produtorSelecionado?.nome}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Registre a sazonalidade no campo Período de produção. Exemplos: ano todo, jan.–mar., abr.–jul., safra das águas ou entressafra.
          </Alert>
          {produtorSelecionado && canEdit(produtorSelecionado.id) && <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}><TextField label="Produto" fullWidth value={produtoForm.produto} onChange={(e) => setProdutoForm({ ...produtoForm, produto: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField label="Capacidade" fullWidth value={produtoForm.capacidade} onChange={(e) => setProdutoForm({ ...produtoForm, capacidade: e.target.value })} /></Grid>
            <Grid item xs={12} md={1.5}><TextField label="Unidade" fullWidth value={produtoForm.unidade} onChange={(e) => setProdutoForm({ ...produtoForm, unidade: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField label="Período de produção" fullWidth value={produtoForm.periodoProducao} onChange={(e) => setProdutoForm({ ...produtoForm, periodoProducao: e.target.value })} /></Grid>
            <Grid item xs={12} md={1.5}><TextField label="Preco sugerido" type="number" fullWidth value={produtoForm.precoSugerido} onChange={(e) => setProdutoForm({ ...produtoForm, precoSugerido: e.target.value })} /></Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="contained" sx={{ height: '100%' }} onClick={() => void submitProduto()} disabled={!produtoForm.produto}>
                {produtoEditing ? 'Atualizar' : 'Adicionar'}
              </Button>
            </Grid>
          </Grid>}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell>Capacidade</TableCell>
                <TableCell>Período</TableCell>
                <TableCell>Preco</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {produtos.length ? produtos.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.produto}</TableCell>
                  <TableCell>{item.capacidade || '-'} {item.unidade || ''}</TableCell>
                  <TableCell><Chip size="small" color={item.periodoProducao ? 'success' : 'warning'} label={item.periodoProducao || 'Não informado'} /></TableCell>
                  <TableCell>{item.precoSugerido ? `R$ ${Number(item.precoSugerido).toFixed(2)}` : '-'}</TableCell>
                  <TableCell align="right">
                    {produtorSelecionado && canEdit(produtorSelecionado.id) && <IconButton onClick={() => editProduto(item)}><Edit /></IconButton>}
                    {produtorSelecionado && canEdit(produtorSelecionado.id) && <IconButton color="error" onClick={() => void removeProduto(item.id)}><Delete /></IconButton>}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5}>Nenhum produto cadastrado para este produtor.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProdutosOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Confirmar exclusao</DialogTitle>
        <DialogContent>
          <Typography>Deseja realmente excluir este produtor?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => void remove()}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
