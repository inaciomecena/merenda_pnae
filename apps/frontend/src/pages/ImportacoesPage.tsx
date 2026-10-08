import { Alert, Button, Card, CardContent, Chip, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Autorenew, FactCheck, UploadFile, Visibility } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
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

export default function ImportacoesPage() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['importacoes'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginationResponse<Importacao>>>('/importacoes?limit=50');
      return response.data.data;
    },
  });

  const processar = async (id: string) => {
    await api.post(`/importacoes/${id}/processar`, { reprocessar: true });
    await refetch();
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
                  <TableCell>Escola</TableCell>
                  <TableCell>Município</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.items ?? []).map((item) => (
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
                    <TableCell>{item.escolaNome || item.edital?.escola?.nome || 'Não informada'}</TableCell>
                    <TableCell>{item.municipioNome || item.edital?.municipio?.nome || '-'}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button component={RouterLink} to={`/importacoes/${item.id}`} size="small" startIcon={<Visibility />}>
                          Detalhes
                        </Button>
                        <Button component={RouterLink} to={`/importacoes/${item.id}/conferencia`} size="small" startIcon={<FactCheck />}>
                          Conferir
                        </Button>
                        <Button size="small" onClick={() => void processar(item.id)}>
                          Processar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
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
    </Stack>
  );
}
