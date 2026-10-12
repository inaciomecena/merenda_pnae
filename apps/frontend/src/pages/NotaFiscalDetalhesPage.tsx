import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, Tab, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  ArrowBack, Download, Refresh, Description, Assignment, CheckCircle,
  Warning, History, Link as LinkIcon, Edit as EditIcon, AddLink, LinkOff,
} from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { humanizeSystemValue } from '../lib/display-text';
import { useAuth } from '../contexts/AuthContext';
import { chaveAcessoValida, podeConfirmarNota, podeCorrigirNota, podeVincularRecebimento } from '../lib/fiscal-manual-ui';

interface NotaFiscalDetalhes {
  id: string;
  numero: string;
  serie: string | null;
  modelo: string | null;
  chaveAcesso: string | null;
  dataEmissao: string;
  valorTotal: string;
  status: string;
  resultadoConciliacao: string | null;
  observacoes?: string | null;
  fornecedor: { nome: string; cpfCnpj?: string | null };
  contrato: { numero: string; exercicio: number };
  itens: Array<{ id: string; numeroItem?: number; descricao: string; quantidade: string; valorUnitario: string; valorTotal: string; unidadeComercial?: string | null; contratoItemId?: string | null }>;
  documentos: Array<{ id: string; tipo: string; titulo: string; versao: number; geradoEm?: string | null }>;
  recebimentos: Array<{ id: string; numero: string; status: string; dataRecebimento: string }>;
  vinculos: Array<{
    id: string;
    notaFiscalItemId: string;
    entregaId: string;
    entregaNumero: string;
    entregaStatus: string;
    entregaItemId: string;
    contratoItemId: string;
    quantidadeVinculada: string;
    valorUnitarioFiscal: string;
    valorTotalVinculado: string;
    observacoes?: string | null;
  }>;
  divergencias: Array<{ id: string; tipo: string; descricao: string; status: string }>;
  conciliacao: { status: string; divergencias: Array<{ id: string; tipo: string; descricao: string; status: string }> } | null;
  conferencias: Array<{ id: string; status: string; dataConferencia: string; conferente?: string | null; justificativa?: string | null; ressalvas?: string | null }>;
  atestos: Array<{ id: string; status: string; valorAtestado: string; dataAtesto: string; justificativa?: string | null }>;
}

interface CandidatosRecebimento {
  itens: Array<{ id: string; descricao: string; quantidade: string; quantidadeDisponivel: string }>;
  recebimentos: Array<{
    entregaItemId: string;
    entregaId: string;
    entregaNumero: string;
    produto: string;
    quantidadeAceita: string;
    quantidadeDisponivel: string;
    dataEntrega: string;
  }>;
}

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

