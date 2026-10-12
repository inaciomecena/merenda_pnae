import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type Row = Record<string, any>;
type Painel = { produtor: { nome: string; municipio?: { nome: string } }; indicadores: { unidades: number; produtos: number; safras: number; propostas: number; contratos: number; saldoPorUnidade: Record<string, number> }; disponibilidade: Row[] };
const sections = ['Visão geral', 'Unidades produtivas', 'Produtos', 'Safras', 'Sazonalidade', 'Disponibilidade', 'Logística', 'Catálogo'] as const;
const initial = { nome: '', municipioId: '', comunidade: '', produtoReferenciaId: '', unidadeProdutivaId: '', produto: '', produtoProdutorId: '', inicio: '', fim: '', quantidadePrevista: '', quantidadeColhida: '', perdas: '', unidade: 'KG', mes: '', modalidade: '', municipiosAtendidos: '', capacidadeDiaria: '' };

export default function MeuCampoPage() {
  const { user, context } = useAuth();
  const [tab, setTab] = useState(0);
  const [editSafraId, setEditSafraId] = useState('');
  const [statusSafra, setStatusSafra] = useState('PLANEJADA');
  const [form, setForm] = useState(initial);
  const [painel, setPainel] = useState<Painel | null>(null);
  const [unidades, setUnidades] = useState<Row[]>([]);
  const [produtos, setProdutos] = useState<Row[]>([]);
  const [safras, setSafras] = useState<Row[]>([]);
  const [sazonalidade, setSazonalidade] = useState<Row[]>([]);
  const [logistica, setLogistica] = useState<Row[]>([]);
  const [catalogo, setCatalogo] = useState<Row[]>([]);
  const [municipios, setMunicipios] = useState<Row[]>([]);
  const [vinculos, setVinculos] = useState<Row[]>([]);
  const [selectedProducerId, setSelectedProducerId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const producerId = selectedProducerId || context?.vinculos.find(v => v.funcao === 'PRODUTOR')?.produtor?.id || context?.representacoes[0]?.produtor.id || '';
  const query = producerId ? `?produtorId=${encodeURIComponent(producerId)}` : '';
  const canWrite = user?.role === 'PRODUTOR' || user?.role === 'ADMIN' || user?.role === 'EXTENSIONISTA';
  useEffect(() => { api.get('/produtor/meus-vinculos').then(response => { const list = response.data.data as Row[]; setVinculos(list); if (!selectedProducerId && list.length) setSelectedProducerId(list[0].id); }).catch(() => setVinculos([])); }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const paths = ['/produtor/meu-painel', '/produtor/minhas-unidades', '/produtor/meus-produtos', '/produtor/minhas-safras', '/produtor/minha-sazonalidade', '/produtor/minha-logistica'];
      const [dashboard, units, products, harvests, calendar, delivery, reference, cities] = await Promise.all([
        ...paths.map(path => api.get(path + query)), api.get('/catalogo-produtos'), api.get('/municipios?limit=200'),
      ]);
      setPainel(dashboard.data.data); setUnidades(units.data.data); setProdutos(products.data.data); setSafras(harvests.data.data);
      setSazonalidade(calendar.data.data); setLogistica(delivery.data.data); setCatalogo(reference.data.data);
      setMunicipios(cities.data.data.items || []); setError('');
    } catch (e: any) { setError(e.response?.data?.message || 'Não foi possível carregar seus dados de produção.'); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void refresh(); }, [refresh]);

  const field = (key: keyof typeof initial, label: string, type = 'text') => <TextField fullWidth size="small" label={label} type={type} value={form[key]} onChange={e => setForm(old => ({ ...old, [key]: e.target.value }))} InputLabelProps={type === 'date' ? { shrink: true } : undefined} />;
  const select = (key: keyof typeof initial, label: string, values: Row[], name: (row: Row) => string) => <TextField select fullWidth size="small" label={label} value={form[key]} onChange={e => setForm(old => ({ ...old, [key]: e.target.value }))}><MenuItem value="">Selecione</MenuItem>{values.map(row => <MenuItem key={row.id} value={row.id}>{name(row)}</MenuItem>)}</TextField>;
  const submit = async (path: string, payload: Row) => {
    setError(''); setSuccess('');
    try { await api.post(path + query, payload); setSuccess('Cadastro salvo.'); setForm(initial); await refresh(); }
    catch (e: any) { setError(e.response?.data?.message || 'Não foi possível salvar. Confira os campos.'); }
  };
  const updateHarvest = async () => {
    const harvest = safras.find(s => s.id === editSafraId);
    if (!harvest) return;
    setError(''); setSuccess('');
    try {
      await api.patch(`/produtor/minhas-safras/${harvest.id}`, {
        produtoProdutorId: harvest.produtoProdutorId, unidadeProdutivaId: harvest.unidadeProdutivaId || undefined,
        nome: harvest.nome, inicio: harvest.inicio, fim: harvest.fim,
        quantidadePrevista: Number(harvest.quantidadePrevista), quantidadeColhida: Number(form.quantidadeColhida),
        perdas: Number(form.perdas), unidade: harvest.unidade, status: statusSafra, versao: harvest.versao,
      });
      setSuccess('Colheita atualizada.'); setEditSafraId(''); await refresh();
    } catch (e: any) { setError(e.response?.data?.message || 'Não foi possível atualizar a colheita.'); }
  };
  const records = (rows: Row[], render: (row: Row) => string) => rows.length ? <Stack spacing={1}>{rows.map(row => <Card key={row.id} variant="outlined"><CardContent sx={{ py: 1.5 }}>{render(row)}</CardContent></Card>)}</Stack> : <Typography color="text.secondary">Ainda não há registros.</Typography>;

  return <Stack spacing={2}>
    <Box><Typography variant="h4" fontWeight={700}>Meu campo</Typography><Typography color="text.secondary">Planeje sua produção e acompanhe o que pode oferecer ao PNAE.</Typography></Box>
    {vinculos.length > 1 && <TextField select size="small" label="Produtor" value={producerId} onChange={e => setSelectedProducerId(e.target.value)} sx={{ maxWidth: 360 }}>{vinculos.map(p => <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>)}</TextField>}
    {error && <Alert severity="error">{error}</Alert>}{success && <Alert severity="success">{success}</Alert>}
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Áreas do meu campo">{sections.map(s => <Tab key={s} label={s} />)}</Tabs>
    {loading ? <CircularProgress /> : <>
      {tab === 0 && <Stack spacing={2}>
        <Typography variant="h5">Olá, {painel?.produtor.nome || 'produtor'}!</Typography>
        <Grid container spacing={2}>{[
          ['Unidades produtivas', painel?.indicadores.unidades], ['Produtos cadastrados', painel?.indicadores.produtos], ['Safras', painel?.indicadores.safras], ['Propostas', painel?.indicadores.propostas], ['Contratos', painel?.indicadores.contratos],
        ].map(([label, value]) => <Grid item xs={6} md={3} key={String(label)}><Card variant="outlined"><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h5">{value ?? 0}</Typography></CardContent></Card></Grid>)}</Grid>
        <Typography variant="h6">Saldo confirmado por unidade</Typography>
        {Object.entries(painel?.indicadores.saldoPorUnidade || {}).length ? <Typography>{Object.entries(painel?.indicadores.saldoPorUnidade || {}).map(([unit, amount]) => `${amount} ${unit}`).join(' · ')}</Typography> : <Typography color="text.secondary">Sem colheita confirmada.</Typography>}
        <Typography variant="h6">Próximas colheitas</Typography>{records(safras.filter(s => s.status !== 'CANCELADA' && new Date(s.fim) >= new Date()).sort((a, b) => a.fim.localeCompare(b.fim)).slice(0, 5), s => `${s.nome} · ${new Date(s.fim).toLocaleDateString('pt-BR')} · ${s.quantidadePrevista} ${s.unidade}`)}
        <Stack direction="row" gap={1} flexWrap="wrap"><Button component={Link} to="/produtores" variant="outlined">Meu cadastro</Button><Button component={Link} to="/propostas" variant="outlined">Minhas propostas</Button><Button component={Link} to="/contratos" variant="outlined">Contratos</Button></Stack>
      </Stack>}
      {tab === 1 && <Stack spacing={2}><Typography variant="h6">Minhas unidades produtivas</Typography>{records(unidades, u => `${u.nome} · ${u.municipio?.nome || ''} · ${u.comunidade || ''}`)}{canWrite && <Card variant="outlined"><CardContent><Stack spacing={2}><Typography fontWeight={600}>Adicionar unidade</Typography>{field('nome', 'Nome da unidade')}{select('municipioId', 'Município', municipios, m => m.nome)}{field('comunidade', 'Comunidade ou localidade')}<Button variant="contained" onClick={() => void submit('/produtor/minhas-unidades', { nome: form.nome, municipioId: form.municipioId, comunidade: form.comunidade })}>Salvar unidade</Button></Stack></CardContent></Card>}</Stack>}
      {tab === 2 && <Stack spacing={2}><Typography variant="h6">O que eu produzo</Typography>{records(produtos, p => `${p.produto} · ${p.unidadeProdutiva?.nome || 'Unidade não informada'}`)}{canWrite && <Card variant="outlined"><CardContent><Stack spacing={2}>{select('produtoReferenciaId', 'Produto do catálogo', catalogo, p => p.nome)}{select('unidadeProdutivaId', 'Unidade produtiva', unidades, u => u.nome)}<Button variant="contained" onClick={() => { const selected = catalogo.find(p => p.id === form.produtoReferenciaId); void submit('/produtor/meus-produtos', { produtoReferenciaId: form.produtoReferenciaId, unidadeProdutivaId: form.unidadeProdutivaId, produto: selected?.nome || '' }); }}>Salvar produto</Button></Stack></CardContent></Card>}</Stack>}
      {tab === 3 && <Stack spacing={2}><Typography variant="h6">Safras e ciclos</Typography>{safras.length ? safras.map(s => <Card key={s.id} variant="outlined"><CardContent><Stack spacing={1}><Typography>{s.nome} · {s.status} · prevista: {s.quantidadePrevista} {s.unidade} · colhida: {s.quantidadeColhida} {s.unidade}</Typography>{canWrite && <Button sx={{ alignSelf: 'flex-start' }} onClick={() => { setEditSafraId(s.id); setStatusSafra(s.status); setForm(old => ({ ...old, quantidadeColhida: String(s.quantidadeColhida), perdas: String(s.perdas) })); }}>Atualizar colheita</Button>}</Stack></CardContent></Card>) : <Typography color="text.secondary">Ainda não há safras.</Typography>}{editSafraId && <Card variant="outlined"><CardContent><Stack spacing={2}><Typography fontWeight={600}>Registrar colheita e perdas</Typography>{field('quantidadeColhida', 'Quantidade colhida', 'number')}{field('perdas', 'Perdas', 'number')}<TextField select fullWidth size="small" label="Situação da safra" value={statusSafra} onChange={e => setStatusSafra(e.target.value)}>{[statusSafra, ...({ PLANEJADA: ['EM_PRODUCAO', 'CANCELADA'], EM_PRODUCAO: ['EM_COLHEITA', 'CANCELADA'], EM_COLHEITA: ['COLHIDA', 'CANCELADA'], COLHIDA: ['ENCERRADA'], ENCERRADA: [], CANCELADA: [] } as Record<string, string[]>)[safras.find(s => s.id === editSafraId)?.status || 'PLANEJADA']].filter((value, index, all) => all.indexOf(value) === index).map(value => <MenuItem key={value} value={value}>{value.replaceAll('_', ' ')}</MenuItem>)}</TextField><Button variant="contained" onClick={() => void updateHarvest()}>Salvar colheita</Button></Stack></CardContent></Card>}{canWrite && <Card variant="outlined"><CardContent><Stack spacing={2}>{select('produtoProdutorId', 'Produto', produtos, p => p.produto)}{field('nome', 'Nome da safra')}{field('inicio', 'Início previsto', 'date')}{field('fim', 'Colheita prevista', 'date')}{field('quantidadePrevista', 'Quantidade prevista', 'number')}{field('unidade', 'Unidade comercial')}<Button variant="contained" onClick={() => { const product = produtos.find(p => p.id === form.produtoProdutorId); void submit('/produtor/minhas-safras', { produtoProdutorId: form.produtoProdutorId, unidadeProdutivaId: product?.unidadeProdutivaId || undefined, nome: form.nome, inicio: form.inicio, fim: form.fim, quantidadePrevista: Number(form.quantidadePrevista), unidade: form.unidade }); }}>Salvar safra</Button></Stack></CardContent></Card>}</Stack>}
      {tab === 4 && <Stack spacing={2}><Typography variant="h6">Calendário de sazonalidade</Typography>{records(sazonalidade, s => `${s.produtoProdutor?.produto || 'Produto'} · mês ${s.mes} · ${s.quantidadePrevista} ${s.unidade}`)}{canWrite && <Card variant="outlined"><CardContent><Stack spacing={2}>{select('produtoProdutorId', 'Produto', produtos, p => p.produto)}{field('mes', 'Mês (1 a 12)', 'number')}{field('quantidadePrevista', 'Quantidade prevista', 'number')}{field('unidade', 'Unidade')}<Button variant="contained" onClick={() => void submit('/produtor/minha-sazonalidade', { produtoProdutorId: form.produtoProdutorId, mes: Number(form.mes), quantidadePrevista: Number(form.quantidadePrevista), unidade: form.unidade })}>Salvar previsão</Button></Stack></CardContent></Card>}</Stack>}
      {tab === 5 && <Stack spacing={2}><Alert severity="info">Previsão é planejamento. O saldo confirmado considera somente a colheita registrada, descontadas perdas, reservas e compromissos informados.</Alert>{records(painel?.disponibilidade || [], d => `${d.produto} · prevista: ${d.prevista} ${d.unidade} · colhida: ${d.colhida} · saldo: ${d.saldo}`)}</Stack>}
      {tab === 6 && <Stack spacing={2}><Typography variant="h6">Como posso entregar</Typography>{records(logistica, l => `${l.modalidade} · ${l.municipiosAtendidos || 'Municípios não informados'} · capacidade: ${l.capacidadeDiaria ?? 'não informada'} ${l.unidadeCapacidade || ''}`)}{canWrite && <Card variant="outlined"><CardContent><Stack spacing={2}>{field('modalidade', 'Modalidade de entrega')}{field('municipiosAtendidos', 'Municípios atendidos')}{field('capacidadeDiaria', 'Capacidade por dia', 'number')}{field('unidade', 'Unidade da capacidade')}<Button variant="contained" onClick={() => void submit('/produtor/minha-logistica', { modalidade: form.modalidade, municipiosAtendidos: form.municipiosAtendidos, capacidadeDiaria: form.capacidadeDiaria ? Number(form.capacidadeDiaria) : undefined, unidadeCapacidade: form.unidade })}>Salvar logística</Button></Stack></CardContent></Card>}</Stack>}
      {tab === 7 && <Stack spacing={2}><Typography variant="h6">Catálogo de produtos</Typography>{catalogo.length ? catalogo.map(p => { const nutrition = p.informacoesNutricionais?.[0]; return <Card key={p.id} variant="outlined"><CardContent><Typography fontWeight={600}>{p.nome}</Typography><Typography color="text.secondary">{p.categoria || 'Categoria não informada'} · {p.unidadePadrao || 'Unidade não informada'}</Typography>{nutrition ? <Typography variant="body2">Referência nutricional: {nutrition.fonte}{nutrition.versaoFonte ? `, versão ${nutrition.versaoFonte}` : ''}. Energia: {nutrition.energiaKcal ?? 'não informada'} kcal; proteínas: {nutrition.proteinaG ?? 'não informadas'} g. Valores de referência do alimento, não laudo da produção individual.</Typography> : <Typography variant="body2" color="text.secondary">Informação nutricional validada ainda não disponível.</Typography>}</CardContent></Card>; }) : <Typography color="text.secondary">Catálogo sem produtos disponíveis.</Typography>}</Stack>}
    </>}
  </Stack>;
}
