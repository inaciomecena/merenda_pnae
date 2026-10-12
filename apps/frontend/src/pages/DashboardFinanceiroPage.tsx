import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, Divider, Grid, LinearProgress,
  List, ListItem, ListItemText, Paper, Stack, Typography,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Warning, CheckCircle, Schedule, AccountBalance,
} from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';

type Indicadores = {
  contratado: string;
  recebidoAceito: string;
  faturado: string;
  conciliado: string;
  atestado: string;
  liquidado: string;
  pago: string;
};

type Saldos = {
  aLiquidar: string;
  aPagar: string;
};

type Pendencia = {
  id: string;
  tipo: string;
  descricao: string;
  gravidade: 'ALTA' | 'MEDIA' | 'BAIXA';
};

type Divergencia = {
  id: string;
  notaFiscalId: string;
  notaFiscalNumero: string;
  tipo: string;
  descricao: string;
};

type Grafico = {
  label: string;
  valor: string;
  percentual: number;
};

const moeda = (valor: string | number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

const gravidadeCores: Record<string, 'error' | 'warning' | 'info'> = {
  ALTA: 'error',
  MEDIA: 'warning',
  BAIXA: 'info',
};

export default function DashboardFinanceiroPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [saldos, setSaldos] = useState<Saldos | null>(null);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [divergencias, setDivergencias] = useState<Divergencia[]>([]);
  const [grafico, setGrafico] = useState<Grafico[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [ind, sal, pen, div, gra] = await Promise.all([
        api.get<ApiResponse<Indicadores>>('/dashboard-financeiro/indicadores'),
        api.get<ApiResponse<Saldos>>('/dashboard-financeiro/saldos'),
        api.get<ApiResponse<Pendencia[]>>('/dashboard-financeiro/pendencias'),
        api.get<ApiResponse<Divergencia[]>>('/dashboard-financeiro/divergencias'),
        api.get<ApiResponse<Grafico[]>>('/dashboard-financeiro/grafico'),
      ]);
      setIndicadores(ind.data.data);
      setSaldos(sal.data.data);
      setPendencias(pen.data.data);
      setDivergencias(div.data.data);
      setGrafico(gra.data.data);
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const maxGrafico = Math.max(...grafico.map(g => Number(g.valor)), 1);

  return (
    <Stack spacing={2} sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4">Dashboard Financeiro</Typography>

      {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}
      {loading && <CircularProgress size={25} />}

      {indicadores && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountBalance color="primary" />
                    <Typography variant="h6" color="text.secondary">Contratado</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(indicadores.contratado)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle color="success" />
                    <Typography variant="h6" color="text.secondary">Recebido/Aceito</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(indicadores.recebidoAceito)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TrendingUp color="info" />
                    <Typography variant="h6" color="text.secondary">Faturado</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(indicadores.faturado)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle color="success" />
                    <Typography variant="h6" color="text.secondary">Conciliado</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(indicadores.conciliado)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle color="success" />
                    <Typography variant="h6" color="text.secondary">Atestado</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(indicadores.atestado)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TrendingUp color="info" />
                    <Typography variant="h6" color="text.secondary">Liquidado</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(indicadores.liquidado)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TrendingDown color="success" />
                    <Typography variant="h6" color="text.secondary">Pago</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(indicadores.pago)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Schedule color="warning" />
                    <Typography variant="h6" color="text.secondary">A Liquidar</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{moeda(saldos?.aLiquidar || 0)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Evolução Financeira</Typography>
                  <Divider sx={{ my: 1 }} />
                  {grafico.map(g => (
                    <Box key={g.label} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{g.label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{moeda(g.valor)}</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (Number(g.valor) / maxGrafico) * 100)}
                        sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Pendências e Divergências</Typography>
                  <Divider sx={{ my: 1 }} />
                  {pendencias.length === 0 && divergencias.length === 0 ? (
                    <Typography color="text.secondary">Nenhuma pendência ou divergência.</Typography>
                  ) : (
                    <List dense>
                      {pendencias.map(p => (
                        <ListItem key={p.id}>
                          <ListItemText
                            primary={p.descricao}
                            secondary={p.tipo}
                          />
                          <Chip label={p.gravidade} color={gravidadeCores[p.gravidade]} size="small" />
                        </ListItem>
                      ))}
                      {divergencias.map(d => (
                        <ListItem key={d.id}>
                          <ListItemText
                            primary={`NF ${d.notaFiscalNumero}: ${d.descricao}`}
                            secondary={d.tipo}
                          />
                          <Chip label="Divergência" color="error" size="small" />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6">Saldos</Typography>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">A Liquidar</Typography>
                  <Typography variant="h6" fontWeight={600}>{moeda(saldos?.aLiquidar || 0)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">A Pagar</Typography>
                  <Typography variant="h6" fontWeight={600}>{moeda(saldos?.aPagar || 0)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  );
}
