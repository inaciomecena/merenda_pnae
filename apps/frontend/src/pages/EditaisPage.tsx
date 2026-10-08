import { CrudPage } from './CrudPage';
import { Stack, Typography } from '@mui/material';
import { School, LocationOn } from '@mui/icons-material';
import api from '../services/api';

export default function EditaisPage() {
  const fetchEscolas = async () => {
    try {
      const { data } = await api.get('/escolas?limit=200');
      return (data.data?.items ?? data.data ?? []).map((e: any) => ({ label: e.nome, value: e.id }));
    } catch {
      return [];
    }
  };

  return (
    <CrudPage
      title="Editais"
      endpoint="/editais"
      initialValues={{ numero: '', ano: 2026, titulo: '', descricao: '', status: 'RASCUNHO', escolaId: '' }}
      fields={[
        { name: 'numero', label: 'Número' },
        { name: 'ano', label: 'Ano', type: 'number' },
        { name: 'titulo', label: 'Título' },
        { name: 'descricao', label: 'Descrição' },
        { name: 'status', label: 'Status', type: 'select', options: [{ label: 'Rascunho', value: 'RASCUNHO' }, { label: 'Ativo', value: 'ATIVO' }] },
        { name: 'escolaId', label: 'Escola', fetchOptions: fetchEscolas },
      ]}
      renderRow={(item: any) => (
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={500}>{item.numero} — {item.titulo}</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <School sx={{ fontSize: 14, color: '#666' }} />
            <Typography variant="caption" color="text.secondary">
              Escola: {item.escola?.nome || 'Não informado'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <LocationOn sx={{ fontSize: 14, color: '#666' }} />
            <Typography variant="caption" color="text.secondary">
              Município: {item.municipio?.nome || item.escola?.municipio?.nome || 'Não informado'}
            </Typography>
          </Stack>
        </Stack>
      )}
    />
  );
}
