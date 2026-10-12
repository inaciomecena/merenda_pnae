import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography, FormControl, InputLabel, Select, Divider, Stepper, Step,
  StepLabel, Paper,
} from '@mui/material';
import { ArrowBack, ArrowForward, Save, CheckCircle, Cancel, Edit, Visibility } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { humanizeSystemValue } from '../lib/display-text';

interface Edital { id: string; numero: string; ano: number; titulo: string; objeto?: string | null; status: string; escolaId?: string | null; escola?: { id: string; nome: string } | null; municipio?: { id: string; nome: string; uf: string } | null; escolasVinculadas: Array<{ escola: { id: string; nome: string } }>; }
interface Proposta { id: string; numero: string; tipoDocumento: string; status: string; produtor: { id: string; nome: string } | null; itens: Array<{ id: string; produto: string; especificacao?: string | null; quantidade?: number | null; unidade?: string | null; precoUnitario?: number | null; match?: { editalItemId: string } | null }>; }
interface Produtor { id: string; nome: string; cpfCnpj?: string | null; }
interface Escola { id: string; nome: string; }
interface DRE { id: string; nome: string; codigo: string; }
interface Municipio { id: string; nome: string; uf: string; }

interface ItemPreview {
  propostaItemId: string;
  editalItemId?: string | null;
  produto: string;
  descricao?: string | null;
  unidade: string;
  quantidadeProposta?: string | null;
  valorUnitario?: string | null;
  quantidadeEdital?: string | null;
  valorEdital?: string | null;
  quantidadeComprometidaEdital?: string | null;
  quantidadeComprometidaProposta?: string | null;
  quantidadeContratada?: string;
  valorTotal?: string;
  bloqueio?: string;
  pendencia?: string;
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^\d+(\.\d{1,4})?$/;

export default function ContratoFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const podeCriar = user?.role === 'ADMIN' || user?.role === 'DRE';

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Edital
  const [editais, setEditais] = useState<Edital[]>([]);
  const [editalId, setEditalId] = useState('');
  const [editalSelecionado, setEditalSelecionado] = useState<Edital | null>(null);

  // Step 2: Proposta/Fornecedor
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [propostaId, setPropostaId] = useState('');
  const [propostaSelecionada, setPropostaSelecionada] = useState<Proposta | null>(null);
  const [origemPreview, setOrigemPreview] = useState<ItemPreview[]>([]);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, string>>({});

  // Step 3: Dados contratuais
  const [numero, setNumero] = useState('');
  const [exercicio, setExercicio] = useState(new Date().getFullYear());
  const [escolaId, setEscolaId] = useState('');
  const [dreId, setDreId] = useState('');
  const [municipioId, setMunicipioId] = useState('');
  const [escolasDisponiveis, setEscolasDisponiveis] = useState<Escola[]>([]);
  const [dresDisponiveis, setDresDisponiveis] = useState<DRE[]>([]);
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<Municipio[]>([]);
  const [objeto, setObjeto] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [vigenciaInicio, setVigenciaInicio] = useState('');
  const [vigenciaFim, setVigenciaFim] = useState('');
  const [condicoesFornecimento, setCondicoesFornecimento] = useState('');
  const [condicoesPagamento, setCondicoesPagamento] = useState('');
  const [fiscalizacao, setFiscalizacao] = useState('');

  // Step 4: Revisão
  const [revisaoContrato, setRevisaoContrato] = useState<any>(null);