export default function NotaFiscalDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const podeGerenciar = user?.role === 'ADMIN' || user?.role === 'DRE';

  const [nota, setNota] = useState<NotaFiscalDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState(0);
  const [conciliando, setConciliando] = useState(false);

  // Correção de dados
  const [abrirCorrecao, setAbrirCorrecao] = useState(false);
  const [corrNumero, setCorrNumero] = useState('');
  const [corrSerie, setCorrSerie] = useState('');
  const [corrChave, setCorrChave] = useState('');
  const [corrObservacoes, setCorrObservacoes] = useState('');
  const [corrConfirmar, setCorrConfirmar] = useState(false);
  const [corrigindo, setCorrigindo] = useState(false);

  // Vínculo de recebimentos
  const [abrirVinculo, setAbrirVinculo] = useState(false);
  const [candidatos, setCandidatos] = useState<CandidatosRecebimento | null>(null);
  const [candidatoItemId, setCandidatoItemId] = useState('');
  const [candidatoRecebimento, setCandidatoRecebimento] = useState('');
  const [vincQuantidade, setVincQuantidade] = useState('');
  const [vinculando, setVinculando] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErro('');
    try {
      const { data } = await api.get<ApiResponse<NotaFiscalDetalhes>>(`/notas-fiscais/${id}`);
      setNota(data.data);
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void carregar(); }, [carregar]);

  const baixarDocumento = async (documentoId: string, titulo: string) => {
    try {
      const resposta = await api.get(`/notas-fiscais/${id}/documentos/${documentoId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(resposta.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = titulo;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(erroApi(e));
    }
  };

  const executarConciliacao = async () => {
    setConciliando(true);
    setErro('');
    try {
      await api.post(`/notas-fiscais/${id}/conciliar`);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setConciliando(false);
    }
  };

  const abrirCorrecaoDados = (confirmar = false) => {
    if (!nota) return;
    setCorrNumero(nota.numero);
    setCorrSerie(nota.serie ?? '');
    setCorrChave(nota.chaveAcesso ?? '');
    setCorrObservacoes(nota.observacoes ?? '');
    setCorrConfirmar(confirmar && nota.status === 'PENDENTE_PROCESSAMENTO');
    setAbrirCorrecao(true);
  };

  const salvarCorrecao = async () => {
    if (!chaveAcessoValida(corrChave)) {
      setErro('A chave de acesso deve conter 44 dígitos.');
      return;
    }
    setCorrigindo(true);
    setErro('');
    try {
      const payload: Record<string, string> = {
        numero: corrNumero,
        serie: corrSerie,
        chaveAcesso: corrChave,
        observacoes: corrObservacoes,
      };
      if (corrConfirmar && nota?.status === 'PENDENTE_PROCESSAMENTO') {
        payload.status = 'PROCESSADA';
        payload.motivo = 'Dados conferidos manualmente antes da confirmação.';
      }
      await api.patch(`/notas-fiscais/${id}`, payload);
      setAbrirCorrecao(false);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setCorrigindo(false);
    }
  };

  const abrirVincularRecebimento = async () => {
    setErro('');
    try {
      const { data } = await api.get<ApiResponse<CandidatosRecebimento>>(`/notas-fiscais/${id}/recebimentos/candidatos`);
      setCandidatos(data.data);
      setCandidatoItemId(data.data?.itens?.[0]?.id ?? '');
      setCandidatoRecebimento(data.data?.recebimentos?.[0]?.entregaItemId ?? '');
      setVincQuantidade(data.data?.recebimentos?.[0]?.quantidadeDisponivel ?? '');
      setAbrirVinculo(true);
    } catch (e) {
      setErro(erroApi(e));
    }
  };

  const confirmarVinculo = async () => {
    const recebimento = candidatos?.recebimentos.find(r => r.entregaItemId === candidatoRecebimento);
    if (!candidatoItemId || !recebimento || !vincQuantidade) {
      setErro('Selecione o item da nota, o recebimento e a quantidade.');
      return;
    }
    setVinculando(true);
    setErro('');
    try {
      await api.post(`/notas-fiscais/${id}/recebimentos`, {
        notaFiscalItemId: candidatoItemId,
        entregaId: recebimento.entregaId,
        entregaItemId: recebimento.entregaItemId,
        quantidadeVinculada: vincQuantidade,
      });
      setAbrirVinculo(false);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setVinculando(false);
    }
  };

  const desvincular = async (vinculoId: string) => {
    setErro('');
    try {
      await api.delete(`/notas-fiscais/${id}/recebimentos/${vinculoId}`);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (erro && !nota) return <Alert severity="error">{erro}</Alert>;
  if (!nota) return <Alert severity="error">Nota fiscal não encontrada.</Alert>;

  const vinculoPermitido = podeVincularRecebimento(podeGerenciar, nota.status);
  const edicaoPermitida = podeCorrigirNota(podeGerenciar, nota.status);
  const confirmacaoPermitida = podeConfirmarNota(podeGerenciar, nota.status);
  const candidatoItensDisponiveis = candidatos?.itens.filter(i => Number(i.quantidadeDisponivel) > 0) ?? [];

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Tooltip title="Voltar"><IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton></Tooltip>
          <Typography variant="h4" fontWeight={700}>NF {nota.numero}</Typography>
          {nota.serie && <Chip size="small" label={`Série ${nota.serie}`} />}
          <Chip label={humanizeSystemValue(nota.status)} color={statusCores[nota.status] || 'default'} size="small" />
          {nota.resultadoConciliacao && (
            <Chip label={humanizeSystemValue(nota.resultadoConciliacao)} color={conciliacaoCores[nota.resultadoConciliacao] || 'default'} size="small" variant="outlined" />
          )}
          {podeGerenciar && !nota.resultadoConciliacao && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Warning />}
              onClick={executarConciliacao}
              disabled={conciliando}
            >
              {conciliando ? 'Conciliando…' : 'Conciliar'}
            </Button>
          )}
          {edicaoPermitida && (
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => abrirCorrecaoDados()}>
              Corrigir dados
            </Button>
          )}
          {confirmacaoPermitida && edicaoPermitida && (
            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => abrirCorrecaoDados(true)}
            >
              Confirmar dados
            </Button>
          )}
        </Stack>
        <Tooltip title="Atualizar"><IconButton onClick={carregar} disabled={loading}><Refresh /></IconButton></Tooltip>
      </Stack>

      {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}

      <Tabs value={aba} onChange={(_, v) => setAba(v)} variant="scrollable" scrollButtons="auto">
        <Tab icon={<Assignment />} label="Dados Gerais" />
        <Tab icon={<Description />} label="Itens" />
        <Tab icon={<Description />} label="Documentos" />
        <Tab icon={<LinkIcon />} label="Recebimentos" />
        <Tab icon={<Warning />} label="Conciliação" />
        <Tab icon={<History />} label="Histórico" />
      </Tabs>

      <Paper elevation={1} sx={{ p: 2 }}>
        {aba === 0 && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Número</Typography>
                <Typography>{nota.numero}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Série</Typography>
                <Typography>{nota.serie || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Modelo</Typography>
                <Typography>{nota.modelo || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Data de Emissão</Typography>
                <Typography>{new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Valor Total</Typography>
                <Typography fontWeight={600}>{moeda(nota.valorTotal)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Fornecedor</Typography>
                <Typography>{nota.fornecedor?.nome}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Contrato</Typography>
                <Typography>{nota.contrato?.numero}/{nota.contrato?.exercicio}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Chave de Acesso</Typography>
                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>{nota.chaveAcesso || '—'}</Typography>
              </Grid>
              {nota.observacoes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Observações</Typography>
                  <Typography>{nota.observacoes}</Typography>
                </Grid>
              )}
            </Grid>
          </Stack>
        )}

        {aba === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="center">Unidade</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Valor Unitário</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nota.itens.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell align="center">{item.unidadeComercial || '—'}</TableCell>
                    <TableCell align="right">{Number(item.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</TableCell>
                    <TableCell align="right">{moeda(item.valorUnitario)}</TableCell>
                    <TableCell align="right">{moeda(item.valorTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {aba === 2 && (
          <Stack spacing={2}>
            {nota.documentos.length === 0 ? (
              <Typography color="text.secondary">Nenhum documento anexado.</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell align="center">Versão</TableCell>
                      <TableCell>Gerado em</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nota.documentos.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell><Chip size="small" label={humanizeSystemValue(doc.tipo)} variant="outlined" /></TableCell>
                        <TableCell>{doc.titulo}</TableCell>
                        <TableCell align="center">v{doc.versao}</TableCell>
                        <TableCell>{doc.geradoEm ? new Date(doc.geradoEm).toLocaleString('pt-BR') : '—'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Baixar"><IconButton size="small" onClick={() => void baixarDocumento(doc.id, doc.titulo)}><Download /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )}

        {aba === 3 && (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Recebimentos vinculados</Typography>
              {vinculoPermitido && (
                <Button size="small" variant="outlined" startIcon={<AddLink />} onClick={() => void abrirVincularRecebimento()}>
                  Vincular recebimento
                </Button>
              )}
            </Stack>
            <Divider />
            {nota.vinculos.length === 0 ? (
              <Typography color="text.secondary">Nenhum recebimento vinculado.</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Entrega</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Item da nota</TableCell>
                      <TableCell align="right">Quantidade vinculada</TableCell>
                      <TableCell align="right">Valor vinculado</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nota.vinculos.map(vinc => (
                      <TableRow key={vinc.id}>
                        <TableCell>{vinc.entregaNumero || vinc.entregaId}</TableCell>
                        <TableCell><Chip size="small" label={humanizeSystemValue(vinc.entregaStatus)} /></TableCell>
                        <TableCell>{nota.itens.find(i => i.id === vinc.notaFiscalItemId)?.descricao ?? '—'}</TableCell>
                        <TableCell align="right">{Number(vinc.quantidadeVinculada).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</TableCell>
                        <TableCell align="right">{moeda(vinc.valorTotalVinculado)}</TableCell>
                        <TableCell align="right">
                          {vinculoPermitido && (
                            <Tooltip title="Desvincular recebimento">
                              <IconButton size="small" color="error" onClick={() => void desvincular(vinc.id)}>
                                <LinkOff fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {nota.recebimentos.length > 0 && (
              <>
                <Typography variant="subtitle1">Entregas relacionadas</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Número</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Data Recebimento</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {nota.recebimentos.map(rec => (
                        <TableRow key={rec.id}>
                          <TableCell>{rec.numero}</TableCell>
                          <TableCell><Chip size="small" label={humanizeSystemValue(rec.status)} /></TableCell>
                          <TableCell>{new Date(rec.dataRecebimento).toLocaleDateString('pt-BR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Stack>
        )}

        {aba === 4 && (
          <Stack spacing={2}>
            <Typography variant="h6">Conciliação</Typography>
            <Divider />
            {nota.conciliacao ? (
              <>
                <Chip label={humanizeSystemValue(nota.conciliacao.status)} color={conciliacaoCores[nota.conciliacao.status] || 'default'} />
                {nota.conciliacao.divergencias.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Descrição</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {nota.conciliacao.divergencias.map(div => (
                          <TableRow key={div.id}>
                            <TableCell><Chip size="small" label={humanizeSystemValue(div.tipo)} color="error" variant="outlined" /></TableCell>
                            <TableCell>{div.descricao}</TableCell>
                            <TableCell><Chip size="small" label={humanizeSystemValue(div.status)} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="success">Sem divergências de conciliação.</Alert>
                )}
              </>
            ) : (
              <Typography color="text.secondary">Conciliação não realizada.</Typography>
            )}
          </Stack>
        )}

        {aba === 5 && (
          <Stack spacing={2}>
            <Typography variant="h6">Conferências e Atestos</Typography>
            <Divider />
            {nota.conferencias.length === 0 && nota.atestos.length === 0 ? (
              <Typography color="text.secondary">Nenhuma conferência ou atesto registrado.</Typography>
            ) : (
              <>
                {nota.conferencias.length > 0 && (
                  <>
                    <Typography variant="subtitle1">Conferências</Typography>
                    {nota.conferencias.map(conf => (
                      <Card key={conf.id} variant="outlined" sx={{ p: 1 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                          <Chip size="small" label={humanizeSystemValue(conf.status)} color={conf.status === 'APROVADA' ? 'success' : conf.status === 'REJEITADA' ? 'error' : 'default'} />
                          <Typography variant="caption" color="text.secondary">{new Date(conf.dataConferencia).toLocaleString('pt-BR')}</Typography>
                          {conf.conferente && <Typography variant="caption" color="text.secondary">por {conf.conferente}</Typography>}
                        </Stack>
                        {conf.justificativa && <Typography variant="body2" sx={{ mt: 1 }}>Justificativa: {conf.justificativa}</Typography>}
                        {conf.ressalvas && <Typography variant="body2" color="warning.main">Ressalvas: {conf.ressalvas}</Typography>}
                      </Card>
                    ))}
                  </>
                )}
                {nota.atestos.length > 0 && (
                  <>
                    <Typography variant="subtitle1">Atestos</Typography>
                    {nota.atestos.map(atesto => (
                      <Card key={atesto.id} variant="outlined" sx={{ p: 1 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                          <Chip size="small" label={humanizeSystemValue(atesto.status)} color={atesto.status === 'ATESTADO' ? 'success' : 'default'} />
                          <Typography variant="caption" color="text.secondary">{new Date(atesto.dataAtesto).toLocaleString('pt-BR')}</Typography>
                          <Typography variant="caption">Valor: {moeda(atesto.valorAtestado)}</Typography>
                        </Stack>
                        {atesto.justificativa && <Typography variant="body2" sx={{ mt: 1 }}>Justificativa: {atesto.justificativa}</Typography>}
                      </Card>
                    ))}
                  </>
                )}
              </>
            )}
          </Stack>
        )}
      </Paper>

      {/* Correção de dados (operação manual antes do atesto/cancelamento) */}
      <Dialog open={abrirCorrecao} onClose={() => setAbrirCorrecao(false)} fullWidth maxWidth="sm">
        <DialogTitle>Corrigir dados da nota fiscal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Correção administrativa dos dados extraídos/cadastrados. Após o atesto ou cancelamento a edição
              fica bloqueada.
            </Typography>
            <TextField label="Número" value={corrNumero} onChange={e => setCorrNumero(e.target.value)} fullWidth />
            <TextField label="Série" value={corrSerie} onChange={e => setCorrSerie(e.target.value)} fullWidth />
            <TextField
              label="Chave de acesso (44 dígitos)"
              value={corrChave}
              onChange={e => setCorrChave(e.target.value.replace(/\D/g, ''))}
              inputProps={{ maxLength: 44 }}
              fullWidth
            />
            <TextField label="Observações" value={corrObservacoes} onChange={e => setCorrObservacoes(e.target.value)} multiline rows={3} fullWidth />
            {nota.status === 'PENDENTE_PROCESSAMENTO' && (
              <Alert severity="info">
                Marque para confirmar os dados conferidos: a nota avançará para PROCESSADA.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirCorrecao(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void salvarCorrecao()} disabled={corrigindo}>
            {corrigindo ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vincular recebimento (entrega aceita) à nota */}
      <Dialog open={abrirVinculo} onClose={() => setAbrirVinculo(false)} fullWidth maxWidth="sm">
        <DialogTitle>Vincular recebimento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Associe um recebimento (entrega aceita) ao item da nota. A quantidade é validada contra o
              faturado do item e a quantidade aceita do recebimento.
            </Typography>
            {candidatos && candidatos.recebimentos.length === 0 ? (
              <Alert severity="warning">Não há recebimentos aceitas disponíveis para este contrato/fornecedor.</Alert>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>Item da nota</InputLabel>
                  <Select value={candidatoItemId} label="Item da nota" onChange={e => setCandidatoItemId(e.target.value)}>
                    {candidatoItensDisponiveis.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.descricao} — disponível {Number(item.quantidadeDisponivel).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Recebimento (entrega aceita)</InputLabel>
                  <Select
                    value={candidatoRecebimento}
                    label="Recebimento (entrega aceita)"
                    onChange={e => {
                      const r = candidatos?.recebimentos.find(x => x.entregaItemId === e.target.value);
                      setCandidatoRecebimento(e.target.value);
                      setVincQuantidade(r?.quantidadeDisponivel ?? '');
                    }}
                  >
                    {candidatos?.recebimentos.map(rec => (
                      <MenuItem key={rec.entregaItemId} value={rec.entregaItemId}>
                        {rec.entregaNumero} — {rec.produto} — disp. {Number(rec.quantidadeDisponivel).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField label="Quantidade a vincular" value={vincQuantidade} onChange={e => setVincQuantidade(e.target.value)} fullWidth />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirVinculo(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => void confirmarVinculo()}
            disabled={vinculando || !candidatos || candidatos.recebimentos.length === 0}
          >
            {vinculando ? <CircularProgress size={20} /> : 'Vincular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
