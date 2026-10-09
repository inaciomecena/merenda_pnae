import { Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, List, ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Add, Autorenew, Close, Edit, FactCheck, Lock, PictureAsPdf, School, UploadFile, Visibility } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

interface Option { label: string; value: string; nome?: string }

interface EditForm {
  numero: string;
  ano: number | string;
  titulo: string;
  descricao: string;
  objeto: string;
  escolaIds: string[];
  municipioId: string;
}

export default function ImportacoesPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Importacao | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ numero: '', ano: '', titulo: '', descricao: '', objeto: '', escolaIds: [], municipioId: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [pendingMunicipioNome, setPendingMunicipioNome] = useState('');
  const [escolaSearch, setEscolaSearch] = useState('');
  const [selectedEscolaToAdd, setSelectedEscolaToAdd] = useState<Option | null>(null);
  const [vinculadas, setVinculadas] = useState<Array<{ id: string; nome: string }>>([]);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['importacoes'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginationResponse<Importacao>>>('/importacoes?limit=50');
      return response.data.data;
    },
  });

  const { data: escolasData } = useQuery({
    queryKey: ['escolas-options', editForm.municipioId, escolaSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '500' });
      params.set('municipioId', editForm.municipioId);
      if (escolaSearch) params.set('search', escolaSearch);
      const { data } = await api.get(`/escolas?${params.toString()}`);
      return (data.data?.items ?? data.data ?? []).map((e: any) => ({
        label: e.municipio?.nome ? `${e.municipio.nome} — ${e.nome}` : e.nome,
        nome: e.nome,
        value: e.id,
      }));
    },
    enabled: editOpen && !!editForm.municipioId,
  });

  const { data: municipiosData } = useQuery({
    queryKey: ['municipios-options'],
    queryFn: async () => {
      const { data } = await api.get('/municipios?limit=200');
      return (data.data?.items ?? data.data ?? []).map((m: any) => ({ label: m.nome, value: m.id }));
    },
    enabled: editOpen,
  });

  useEffect(() => {
    if (!editOpen || !municipiosData) return;
    if (editForm.municipioId) return;
    if (!pendingMunicipioNome) return;

    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const target = normalize(pendingMunicipioNome);
    const match = municipiosData.find((m: Option) => normalize(m.label) === target)
      || municipiosData.find((m: Option) => normalize(m.label).includes(target) || target.includes(normalize(m.label)));

    if (match) {
      setEditForm((prev) => ({ ...prev, municipioId: match.value }));
    }
  }, [editOpen, municipiosData, editForm.municipioId, pendingMunicipioNome]);

  const processar = async (id: string) => {
    await api.post(`/importacoes/${id}/processar`, { reprocessar: true });
    await refetch();
  };

  const verPdf = async (item: Importacao) => {
    try {
      const token = localStorage.getItem('seaf_token');
      const response = await api.get(`/importacoes/${item.id}/pdf`, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      alert('Não foi possível carregar o PDF.');
    }
  };

  const getEscolasVinculadas = (item: Importacao): string[] => {
    const vinc = item.edital?.escolasVinculadas ?? [];
    if (vinc.length > 0) return vinc.map((ev) => ev.escola.nome);
    if (item.edital?.escola?.nome) return [item.edital.escola.nome];
    if (item.escolaNome) return [item.escolaNome];
    return [];
  };

  const openEdit = (item: Importacao) => {
    const vinc = item.edital?.escolasVinculadas ?? [];
    const munNome = item.municipioNome || item.edital?.municipio?.nome || '';
    const withMun = (nome: string) => (munNome ? `${munNome} — ${nome}` : nome);
    let escolaIds: string[];
    let vincList: Array<{ id: string; nome: string }>;

    if (vinc.length > 0) {
      escolaIds = vinc.map((ev) => ev.escola.id);
      vincList = vinc.map((ev) => ({
        id: ev.escola.id,
        nome: ev.escola.municipio?.nome ? `${ev.escola.municipio.nome} — ${ev.escola.nome}` : withMun(ev.escola.nome),
      }));
    } else if (item.edital?.escola?.id) {
      escolaIds = [item.edital.escola.id];
      vincList = [{ id: item.edital.escola.id, nome: withMun(item.edital.escola.nome) }];
    } else {
      escolaIds = [];
      vincList = [];
    }

    setEditItem(item);
    setEditForm({
      numero: item.numeroExtraido || item.edital?.numero || '',
      ano: item.anoExtraido || item.edital?.ano || '',
      titulo: item.tituloExtraido || item.edital?.titulo || '',
      descricao: item.edital?.descricao || '',
      objeto: item.objeto || item.edital?.objeto || '',
      escolaIds,
      municipioId: item.edital?.municipio?.id || '',
    });
    setVinculadas(vincList);
    setPendingMunicipioNome(item.municipioNome || item.edital?.municipio?.nome || '');
    setSelectedEscolaToAdd(null);
    setEscolaSearch('');
    setEditError('');
    setEditOpen(true);
  };

  const vincularEscola = () => {
    if (!selectedEscolaToAdd) return;
    if (vinculadas.some((v) => v.id === selectedEscolaToAdd.value)) return;
    setVinculadas([...vinculadas, { id: selectedEscolaToAdd.value, nome: selectedEscolaToAdd.label }]);
    setSelectedEscolaToAdd(null);
    setEscolaSearch('');
  };

  const desvincularEscola = (escolaId: string) => {
    setVinculadas(vinculadas.filter((v) => v.id !== escolaId));
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
        escolaIds: vinculadas.map((v) => v.id),
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

  const escolas: Option[] = (escolasData ?? []).filter(
    (o: Option) => !vinculadas.some((v) => v.id === o.value)
  );
  const municipios: Option[] = municipiosData ?? [];

  const closeEdit = () => {
    setEditOpen(false);
    setEditItem(null);
    setPendingMunicipioNome('');
    setEscolaSearch('');
    setSelectedEscolaToAdd(null);
    setVinculadas([]);
    setEditError('');
  };

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
                  <TableCell>Escolas</TableCell>
                  <TableCell>Município</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.items ?? []).map((item) => {
                  const isConfirmado = item.status === 'CONFIRMADO';
                  const escolasRow = getEscolasVinculadas(item);
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
                      <TableCell>
                        {escolasRow.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {escolasRow.map((nome, idx) => (
                              <Chip key={idx} size="small" label={nome} icon={<School />} sx={{ mb: 0.5 }} />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Não informada</Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.municipioNome || item.edital?.municipio?.nome || '-'}</TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button size="small" startIcon={<PictureAsPdf />} onClick={() => void verPdf(item)}>
                            PDF
                          </Button>
                          <Button component={RouterLink} to={`/importacoes/${item.id}`} size="small" startIcon={<Visibility />}>
                            Detalhes
                          </Button>
                          <Button component={RouterLink} to={`/importacoes/${item.id}/estrutura`} size="small">Estrutura</Button>
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

      <Dialog open={editOpen} onClose={closeEdit} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Edit color="primary" />
            <Typography variant="h6" fontWeight={700}>Editar Edital</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {editItem?.arquivoNome}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {editError ? <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert> : null}

          {/* Seção: Dados do Edital */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="primary" fontWeight={600} sx={{ display: 'block', mb: 1.5 }}>
              Dados do Edital
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label="Número"
                  fullWidth
                  size="small"
                  value={editForm.numero}
                  onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={2} md={1}>
                <TextField
                  label="Ano"
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm.ano}
                  onChange={(e) => setEditForm({ ...editForm, ano: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={9}>
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
                  minRows={3}
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
                  minRows={3}
                  value={editForm.objeto}
                  onChange={(e) => setEditForm({ ...editForm, objeto: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Seção: Localização */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="primary" fontWeight={600} sx={{ display: 'block', mb: 1.5 }}>
              Localização
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={municipios}
                  getOptionLabel={(opt) => opt.label || ''}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                  value={municipios.find((o) => o.value === editForm.municipioId) || null}
                  onChange={(_, val) => {
                    setEditForm({ ...editForm, municipioId: val?.value ?? '' });
                    setEscolaSearch('');
                    setSelectedEscolaToAdd(null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Município"
                      size="small"
                      placeholder="Digite para buscar..."
                      helperText={!editForm.municipioId && pendingMunicipioNome ? `Nome extraído do PDF: "${pendingMunicipioNome}"` : undefined}
                    />
                  )}
                  noOptionsText="Nenhum município encontrado"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Seção: Vincular Escolas */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
              <School fontSize="small" /> Escolas Vinculadas
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <Autocomplete
                options={escolas}
                getOptionLabel={(opt) => opt.label || ''}
                isOptionEqualToValue={(opt, val) => opt.value === val.value}
                value={selectedEscolaToAdd}
                onChange={(_, val) => setSelectedEscolaToAdd(val)}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input') setEscolaSearch(value);
                }}
                disabled={!editForm.municipioId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar escola"
                    size="small"
                    placeholder={editForm.municipioId ? 'Digite o nome da escola...' : 'Selecione primeiro o município'}
                    helperText={editForm.municipioId
                      ? `Somente escolas de: ${municipios.find((m) => m.value === editForm.municipioId)?.label || ''}`
                      : 'Escolha o município acima para listar as escolas'}
                  />
                )}
                noOptionsText={editForm.municipioId
                  ? `Nenhuma escola encontrada neste município${escolaSearch ? ` para "${escolaSearch}"` : ''}`
                  : 'Selecione o município primeiro'}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={vincularEscola}
                disabled={!selectedEscolaToAdd}
                sx={{ whiteSpace: 'nowrap', height: 40 }}
              >
                Vincular
              </Button>
            </Stack>

            {vinculadas.length > 0 ? (
              <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    {vinculadas.length} escola(s) vinculada(s):
                  </Typography>
                  <List dense disablePadding>
                    {vinculadas.map((escola, idx) => (
                      <ListItem
                        key={escola.id}
                        disableGutters
                        divider={idx < vinculadas.length - 1}
                        sx={{ py: 0.5 }}
                        secondaryAction={
                          <IconButton edge="end" size="small" onClick={() => desvincularEscola(escola.id)} title="Desvincular">
                            <Close fontSize="small" color="error" />
                          </IconButton>
                        }
                      >
                        <School fontSize="small" color="primary" sx={{ mr: 1 }} />
                        <ListItemText
                          primary={<Typography variant="body2">{escola.nome}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ py: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1, border: '1px dashed', borderColor: 'grey.300' }}>
                <School sx={{ color: 'grey.400', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Nenhuma escola vinculada ainda.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeEdit} variant="outlined">Cancelar</Button>
          <Button variant="contained" onClick={() => void saveEdit()} disabled={editSaving}>
            {editSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
