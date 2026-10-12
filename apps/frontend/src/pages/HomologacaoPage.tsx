import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid,
  Stack, Typography,
} from '@mui/material';
import { Refresh, Download, Assessment, CheckCircle, Error, Warning } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { humanizeSystemValue } from '../lib/display-text';

interface HomologacaoStatus {
  timestamp: string;
  ambiente: string;
  db: { status: string; message: string };
  counts: {
    editais: number; editalItens: number; produtores: number; produtosRef: number;
    matches: number; propostas: number; users: number; escolas: number; municipios: number;
    auditLogs: number;
  };
  matchesPorStatus: Record<string, number>;
  propostasPorStatus: Record<string, number>;
  ultimosErros: Array<{ id: string; createdAt: string; endpoint?: string; newValues?: any }>;
  ultimosEventos: Array<{ id: string; action: string; entity: string; userName?: string; createdAt: string }>;
}

export default function HomologacaoPage() {
  const [status, setStatus] = useState<HomologacaoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningSeed, setRunningSeed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<ApiResponse<HomologacaoStatus>>('/homologacao/status');
      const result = data.data;
      setStatus({
        ...result,
        matchesPorStatus: result.matchesPorStatus ?? {},
        propostasPorStatus: result.propostasPorStatus ?? {},
        ultimosErros: result.ultimosErros ?? [],
        ultimosEventos: result.ultimosEventos ?? [],
      });
    } catch {
      setError('Não foi possível carregar o status do sistema.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchStatus(); }, [fetchStatus]);

  const handleExport = (tipo: string) => {
    const token = localStorage.getItem('seaf_token');
    const url = `http://localhost:3000/api/v1/homologacao/exportar/${tipo}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${tipo}-export.csv`;
        a.click();
      });
  };

  const handleRelatorio = () => {
    const token = localStorage.getItem('seaf_token');
    const url = 'http://localhost:3000/api/v1/homologacao/relatorio';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'relatorio-homologacao.json';
        a.click();
      });
  };

  const handleSeed = async () => {
    setRunningSeed(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post<ApiResponse<{ success: boolean; message: string }>>(
        '/homologacao/seed-teste',
        undefined,
        { timeout: 65000 },
      );
      if (!data.data.success) {
        setError(data.data.message || 'Erro ao executar seed de teste.');
        return;
      }
      setSuccess(data.data.message || 'Seed de teste executado com sucesso.');
      await fetchStatus();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao executar seed de teste.');
    } finally {
      setRunningSeed(false);
    }
  };

  if (loading && !status) return <CircularProgress />;
  if (error && !status) return <Alert severity="error">{error}</Alert>;
  if (!status) return null;

  const dbOk = status.db.status === 'CONECTADO';
  const ambienteColor = status.ambiente === 'PRODUCAO'
    ? 'error'
    : status.ambiente === 'HOMOLOGACAO' ? 'warning' : 'info';

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h4" fontWeight={700}>Homologação técnica</Typography>
          <Chip icon={<Assessment />} label={humanizeSystemValue(status.ambiente)} color={ambienteColor} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => void fetchStatus()}>Atualizar</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={handleRelatorio}>Relatório</Button>
          {status.ambiente !== 'PRODUCAO' && (
            <Button variant="contained" color="warning" onClick={() => void handleSeed()} disabled={runningSeed}>
              {runningSeed ? 'Executando Seed...' : 'Executar Seed Teste'}
            </Button>
          )}
        </Stack>
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {success ? <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                {dbOk ? <CheckCircle color="success" /> : <Error color="error" />}
                <Typography variant="h6">Banco de Dados</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">{status.db.message}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Última atualização</Typography>
              <Typography>{new Date(status.timestamp).toLocaleString('pt-BR')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Auditoria</Typography>
              <Typography fontWeight={700}>{status.counts.auditLogs} registros</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Resumo dos Dados</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[
              { label: 'Editais', value: status.counts.editais },
              { label: 'Itens Importados', value: status.counts.editalItens },
              { label: 'Municípios', value: status.counts.municipios },
              { label: 'Escolas', value: status.counts.escolas },
              { label: 'Produtores', value: status.counts.produtores },
              { label: 'Produtos de referência', value: status.counts.produtosRef },
              { label: 'Matches', value: status.counts.matches },
              { label: 'Propostas', value: status.counts.propostas },
              { label: 'Usuários', value: status.counts.users },
            ].map(item => (
              <Grid item xs={6} md={3} key={item.label}>
                <Typography variant="subtitle2" color="text.secondary">{item.label}</Typography>
                <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Matches por Status</Typography>
              <Divider sx={{ mb: 1 }} />
              {Object.entries(status.matchesPorStatus).map(([k, v]) => (
                <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                  <Typography variant="body2">{k}</Typography>
                  <Chip label={v} size="small" />
                </Stack>
              ))}
              {Object.keys(status.matchesPorStatus).length === 0 && (
                <Typography variant="body2" color="text.secondary">Nenhum match registrado</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Propostas por Status</Typography>
              <Divider sx={{ mb: 1 }} />
              {Object.entries(status.propostasPorStatus).map(([k, v]) => (
                <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                  <Typography variant="body2">{k}</Typography>
                  <Chip label={v} size="small" />
                </Stack>
              ))}
              {Object.keys(status.propostasPorStatus).length === 0 && (
                <Typography variant="body2" color="text.secondary">Nenhuma proposta registrada</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Exportar Dados</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={() => handleExport('itens')}>Itens (CSV)</Button>
            <Button variant="outlined" size="small" onClick={() => handleExport('matches')}>Matches (CSV)</Button>
            <Button variant="outlined" size="small" onClick={() => handleExport('propostas')}>Propostas (CSV)</Button>
          </Stack>
        </CardContent>
      </Card>

      {status.ultimosErros.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Warning color="warning" />
              <Typography variant="h6">Últimos erros</Typography>
            </Stack>
            {status.ultimosErros.slice(0, 5).map(erro => (
              <Stack key={erro.id} sx={{ py: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>{erro.endpoint || '—'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(erro.createdAt).toLocaleString('pt-BR')} — {erro.newValues?.error || 'Erro'}
                </Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Últimos eventos de auditoria</Typography>
          <Divider sx={{ mb: 1 }} />
          {status.ultimosEventos.slice(0, 10).map(ev => (
            <Stack key={ev.id} direction="row" spacing={2} sx={{ py: 0.5 }}>
              <Typography variant="caption" sx={{ minWidth: 140 }}>{new Date(ev.createdAt).toLocaleString('pt-BR')}</Typography>
              <Chip label={humanizeSystemValue(ev.action)} size="small" />
              <Typography variant="body2">{ev.entity}</Typography>
              <Typography variant="body2" color="text.secondary">{ev.userName || '—'}</Typography>
            </Stack>
          ))}
        </CardContent>
      </Card>
    </Stack>
  );
}
