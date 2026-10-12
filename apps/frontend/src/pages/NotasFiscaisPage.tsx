import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, FormControl, InputLabel, MenuItem, Pagination, Select, Stack, TextField, Typography } from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { humanizeSystemValue } from '../lib/display-text';

type NotaFiscal = {
  id: string;
  numero: string;
  serie: string | null;
  modelo: string | null;
  chaveAcesso: string | null;
  dataEmissao: string;
  valorTotal: string;
  status: string;
  resultadoConciliacao: string | null;
  fornecedor: { nome: string };
  contrato: { numero: string; exercicio: number };
  itens: Array<{ id: string; descricao: string; quantidade: string; valorTotal: string }>;
  divergencias: Array<{ id: string; tipo: string; status: string }>;
  conferencias: Array<{ id: string; status: string }>;
  atestos: Array<{ id: string; status: string; valorAtestado: string }>;
};

const statusCores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  PENDENTE_PROCESSAMENTO: 'warning',
  PROCESSADA: 'info',
  PENDENTE_CONFERENCIA: 'warning',
  EM_CONFERENCIA: 'info',
  CONFERIDA: 'success',
  AGUARDANDO_ATESTO: 'primary',
  ATESTADA: 'success',
  REJEITADA: 'error',
  CANCELADA: 'default',
};

const conciliacaoCores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  CONCILIADA: 'success',
  CONCILIADA_COM_RESSALVAS: 'info',
  DIVERGENTE: 'error',
  PENDENTE: 'warning',
  NAO_CONCILIADA: 'default',
};

const moeda = (valor: string | number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

export default function NotasFiscaisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const podeGerenciar = user?.role === 'ADMIN' || user?.role === 'DRE';
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<PaginationResponse<NotaFiscal> | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const q = new URLSearchParams({ page: String(pagina), limit: '20' });
      if (status) q.set('status', status);
      if (dataInicio) q.set('dataInicio', dataInicio);
      if (dataFim) q.set('dataFim', dataFim);
      const { data } = await api.get<ApiResponse<PaginationResponse<NotaFiscal>>>(`/notas-fiscais?${q}`);
      setLista(data.data);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  }, [pagina, status, dataInicio, dataFim]);

  useEffect(() => { void carregar(); }, [carregar]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Notas Fiscais</Typography>
        {podeGerenciar && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/notas-fiscais/nova')}>
            Nova Nota Fiscal
          </Button>
        )}
      </Stack>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPagina(1); }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PENDENTE_PROCESSAMENTO">Pendente Processamento</MenuItem>
                <MenuItem value="PROCESSADA">Processada</MenuItem>
                <MenuItem value="PENDENTE_CONFERENCIA">Pendente Conferência</MenuItem>
                <MenuItem value="EM_CONFERENCIA">Em Conferência</MenuItem>
                <MenuItem value="CONFERIDA">Conferida</MenuItem>
                <MenuItem value="AGUARDANDO_ATESTO">Aguardando Atesto</MenuItem>
                <MenuItem value="ATESTADA">Atestada</MenuItem>
                <MenuItem value="REJEITADA">Rejeitada</MenuItem>
                <MenuItem value="CANCELADA">Cancelada</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="Data Início" type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPagina(1); }} InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="Data Fim" type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPagina(1); }} InputLabelProps={{ shrink: true }} />
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : lista?.items.length === 0 ? (
        <Alert severity="info">Nenhuma nota fiscal encontrada.</Alert>
      ) : (
        <>
          <Stack spacing={2}>
            {lista?.items.map(nota => (
              <Card key={nota.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6">NF {nota.numero} {nota.serie && `- Série ${nota.serie}`}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {nota.fornecedor?.nome} • Contrato {nota.contrato?.numero}/{nota.contrato?.exercicio}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Emissão: {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')} • Valor: {moeda(nota.valorTotal)}
                      </Typography>
                      {nota.chaveAcesso && (
                        <Typography variant="caption" color="text.secondary">
                          Chave: {nota.chaveAcesso}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={humanizeSystemValue(nota.status)} color={statusCores[nota.status] || 'default'} size="small" />
                      {nota.resultadoConciliacao && (
                        <Chip label={humanizeSystemValue(nota.resultadoConciliacao)} color={conciliacaoCores[nota.resultadoConciliacao] || 'default'} size="small" variant="outlined" />
                      )}
                      <Button size="small" startIcon={<Visibility />} onClick={() => navigate(`/notas-fiscais/${nota.id}`)}>
                        Detalhes
                      </Button>
                    </Stack>
                  </Stack>
                  {nota.divergencias.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {nota.divergencias.length} divergência(s) pendente(s)
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>

          {lista && lista.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination count={lista.totalPages} page={pagina} onChange={(_, p) => setPagina(p)} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
