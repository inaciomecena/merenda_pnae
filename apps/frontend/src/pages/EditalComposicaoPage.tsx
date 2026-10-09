import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteOutline } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { moverAnexo, podeEditarComposicao, rotuloStatus } from '../lib/composicao-ui';
import api from '../services/api';

const TIPOS = ['EDITAL_PRINCIPAL', 'ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V', 'ANEXO_VI', 'ANEXO_VII'];

const inicial = {
  numero: '', ano: 2026, titulo: '', objeto: '', descricao: '', municipioId: '', escolaIds: [] as string[],
  processoAdministrativo: '', dataPublicacao: '', localRecebimento: '', dataRecebimento: '', horarioRecebimento: '',
  comissao: '', legislacaoAplicavel: '', prazoVigencia: '', condicoesParticipacao: '', criteriosHabilitacao: '',
  regrasEntrega: '', formaPagamento: '', penalidades: '', foro: '', observacoes: '',
};

export default function EditalComposicaoPage() {
  const { id } = useParams();
  const novo = !id || id === 'novo';
  const [searchParams] = useSearchParams();
  const importacaoId = novo ? searchParams.get('importacaoId') : null;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const podeOperar = user?.role === 'ADMIN' || user?.role === 'DRE';
  const [form, setForm] = useState<any>(inicial);
  const [edital, setEdital] = useState<any>(null);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [itens, setItens] = useState<any[]>([{ produtoOriginal: '', quantidade: '', unidade: 'KG', especificacao: '' }]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [padroes, setPadroes] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [escolas, setEscolas] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const [pendencias, setPendencias] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);
  const [previa, setPrevia] = useState<any>(null);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const editavel = podeOperar && podeEditarComposicao(edital?.documento?.statusComposicao);
  const arquivoDisponivel = (formato: string) => edital?.documento?.geracoes?.some((geracao: any) =>
    geracao.status === 'SUCESSO' && geracao.formato === formato && geracao.versaoNumero === edital.documento.versaoAtual);
  const haDocumentosGerados = Boolean(arquivoDisponivel('PDF') || arquivoDisponivel('DOCX'));

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    setPendencias([]);
    setMensagem('');
    setEdital(null);
    setForm(inicial);
    setAnexos([]);
    setItens([{ produtoOriginal: '', quantidade: '', unidade: 'KG', especificacao: '', precoUnitario: '' }]);
    void (async () => {
      const [mun, tpl, modelosPadrao] = await Promise.all([
        api.get('/municipios?limit=200').catch(() => ({ data: { data: { items: [] } } })),
        api.get('/templates-documento?ativo=true').catch(() => ({ data: { data: [] } })),
        podeOperar ? api.get('/templates-documento/anexos-padrao') : Promise.resolve({ data: { data: [] } }),
      ]);
      if (!ativo) return;
      setMunicipios(mun.data.data?.items || mun.data.data || []);
      setTemplates(tpl.data.data || []);
      setPadroes(modelosPadrao.data.data || []);
      if (!novo) {
        const resposta = await api.get(`/editais/${id}/composicao`);
        if (ativo) preencher(resposta.data.data);
      } else if (importacaoId) {
        const resposta = await api.post(`/importacoes/${importacaoId}/preparar-edital`, {}, { timeout: 120000 });
        if (ativo) preencher(resposta.data.data);
      } else {
        setAnexos(modelosPadrao.data.data || []);
      }
    })().catch((err) => { if (ativo) setErro(err?.response?.data?.message || 'Falha ao carregar o edital.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id, importacaoId]);

  useEffect(() => {
    let ativo = true;
    setEscolas([]);
    if (form.municipioId) {
      api.get(`/escolas?limit=500&municipioId=${form.municipioId}`).then(res => {
        if (ativo) setEscolas(res.data.data.items || res.data.data || []);
      }).catch(() => { if (ativo) setErro('Não foi possível carregar as escolas do município.'); });
    }
    return () => { ativo = false; };
  }, [form.municipioId]);

  function preencher(data: any) {
    setEdital(data);
    setForm({
      ...inicial,
      numero: data.numero,
      ano: data.ano,
      titulo: data.titulo,
      objeto: data.objeto || '',
      descricao: data.descricao || '',
      municipioId: data.municipioId || '',
      escolaIds: (data.escolasVinculadas || []).map((item: any) => item.escolaId || item.escola?.id),
      processoAdministrativo: data.documento?.processoAdministrativo || '',
      dataPublicacao: data.dataPublicacao?.slice(0, 10) || '',
      localRecebimento: data.documento?.localRecebimento || '',
      dataRecebimento: data.documento?.dataRecebimento?.slice(0, 10) || '',
      horarioRecebimento: data.documento?.horarioRecebimento || '',
      comissao: data.documento?.comissao || '',
      legislacaoAplicavel: data.documento?.legislacaoAplicavel || '',
      prazoVigencia: data.documento?.prazoVigencia || '',
      condicoesParticipacao: data.documento?.condicoesParticipacao || '',
      criteriosHabilitacao: data.documento?.criteriosHabilitacao || '',
      regrasEntrega: data.documento?.regrasEntrega || '',
      formaPagamento: data.documento?.formaPagamento || '',
      penalidades: data.documento?.penalidades || '',
      foro: data.documento?.foro || '',
      observacoes: data.documento?.observacoesDocumento || data.observacoes || '',
    });
    setAnexos(data.documento?.anexos || []);
      setItens((data.itens || []).map((item: any) => ({
        numeroItem: item.numeroItem,
        produtoOriginal: item.produtoOriginal,
        especificacao: item.especificacao || '',
        quantidade: item.quantidade ?? '',
        unidade: item.unidade || '',
        precoUnitario: item.precoUnitario ?? '',
      })));
  }

  function setCampo(nome: string, valor: any) {
    setForm({ ...form, [nome]: valor });
  }

  async function salvar() {
    if (salvando || carregando) return;
    setSalvando(true);
    try {
      setErro('');
      const itensPayload = itens.filter((item) => item.produtoOriginal.trim()).map((item, index) => ({
        numeroItem: index + 1, produtoOriginal: item.produtoOriginal, especificacao: item.especificacao || '',
        unidade: item.unidade || '', quantidade: item.quantidade === '' || item.quantidade == null ? undefined : Number(item.quantidade),
        precoUnitario: item.precoUnitario === '' || item.precoUnitario == null ? undefined : Number(item.precoUnitario),
      }));
      const payload = {
        ...form,
        ano: Number(form.ano),
        municipioId: form.municipioId || null,
        dataPublicacao: form.dataPublicacao || null,
        dataRecebimento: form.dataRecebimento || null,
      };
      const anexosPayload = anexos.map((anexo, ordem) => ({
        tipo: anexo.tipo, titulo: anexo.titulo, ordem, incluido: anexo.incluido,
        templateId: anexo.templateId || undefined, templateVersaoId: anexo.templateVersaoId || undefined, conteudoManual: anexo.conteudoManual || undefined,
      }));
      const resposta = novo
        ? await api.post('/editais/composicao', { ...payload, itens: itensPayload, anexos: anexosPayload, ...(importacaoId ? { importacaoId } : {}) })
        : await api.patch(`/editais/${id}/composicao`, payload);
      const salvo = resposta.data.data;
      if (!novo) {
        await api.post(`/editais/${salvo.id}/composicao/itens`, {
          itens: itensPayload,
        });
        await api.post(`/editais/${salvo.id}/composicao/anexos`, { anexos: anexosPayload });
      }
      navigate(`/editais/${salvo.id}`);
      preencher((await api.get(`/editais/${salvo.id}/composicao`)).data.data);
      setMensagem('Estrutura salva.');
      await queryClient.invalidateQueries({ queryKey: ['editais'] });
      return salvo.id;
    } finally { setSalvando(false); }
  }

  async function gerar(atualizar = false) {
    if (gerando || salvando || carregando) return;
    setGerando(true);
    setErro('');
    setPendencias([]);
    setMensagem('');
    try {
      const atualId = await salvar();
      if (!atualId) return;
      preencher((await api.post(`/editais/${atualId}/composicao/gerar`, {}, { timeout: 120000 })).data.data);
      setMensagem(atualizar ? 'PDF e DOCX atualizados.' : 'PDF e DOCX gerados.');
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'A geração foi recusada pela validação.');
      setPendencias(err?.response?.data?.erros || []);
    } finally { setGerando(false); }
  }

  async function baixar(formato: 'pdf' | 'docx') {
    try {
    const resposta = await api.get(`/editais/${id}/composicao/download?formato=${formato}`, { responseType: 'blob', timeout: 120000 });
    const url = URL.createObjectURL(resposta.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edital-${form.numero}.${formato}`;
    link.click();
    URL.revokeObjectURL(url);
    } catch (err: any) {
      const corpo = err?.response?.data;
      let mensagem = 'Não foi possível baixar o documento. Gere o edital e tente novamente.';
      if (corpo instanceof Blob) {
        try { mensagem = JSON.parse(await corpo.text()).message || mensagem; } catch { /* mantém a mensagem de download */ }
      } else if (corpo?.message) mensagem = corpo.message;
      setErro(mensagem);
    }
  }

  async function confirmarVariavel(variavel: any) {
    await api.post(`/editais/${id}/composicao/variaveis`, {
      variaveis: [{ chave: variavel.chave, valor: variavel.valor || variavel.valorExtraido || '', statusRevisao: 'confirmado', escopo: variavel.escopo || '' }],
    });
    preencher((await api.get(`/editais/${id}/composicao`)).data.data);
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>{novo ? 'Novo edital' : 'Estrutura do edital'}</Typography>
      <Box role="group" aria-label="Ações do edital" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', '& .MuiButton-root': { whiteSpace: 'nowrap', minHeight: 40 } }}>
        <Button component={RouterLink} to="/editais" variant="contained" color="primary">Voltar</Button>
        {podeOperar && editavel ? <Button variant="contained" color="primary" disabled={carregando || salvando || gerando || (Boolean(importacaoId) && !edital)} onClick={() => void salvar().catch((err) => setErro(err?.response?.data?.message || 'Não foi possível salvar.'))}>{salvando ? 'Salvando...' : 'Salvar'}</Button> : null}
        {podeOperar && !novo ? <Button variant="contained" color="primary" disabled={carregando || salvando || gerando} onClick={() => void api.get(`/editais/${id}/composicao/previa`).then((res) => setPrevia(res.data.data)).catch(() => setErro('Não foi possível carregar a prévia.'))}>Visualizar prévia</Button> : null}
        {podeOperar && !novo && editavel ? <Button variant="contained" color="primary" disabled={gerando || carregando || salvando} onClick={() => void gerar(haDocumentosGerados)}>{gerando ? (haDocumentosGerados ? 'Atualizando...' : 'Gerando...') : haDocumentosGerados ? 'Atualizar PDF/DOCX' : 'Gerar edital'}</Button> : null}
        {!novo ? <Button variant="contained" color="primary" disabled={!arquivoDisponivel('PDF') || gerando || salvando || carregando} onClick={() => void baixar('pdf')}>Baixar PDF</Button> : null}
        {!novo ? <Button variant="contained" color="primary" disabled={!arquivoDisponivel('DOCX') || gerando || salvando || carregando} onClick={() => void baixar('docx')}>Baixar DOCX</Button> : null}
      </Box>
      {!novo && edital?.documento ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={rotuloStatus(edital.documento.statusComposicao)} color={edital.documento.statusComposicao === 'PUBLICADO' ? 'success' : 'primary'} />
          <Chip label={`Versão ${edital.documento.versaoAtual}`} />
          <Chip label={`Responsável ${edital.documento.updatedBy || edital.documento.createdBy || 'não informado'}`} />
          {edital.documento.geracoes?.[0] ? <Chip label={`Última geração ${new Date(edital.documento.geracoes[0].createdAt).toLocaleString('pt-BR')} · ${edital.documento.geracoes[0].usuarioNome || 'sistema'}`} /> : null}
        </Stack>
      ) : null}
      {erro ? <Alert severity="error">{Array.isArray(erro) ? erro.join(' ') : erro}
        {pendencias.length ? <Box component="ul" sx={{ pl: 2, mb: 0 }}>{pendencias.map((pendencia, index) => {
          const item = pendencia.match(/^Item (\d+)/)?.[1];
          return <li key={index}>{pendencia}{item ? <Button size="small" onClick={() => document.getElementById(`edital-item-${item}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Ver item</Button> : null}</li>;
        })}</Box> : null}
      </Alert> : null}
      {mensagem ? <Alert severity="success">{mensagem}</Alert> : null}
      {carregando ? <Typography>Carregando dados do edital...</Typography> : null}
      {importacaoId && edital ? <Alert severity="info">Dados da importação carregados. Revise os campos, as escolas, os produtos e os preços. O novo edital será criado ao salvar; o edital de origem será preservado.</Alert> : null}
      {!editavel && edital?.documento?.statusComposicao === 'PUBLICADO' ? (
        <Alert severity="warning" action={podeOperar ? <Button color="inherit" onClick={() => void api.post(`/editais/${id}/composicao/nova-versao`).then((res) => preencher(res.data.data))}>Nova versão</Button> : undefined}>
          Documento publicado não pode ser alterado diretamente.
        </Alert>
      ) : null}

      <Box component="fieldset" disabled={carregando || salvando || gerando} sx={{ border: 0, p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {[
          ['numero', 'Número'], ['ano', 'Ano'], ['titulo', 'Título'], ['objeto', 'Objeto'], ['descricao', 'Descrição'],
          ['processoAdministrativo', 'Processo administrativo'], ['dataPublicacao', 'Data de publicação'], ['dataRecebimento', 'Data de recebimento'],
          ['horarioRecebimento', 'Horário'], ['localRecebimento', 'Local'], ['comissao', 'Comissão'], ['legislacaoAplicavel', 'Legislação'],
          ['prazoVigencia', 'Prazo de vigência'], ['condicoesParticipacao', 'Condições de participação'], ['criteriosHabilitacao', 'Habilitação'],
          ['regrasEntrega', 'Regras de entrega'], ['formaPagamento', 'Pagamento'], ['penalidades', 'Penalidades'], ['foro', 'Foro'], ['observacoes', 'Observações'],
        ].map(([nome, label]) => (
          <TextField key={nome} label={label} type={nome.toLowerCase().includes('data') ? 'date' : nome === 'ano' ? 'number' : 'text'} InputLabelProps={nome.toLowerCase().includes('data') ? { shrink: true } : undefined} value={form[nome] ?? ''} disabled={!editavel && !novo} onChange={(e) => setCampo(nome, e.target.value)} />
        ))}
        <TextField select label="Município" value={form.municipioId} disabled={!editavel && !novo} onChange={(e) => {
          setForm({ ...form, municipioId: e.target.value, escolaIds: [] });
        }}>
          <MenuItem value="">Não informado</MenuItem>
          {municipios.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
        </TextField>
        <TextField select label="Unidades escolares" SelectProps={{ multiple: true }} value={form.escolaIds} disabled={!editavel && !novo} onChange={(e) => setCampo('escolaIds', e.target.value)}>
          {escolas.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
        </TextField>
      </Box>

      <Typography variant="h6">Itens ({itens.length})</Typography>
      {itens.map((item, index) => (
        <Box key={index} id={`edital-item-${index + 1}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'minmax(150px, 1.2fr) minmax(220px, 2fr) minmax(95px, .6fr) minmax(75px, .5fr) minmax(120px, .8fr) auto' }, gap: 1, alignItems: 'start', p: 1.5, bgcolor: 'white', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <TextField fullWidth multiline minRows={2} label="Produto" sx={{ gridColumn: { xs: 'span 2', lg: 'auto' } }} value={item.produtoOriginal} disabled={!editavel || carregando || salvando} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, produtoOriginal: e.target.value } : atual))} />
          <TextField fullWidth multiline minRows={2} maxRows={6} label="Especificação" sx={{ gridColumn: { xs: 'span 2', lg: 'auto' } }} value={item.especificacao} disabled={!editavel || carregando || salvando} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, especificacao: e.target.value } : atual))} />
          <TextField label="Quantidade" value={item.quantidade} disabled={!editavel && !novo} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, quantidade: e.target.value } : atual))} />
          <TextField label="Unidade" value={item.unidade} disabled={!editavel && !novo} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, unidade: e.target.value } : atual))} />
          <TextField label="Preço unitário (R$)" type="number" value={item.precoUnitario ?? ''} disabled={!editavel && !novo} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, precoUnitario: e.target.value } : atual))} />
          {editavel ? <Button color="error" startIcon={<DeleteOutline />} aria-label={`Excluir item ${index + 1}`} disabled={carregando || salvando} onClick={() => setItens(itens.filter((_, i) => i !== index))}>Excluir</Button> : null}
        </Box>
      ))}
      {!itens.length ? <Typography color="text.secondary">Nenhum item selecionado. Adicione os produtos que farão parte do edital.</Typography> : null}
      {editavel || novo ? <Button onClick={() => setItens([...itens, { produtoOriginal: '', quantidade: '', unidade: 'KG', especificacao: '' }])}>Adicionar item</Button> : null}

      <Typography variant="h6">Anexos e declarações ({anexos.filter(anexo => anexo.incluido).length} selecionados)</Typography>
      {anexos.map((anexo, index) => (
        <Box key={`${anexo.templateId || anexo.tipo}-${index}`} data-anexo sx={{ p: 2, bgcolor: 'white', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Chip size="small" label={anexo.incluido ? 'Selecionado' : 'Fora do edital'} color={anexo.incluido ? 'success' : 'default'} disabled={!editavel || carregando || salvando} onClick={() => setAnexos(anexos.map((item, i) => i === index ? { ...item, incluido: !item.incluido } : item))} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>{anexo.tipo.replaceAll('_', ' ')} · posição {index + 1}</Typography>
            <Button disabled={!editavel || carregando || salvando || index === 0} onClick={() => setAnexos(moverAnexo(anexos, index, -1))}>Subir</Button>
            <Button disabled={!editavel || carregando || salvando || index === anexos.length - 1} onClick={() => setAnexos(moverAnexo(anexos, index, 1))}>Descer</Button>
            {editavel ? <Button color="error" startIcon={<DeleteOutline />} aria-label={`Remover anexo ${index + 1}`} disabled={carregando || salvando} onClick={() => setAnexos(anexos.filter((_, i) => i !== index))}>Remover</Button> : null}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.2fr)' }, gap: 2 }}>
          <TextField fullWidth multiline minRows={2} label="Título do anexo ou declaração" value={anexo.titulo} disabled={!editavel || carregando || salvando} onChange={(e) => setAnexos(anexos.map((item, i) => i === index ? { ...item, titulo: e.target.value } : item))} />
          <TextField fullWidth select label="Modelo / versão" sx={{ minWidth: 0, '& .MuiSelect-select': { whiteSpace: 'normal', minHeight: '3em', display: 'flex', alignItems: 'center' } }} SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 420, maxWidth: '90vw', '& .MuiMenuItem-root': { whiteSpace: 'normal' } } } } }} value={anexo.templateVersaoId || ''} disabled={!editavel || carregando || salvando} onChange={(e) => {
            const template = templates.find((item) => item.versoes?.some((versao: any) => versao.id === e.target.value));
            setAnexos(anexos.map((item, i) => i === index ? { ...item, tipo: template?.tipo || item.tipo, titulo: template?.titulo || item.titulo, templateId: template?.id || item.templateId, templateVersaoId: e.target.value } : item));
          }}>
            <MenuItem value="">Versão atual do template</MenuItem>
            {anexo.templateVersaoId && !templates.some(template => template.versoes?.some((versao: any) => versao.id === anexo.templateVersaoId)) ? <MenuItem value={anexo.templateVersaoId}>{anexo.templateVersao?.titulo || anexo.titulo} · v{anexo.templateVersao?.numero || 'fixada'}</MenuItem> : null}
            {templates.filter(item => item.versoes?.[0]).map((item) => (
              <MenuItem key={item.id} value={item.versoes[0].id}>{item.titulo} · v{item.versaoAtual}</MenuItem>
            ))}
          </TextField>
          </Box>
        </Box>
      ))}
      {!anexos.length && !novo ? <Typography color="text.secondary">Nenhum anexo vinculado. Salve o edital para anexar os templates ativos.</Typography> : null}
      {editavel ? <Button onClick={() => setAnexos([...anexos, { tipo: TIPOS[Math.min(anexos.length, 7)], titulo: 'Novo anexo', ordem: anexos.length, incluido: true }])}>Adicionar anexo</Button> : null}
      {editavel ? <Button disabled={carregando || salvando} onClick={() => setAnexos([...anexos, ...padroes.filter(padrao => !anexos.some(anexo => anexo.templateId === padrao.templateId))].map((anexo, ordem) => ({ ...anexo, ordem })))}>Vincular modelos ativos de anexos e declarações</Button> : null}

      <Typography variant="h6">Variáveis e pendências</Typography>
      {(edital?.documento?.variaveis || []).map((variavel: any) => (
        <Stack key={variavel.id} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
          <Typography sx={{ minWidth: 220 }}>{`{{${variavel.chave}}}`}</Typography>
          <Chip size="small" label={rotuloStatus(variavel.statusRevisao)} color={variavel.statusRevisao === 'pendente_revisao' ? 'warning' : 'success'} />
          {variavel.paginaOrigem ? <Chip size="small" label={`Página ${variavel.paginaOrigem}`} /> : null}
          <TextField size="small" fullWidth value={variavel.valor || ''} disabled={!editavel} onChange={(e) => setEdital({ ...edital, documento: { ...edital.documento, variaveis: edital.documento.variaveis.map((item: any) => item.id === variavel.id ? { ...item, valor: e.target.value } : item) } })} />
          {editavel ? <Button size="small" onClick={() => void confirmarVariavel(variavel)}>Confirmar</Button> : null}
        </Stack>
      ))}

      <Typography variant="h6">Histórico de versões</Typography>
      {(edital?.documento?.versoes || []).map((versao: any) => (
        <Typography key={versao.id} variant="body2">{`v${versao.numero} · ${rotuloStatus(versao.statusComposicao)} · ${versao.motivo || 'sem motivo'} · ${new Date(versao.createdAt).toLocaleString('pt-BR')}`}</Typography>
      ))}
      {podeOperar && edital?.documento?.statusComposicao === 'GERADO' ? <Button onClick={() => void api.post(`/editais/${id}/composicao/publicar`).then((res) => preencher(res.data.data))}>Publicar</Button> : null}

      <Dialog open={Boolean(previa)} onClose={() => setPrevia(null)} fullWidth maxWidth="md">
        <DialogTitle>Prévia</DialogTitle>
        <DialogContent>
          {previa?.validacao?.erros?.length ? <Alert severity="warning">{previa.validacao.erros.join(' ')}</Alert> : <Alert severity="success">Validação sem pendências.</Alert>}
          {(previa?.secoes || []).map((secao: any, index: number) => (
            <Box key={`${secao.tipo}-${index}`} sx={{ mt: 2 }}>
              <Typography fontWeight={700}>{secao.titulo}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{secao.conteudo}</Typography>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
