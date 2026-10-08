import { Alert, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function BalizamentoPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/balizamento');
        setItems(data.data?.items ?? []);
      } catch {
        setError('Não foi possível carregar o balizamento.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>Balizamento</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <CircularProgress /> : items.map((item) => (
        <Card key={item.id}><CardContent><Typography fontWeight={700}>{item.id}</Typography><Typography color="text.secondary">Status: {item.status}</Typography><Button variant="outlined" sx={{ mt: 1 }}>Validar match</Button></CardContent></Card>
      ))}
    </Stack>
  );
}
