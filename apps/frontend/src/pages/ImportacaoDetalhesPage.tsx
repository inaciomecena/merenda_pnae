import type { ReactNode } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { FactCheck, School } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useParams } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse, Importacao } from '../types';

function moeda(value?: number | null) {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function ImportacaoDetalhesPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['importacao', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Importacao>>(`/importacoes/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight={700}>Detalhes da Importação</Typography>
          <Typography variant="body1" color="text.secondary">{data?.arquivoNome || 'Carregando arquivo...'}</Typography>
        </Stack>
        {id ? (
          <Button component={RouterLink} to={`/importacoes/${id}/conferencia`} variant="contained" startIcon={<FactCheck />}>
            Tela de Conferência
          </Button>
        ) : null}
      </Stack>

      {error ? <Alert severity="error">Não foi possível carregar os detalhes.</Alert> : null}

      {isLoading || !data ? (
        <CircularProgress />
      ) : (
        <>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Info label="Status" value={<Chip size="small" label={data.status} color={data.status === 'ERRO' ? 'error' : data.status === 'PENDENTE_CONFERENCIA' ? 'warning' : 'success'} />} />
                <Info label="Título" value={data.tituloExtraido || data.edital?.titulo || '-'} />
                <Info label="Número/Ano" value={`${data.numeroExtraido || data.edital?.numero || '-'} / ${data.anoExtraido || data.edital?.ano || '-'}`} />
                <Info label="Município" value={data.municipioNome || data.edital?.municipio?.nome || '-'} />
                <Info
                  label="Escolas Vinculadas"
                  value={
                    (() => {
                      const vinculadas = data.edital?.escolasVinculadas ?? [];
                      if (vinculadas.length > 0) {
                        return (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {vinculadas.map((ev) => (
                              <Chip key={ev.id} size="small" label={ev.escola.nome} icon={<School />} />
                            ))}
                          </Stack>
                        );
                      }
                      const unica = data.escolaNome || data.edital?.escola?.nome;
                      return unica || '-';
                    })()
                  }
                />
                <Info label="Objeto" value={data.objeto || data.edital?.objeto || '-'} />
                <Info label="Itens extraídos" value={String(data.quantidadeItens || data.edital?.itens?.length || 0)} />
                <Info label="Tempo de processamento" value={data.tempoProcessamentoMs ? `${data.tempoProcessamentoMs} ms` : '-'} />
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Itens importados</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Produto</TableCell>
                    <TableCell>Qtd</TableCell>
                    <TableCell>Unidade</TableCell>
                    <TableCell>Preço</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.edital?.itens ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.numeroItem || '-'}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{item.produtoOriginal}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.especificacao || '-'}</Typography>
                      </TableCell>
                      <TableCell>{item.quantidade ?? '-'}</TableCell>
                      <TableCell>{item.unidade || '-'}</TableCell>
                      <TableCell>{moeda(item.precoUnitario)}</TableCell>
                      <TableCell>{moeda(item.valorTotal)}</TableCell>
                      <TableCell>{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Grid item xs={12} md={6} lg={3}>
      <Typography variant="overline">{label}</Typography>
      <Box sx={{ typography: 'body1' }}>{value}</Box>
    </Grid>
  );
}
