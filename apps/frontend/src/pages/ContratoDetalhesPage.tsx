import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tabs, Tab, TextField, Tooltip, Typography, Divider, Accordion, AccordionSummary, AccordionDetails,
  Avatar, Badge, Paper,
} from '@mui/material';
import {
  Download, Edit, Visibility, ContentCopy, Refresh, Close, ExpandMore,
  PictureAsPdf, Description, Gavel, History, Assignment, Person, Business, Event, AttachMoney,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { humanizeSystemValue } from '../lib/display-text';

interface Contrato {
  id: string;
  numero: string;
  exercicio: number;
  status: string;
  valorInicial: string;
  valorAtualizado: string;
  objeto?: string | null;
  observacoes?: string | null;
  condicoesFornecimento?: string | null;
  condicoesPagamento?: string | null;
  fiscalizacao?: string | null;
  dataAssinatura?: string | null;
  vigenciaInicio?: string | null;
  vigenciaFim?: string | null;
  instrumentoExternoRegistrado: boolean;
  instrumentoRegistradoEm?: string | null;
  createdAt: string;
  updatedAt: string;
  edital: { id: string; numero: string; ano: number; titulo: string; municipio?: { nome: string; uf: string } | null; documento?: { processoAdministrativo?: string | null } };
  produtor: { id: string; nome: string; cpfCnpj?: string | null; endereco?: string | null; telefone?: string | null } | null;
  escola?: { id: string; nome: string } | null;
  dre?: { id: string; nome: string; codigo: string } | null;
  municipio?: { id: string; nome: string; uf: string } | null;
  itens: Array<{ id: string; produto: string; descricao?: string | null; unidade: string; quantidadeContratada: string; valorUnitario: string; valorTotal: string; quantidadeAditivada: string; quantidadeDisponivel: string }>;
  aditivos: Array<{
    id: string; numeroSequencial: number; tipo: string; tipoOutro?: string | null;
    justificativa: string; data?: string | null; vigenciaFim?: string | null;
    valorAlteracao: string; status: string; formalizadoEm?: string | null;
    itens: Array<{ contratoItemId: string; quantidadeAnterior: string; quantidadeNova: string; valorUnitarioNovo: string; valorTotalNovo: string }>;
  }>;
  documentos: Array<{ id: string; tipo: string; versao: number; titulo: string; formalizado: boolean; hashSha256?: string | null; geradoEm?: string | null; assinaturaDigital: boolean; origemAssinatura?: string | null }>;
  signatarios: Array<{ id: string; nome: string; cargo?: string | null; papel: string; enviadoEm?: string | null; documentoRegistradoEm?: string | null }>;
  pendencias: Array<{ codigo: string; mensagem: string; bloqueiaConferencia: boolean; bloqueiaFormalizacao: boolean }>;
  historico?: any[];
  auditoria?: any[];
}

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  RASCUNHO: 'default', EM_CONFERENCIA: 'warning', AGUARDANDO_ASSINATURA: 'info',
  VIGENTE: 'success', SUSPENSO: 'warning', ENCERRADO: 'default',
  RESCINDIDO: 'error', CANCELADO: 'error',
};

const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho', EM_CONFERENCIA: 'Em conferência', AGUARDANDO_ASSINATURA: 'Aguardando assinatura',
  VIGENTE: 'Vigente', SUSPENSO: 'Suspenso', ENCERRADO: 'Encerrado',
  RESCINDIDO: 'Rescindido', CANCELADO: 'Cancelado',
};

const tipoAditivoLabels: Record<string, string> = {
  PRAZO: 'Prazo', VALOR: 'Valor', QUANTIDADE: 'Quantidade', RETIFICACAO: 'Retificação', OUTRO: 'Outro',
};

const tipoDocLabels: Record<string, string> = {
  MINUTA: 'Minuta', CONTRATO_ASSINADO: 'Contrato assinado', ADITIVO: 'Aditivo', COMPLEMENTAR: 'Complementar',
};

