import { Alert, Button, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rotuloStatus } from '../lib/composicao-ui';
import api from '../services/api';

export default function EditaisPage() {
  const { user } = useAuth();
  const dre = user?.role === 'ADMIN' || user?.role === 'DRE';
  const { data, isLoading, error } = useQuery({
    queryKey: ['editais'],
    queryFn: async () => (await api.get('/editais?limit=50')).data.data,
  });

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <div>
          <Typography variant="h4" fontWeight={700}>Editais</Typography>
          <Typography color="text.secondary">Composição, versão e geração da chamada pública do PNAE.</Typography>
        </div>
        {dre ? (
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/editais/novo" variant="contained">Novo Edital</Button>
            <Button component={RouterLink} to="/importacoes" variant="outlined">Criar a partir de importação</Button>
          </Stack>
        ) : null}
      </Stack>
      {error ? <Alert severity="error">Não foi possível carregar os editais.</Alert> : null}
      {isLoading ? <Typography>Carregando...</Typography> : null}
      {(data?.items || []).map((item: any) => {
        const ultima = item.documento?.geracoes?.[0];
        return (
          <Stack key={item.id} spacing={0.5} sx={{ p: 2, bgcolor: 'white', border: '1px solid #e8e8e8', borderRadius: 1 }}>
            <Typography fontWeight={700}>{item.numero}/{item.ano} — {item.titulo}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={rotuloStatus(item.documento?.statusComposicao)} color={item.documento?.statusComposicao === 'PUBLICADO' ? 'success' : 'default'} />
              <Chip size="small" label={item.documento?.origem || 'operacional'} />
              <Chip size="small" label={item.municipio?.nome || item.escola?.municipio?.nome || 'Município não informado'} />
              {ultima ? <Chip size="small" label={`Última geração: ${new Date(ultima.createdAt).toLocaleString('pt-BR')} · ${ultima.usuarioNome || 'sistema'}`} /> : null}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Origem: {item.documento?.origem || 'cadastro operacional'} · Arquivo-fonte: {item.documento?.arquivoFonte || item.arquivoFonte || 'não informado'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to={`/editais/${item.id}`} size="small">{dre ? 'Editar estrutura' : 'Visualizar'}</Button>
              {dre ? <Button size="small" onClick={() => void api.post(`/editais/${item.id}/composicao/duplicar`).then(() => window.location.reload())}>Duplicar edital</Button> : null}
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
