import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Divider, FormControl, FormControlLabel, InputLabel, MenuItem, Pagination, Select, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import api from '../services/api';
import type { ApiResponse, PaginationResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { humanizeSystemValue } from '../lib/display-text';

type Item = { id: string; contratoItemId: string; produto: string; unidadeMedida: string | null; quantidadeProgramada: string; quantidadeReservada: string };
type Programacao = { id: string; numero: string; contratoId: string; status: string; dataPrevista: string; unidadeEscolarId: string; observacoes?: string; versao: number; contrato?: { numero: string; exercicio: number }; fornecedor?: { nome: string }; unidadeEscolar?: { nome: string }; dre?: { nome: string }; itens: Item[]; entregas?: Array<{ id: string; numero: string; status: string; dataEntrega: string }> };
type Contrato = { id: string; numero: string; exercicio: number; escolaId?: string | null; escola?: { nome: string } | null; produtor?: { nome: string } | null; itens: Array<{ id: string; produto: string; unidade: string | null; quantidadeDisponivel: string }> };
type Escola = { id: string; nome: string };
type Entrega = { id: string; numero: string; status: string; dataEntrega: string; itens: Array<{ id: string; quantidadeInformada: string; quantidadeAceita: string; quantidadeRejeitada: string; programacaoItem: { produto: string } }>; ocorrencias: Array<{ id: string; tipo: string; descricao: string; status: string }>; documentos: Array<{ id: string; tipo: string; titulo: string; versao: number }> };
type Saldo = { valorContratadoAtualizado: string; valorAceitoAcumulado: string; percentualExecucaoFinanceira: string; itens: Array<{ produto: string; quantidadeDisponivel: string; quantidadeAceitaAcumulada: string; quantidadeReservadaProgramacoes: string; quantidadeRejeitadaAcumulada: string }> };
type Visao = { id: string; nome: string; quantidadeAceita: string; valorAceito: string };
const estados = ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'CANCELADA'];
const tipos = ['ENTREGA_INCOMPLETA', 'PRODUTO_DIVERGENTE', 'QUANTIDADE_DIVERGENTE', 'PRODUTO_DANIFICADO', 'PROBLEMA_QUALIDADE', 'PRODUTO_VENCIDO', 'ENTREGA_FORA_PRAZO', 'RECUSA_RECEBIMENTO', 'OUTRO'];
const dataHoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Cuiaba' });
const moeda = (valor: string | number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const erroApi = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const mensagem = e.response?.data?.message;
  return Array.isArray(mensagem) ? mensagem.join('; ') : mensagem || e.message || 'Falha na operação.';
};

