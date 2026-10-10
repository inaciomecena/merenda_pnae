import { useEffect, useState } from 'react';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse } from '../types';

type Edital = { numero: string; ano: number; titulo: string; descricao?: string; itens: Array<{ id: string; produtoOriginal: string; quantidade?: number }> };
export default function EditalConsultaPage() {
  const { id } = useParams();
  const [edital, setEdital] = useState<Edital | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { if (id) void api.get<ApiResponse<Edital>>(`/editais/${encodeURIComponent(id)}`)
    .then(r => setEdital(r.data.data)).catch(() => setError('Edital indisponível para este vínculo.')); }, [id]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!edital) return <CircularProgress />;
  return <Stack spacing={2}>
    <Typography variant="h4">{edital.titulo}</Typography>
    <Typography>{edital.numero}/{edital.ano}</Typography>
    {edital.descricao && <Typography>{edital.descricao}</Typography>}
    <Typography variant="h6">Itens do edital</Typography>
    {edital.itens.map(i => <Typography key={i.id}>{i.produtoOriginal} · {i.quantidade ?? 'Quantidade não informada'}</Typography>)}
  </Stack>;
}
