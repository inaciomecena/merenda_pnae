import { Alert, Autocomplete, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, CircularProgress, Pagination } from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';

interface CrudPageProps<TItem, TForm> {
  title: string;
  endpoint: string;
  fields: Array<{
    name: keyof TForm;
    label: string;
    type?: 'text' | 'number' | 'select' | 'autocomplete';
    options?: Array<{ label: string; value: string }>;
    fetchOptions?: () => Promise<Array<{ label: string; value: string }>>;
  }>;
  renderRow: (item: TItem) => React.ReactNode;
  emptyLabel?: string;
  initialValues: TForm;
  mapToPayload?: (values: TForm) => any;
  getItemLabel?: (item: TItem) => string;
  headerAction?: React.ReactNode;
}

export function CrudPage<TItem extends { id: string }, TForm extends Record<string, any>>({ title, endpoint, fields, renderRow, emptyLabel = 'Nenhum registro encontrado.', initialValues, mapToPayload, headerAction }: CrudPageProps<TItem, TForm>) {
  const [items, setItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TItem | null>(null);
  const [form, setForm] = useState<TForm>(initialValues);
  const [confirmDelete, setConfirmDelete] = useState<TItem | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, Array<{ label: string; value: string }>>>({});

  const fetchDynamicOptions = async () => {
    const newOptions: Record<string, Array<{ label: string; value: string }>> = {};
    for (const field of fields) {
      if (field.fetchOptions) {
        newOptions[String(field.name)] = await field.fetchOptions();
      }
    }
    setDynamicOptions(newOptions);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<PaginationResponse<TItem>>>(`${endpoint}?page=${page}&limit=10`);
      const payload = data.data;
      setItems(payload.items ?? []);
      setTotalPages(payload.totalPages ?? 1);
    } catch {
      setError('Não foi possível carregar os registros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchItems(); }, [page]);

  useEffect(() => {
    if (open) void fetchDynamicOptions();
  }, [open]);

  const submit = async () => {
    try {
      const payload = mapToPayload ? mapToPayload(form) : form;
      if (editing) {
        await api.patch(`${endpoint}/${editing.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setOpen(false);
      setForm(initialValues);
      setEditing(null);
      void fetchItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao salvar');
    }
  };

  const remove = async (item: TItem) => {
    if (!item?.id) {
      setError('Registro inválido — ID não encontrado.');
      return;
    }
    try {
      await api.delete(`${endpoint}/${item.id}`);
      setConfirmDelete(null);
      void fetchItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao excluir');
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>{title}</Typography>
        <Stack direction="row" spacing={1}>{headerAction}<Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm(initialValues); setOpen(true); }}>Novo</Button></Stack>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <CardContent>
          {loading ? <CircularProgress /> : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Registro</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length ? items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{renderRow(item)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => { setEditing(item); setForm(item as unknown as TForm); setOpen(true); }}><Edit /></IconButton>
                        <IconButton onClick={() => setConfirmDelete(item)}><Delete /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={2}>{emptyLabel}</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 ? <Pagination count={totalPages} page={page - 1} onChange={(_, value) => setPage(value + 1)} sx={{ mt: 2 }} /> : null}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Editar' : 'Novo'} {title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {fields.map((field) => (
              <Grid item xs={12} md={6} key={String(field.name)}>
                {field.type === 'autocomplete' || (field.fetchOptions && field.type !== 'select') ? (
                  <Autocomplete
                    options={dynamicOptions[String(field.name)] || field.options || []}
                    getOptionLabel={(option) => option.label || ''}
                    isOptionEqualToValue={(option, value) => option.value === value}
                    value={
                      (dynamicOptions[String(field.name)] || field.options || []).find(
                        (opt) => opt.value === form[field.name]
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setForm({ ...form, [field.name]: newValue?.value ?? '' });
                    }}
                    renderInput={(params) => <TextField {...params} label={field.label} placeholder="Digite para buscar..." />}
                    noOptionsText="Nenhuma opção encontrada"
                  />
                ) : field.type === 'select' || field.fetchOptions ? (
                  <TextField select label={field.label} fullWidth value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
                    {(dynamicOptions[String(field.name)] || field.options || []).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                ) : (
                  <TextField label={field.label} fullWidth value={form[field.name] ?? ''} type={field.type === 'number' ? 'number' : 'text'} onChange={(e) => setForm({ ...form, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })} />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submit}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <Typography>Deseja realmente excluir este registro?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button color="error" onClick={() => confirmDelete && remove(confirmDelete)}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
