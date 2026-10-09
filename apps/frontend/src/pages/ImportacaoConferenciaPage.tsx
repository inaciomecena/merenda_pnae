import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { FactCheck, Save } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse, Importacao, ImportacaoItem } from '../types';

interface EditableItem extends ImportacaoItem {}

function formatCurrencyInput(value?: number | string | null): string {
  if (value == null || value === '') return '';
  const num = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (isNaN(num)) return '';
  const formatted = num.toFixed(2);
  const [intPart, decPart] = formatted.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intFormatted},${decPart}`;
}

function parseCurrencyInput(value: string): number | null {
  if (!value.trim()) return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function formatCurrency(value?: number | null): string {
  if (value == null || isNaN(value)) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ItemCard({ item, index, onUpdate, onUpdateCurrency }: {
  item: EditableItem;
  index: number;
  onUpdate: (id: string, field: keyof EditableItem, value: string) => void;
  onUpdateCurrency: (id: string, field: 'precoUnitario' | 'valorTotal', value: string) => void;
}) {
  const needsReview = item.status === 'PENDENTE_CONFERENCIA';

  return (
    <Card
      sx={{
        mb: 1.5,
        border: needsReview ? '2px solid' : '1px solid',
        borderColor: needsReview ? 'warning.main' : 'divider',
        bgcolor: needsReview ? 'warning.50' : 'background.paper',
        transition: 'all 0.2s',
        '&:hover': { boxShadow: 2 },
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={`#${item.numeroItem || index + 1}`}
                size="small"
                color={needsReview ? 'warning' : 'default'}
                sx={{ fontWeight: 600, minWidth: 48 }}
              />
              <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
                {item.produtoOriginal}
              </Typography>
              {needsReview ? (
                <Chip label="Revisar" size="small" color="warning" variant="outlined" />
              ) : (
                <Chip label="OK" size="small" color="success" variant="outlined" />
              )}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Produto"
              value={item.produtoOriginal}
              onChange={(e) => onUpdate(item.id, 'produtoOriginal', e.target.value)}
              sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Especificação"
              value={item.especificacao || ''}
              onChange={(e) => onUpdate(item.id, 'especificacao', e.target.value)}
              multiline
              minRows={2}
              maxRows={4}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              label="Quantidade"
              type="number"
              value={item.quantidade ?? ''}
              onChange={(e) => onUpdate(item.id, 'quantidade', e.target.value)}
              inputProps={{ min: 0, step: '0.01' }}
              sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              label="Unidade"
              value={item.unidade ?? ''}
              onChange={(e) => onUpdate(item.id, 'unidade', e.target.value)}
              sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              label="Preço Unit."
              type="text"
              inputMode="decimal"
              value={formatCurrencyInput(item.precoUnitario)}
              onChange={(e) => onUpdateCurrency(item.id, 'precoUnitario', e.target.value)}
              placeholder="0,00"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Valor Total:
              </Typography>
              <TextField
                size="small"
                type="text"
                inputMode="decimal"
                value={formatCurrencyInput(item.valorTotal)}
                onChange={(e) => onUpdateCurrency(item.id, 'valorTotal', e.target.value)}
                placeholder="0,00"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                sx={{ width: 140, '& .MuiInputBase-input': { py: 0.5, fontWeight: 600 } }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function ImportacaoConferenciaPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<EditableItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['importacao-conferencia', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Importacao>>(`/importacoes/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    setItems(data?.edital?.itens ?? []);
  }, [data]);

  const updateItem = (itemId: string, field: keyof EditableItem, value: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]:
                field === 'quantidade' || field === 'precoUnitario' || field === 'valorTotal'
                  ? value === ''
                    ? null
                    : Number(value)
                  : value,
            }
          : item,
      ),
    );
  };

  const updateCurrencyItem = (itemId: string, field: 'precoUnitario' | 'valorTotal', value: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, [field]: parseCurrencyInput(value) }
          : item,
      ),
    );
  };

  const confirmar = async () => {
    setSaving(true);
    setError('');

    try {
      await api.post(`/importacoes/${id}/confirmar`, {
        itens: items.map((item) => ({
          id: item.id,
          produtoOriginal: item.produtoOriginal,
          especificacao: item.especificacao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          precoUnitario: item.precoUnitario,
          valorTotal: item.valorTotal,
          observacoes: item.observacoes,
        })),
      });

      navigate(`/importacoes/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Não foi possível confirmar os itens.');
    } finally {
      setSaving(false);
    }
  };

  const totalGeral = items.reduce((sum, item) => sum + (item.valorTotal || 0), 0);
  const pendentes = items.filter((item) => item.status === 'PENDENTE_CONFERENCIA').length;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight={700}>Tela de Conferência dos Itens</Typography>
          <Typography variant="body1" color="text.secondary">
            Revise produto, quantidade, unidade e valores antes da confirmação final.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to={`/importacoes/${id}`} variant="outlined">
            Voltar
          </Button>
          <Button component={RouterLink} to={`/importacoes/${id}/estrutura`} variant="outlined">
            Estrutura do documento
          </Button>
          <Button variant="contained" startIcon={<Save />} onClick={() => void confirmar()} disabled={saving}>
            {saving ? 'Salvando...' : 'Confirmar Importação'}
          </Button>
        </Stack>
      </Stack>

      {queryError ? <Alert severity="error">Não foi possível carregar a conferência.</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading || !data ? (
        <CircularProgress />
      ) : (
        <>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="overline" color="text.secondary">Arquivo</Typography>
                  <Typography variant="body2" fontWeight={600}>{data.arquivoNome}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="overline" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={data.status}
                      color={data.status === 'ERRO' ? 'error' : data.status === 'PENDENTE_CONFERENCIA' ? 'warning' : 'success'}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Typography variant="overline" color="text.secondary">Itens</Typography>
                  <Typography variant="body2" fontWeight={600}>{items.length}</Typography>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Typography variant="overline" color="text.secondary">Pendentes</Typography>
                  <Typography variant="body2" fontWeight={600} color={pendentes > 0 ? 'warning.main' : 'success.main'}>
                    {pendentes}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="overline" color="text.secondary">Valor Total</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {formatCurrency(totalGeral)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <FactCheck color="primary" />
              <Typography variant="h6">Itens para Conferência</Typography>
              {pendentes > 0 && (
                <Chip label={`${pendentes} pendente(s)`} size="small" color="warning" variant="outlined" />
              )}
            </Stack>

            {items.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                index={index}
                onUpdate={updateItem}
                onUpdateCurrency={updateCurrencyItem}
              />
            ))}

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<Save />} onClick={() => void confirmar()} disabled={saving}>
                {saving ? 'Salvando...' : 'Confirmar Importação'}
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
