import { Alert, Button, Card, CardContent, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Save } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse, Importacao, ImportacaoItem } from '../types';

interface EditableItem extends ImportacaoItem {}

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

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>Tela de Conferência dos Itens</Typography>
        <Typography variant="body1" color="text.secondary">
          Revise produto, quantidade, unidade e valores antes da confirmação final.
        </Typography>
      </Stack>

      {queryError ? <Alert severity="error">Não foi possível carregar a conferência.</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading || !data ? (
        <CircularProgress />
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Unidade</TableCell>
                  <TableCell>Preço Unitário</TableCell>
                  <TableCell>Valor Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.numeroItem || '-'}</TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.produtoOriginal}
                        onChange={(event) => updateItem(item.id, 'produtoOriginal', event.target.value)}
                        helperText={item.status === 'PENDENTE_CONFERENCIA' ? 'Item sinalizado pelo parser para revisão.' : ' '}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField fullWidth type="number" value={item.quantidade ?? ''} onChange={(event) => updateItem(item.id, 'quantidade', event.target.value)} />
                    </TableCell>
                    <TableCell>
                      <TextField fullWidth value={item.unidade ?? ''} onChange={(event) => updateItem(item.id, 'unidade', event.target.value)} />
                    </TableCell>
                    <TableCell>
                      <TextField fullWidth type="number" value={item.precoUnitario ?? ''} onChange={(event) => updateItem(item.id, 'precoUnitario', event.target.value)} />
                    </TableCell>
                    <TableCell>
                      <TextField fullWidth type="number" value={item.valorTotal ?? ''} onChange={(event) => updateItem(item.id, 'valorTotal', event.target.value)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<Save />} onClick={() => void confirmar()} disabled={saving}>
                Confirmar Importação
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