  const fetchEditais = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<any>>('/editais?limit=200');
      setEditais(data.data.items ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchPropostas = useCallback(async (editalId: string) => {
    try {
      const { data } = await api.get<ApiResponse<any>>(`/propostas?editalId=${editalId}&limit=200`);
      setPropostas(data.data.items ?? []);
    } catch { setPropostas([]); }
  }, []);

  const fetchOrigem = useCallback(async (editalId: string, propostaId: string) => {
    try {
      const { data } = await api.get<ApiResponse<any>>(`/contratos/origens/${editalId}`);
      const propostaData = data.data.propostas?.find((p: any) => p.id === propostaId);
      if (propostaData) {
        setOrigemPreview(propostaData.itens || []);
        setPropostaSelecionada(propostaData);
        const sel: Record<string, string> = {};
        (propostaData.itens || []).forEach((item: any) => {
          if (item.selecionado) sel[item.propostaItemId] = item.selecionado.quantidadeContratada || '';
        });
        setItensSelecionados(sel);
      }
    } catch { setOrigemPreview([]); }
  }, []);

  const fetchEscolasDreMunicipios = useCallback(async (edital: Edital) => {
    const escolasMap = new Map<string, Escola>();
    if (edital.escola) escolasMap.set(edital.escola.id, edital.escola);
    for (const v of edital.escolasVinculadas || []) escolasMap.set(v.escola.id, v.escola);
    setEscolasDisponiveis([...escolasMap.values()]);
    try {
      const [{ data: dreData }, { data: munData }] = await Promise.all([
        api.get<ApiResponse<DRE[]>>('/dres'),
        api.get<ApiResponse<any>>('/municipios?limit=500'),
      ]);
      setDresDisponiveis(dreData.data ?? []);
      setMunicipiosDisponiveis(munData.data.items ?? []);
    } catch { /* ignore */ }
  }, []);

  const loadContrato = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<any>>(`/contratos/${id}`);
      const c = data.data;
      setEditalId(c.editalId);
      setPropostaId(c.propostaId);
      setNumero(c.numero);
      setExercicio(c.exercicio);
      setEscolaId(c.escolaId || '');
      setDreId(c.dreId || '');
      setMunicipioId(c.municipioId || '');
      setObjeto(c.objeto || '');
      setObservacoes(c.observacoes || '');
      setVigenciaInicio(c.vigenciaInicio ? c.vigenciaInicio.slice(0, 10) : '');
      setVigenciaFim(c.vigenciaFim ? c.vigenciaFim.slice(0, 10) : '');
      setCondicoesFornecimento(c.condicoesFornecimento || '');
      setCondicoesPagamento(c.condicoesPagamento || '');
      setFiscalizacao(c.fiscalizacao || '');
      // carregar origens para preenchimento
      await fetchOrigem(c.editalId, c.propostaId);
      await fetchEscolasDreMunicipios({ ...c.edital, escolasVinculadas: [] });
      if (c.escola) setEscolaId(c.escola.id);
      if (c.dre) setDreId(c.dre.id);
      if (c.municipio) setMunicipioId(c.municipio.id);
    } catch {
      setError('Não foi possível carregar o contrato.');
    } finally {
      setLoading(false);
    }
  }, [id, fetchOrigem, fetchEscolasDreMunicipios]);

  useEffect(() => { void fetchEditais(); }, [fetchEditais]);
  useEffect(() => { if (isEdit) void loadContrato(); else setLoading(false); }, [isEdit, loadContrato]);
  useEffect(() => { if (editalId) { void fetchPropostas(editalId); const ed = editais.find(e => e.id === editalId); if (ed) { setEditalSelecionado(ed); fetchEscolasDreMunicipios(ed); } } }, [editalId, fetchPropostas, fetchEscolasDreMunicipios, editais]);
  useEffect(() => { if (editalId && propostaId) void fetchOrigem(editalId, propostaId); }, [editalId, propostaId, fetchOrigem]);

  const handleNext = () => {
    if (activeStep === 0 && !editalId) { setError('Selecione um edital.'); return; }
    if (activeStep === 1 && !propostaId) { setError('Selecione uma proposta/fornecedor.'); return; }
    if (activeStep === 2) {
      if (!numero.trim()) { setError('Número do contrato é obrigatório.'); return; }
      if (!escolaId) { setError('Unidade contratante é obrigatória.'); return; }
      if (!dreId) { setError('DRE responsável é obrigatória.'); return; }
      if (!municipioId) { setError('Município é obrigatório.'); return; }
      if (!vigenciaInicio || !vigenciaFim) { setError('Início e fim de vigência são obrigatórios.'); return; }
      if (!DATA.test(vigenciaInicio) || !DATA.test(vigenciaFim)) { setError('Datas inválidas. Use AAAA-MM-DD.'); return; }
      if (vigenciaFim < vigenciaInicio) { setError('Fim de vigência não pode ser anterior ao início.'); return; }
      if (!Object.keys(itensSelecionados).length) { setError('Selecione pelo menos um item.'); return; }
    }
    setError('');
    if (activeStep === 2) montarRevisao();
    setActiveStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const montarRevisao = () => {
    const itensCalc = origemPreview.map(item => {
      const qtd = itensSelecionados[item.propostaItemId] || item.quantidadeContratada || '0';
      const unit = item.valorUnitario || '0';
      const total = (Number(qtd) * Number(unit)).toFixed(2);
      return { ...item, quantidadeContratada: qtd, valorTotal: total };
    });
    const total = itensCalc.reduce((sum, i) => sum + Number(i.valorTotal || 0), 0).toFixed(2);
    setRevisaoContrato({ numero, exercicio, edital: editalSelecionado, proposta: propostaSelecionada, itens: itensCalc, total, escolaId, dreId, municipioId, objeto, observacoes, vigenciaInicio, vigenciaFim });
  };

  const handleSubmit = async () => {
    if (!revisaoContrato) return;
    setLoading(true);
    try {
      const itensPayload = Object.entries(itensSelecionados).map(([propostaItemId, quantidade]) => ({ propostaItemId, quantidade }));
      const payload = {
        editalId, propostaId, numero, exercicio, escolaId, dreId, municipioId,
        objeto: objeto || undefined, observacoes: observacoes || undefined,
        vigenciaInicio, vigenciaFim,
        condicoesFornecimento: condicoesFornecimento || undefined,
        condicoesPagamento: condicoesPagamento || undefined,
        fiscalizacao: fiscalizacao || undefined,
        itens: itensPayload,
      };
      if (isEdit) {
        await api.patch(`/contratos/${id}`, { ...payload, versao: revisaoContrato.versao || 1 });
        setSuccess('Contrato atualizado com sucesso!');
      } else {
        await api.post('/contratos', payload);
        setSuccess('Contrato criado com sucesso!');
      }
      setTimeout(() => navigate('/contratos'), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao salvar contrato.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Edital', 'Fornecedor & Itens', 'Dados contratuais', 'Revisão'];

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <div>
          <Typography variant="h4" fontWeight={700}>{isEdit ? 'Editar Contrato' : 'Novo Contrato'}</Typography>
          <Typography color="text.secondary">Fluxo guiado: edital → proposta → itens → dados → revisão</Typography>
        </div>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/contratos')}>Voltar</Button>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={1} sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Stack spacing={2}>
            <Typography variant="h6" gutterBottom>1. Seleção do edital</Typography>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="edital-label">Edital</InputLabel>
              <Select labelId="edital-label" value={editalId} label="Edital" onChange={e => setEditalId(e.target.value)} displayEmpty>
                {editais.map(e => <MenuItem key={e.id} value={e.id} disabled={e.status === 'CANCELADO' || e.status === 'RASCUNHO'}>
                  {e.numero}/{e.ano} — {e.titulo} {e.status !== 'ATIVO' && e.status !== 'FECHADO' ? `(${humanizeSystemValue(e.status)})` : ''}
                </MenuItem>)}
              </Select>
            </FormControl>
            {editalSelecionado && (
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Objeto: {editalSelecionado.objeto || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">Município: {editalSelecionado.municipio?.nome || '—'}/{editalSelecionado.municipio?.uf || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">Unidades vinculadas: {editalSelecionado.escolasVinculadas?.length || 0}</Typography>
              </Card>
            )}
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={2}>
            <Typography variant="h6" gutterBottom>2. Seleção da proposta / fornecedor</Typography>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="proposta-label">Proposta</InputLabel>
              <Select labelId="proposta-label" value={propostaId} label="Proposta" onChange={e => setPropostaId(e.target.value)} displayEmpty>
                {propostas.map(p => <MenuItem key={p.id} value={p.id} disabled={p.status !== 'FINALIZADA'}>
                  {p.numero} — {humanizeSystemValue(p.tipoDocumento)} — {p.produtor?.nome || 'Sem fornecedor'} {p.status !== 'FINALIZADA' ? `(${humanizeSystemValue(p.status)})` : ''}
                </MenuItem>)}
              </Select>
            </FormControl>
            {propostaSelecionada && (
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Fornecedor: {propostaSelecionada.produtor?.nome || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">Tipo: {humanizeSystemValue(propostaSelecionada.tipoDocumento)}</Typography>
              </Card>
            )}
            {origemPreview.length > 0 && (
              <Typography variant="h6" gutterBottom>Itens do edital — preencha a quantidade a contratar</Typography>
            )}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell>Unid.</TableCell>
                    <TableCell align="right">Qtd. edital</TableCell>
                    <TableCell align="right">Qtd. proposta</TableCell>
                    <TableCell align="right">Vlr. unit. (proposta)</TableCell>
                    <TableCell align="right">Comprometido edital</TableCell>
                    <TableCell align="right">Qtd. a contratar</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {origemPreview.map((item, idx) => (
                    <TableRow key={item.propostaItemId}>
                      <TableCell>{item.descricao ? `${item.produto} — ${item.descricao}` : item.produto}</TableCell>
                      <TableCell>{item.unidade || '—'}</TableCell>
                      <TableCell align="right">{item.quantidadeEdital ? Number(item.quantidadeEdital).toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—'}</TableCell>
                      <TableCell align="right">{item.quantidadeProposta ? Number(item.quantidadeProposta).toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—'}</TableCell>
                      <TableCell align="right">{item.valorUnitario ? Number(item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</TableCell>
                      <TableCell align="right">{item.quantidadeComprometidaEdital ? Number(item.quantidadeComprometidaEdital).toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '0'}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="text"
                          size="small"
                          value={itensSelecionados[item.propostaItemId] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (DECIMAL.test(val) || val === '') setItensSelecionados(prev => ({ ...prev, [item.propostaItemId]: val }));
                          }}
                          inputProps={{ inputMode: 'decimal' }}
                          placeholder="Qtd."
                          variant="outlined"
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        {item.bloqueio && <Chip size="small" label={item.bloqueio} color="error" />}
                        {item.pendencia && !item.bloqueio && <Chip size="small" label={item.pendencia} color="warning" />}
                        {!item.bloqueio && !item.pendencia && <Chip size="small" label="OK" color="success" icon={<CheckCircle />} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {origemPreview.length > 0 && origemPreview.every(i => !i.bloqueio) && (
              <Alert severity="success">Todos os itens têm saldo disponível para contratação.</Alert>
            )}
            {origemPreview.some(i => i.bloqueio) && (
              <Alert severity="error">Itens com bloqueio impedem a contratação. Ajuste as quantidades ou regularize os saldos.</Alert>
            )}
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={2}>
            <Typography variant="h6" gutterBottom>3. Dados contratuais</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Número do contrato" fullWidth value={numero} onChange={e => setNumero(e.target.value)} variant="outlined" size="small" placeholder="Ex: CT-2026-0001 (opcional, preenchido automaticamente se vazio)" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField type="number" label="Exercício" fullWidth value={exercicio} onChange={e => setExercicio(Number(e.target.value))} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="escola-label">Unidade contratante</InputLabel>
                  <Select labelId="escola-label" value={escolaId} label="Unidade contratante" onChange={e => setEscolaId(e.target.value)} displayEmpty>
                    {escolasDisponiveis.map(e => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="dre-label">DRE responsável</InputLabel>
                  <Select labelId="dre-label" value={dreId} label="DRE responsável" onChange={e => setDreId(e.target.value)} displayEmpty>
                    {dresDisponiveis.map(d => <MenuItem key={d.id} value={d.id}>{d.codigo ? `${d.codigo} — ` : ''}{d.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="municipio-label">Município</InputLabel>
                  <Select labelId="municipio-label" value={municipioId} label="Município" onChange={e => setMunicipioId(e.target.value)} displayEmpty>
                    {municipiosDisponiveis.map(m => <MenuItem key={m.id} value={m.id}>{m.nome}/{m.uf}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField type="date" label="Início da vigência" fullWidth value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField type="date" label="Fim da vigência" fullWidth value={vigenciaFim} onChange={e => setVigenciaFim(e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Objeto" multiline rows={3} fullWidth value={objeto} onChange={e => setObjeto(e.target.value)} variant="outlined" size="small" placeholder="Objeto do contrato..." />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Observações" multiline rows={2} fullWidth value={observacoes} onChange={e => setObservacoes(e.target.value)} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Condições de fornecimento" multiline rows={3} fullWidth value={condicoesFornecimento} onChange={e => setCondicoesFornecimento(e.target.value)} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Condições de pagamento" multiline rows={3} fullWidth value={condicoesPagamento} onChange={e => setCondicoesPagamento(e.target.value)} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Fiscalização" multiline rows={2} fullWidth value={fiscalizacao} onChange={e => setFiscalizacao(e.target.value)} variant="outlined" size="small" />
              </Grid>
            </Grid>
          </Stack>
        )}

        {activeStep === 3 && (
          <Stack spacing={2}>
            <Typography variant="h6" gutterBottom>4. Revisão e confirmação</Typography>
            {revisaoContrato && (
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`Nº ${revisaoContrato.numero}`} color="primary" />
                    <Chip label={`Exercício ${revisaoContrato.exercicio}`} />
                    <Chip label={`Edital ${revisaoContrato.edital?.numero}/${revisaoContrato.edital?.ano}`} />
                    <Chip label={revisaoContrato.proposta?.produtor?.nome || '—'} />
                  </Stack>
                </Card>
                <Typography variant="body2" color="text.secondary">Vigência: {revisaoContrato.vigenciaInicio} a {revisaoContrato.vigenciaFim}</Typography>
                <Typography variant="body2" color="text.secondary">Unidade: {escolasDisponiveis.find(e => e.id === revisaoContrato.escolaId)?.nome || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">DRE: {dresDisponiveis.find(d => d.id === revisaoContrato.dreId)?.nome || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">Município: {municipiosDisponiveis.find(m => m.id === revisaoContrato.municipioId)?.nome || '—'}</Typography>
                <Divider />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Produto</TableCell>
                        <TableCell align="center">Unid.</TableCell>
                        <TableCell align="right">Qtd.</TableCell>
                        <TableCell align="right">Vlr. unit.</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revisaoContrato.itens.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{item.descricao ? `${item.produto} — ${item.descricao}` : item.produto}</TableCell>
                          <TableCell align="center">{item.unidade || '—'}</TableCell>
                          <TableCell align="right">{Number(item.quantidadeContratada || 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</TableCell>
                          <TableCell align="right">{Number(item.valorUnitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                          <TableCell align="right">{Number(item.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="h6" align="right">Valor total: {Number(revisaoContrato.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        {activeStep > 0 && <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack} disabled={loading}>Voltar</Button>}
        {activeStep < 3 && <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext} disabled={loading}>{activeStep === 2 ? 'Revisar' : 'Avançar'}</Button>}
        {activeStep === 3 && <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={loading}>{isEdit ? 'Salvar alterações' : 'Criar contrato'}</Button>}
      </Stack>
    </Stack>
  );
}

