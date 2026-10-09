import { Alert, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { CloudUpload, FormatListBulleted } from '@mui/icons-material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function ImportarEditalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const criarEdital = searchParams.get('destino') === 'edital';
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (loading) return;
    if (!file) {
      setError('Selecione um arquivo PDF.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('O PDF deve ter no máximo 10 MB.');
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
        timeout: 120000,
      });
      await queryClient.invalidateQueries({ queryKey: ['importacoes'] });
      await queryClient.invalidateQueries({ queryKey: ['editais'] });
      navigate(criarEdital ? `/editais/novo?importacaoId=${response.data.data.id}` : `/importacoes/${response.data.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Não foi possível enviar o PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>{criarEdital ? 'Criar edital a partir de PDF' : 'Importar Edital'}</Typography>
        <Typography variant="body1" color="text.secondary">
          {criarEdital ? 'Envie o PDF do edital. Após o processamento, os dados e os itens serão carregados no formulário para você revisar e salvar.' : 'O motor lê PDFs pesquisáveis, extrai os itens e abre a conferência antes da confirmação final.'}
        </Typography>
      </Stack>

      {loading ? <Stack spacing={1}><LinearProgress /><Typography role="status">Processando o PDF e extraindo os dados. Aguarde...</Typography></Stack> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Upload manual</Typography>
            <Button component="label" variant="outlined" startIcon={<CloudUpload />} disabled={loading}>
              {file ? file.name : 'Selecionar PDF'}
              <input hidden type="file" accept="application/pdf,.pdf" disabled={loading} onChange={(event) => { setFile(event.target.files?.[0] || null); setError(''); }} />
            </Button>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => void upload()} disabled={loading || !file}>{loading ? 'Processando...' : 'Enviar e processar'}</Button>
              <Button component={RouterLink} to={criarEdital ? '/editais' : '/importacoes'} variant="text" startIcon={<FormatListBulleted />} disabled={loading}>{criarEdital ? 'Voltar para editais' : 'Voltar para a fila'}</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {!criarEdital ? <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Pasta automática</Typography>
            <Typography variant="body2" color="text.secondary">
              Arquivos PDF colocados em `C:\Projetos\merenda_pnae\docs` são sincronizados automaticamente no backend.
            </Typography>
          </Stack>
        </CardContent>
      </Card> : null}
    </Stack>
  );
}
