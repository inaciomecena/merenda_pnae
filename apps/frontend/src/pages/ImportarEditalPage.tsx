import { Alert, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { CloudUpload, FormatListBulleted } from '@mui/icons-material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ImportarEditalPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) {
      setError('Selecione um arquivo PDF.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('processarAutomaticamente', 'true');
      const response = await api.post('/importacoes/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/importacoes/${response.data.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Não foi possível enviar o PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>Importar Edital</Typography>
        <Typography variant="body1" color="text.secondary">
          O motor lê PDFs pesquisáveis, extrai os itens e abre a conferência antes da confirmação final.
        </Typography>
      </Stack>

      {loading ? <LinearProgress /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Upload manual</Typography>
            <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
              {file ? file.name : 'Selecionar PDF'}
              <input hidden type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </Button>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => void upload()} disabled={loading}>Enviar e processar</Button>
              <Button component={RouterLink} to="/importacoes" variant="text" startIcon={<FormatListBulleted />}>Voltar para a fila</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Pasta automática</Typography>
            <Typography variant="body2" color="text.secondary">
              Arquivos PDF colocados em `C:\Projetos\sagae_pnae\docs` são sincronizados automaticamente no backend.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
