import { Alert, Autocomplete, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Autorenew, Edit, FactCheck, Lock, UploadFile, Visibility } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse, Importacao, PaginationResponse } from '../types';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function statusColor(status: string): 'default' | 'warning' | 'success' | 'error' | 'info' {
  if (status === 'CONFIRMADO' || status === 'PROCESSADO') return 'success';
  if (status === 'PENDENTE_CONFERENCIA') return 'warning';
  if (status === 'ERRO') return 'error';
  if (status === 'PROCESSANDO') return 'info';
  return 'default';
}

interface EditForm {
  numero: string;
  ano: number | string;
  titulo: string;
  descricao: string;
  objeto: string;
  escolaId: string;
  municipioId: string;
}

export default function ImportacoesPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Importacao | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ numero: '', ano: '', titulo: '', descricao: '', objeto: '', escolaId: '', municipioId: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['importacoes'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginationResponse<Importacao>>>('/importacoes?limit=50');
      return response.data.data;
    },
  });

  const { data: escolasData } = useQuery({
    queryKey: ['escolas-options'],
    queryFn: async () => {
      const { data } = await api.get('/escolas?limit=500');
      return (data.data?.items ?? data.data ?? []).map((e: any) => ({ label: e.nome, value: e.id }));
    },
    enabled: editOpen,
  });

  const { data: municipiosData } = useQuery({
    queryKey: ['municipios-options'],
    queryFn: async () => {
      const { data } = await api.get('/municipios?limit=200');
      return (data.data?.items ?? data.data ?? []).map((m: any) => ({ label: m.nome, value: m.id }));
    },
    enabled: editOpen,
  });

  const processar = async (id: string) => {
    await api.post(`/importacoes/${id}/processar`, { reprocessar: true });
    await refetch();
  };

  const openEdit = (item: Importacao) => {
    setEditItem(item);
    setEditForm({
      numero: item.numeroExtraido || item.edital?.numero || '',
      ano: item.anoExtraido || item.edital?.ano || '',
      titulo: item.tituloExtraido || item.edital?.titulo || '',
      descricao: item.edital?.descricao || '',
      objeto: item.objeto || item.edital?.objeto || '',
      escolaId: item.edital?.escola?.id || '',
      municipioId: item.edital?.municipio?.id || '',
    });
    setEditError('');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setEditSaving(true);
    setEditError('');
    try {
      await api.patch(`/importacoes/${editItem.id}`, {
        numero: editForm.numero || undefined,
        ano: editForm.ano ? Number(editForm.ano) : undefined,
        titulo: editForm.titulo || undefined,
        descricao: editForm.descricao || undefined,
        objeto: editForm.objeto || undefined,
        escolaId: editForm.escolaId || undefined,
        municipioId: editForm.municipioId || undefined,
      });
      setEditOpen(false);
      setEditItem(null);
      await refetch();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Falha ao salvar alterações.');
    } finally {
      setEditSaving(false);
    }
  };

  const escolas = escolasData ?? [];
  const municipios = municipiosData ?? [];

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight={700}>Lista de Importações</Typography>
          <Typography variant="body1" color="text.secondary">
            PDFs em `docs` entram automaticamente na fila e uploads manuais passam pelo mesmo fluxo.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Autorenew />} onClick={() => void refetch()} disabled={isRefetching}>
            Atualizar
          </Button>
          <Button component={RouterLink} to="/importacoes/importar" variant="contained" startIcon={<UploadFile />}>
            Importar Edital
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">Não foi possível carregar as importações.</Alert> : null}

      <Card>
        <CardContent>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Arquivo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Itens</TableCell>
                  <TableCell>Escola</TableCell>
                  <TableCell>Município</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.items ?? []).map((item) => {
                  const isConfirmado = item.status === 'CONFIRMADO';
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{item.arquivoNome}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.tituloExtraido || item.edital?.titulo || 'Aguardando leitura do PDF'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color={statusColor(item.status)} label={item.status} />
                      </TableCell>
                      <TableCell>{item.quantidadeItens || item.edital?.itens?.length || 0}</TableCell>
                      <TableCell>{item.escolaNome || item.edital?.escola?.nome || 'Não informada'}</TableCell>
                      <TableCell>{item.municipioNome || item.edital?.municipio?.nome || '-'}</TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button component={RouterLink} to={`/importacoes/${item.id}`} size="small" startIcon={<Visibility />}>
                            Detalhes
                          </Button>
                          <Button component={RouterLink} to={`/importacoes/${item.id}/conferencia`} size="small" startIcon={<FactCheck />} disabled={isConfirmado}>
                            Conferir
                          </Button>
                          {isConfirmado ? (
                            <Chip size="small" icon={<Lock />} label="Confirmado" color="success" variant="outlined" />
                          ) : (
                            <>
                              <Button size="small" startIcon={<Edit />} onClick={() => openEdit(item)}>
                                Editar
                              </Button>
                              <Button size="small" onClick={() => void processar(item.id)}>
                                Processar
                              </Button>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data?.items?.length ? (
                  <TableRow>
                    <TableCell colSpan={7}>Nenhuma importação encontrada.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Editar Edital — {editItem?.arquivoNome}
        </DialogTitle>
        <DialogContent>
          {editError ? <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{editError}</Alert> : null}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Número"
                fullWidth
                size="small"
                value={editForm.numero}
                onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Ano"
                fullWidth
                size="small"
                type="number"
                value={editForm.ano}
                onChange={(e) => setEditForm({ ...editForm, ano: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                label="Título"
                fullWidth
                size="small"
                value={editForm.titulo}
                onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Descrição"
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={editForm.descricao}
                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Objeto"
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={editForm.objeto}
                onChange={(e) => setEditForm({ ...editForm, objeto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={escolas}
                getOptionLabel={(opt) => opt.label || ''}
                isOptionEqualToValue={(opt, val) => opt.value === val}
                value={escolas.find((o: any) => o.value === editForm.escolaId) || null}
                onChange={(_, val) => setEditForm({ ...editForm, escolaId: val?.value ?? '' })}
                renderInput={(params) => <TextField {...params} label="Escola" size="small" placeholder="Digite para buscar..." />}
                noOptionsText="Nenhuma escola encontrada"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={municipios}
                getOptionLabel={(opt) => opt.label || ''}
                isOptionEqualToValue={(opt, val) => opt.value === val}
                value={municipios.find((o: any) => o.value === editForm.municipioId) || null}
                onChange={(_, val) => setEditForm({ ...editForm, municipioId: val?.value ?? '' })}
                renderInput={(params) => <TextField {...params} label="Município" size="small" placeholder="Digite para buscar..." />}
                noOptionsText="Nenhum município encontrado"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void saveEdit()} disabled={editSaving}>
            {editSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
