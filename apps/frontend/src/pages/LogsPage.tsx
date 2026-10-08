import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Button, Card, CardContent, Chip, CircularProgress, Grid, MenuItem, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, TextField, Typography, Pagination,
  Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip, Box, Divider,
} from '@mui/material';
import { Refresh, Visibility, FilterList, Clear } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';

interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  entityLabel?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  recentActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ name: string; count: number }>;
  topEntities: Array<{ entity: string; count: number }>;
}

const actionColors: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  CRIAR: 'success', ALTERAR: 'info', EXCLUIR: 'error', CONSULTAR: 'default',
  APROVAR: 'success', REJEITAR: 'error', GERAR: 'info', FINALIZAR: 'success',
  IMPORTAR: 'info', CONFIRMAR: 'success', LOGIN: 'info', ERROR: 'error',
};

const actionLabels: Record<string, string> = {
  CRIAR: 'Criar', ALTERAR: 'Alterar', EXCLUIR: 'Excluir', CONSULTAR: 'Consultar',
  APROVAR: 'Aprovar', REJEITAR: 'Rejeitar', GERAR: 'Gerar', FINALIZAR: 'Finalizar',
  IMPORTAR: 'Importar', CONFIRMAR: 'Confirmar', LOGIN: 'Login', ERROR: 'Erro',
};

const entityLabels: Record<string, string> = {
  editais: 'Edital', edital_itens: 'Item do Edital', produtores: 'Produtor',
  escolas: 'Escola', municipios: 'Municipio', matches: 'Match', propostas: 'Proposta',
  users: 'Usuario', import_logs: 'Importacao', audit_logs: 'Auditoria',
};

export default function LogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entity', filterEntity);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const { data } = await api.get<ApiResponse<PaginationResponse<AuditLog>>>(`/audit?${params}`);
      setItems(data.data.items ?? []);
      setTotalPages(data.data.totalPages ?? 1);
    } catch {
      setError('Nao foi possivel carregar os logs de auditoria.');
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity, startDate, endDate]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get<ApiResponse<AuditStats>>('/audit/stats');
      setStats(data as any);
    } catch { /* ignore */ }
  };

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);
  useEffect(() => { void fetchStats(); }, []);

  const clearFilters = () => {
    setFilterAction('');
    setFilterEntity('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>Auditoria</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FilterList />} onClick={() => setShowFilters(!showFilters)}>
            Filtros
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => { void fetchLogs(); void fetchStats(); }}>
            Atualizar
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}

      {stats && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Total de Registros</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.totalLogs}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Hoje</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.todayLogs}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Acoes Mais Frequentes</Typography>
                {stats.recentActions.slice(0, 3).map(a => (
                  <Typography key={a.action} variant="body2">{actionLabels[a.action] || a.action}: {a.count}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Entidades Mais Movimentadas</Typography>
                {stats.topEntities.slice(0, 3).map(e => (
                  <Typography key={e.entity} variant="body2">{entityLabels[e.entity] || e.entity}: {e.count}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {showFilters && (
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField select label="Acao" fullWidth size="small" value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}>
                  <MenuItem value="">Todas</MenuItem>
                  {Object.entries(actionLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select label="Entidade" fullWidth size="small" value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1); }}>
                  <MenuItem value="">Todas</MenuItem>
                  {Object.entries(entityLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Data Inicio" type="date" fullWidth size="small" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Data Fim" type="date" fullWidth size="small" value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button variant="outlined" startIcon={<Clear />} onClick={clearFilters} fullWidth>Limpar</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data/Hora</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Acao</TableCell>
                    <TableCell>Entidade</TableCell>
                    <TableCell>Detalhe</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell align="right">Acoes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? items.map(log => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{log.userName || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{log.userRole || ''}</Typography>
                      </TableCell>
                      <TableCell><Chip size="small" color={actionColors[log.action] || 'default'} label={actionLabels[log.action] || log.action} /></TableCell>
                      <TableCell>{entityLabels[log.entity] || log.entity}</TableCell>
                      <TableCell>{log.entityLabel || log.entityId || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{log.method} {log.endpoint}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver detalhes">
                          <IconButton size="small" onClick={() => setDetailLog(log)}><Visibility fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={7} align="center">Nenhum registro de auditoria encontrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {totalPages > 1 && <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />}
        </CardContent>
      </Card>

      <Dialog open={!!detailLog} onClose={() => setDetailLog(null)} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes do Registro de Auditoria</DialogTitle>
        <DialogContent>
          {detailLog && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Data/Hora</Typography><Typography>{new Date(detailLog.createdAt).toLocaleString('pt-BR')}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Acao</Typography><Chip color={actionColors[detailLog.action] || 'default'} label={actionLabels[detailLog.action] || detailLog.action} /></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Usuario</Typography><Typography>{detailLog.userName || '—'} ({detailLog.userRole || '—'})</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Email</Typography><Typography>{detailLog.userEmail || '—'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Entidade</Typography><Typography>{entityLabels[detailLog.entity] || detailLog.entity} ({detailLog.entityId || '—'})</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Endpoint</Typography><Typography>{detailLog.method} {detailLog.endpoint}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Status</Typography><Typography>{detailLog.statusCode || '—'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">Duracao</Typography><Typography>{detailLog.durationMs ? `${detailLog.durationMs}ms` : '—'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">IP</Typography><Typography>{detailLog.ipAddress || '—'}</Typography></Grid>
              </Grid>
              {detailLog.newValues && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" color="text.secondary">Dados Enviados</Typography>
                  <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(detailLog.newValues, null, 2)}</pre>
                  </Box>
                </>
              )}
              {detailLog.oldValues && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" color="text.secondary">Dados Anteriores</Typography>
                  <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(detailLog.oldValues, null, 2)}</pre>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailLog(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