export default function EntregasPage() {
  const { user } = useAuth();
  const gerencia = user?.role === 'ADMIN' || user?.role === 'DRE';
  const recebe = gerencia || user?.role === 'ESCOLA';
  const [aba, setAba] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<PaginationResponse<Programacao> | null>(null);
  const [visaoCalendario, setVisaoCalendario] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(dataHoje().slice(0, 7));
  const [eventos, setEventos] = useState<Array<Pick<Programacao, 'id' | 'numero' | 'status' | 'dataPrevista'>>>([]);
  const [calendarioTruncado, setCalendarioTruncado] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [escolaId, setEscolaId] = useState('');
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [dataPrevista, setDataPrevista] = useState(dataHoje());
  const [periodo, setPeriodo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selecionada, setSelecionada] = useState<Programacao | null>(null);
  const [editando, setEditando] = useState(false);
  const [novaData, setNovaData] = useState('');
  const [novasQuantidades, setNovasQuantidades] = useState<Record<string, string>>({});
  const [motivoReprogramacao, setMotivoReprogramacao] = useState('');
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregaQtd, setEntregaQtd] = useState<Record<string, Partial<{ informada: string; aceita: string; rejeitada: string; motivo: string }>>>({});
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [ocorrenciaEntrega, setOcorrenciaEntrega] = useState('');
  const [ocorrenciaTipo, setOcorrenciaTipo] = useState('OUTRO');
  const [ocorrenciaDescricao, setOcorrenciaDescricao] = useState('');
  const [anexoArquivo, setAnexoArquivo] = useState<File | null>(null);
  const [anexoTipo, setAnexoTipo] = useState('COMPROVANTE_ENTREGA');
  const [anexoAssinado, setAnexoAssinado] = useState(false);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [historico, setHistorico] = useState<Array<{ id: string; action: string; createdAt: string; userId?: string }>>([]);
  const [geral, setGeral] = useState<{ totalContratos: number; valorTotalContratado: string; valorTotalAceito: string; percentualExecucaoGeral: string; indicadores: { programacoes: number; previstasPeriodo: number; realizadas: number; atrasadas: number; parcialmenteRecebidas: number; comDivergencias: number; quantidadeAceita: string; valorProgramado: string }; visoes: Record<string, Visao[]> } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const q = new URLSearchParams({ page: String(pagina), limit: '20' });
      if (status) q.set('status', status);
      if (dataInicio) q.set('dataInicio', dataInicio);
      if (dataFim) q.set('dataFim', dataFim);
      const { data } = await api.get<ApiResponse<PaginationResponse<Programacao>>>(`/programacoes-entrega?${q}`);
      setLista(data.data);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  }, [pagina, status, dataInicio, dataFim]);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => {
    if (!visaoCalendario) return;
    void api.get<ApiResponse<{ items: typeof eventos; truncado: boolean }>>(`/programacoes-entrega/calendario/mes?mes=${mesCalendario}`)
      .then(r => { setEventos(r.data.data.items); setCalendarioTruncado(r.data.data.truncado); })
      .catch(e => setErro(erroApi(e)));
  }, [visaoCalendario, mesCalendario]);
  useEffect(() => {
    if (!gerencia) return;
    void api.get<ApiResponse<PaginationResponse<Contrato>>>('/contratos?status=VIGENTE&limit=100').then(r => setContratos(r.data.data.items)).catch(e => setErro(erroApi(e)));
    void api.get<ApiResponse<PaginationResponse<Escola>>>('/escolas?limit=100').then(r => setEscolas(r.data.data.items)).catch(e => setErro(erroApi(e)));
  }, [gerencia]);

  const abrir = async (id: string) => {
    setLoading(true); setErro('');
    try {
      const { data } = await api.get<ApiResponse<Programacao>>(`/programacoes-entrega/${id}`);
      setSelecionada(data.data);
      setNovaData(data.data.dataPrevista.slice(0, 10));
      setNovasQuantidades(Object.fromEntries(data.data.itens.map(i => [i.contratoItemId, i.quantidadeProgramada])));
      setEditando(false);
      const [e, s] = await Promise.all([
        api.get<ApiResponse<PaginationResponse<Entrega>>>(`/entregas?programacaoId=${id}&limit=100`),
        api.get<ApiResponse<Saldo>>(`/saldos-contratos/${data.data.contratoId}`),
      ]);
      setEntregas(e.data.data.items);
      setSaldo(s.data.data);
      if (gerencia) {
        const h = await api.get<ApiResponse<typeof historico>>(`/programacoes-entrega/${id}/historico`);
        setHistorico(h.data.data);
      } else setHistorico([]);
      setAba(2);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  };

  const executar = async (path: string, corpo: unknown = {}) => {
    setLoading(true); setErro(''); setAviso('');
    try {
      await api.post(path, corpo);
      setAviso('Operação registrada.');
      await carregar();
      if (selecionada) await abrir(selecionada.id);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  };

  const escolherContrato = async (id: string) => {
    if (!id) { setContrato(null); return; }
    try {
      const { data } = await api.get<ApiResponse<Contrato>>(`/contratos/${id}`);
      setContrato(data.data); setEscolaId(data.data.escolaId || ''); setQuantidades({});
    } catch (e) { setErro(erroApi(e)); }
  };

  const criarProgramacao = async () => {
    if (!contrato || !escolaId) { setErro('Selecione contrato e escola.'); return; }
    const itens = contrato.itens.filter(i => Number(quantidades[i.id]) > 0).map(i => ({ contratoItemId: i.id, quantidadeProgramada: quantidades[i.id] }));
    if (!itens.length) { setErro('Informe ao menos uma quantidade positiva.'); return; }
    setLoading(true); setErro('');
    try {
      const { data } = await api.post<ApiResponse<Programacao>>('/programacoes-entrega', { contratoId: contrato.id, unidadeEscolarId: escolaId, dataPrevista, periodoEntrega: periodo || undefined, observacoes, itens });
      setAviso('Programação criada em rascunho.'); await carregar(); await abrir(data.data.id);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  };

  const criarEntrega = async () => {
    if (!selecionada) return;
    const itens = selecionada.itens.filter(i => Number(entregaQtd[i.id]?.informada) > 0).map(i => ({ programacaoItemId: i.id, quantidadeInformada: entregaQtd[i.id].informada, quantidadeAceita: entregaQtd[i.id].aceita || '0', quantidadeRejeitada: entregaQtd[i.id].rejeitada || '0', motivoRejeicao: entregaQtd[i.id].motivo || undefined }));
    if (!itens.length) { setErro('Informe os produtos entregues.'); return; }
    setLoading(true); setErro('');
    try {
      await api.post('/entregas', { programacaoId: selecionada.id, dataEntrega: dataHoje(), numeroDocumento: numeroDocumento || undefined, itens });
      setEntregaQtd({}); setNumeroDocumento(''); setAviso('Entrega registrada. Confira e confirme o aceite.'); await abrir(selecionada.id);
    } catch (e) { setErro(erroApi(e)); } finally { setLoading(false); }
  };

  const salvarReprogramacao = async () => {
    if (!selecionada) return;
    try {
      await api.put(`/programacoes-entrega/${selecionada.id}`, {
        versao: selecionada.versao, dataPrevista: novaData,
        motivoReprogramacao: selecionada.status === 'RASCUNHO' ? undefined : motivoReprogramacao,
        itens: selecionada.itens.map(i => ({ contratoItemId: i.contratoItemId, quantidadeProgramada: novasQuantidades[i.contratoItemId] })),
      });
      setAviso('Programação atualizada. Confira o histórico.'); setMotivoReprogramacao(''); await carregar(); await abrir(selecionada.id);
    } catch (e) { setErro(erroApi(e)); }
  };

  const carregarGeral = async () => {
    try { const { data } = await api.get<ApiResponse<typeof geral>>('/saldos-contratos/execucao/geral'); setGeral(data.data); }
    catch (e) { setErro(erroApi(e)); }
  };
  const anexar = async (entregaId: string) => {
    if (!anexoArquivo || !selecionada) { setErro('Selecione um arquivo.'); return; }
    const form = new FormData(); form.append('arquivo', anexoArquivo); form.append('tipo', anexoTipo);
    if (anexoAssinado) form.append('assinadoExternamente', 'true');
    try { await api.post(`/entregas/${entregaId}/documentos`, form); setAnexoArquivo(null); setAnexoAssinado(false); setAviso('Documento anexado.'); await abrir(selecionada.id); }
    catch (e) { setErro(erroApi(e)); }
  };
  const baixar = async (entregaId: string, documentoId: string, titulo: string) => {
    try {
      const resposta = await api.get(`/entregas/${entregaId}/documentos/${documentoId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(resposta.data);
      const link = document.createElement('a'); link.href = url; link.download = titulo; link.click();
      URL.revokeObjectURL(url);
    } catch (e) { setErro(erroApi(e)); }
  };
  useEffect(() => { if (aba === 3) void carregarGeral(); }, [aba]);

  return <Stack spacing={2} sx={{ p: { xs: 1, md: 3 } }}>
    <Typography variant="h4">Entregas e recebimentos</Typography>
    <Tabs value={aba} onChange={(_, v) => setAba(v)} variant="scrollable" scrollButtons="auto">
      <Tab label="Cronograma" /><Tab label="Nova programação" disabled={!gerencia} /><Tab label="Detalhes e recebimento" /><Tab label="Execução" />
    </Tabs>
    {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}
    {aviso && <Alert severity="success" onClose={() => setAviso('')}>{aviso}</Alert>}
    {loading && <CircularProgress size={25} />}

    {aba === 0 && <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>Situação</InputLabel><Select value={status} label="Situação" onChange={e => { setStatus(e.target.value); setPagina(1); }}><MenuItem value="">Todas</MenuItem>{estados.map(s => <MenuItem key={s} value={s}>{humanizeSystemValue(s)}</MenuItem>)}</Select></FormControl>
        <TextField size="small" label="De" type="date" InputLabelProps={{ shrink: true }} value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPagina(1); }} />
        <TextField size="small" label="Até" type="date" InputLabelProps={{ shrink: true }} value={dataFim} onChange={e => { setDataFim(e.target.value); setPagina(1); }} />
        <Button onClick={() => void carregar()}>Atualizar</Button>
        <Button onClick={() => setVisaoCalendario(!visaoCalendario)}>{visaoCalendario ? 'Ver lista' : 'Ver calendário'}</Button>
      </Stack>
      {visaoCalendario && <Stack spacing={1}>
        <TextField label="Mês" type="month" size="small" InputLabelProps={{ shrink: true }} value={mesCalendario} onChange={e => setMesCalendario(e.target.value)} sx={{ maxWidth: 190 }} />
        {calendarioTruncado && <Alert severity="warning">Mais de 1.000 programações no mês. Use a listagem com filtros para consultar todas.</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => <Typography key={dia} align="center" variant="caption">{dia}</Typography>)}
          {Array.from({ length: new Date(Date.UTC(Number(mesCalendario.slice(0, 4)), Number(mesCalendario.slice(5, 7)) - 1, 1)).getUTCDay() }, (_, i) => <Box key={`vazio-${i}`} />)}
          {Array.from({ length: new Date(Date.UTC(Number(mesCalendario.slice(0, 4)), Number(mesCalendario.slice(5, 7)), 0)).getUTCDate() }, (_, i) => {
            const dia = `${mesCalendario}-${String(i + 1).padStart(2, '0')}`;
            return <Box key={dia} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 92, p: 0.5, overflow: 'hidden' }}><Typography variant="caption">{i + 1}</Typography>{eventos.filter(p => p.dataPrevista.slice(0, 10) === dia).map(p => <Button key={p.id} size="small" sx={{ display: 'block', textAlign: 'left', fontSize: 10, p: 0.2, maxWidth: '100%' }} onClick={() => void abrir(p.id)}>{p.numero} · {humanizeSystemValue(p.status)}</Button>)}</Box>;
          })}
        </Box>
      </Stack>}
      {!visaoCalendario && !lista?.items.length && <Typography color="text.secondary">Nenhuma programação encontrada.</Typography>}
      {!visaoCalendario && lista?.items.map(p => <Card key={p.id} variant="outlined"><CardContent><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <Box><Typography variant="h6">{p.numero} · {p.contrato?.numero}/{p.contrato?.exercicio}</Typography><Typography>{p.unidadeEscolar?.nome} · {p.fornecedor?.nome}</Typography><Typography color="text.secondary">Prevista: {p.dataPrevista.slice(0, 10)} · {p.itens.map(i => i.produto).join(', ')}</Typography></Box>
        <Stack alignItems="flex-start" spacing={1}><Chip label={humanizeSystemValue(p.status)} size="small" /><Button onClick={() => void abrir(p.id)}>Detalhar</Button></Stack>
      </Stack></CardContent></Card>)}
      {!visaoCalendario && <Pagination count={Math.max(1, lista?.totalPages || 1)} page={pagina} onChange={(_, p) => setPagina(p)} />}
    </Stack>}

    {aba === 1 && gerencia && <Stack spacing={2}>
      <FormControl fullWidth><InputLabel>Contrato vigente</InputLabel><Select label="Contrato vigente" value={contrato?.id || ''} onChange={e => void escolherContrato(e.target.value)}><MenuItem value="">Selecione</MenuItem>{contratos.map(c => <MenuItem key={c.id} value={c.id}>{c.numero}/{c.exercicio} · {c.produtor?.nome}</MenuItem>)}</Select></FormControl>
      {contrato && <><Typography>Fornecedor: {contrato.produtor?.nome}</Typography><FormControl fullWidth><InputLabel>Escola destinatária</InputLabel><Select label="Escola destinatária" value={escolaId} onChange={e => setEscolaId(e.target.value)} disabled={Boolean(contrato.escolaId)}>{escolas.map(e => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}{contrato.escolaId && !escolas.some(e => e.id === contrato.escolaId) && <MenuItem value={contrato.escolaId}>{contrato.escola?.nome || contrato.escolaId}</MenuItem>}</Select></FormControl>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}><TextField label="Data prevista" type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} InputLabelProps={{ shrink: true }} /><TextField label="Janela de entrega" value={periodo} onChange={e => setPeriodo(e.target.value)} /></Stack>
        {contrato.itens.map(i => <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" key={i.id}><Typography sx={{ minWidth: 260 }}>{i.produto} · saldo {i.quantidadeDisponivel} {i.unidade}</Typography><TextField label="Quantidade a programar" type="number" inputProps={{ min: 0, step: '0.0001' }} value={quantidades[i.id] || ''} onChange={e => setQuantidades({ ...quantidades, [i.id]: e.target.value })} /></Stack>)}
        <TextField label="Observações" multiline minRows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} /><Button variant="contained" disabled={loading} onClick={() => void criarProgramacao()}>Salvar rascunho</Button></>}
    </Stack>}

    {aba === 2 && <Stack spacing={2}>
      {!selecionada && <Typography color="text.secondary">Escolha uma programação no cronograma.</Typography>}
      {selecionada && <><Card variant="outlined"><CardContent><Stack spacing={1}><Typography variant="h6" component="div">{selecionada.numero} <Chip label={humanizeSystemValue(selecionada.status)} size="small" /></Typography><Typography>{selecionada.unidadeEscolar?.nome} · {selecionada.fornecedor?.nome}</Typography><Typography>Entrega prevista: {selecionada.dataPrevista.slice(0, 10)}</Typography>{selecionada.itens.map(i => <Typography key={i.id}>{i.produto}: {i.quantidadeProgramada} {i.unidadeMedida} · pendente {i.quantidadeReservada}</Typography>)}
        {gerencia && <Stack direction="row" flexWrap="wrap" gap={1}>{selecionada.status === 'RASCUNHO' && <Button onClick={() => void api.patch(`/programacoes-entrega/${selecionada.id}/status`, { para: 'PROGRAMADA' }).then(() => abrir(selecionada.id)).catch(e => setErro(erroApi(e)))}>Programar</Button>}{selecionada.status === 'PROGRAMADA' && <Button onClick={() => void executar(`/programacoes-entrega/${selecionada.id}/confirmar`)}>Confirmar</Button>}{!['RECEBIDA', 'CANCELADA'].includes(selecionada.status) && <Button color="error" onClick={() => { const motivo = window.prompt('Motivo do cancelamento'); if (motivo?.trim()) void executar(`/programacoes-entrega/${selecionada.id}/cancelar`, { motivo }); }}>Cancelar</Button>}</Stack>}</Stack></CardContent></Card>
        {gerencia && ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA'].includes(selecionada.status) && !selecionada.entregas?.length && <Card variant="outlined"><CardContent><Stack spacing={1}><Button onClick={() => setEditando(!editando)}>{editando ? 'Fechar edição' : 'Editar ou reprogramar'}</Button>{editando && <><TextField label="Nova data prevista" type="date" InputLabelProps={{ shrink: true }} value={novaData} onChange={e => setNovaData(e.target.value)} />{selecionada.itens.map(i => <TextField key={i.id} label={`${i.produto} (${i.unidadeMedida || 'un.'})`} type="number" inputProps={{ min: 0, step: '0.0001' }} value={novasQuantidades[i.contratoItemId] || ''} onChange={e => setNovasQuantidades({ ...novasQuantidades, [i.contratoItemId]: e.target.value })} />)}{selecionada.status !== 'RASCUNHO' && <TextField label="Motivo da reprogramação" multiline value={motivoReprogramacao} onChange={e => setMotivoReprogramacao(e.target.value)} />}<Button variant="contained" onClick={() => void salvarReprogramacao()}>Salvar alterações</Button></>}</Stack></CardContent></Card>}
        {saldo && <Card variant="outlined"><CardContent><Typography variant="h6">Saldo do contrato</Typography><Typography>Valor atualizado: {moeda(saldo.valorContratadoAtualizado)} · aceito: {moeda(saldo.valorAceitoAcumulado)} · execução: {saldo.percentualExecucaoFinanceira}%</Typography>{saldo.itens.map(i => <Typography key={i.produto}>{i.produto}: disponível {i.quantidadeDisponivel}; reservado {i.quantidadeReservadaProgramacoes}; aceito {i.quantidadeAceitaAcumulada}; rejeitado {i.quantidadeRejeitadaAcumulada}</Typography>)}</CardContent></Card>}
        {gerencia && <Card variant="outlined"><CardContent><Typography variant="h6">Histórico da programação</Typography>{historico.map(h => <Typography key={h.id} variant="body2">{new Date(h.createdAt).toLocaleString('pt-BR')} · {h.action} · {h.userId || 'sistema'}</Typography>)}{!historico.length && <Typography color="text.secondary">Sem eventos registrados.</Typography>}</CardContent></Card>}
        {recebe && ['CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'].includes(selecionada.status) && <Card variant="outlined"><CardContent><Stack spacing={2}><Typography variant="h6">Registrar entrega parcial ou integral</Typography><TextField label="Documento do fornecedor" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} />{selecionada.itens.map(i => <Stack key={i.id} spacing={1}><Typography>{i.produto} · pendente {i.quantidadeReservada} {i.unidadeMedida}</Typography><Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>{(['informada', 'aceita', 'rejeitada'] as const).map(campo => <TextField key={campo} label={campo} type="number" inputProps={{ min: 0, step: '0.0001' }} value={entregaQtd[i.id]?.[campo] || ''} onChange={e => setEntregaQtd({ ...entregaQtd, [i.id]: { ...entregaQtd[i.id], [campo]: e.target.value } })} />)}<TextField label="Motivo da rejeição" value={entregaQtd[i.id]?.motivo || ''} onChange={e => setEntregaQtd({ ...entregaQtd, [i.id]: { ...entregaQtd[i.id], motivo: e.target.value } })} /></Stack></Stack>)}<Button variant="contained" disabled={loading} onClick={() => void criarEntrega()}>Registrar entrega</Button></Stack></CardContent></Card>}
        <Typography variant="h6">Recebimentos</Typography>{entregas.map(e => <Card variant="outlined" key={e.id}><CardContent><Stack spacing={1}><Typography component="div">{e.numero} · {e.dataEntrega.slice(0, 10)} <Chip size="small" label={humanizeSystemValue(e.status)} /></Typography>{e.itens.map(i => <Typography key={i.id}>{i.programacaoItem.produto}: entregue {i.quantidadeInformada}, aceito {i.quantidadeAceita}, rejeitado {i.quantidadeRejeitada}</Typography>)}{recebe && <Stack direction="row" gap={1}>{e.status === 'REGISTRADA' && <Button onClick={() => void api.patch(`/entregas/${e.id}/status`, { para: 'EM_CONFERENCIA' }).then(() => abrir(selecionada.id)).catch(x => setErro(erroApi(x)))}>Iniciar conferência</Button>}{e.status === 'EM_CONFERENCIA' && <Button onClick={() => void executar(`/entregas/${e.id}/conferir`)}>Conferir</Button>}{e.status === 'CONFERIDA' && <Button color="success" variant="contained" onClick={() => void executar(`/entregas/${e.id}/aceitar`)}>Confirmar aceite</Button>}</Stack>}{e.ocorrencias?.map(o => <Alert key={o.id} severity="warning">{humanizeSystemValue(o.tipo)}: {o.descricao} ({humanizeSystemValue(o.status)})</Alert>)}{recebe && <Button size="small" onClick={() => setOcorrenciaEntrega(e.id)}>Registrar ocorrência</Button>}</Stack></CardContent></Card>)}
        {entregas.map(e => <Card variant="outlined" key={`documentos-${e.id}`}><CardContent><Stack spacing={1}>
          <Typography variant="subtitle1">Documentos de {e.numero}</Typography>
          {recebe && <FormControlLabel control={<Checkbox checked={anexoAssinado} onChange={ev => setAnexoAssinado(ev.target.checked)} />} label="O termo ou recibo PDF anexado foi assinado fora do sistema" />}
          {gerencia && e.status === 'ACEITA' && <Button color="error" size="small" onClick={() => { const motivo = window.prompt('Motivo do estorno deste recebimento'); if (motivo?.trim()) void executar(`/entregas/${e.id}/estornar`, { motivo }); }}>Estornar recebimento</Button>}
          {e.documentos?.map(d => <Button key={d.id} size="small" onClick={() => void baixar(e.id, d.id, `${d.titulo}.pdf`)}>{humanizeSystemValue(d.tipo)} v{d.versao} · {d.titulo}</Button>)}
          {recebe && <><Stack direction="row" spacing={1} flexWrap="wrap">{e.status === 'ACEITA' && <Button onClick={() => void executar(`/entregas/${e.id}/documentos/termo`)}>Gerar termo PDF</Button>}<FormControl size="small" sx={{ minWidth: 200 }}><InputLabel>Tipo de anexo</InputLabel><Select label="Tipo de anexo" value={anexoTipo} onChange={ev => setAnexoTipo(ev.target.value)}>{['COMPROVANTE_ENTREGA', 'NOTA_FISCAL', 'RECIBO', 'EVIDENCIA_FOTOGRAFICA', 'OUTRO'].map(t => <MenuItem key={t} value={t}>{humanizeSystemValue(t)}</MenuItem>)}</Select></FormControl><Button component="label">Escolher arquivo<input hidden type="file" accept="application/pdf,image/png,image/jpeg" onChange={ev => setAnexoArquivo(ev.target.files?.[0] || null)} /></Button><Button disabled={!anexoArquivo} onClick={() => void anexar(e.id)}>Anexar</Button></Stack>{anexoArquivo && <Typography>{anexoArquivo.name}</Typography>}</>}
        </Stack></CardContent></Card>)}
        {recebe && ocorrenciaEntrega && <Card variant="outlined"><CardContent><Stack spacing={2}><Typography variant="h6">Nova ocorrência</Typography><FormControl><InputLabel>Tipo</InputLabel><Select label="Tipo" value={ocorrenciaTipo} onChange={e => setOcorrenciaTipo(e.target.value)}>{tipos.map(t => <MenuItem key={t} value={t}>{humanizeSystemValue(t)}</MenuItem>)}</Select></FormControl><TextField label="Descrição" multiline minRows={2} value={ocorrenciaDescricao} onChange={e => setOcorrenciaDescricao(e.target.value)} /><Button onClick={() => void executar(`/entregas/${ocorrenciaEntrega}/ocorrencias`, { tipo: ocorrenciaTipo, descricao: ocorrenciaDescricao }).then(() => { setOcorrenciaEntrega(''); setOcorrenciaDescricao(''); })}>Salvar ocorrência</Button></Stack></CardContent></Card>}</>}
    </Stack>}

    {aba === 3 && <Stack spacing={2}><Button onClick={() => void carregarGeral()}>Atualizar indicadores</Button>{geral && <><Card variant="outlined"><CardContent><Typography variant="h6">Execução contratual no seu escopo</Typography><Divider sx={{ my: 1 }} /><Typography>Contratos vigentes: {geral.totalContratos}</Typography><Typography>Programações: {geral.indicadores.programacoes} · previstas no mês: {geral.indicadores.previstasPeriodo} · atrasadas: {geral.indicadores.atrasadas}</Typography><Typography>Entregas aceitas: {geral.indicadores.realizadas} · parcialmente recebidas: {geral.indicadores.parcialmenteRecebidas} · ocorrências: {geral.indicadores.comDivergencias}</Typography><Typography>Quantidade aceita: {geral.indicadores.quantidadeAceita}</Typography><Typography>Valor programado: {moeda(geral.indicadores.valorProgramado)}</Typography><Typography>Valor atualizado: {moeda(geral.valorTotalContratado)}</Typography><Typography>Valor aceito: {moeda(geral.valorTotalAceito)}</Typography><Typography>Execução financeira: {geral.percentualExecucaoGeral}%</Typography></CardContent></Card>{Object.entries(geral.visoes || {}).map(([tipo, linhas]) => <Card variant="outlined" key={tipo}><CardContent><Typography variant="h6">Por {humanizeSystemValue(tipo)}</Typography>{linhas.slice(0, 20).map(linha => <Typography key={linha.id}>{linha.nome}: {linha.quantidadeAceita} aceito · {moeda(linha.valorAceito)}</Typography>)}{!linhas.length && <Typography color="text.secondary">Sem recebimentos aceitos.</Typography>}</CardContent></Card>)}</>}</Stack>}
  </Stack>;
}