export default function ContratoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const podeGerenciar = user?.role === 'ADMIN' || user?.role === 'DRE';
  const podeVerAuditoria = user?.role === 'ADMIN';

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [openAnexar, setOpenAnexar] = useState(false);
  const [anexarTipo, setAnexarTipo] = useState<'CONTRATO_ASSINADO' | 'COMPLEMENTAR' | 'ADITIVO'>('CONTRATO_ASSINADO');
  const [anexarAditivoId, setAnexarAditivoId] = useState('');
  const [anexarFile, setAnexarFile] = useState<File | null>(null);
  const [anexarTitulo, setAnexarTitulo] = useState('');
  const [anexarObs, setAnexarObs] = useState('');
  const [anexarLoading, setAnexarLoading] = useState(false);
  const [openMinuta, setOpenMinuta] = useState(false);
  const [minutaLoading, setMinutaLoading] = useState(false);
  const [minutaResult, setMinutaResult] = useState<{ pendentes: string[]; documentos: any[] } | null>(null);
  const [openAditivo, setOpenAditivo] = useState(false);
  const [aditivoForm, setAditivoForm] = useState({ tipo: 'PRAZO', tipoOutro: '', justificativa: '', vigenciaFim: '', valorAlteracao: '', itens: [] as any[] });
  const [aditivoLoading, setAditivoLoading] = useState(false);
  const [openTransicao, setOpenTransicao] = useState(false);
  const [transicaoForm, setTransicaoForm] = useState({ para: 'SUSPENSO', motivo: '' });
  const [transicaoLoading, setTransicaoLoading] = useState(false);
  const [openEnviarAssinatura, setOpenEnviarAssinatura] = useState(false);
  const [assinaturaSignatarios, setAssinaturaSignatarios] = useState<Array<{ nome: string; cargo: string; papel: 'CONTRATANTE' | 'CONTRATADO' | 'TESTEMUNHA' }>>([]);
  const [assinaturaLoading, setAssinaturaLoading] = useState(false);
  const [openFormalizar, setOpenFormalizar] = useState(false);
  const [formalizarData, setFormalizarData] = useState('');
  const [formalizarDocId, setFormalizarDocId] = useState('');
  const [formalizarLoading, setFormalizarLoading] = useState(false);
  const [encaminharLoading, setEncaminharLoading] = useState(false);
  const [validarLoading, setValidarLoading] = useState(false);
  const [validarResult, setValidarResult] = useState<any>(null);

  const fetchContrato = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Contrato>>(`/contratos/${id}`);
      setContrato(data.data);
    } catch {
      setError('Não foi possível carregar o contrato.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchContrato(); }, [fetchContrato]);

  const fmtData = (d?: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const fmtMoeda = (v: string) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtQtd = (v: string) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 });

  const handleAnexar = async () => {
    if (!anexarFile) return;
    setAnexarLoading(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', anexarFile);
      formData.append('tipo', anexarTipo);
      formData.append('titulo', anexarTitulo);
      if (anexarAditivoId) formData.append('aditivoId', anexarAditivoId);
      if (anexarObs) formData.append('observacao', anexarObs);
      await api.post(`/contratos/${id}/documentos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOpenAnexar(false);
      setAnexarFile(null);
      setAnexarTitulo('');
      setAnexarAditivoId('');
      setAnexarObs('');
      void fetchContrato();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao anexar documento.');
    } finally {
      setAnexarLoading(false);
    }
  };

  const handleGerarMinuta = async () => {
    setMinutaLoading(true);
    try {
      const { data } = await api.post<ApiResponse<any>>(`/contratos/${id}/minuta`);
      setMinutaResult(data.data);
      setOpenMinuta(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao gerar minuta.');
    } finally {
      setMinutaLoading(false);
    }
  };

  const handleCriarAditivo = async () => {
    setAditivoLoading(true);
    try {
      await api.post(`/contratos/${id}/aditivos`, aditivoForm);
      setOpenAditivo(false);
      void fetchContrato();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao criar aditivo.');
    } finally {
      setAditivoLoading(false);
    }
  };

  const handleFormalizarAditivo = async (aditivoId: string) => {
    try {
      await api.post(`/contratos/${id}/aditivos/${aditivoId}/formalizar`);
      void fetchContrato();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao formalizar aditivo.');
    }
  };

  const handleTransicao = async () => {
    setTransicaoLoading(true);
    try {
      await api.patch(`/contratos/${id}/transicao`, transicaoForm);
      setOpenTransicao(false);
      setTransicaoForm({ para: 'SUSPENSO', motivo: '' });
      void fetchContrato();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro na transição.');
    } finally {
      setTransicaoLoading(false);
    }
  };

  const handleEnviarAssinatura = async () => {
    setAssinaturaLoading(true);
    try {
      await api.post(`/contratos/${id}/enviar-assinatura`, { signatarios: assinaturaSignatarios });
      setOpenEnviarAssinatura(false);
      void fetchContrato();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao enviar para assinatura.');
    } finally {
      setAssinaturaLoading(false);
    }
  };

  const handleFormalizar = async () => {
    setFormalizarLoading(true);
    try {
      await api.post(`/contratos/${id}/formalizar`, { dataFormalizacao: formalizarData, documentoId: formalizarDocId });
      setOpenFormalizar(false);
      void fetchContrato();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao formalizar.');
    } finally {
      setFormalizarLoading(false);
    }
  };

  const handleEncaminharConferencia = async () => {
    setEncaminharLoading(true);
    try {
      await api.post(`/contratos/${id}/encaminhar-conferencia`);
      void fetchContrato();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao encaminhar para conferência.');
    } finally {
      setEncaminharLoading(false);
    }
  };

  const handleValidar = async () => {
    setValidarLoading(true);
    try {
      const { data } = await api.post<ApiResponse<any>>(`/contratos/${id}/validar`);
      setValidarResult(data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro na validação.');
    } finally {
      setValidarLoading(false);
    }
  };

  const downloadDocumento = async (documentoId: string, nome: string) => {
    try {
      const blob = await api.get(`/contratos/${id}/documentos/${documentoId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([blob.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nome);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError('Não foi possível baixar o documento.');
    }
  };

  if (loading) return <CircularProgress />;
  if (error && !contrato) return <Alert severity="error">{error}</Alert>;
  if (!contrato) return <Alert severity="error">Contrato não encontrado.</Alert>;

  const acoesResumo = (
    <>
      <Tooltip title="Voltar"><IconButton onClick={() => navigate(-1)}><Close /></IconButton></Tooltip>
      {podeGerenciar && contrato.status === 'RASCUNHO' && (
        <Tooltip title="Editar"><IconButton onClick={() => navigate(`/contratos/${id}/editar`)}><Edit /></IconButton></Tooltip>
      )}
      {podeVerAuditoria && <Tooltip title="Auditoria"><IconButton onClick={() => navigate(`/contratos/${id}/auditoria`)}><ContentCopy /></IconButton></Tooltip>}
      <Tooltip title="Atualizar"><IconButton onClick={fetchContrato} disabled={loading}><Refresh /></IconButton></Tooltip>
    </>
  );

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <div>
          <Stack direction="row" spacing={1}>
            <Typography variant="h4" fontWeight={700}>{contrato.numero}</Typography>
            <Chip size="small" label={statusLabels[contrato.status] || humanizeSystemValue(contrato.status)} color={statusColors[contrato.status] || 'default'} />
            <Typography variant="body2" color="text.secondary">Exercício {contrato.exercicio}</Typography>
          </Stack>
          <Typography color="text.secondary">{contrato.edital.titulo} — Edital {contrato.edital.numero}/{contrato.edital.ano}</Typography>
        </div>
        {acoesResumo}
      </Stack>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        <Tab icon={<Assignment />} label="Resumo" />
        <Tab icon={<Inventory2 />} label="Itens" />
        <Tab icon={<Description />} label="Documentos" />
        <Tab icon={<Person />} label="Assinaturas" />
        <Tab icon={<Gavel />} label="Aditivos" />
        <Tab icon={<History />} label="Histórico" />
        {podeVerAuditoria && <Tab icon={<Visibility />} label="Auditoria" />}
      </Tabs>

      <Paper elevation={1} sx={{ p: 2 }}>
        {tab === 0 && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><Typography variant="h6" color="text.secondary">Dados do contrato</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography variant="h6" color="text.secondary">Vigência & Valores</Typography></Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Número</Typography>
                <Typography>{contrato.numero}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Vigência</Typography>
                <Typography>{fmtData(contrato.vigenciaInicio)} — {fmtData(contrato.vigenciaFim)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Data assinatura</Typography>
                <Typography>{fmtData(contrato.dataAssinatura)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Instrumento registrado</Typography>
                <Typography>{contrato.instrumentoExternoRegistrado ? 'Sim' : 'Não'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Fornecedor</Typography>
                <Typography>{contrato.produtor?.nome || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Valor inicial</Typography>
                <Typography>{fmtMoeda(contrato.valorInicial)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">DRE</Typography>
                <Typography>{contrato.dre?.nome || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Valor atualizado</Typography>
                <Typography fontWeight={600}>{fmtMoeda(contrato.valorAtualizado)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Unidade</Typography>
                <Typography>{contrato.escola?.nome || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Município</Typography>
                <Typography>{contrato.municipio?.nome || '—'}/{contrato.municipio?.uf || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Edital</Typography>
                <Typography>{contrato.edital.numero}/{contrato.edital.ano}</Typography>
              </Grid>
            </Grid>
            <Divider />
            {contrato.objeto && (
              <Stack spacing={1}>
                <Typography variant="h6" color="text.secondary">Objeto</Typography>
                <Typography>{contrato.objeto}</Typography>
              </Stack>
            )}
            {contrato.condicoesFornecimento && (
              <Stack spacing={1}>
                <Typography variant="h6" color="text.secondary">Condições de fornecimento</Typography>
                <Typography>{contrato.condicoesFornecimento}</Typography>
              </Stack>
            )}
            {contrato.condicoesPagamento && (
              <Stack spacing={1}>
                <Typography variant="h6" color="text.secondary">Condições de pagamento</Typography>
                <Typography>{contrato.condicoesPagamento}</Typography>
              </Stack>
            )}
            {contrato.fiscalizacao && (
              <Stack spacing={1}>
                <Typography variant="h6" color="text.secondary">Fiscalização</Typography>
                <Typography>{contrato.fiscalizacao}</Typography>
              </Stack>
            )}
            <Divider />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {podeGerenciar && contrato.status === 'RASCUNHO' && (
                <Button variant="contained" startIcon={<Visibility />} onClick={handleValidar} disabled={validarLoading}>
                  {validarLoading ? <CircularProgress size={18} color="inherit" /> : 'Validar'}
                </Button>
              )}
              {podeGerenciar && contrato.status === 'RASCUNHO' && (
                <Button variant="outlined" startIcon={<Event />} onClick={handleEncaminharConferencia} disabled={encaminharLoading}>
                  {encaminharLoading ? <CircularProgress size={18} color="inherit" /> : 'Encaminhar para conferência'}
                </Button>
              )}
              {podeGerenciar && contrato.status === 'EM_CONFERENCIA' && (
                <Button variant="contained" startIcon={<Person />} onClick={() => setOpenEnviarAssinatura(true)}>
                  Enviar para assinatura
                </Button>
              )}
              {podeGerenciar && contrato.status === 'AGUARDANDO_ASSINATURA' && (
                <Button variant="contained" startIcon={<AttachMoney />} onClick={() => {
                  setFormalizarData(new Date().toISOString().slice(0, 10));
                  setOpenFormalizar(true);
                }}>
                  Formalizar
                </Button>
              )}
              {podeGerenciar && contrato.status === 'VIGENTE' && (
                <>
                  <Button variant="outlined" startIcon={<Gavel />} onClick={() => setOpenAditivo(true)}>Novo aditivo</Button>
                  <Button variant="outlined" startIcon={<ExpandMore />} onClick={() => { setTransicaoForm({ para: 'SUSPENSO', motivo: '' }); setOpenTransicao(true); }}>Suspender</Button>
                  <Button variant="outlined" startIcon={<Close />} onClick={() => { setTransicaoForm({ para: 'ENCERRADO', motivo: '' }); setOpenTransicao(true); }}>Encerrar</Button>
                  <Button variant="outlined" startIcon={<ContentCopy />} onClick={() => { setTransicaoForm({ para: 'RESCINDIDO', motivo: '' }); setOpenTransicao(true); }}>Rescindir</Button>
                </>
              )}
            </Stack>
            {validarResult && (
              <Alert severity={validarResult.pendencias?.length ? 'warning' : 'success'}>
                {validarResult.pendencias?.length ? (
                  <Stack spacing={1}>
                    <Typography variant="body2" fontWeight={600}>Pendências ({validarResult.pendencias.length})</Typography>
                    {validarResult.pendencias.map((p: string, i: number) => <Typography key={i} variant="body2" color="error">• {p}</Typography>)}
                  </Stack>
                ) : (
                  <Typography>Validação OK — sem pendências bloqueantes.</Typography>
                )}
              </Alert>
            )}
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Produto / Descrição</TableCell>
                    <TableCell align="center">Unid.</TableCell>
                    <TableCell align="right">Qtd. contratada</TableCell>
                    <TableCell align="right">Vlr. unitário</TableCell>
                    <TableCell align="right">Vlr. total</TableCell>
                    <TableCell align="right">Qtd. aditivada</TableCell>
                    <TableCell align="right">Qtd. disponível</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contrato.itens.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.descricao ? `${item.produto} — ${item.descricao}` : item.produto}</TableCell>
                      <TableCell align="center">{item.unidade || '—'}</TableCell>
                      <TableCell align="right">{fmtQtd(item.quantidadeContratada)}</TableCell>
                      <TableCell align="right">{fmtMoeda(item.valorUnitario)}</TableCell>
                      <TableCell align="right">{fmtMoeda(item.valorTotal)}</TableCell>
                      <TableCell align="right">{fmtQtd(item.quantidadeAditivada)}</TableCell>
                      <TableCell align="right">{fmtQtd(item.quantidadeDisponivel)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {podeGerenciar && !['ENCERRADO', 'RESCINDIDO', 'CANCELADO'].includes(contrato.status) && (
                <Button variant="outlined" startIcon={<Description />} onClick={() => { setAnexarTipo('CONTRATO_ASSINADO'); setOpenAnexar(true); }}>
                  Anexar contrato assinado
                </Button>
              )}
              {podeGerenciar && !['ENCERRADO', 'RESCINDIDO', 'CANCELADO'].includes(contrato.status) && (
                <Button variant="outlined" startIcon={<AttachMoney />} onClick={() => { setAnexarTipo('COMPLEMENTAR'); setOpenAnexar(true); }}>
                  Anexar complementar
                </Button>
              )}
              {podeGerenciar && contrato.status === 'VIGENTE' && (
                <Button variant="outlined" startIcon={<Gavel />} onClick={() => { setAnexarTipo('ADITIVO'); setOpenAnexar(true); }}>
                  Anexar aditivo
                </Button>
              )}
              <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleGerarMinuta} disabled={minutaLoading}>
                {minutaLoading ? <CircularProgress size={18} color="inherit" /> : 'Gerar minuta'}
              </Button>
            </Stack>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell align="center">Versão</TableCell>
                    <TableCell>Gerado em</TableCell>
                    <TableCell>Formalizado</TableCell>
                    <TableCell>Integridade</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contrato.documentos.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell><Chip size="small" label={tipoDocLabels[doc.tipo] || doc.tipo} color="default" variant="outlined" /></TableCell>
                      <TableCell>{doc.titulo}</TableCell>
                      <TableCell align="center">v{doc.versao}</TableCell>
                      <TableCell>{doc.geradoEm ? new Date(doc.geradoEm).toLocaleString('pt-BR') : '—'}</TableCell>
                      <TableCell>{doc.formalizado ? <Chip size="small" label="Sim" color="success" icon={<CheckCircle />} /> : <Chip size="small" label="Não" color="default" />}</TableCell>
                      <TableCell>
                        {doc.hashSha256 ? (
                          <Chip size="small" label="Conferida" color="success" icon={<CheckCircle />} />
                        ) : (
                          <Chip size="small" label="Sem hash" color="warning" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Baixar"><IconButton size="small" onClick={() => downloadDocumento(doc.id, doc.titulo)}><Download /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {tab === 3 && (
          <Stack spacing={2}>
            {podeGerenciar && contrato.status === 'EM_CONFERENCIA' && (
              <Button variant="contained" startIcon={<Person />} onClick={() => setOpenEnviarAssinatura(true)}>
                Registrar signatários e enviar para assinatura
              </Button>
            )}
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Papel</TableCell>
                    <TableCell>Enviado em</TableCell>
                    <TableCell>Documento registrado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contrato.signatarios.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{s.nome}</TableCell>
                      <TableCell>{s.cargo || '—'}</TableCell>
                      <TableCell><Chip size="small" label={humanizeSystemValue(s.papel)} color="default" variant="outlined" /></TableCell>
                      <TableCell>{s.enviadoEm ? new Date(s.enviadoEm).toLocaleString('pt-BR') : '—'}</TableCell>
                      <TableCell>{s.documentoRegistradoEm ? new Date(s.documentoRegistradoEm).toLocaleString('pt-BR') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {tab === 4 && (
          <Stack spacing={2}>
            {podeGerenciar && contrato.status === 'VIGENTE' && (
              <Button variant="contained" startIcon={<Gavel />} onClick={() => setOpenAditivo(true)}>Novo aditivo</Button>
            )}
            <Divider />
            {contrato.aditivos.length === 0 ? (
              <Typography color="text.secondary">Nenhum aditivo.</Typography>
            ) : (
              contrato.aditivos.map(aditivo => (
                <Accordion key={aditivo.id} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                      <Chip size="small" label={`Aditivo ${aditivo.numeroSequencial}`} color="primary" />
                      <Chip size="small" label={tipoAditivoLabels[aditivo.tipo] || aditivo.tipo} color="default" variant="outlined" />
                      <Chip size="small" label={humanizeSystemValue(aditivo.status)} color={aditivo.status === 'FORMALIZADO' ? 'success' : 'default'} />
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        {aditivo.data ? new Date(aditivo.data).toLocaleDateString('pt-BR') : '—'}
                        {aditivo.vigenciaFim ? ` — Nova vigência até ${new Date(aditivo.vigenciaFim).toLocaleDateString('pt-BR')}` : ''}
                      </Typography>
                      {aditivo.status !== 'FORMALIZADO' && podeGerenciar && (
                        <Button size="small" onClick={() => handleFormalizarAditivo(aditivo.id)}>Formalizar</Button>
                      )}
                      {aditivo.status === 'FORMALIZADO' && aditivo.valorAlteracao && (
                        <Typography variant="body2">Valor alteração: {fmtMoeda(aditivo.valorAlteracao)}</Typography>
                      )}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">Justificativa</Typography>
                      <Typography>{aditivo.justificativa}</Typography>
                      <Divider />
                      <Typography variant="body2" color="text.secondary">Itens alterados</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item ID</TableCell>
                              <TableCell align="right">Qtd. anterior</TableCell>
                              <TableCell align="right">Qtd. nova</TableCell>
                              <TableCell align="right">Vlr. unit. novo</TableCell>
                              <TableCell align="right">Vlr. total novo</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {aditivo.itens.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell>{item.contratoItemId.slice(0, 8)}...</TableCell>
                                <TableCell align="right">{fmtQtd(item.quantidadeAnterior)}</TableCell>
                                <TableCell align="right">{fmtQtd(item.quantidadeNova)}</TableCell>
                                <TableCell align="right">{fmtMoeda(item.valorUnitarioNovo)}</TableCell>
                                <TableCell align="right">{fmtMoeda(item.valorTotalNovo)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Stack>
        )}

        {tab === 5 && (
          <Stack spacing={1}>
            {contrato.historico?.length ? (
              contrato.historico.map((h: any, i: number) => (
                <Paper key={i} elevation={0} variant="outlined" sx={{ p: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={humanizeSystemValue(h.acao)} color="default" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">{new Date(h.criadoEm).toLocaleString('pt-BR')}</Typography>
                    <Typography variant="caption" color="text.secondary">por {h.papel || 'sistema'}</Typography>
                    {h.anterior && <Button size="small" variant="text" onClick={() => { /* show diff */ }}>Ver anterior</Button>}
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary">Sem histórico.</Typography>
            )}
          </Stack>
        )}

        {tab === 6 && podeVerAuditoria && (
          <Stack spacing={1}>
            {contrato.auditoria?.length ? (
              contrato.auditoria.map((a: any, i: number) => (
                <Paper key={i} elevation={0} variant="outlined" sx={{ p: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={humanizeSystemValue(a.action)} color="default" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">{new Date(a.createdAt).toLocaleString('pt-BR')}</Typography>
                    <Typography variant="caption" color="text.secondary">IP: {a.ipAddress || '—'}</Typography>
                    <Button size="small" variant="text" onClick={() => { /* show details */ }}>Detalhes</Button>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary">Sem registros de auditoria.</Typography>
            )}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}

import { CheckCircle } from '@mui/icons-material';
import Inventory2 from '@mui/icons-material/Inventory2';
