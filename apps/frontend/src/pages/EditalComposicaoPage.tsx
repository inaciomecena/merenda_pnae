import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const podeOperar = user?.role === 'ADMIN' || user?.role === 'DRE';
  const [form, setForm] = useState<any>(inicial);
  const [edital, setEdital] = useState<any>(null);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [itens, setItens] = useState<any[]>([{ produtoOriginal: '', quantidade: '', unidade: 'KG', especificacao: '' }]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [escolas, setEscolas] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const [previa, setPrevia] = useState<any>(null);
  const [mensagem, setMensagem] = useState('');

  const editavel = podeOperar && podeEditarComposicao(edital?.documento?.statusComposicao);

  useEffect(() => {
    void (async () => {
      const [mun, tpl] = await Promise.all([
        api.get('/municipios?limit=200').catch(() => ({ data: { data: { items: [] } } })),
        api.get('/templates-documento').catch(() => ({ data: { data: [] } })),
      ]);
      setMunicipios(mun.data.data?.items || mun.data.data || []);
      setTemplates(tpl.data.data || []);
      if (!novo) {
        const resposta = await api.get(`/editais/${id}/composicao`);
        preencher(resposta.data.data);
      }
    })().catch((err) => setErro(err?.response?.data?.message || 'Falha ao carregar o edital.'));
  }, [id]);

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
    if (data.itens?.length) {
      setItens(data.itens.map((item: any) => ({
        numeroItem: item.numeroItem,
        produtoOriginal: item.produtoOriginal,
        especificacao: item.especificacao || '',
        quantidade: item.quantidade ?? '',
        unidade: item.unidade || '',
      })));
    }
  }

  function setCampo(nome: string, valor: any) {
    setForm({ ...form, [nome]: valor });
  }

  async function salvar() {
    setErro('');
    const payload = {
      ...form,
      ano: Number(form.ano),
      municipioId: form.municipioId || undefined,
      dataPublicacao: form.dataPublicacao || undefined,
      dataRecebimento: form.dataRecebimento || undefined,
    };
    const resposta = novo
      ? await api.post('/editais/composicao', payload)
      : await api.patch(`/editais/${id}/composicao`, payload);
    const salvo = resposta.data.data;
    if (!novo) {
      await api.post(`/editais/${salvo.id}/composicao/itens`, {
        itens: itens.filter((item) => item.produtoOriginal).map((item, index) => ({
          ...item,
          numeroItem: index + 1,
          quantidade: item.quantidade === '' ? undefined : Number(item.quantidade),
        })),
      });
      if (anexos.length) await api.post(`/editais/${salvo.id}/composicao/anexos`, { anexos });
    }
    navigate(`/editais/${salvo.id}`);
    preencher((await api.get(`/editais/${salvo.id}/composicao`)).data.data);
    setMensagem('Estrutura salva.');
  }

  async function gerar() {
    setErro('');
    try {
      await salvar();
      const atualId = id && id !== 'novo' ? id : edital?.id;
      if (!atualId) return;
      preencher((await api.post(`/editais/${atualId}/composicao/gerar`, {}, { timeout: 120000 })).data.data);
      setMensagem('PDF e DOCX gerados.');
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'A geração foi recusada pela validação.');
    }
  }

  async function baixar(formato: 'pdf' | 'docx') {
    const resposta = await api.get(`/editais/${id}/composicao/download?formato=${formato}`, { responseType: 'blob', timeout: 120000 });
    const url = URL.createObjectURL(resposta.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edital-${form.numero}.${formato}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function confirmarVariavel(variavel: any) {
    await api.post(`/editais/${id}/composicao/variaveis`, {
      variaveis: [{ chave: variavel.chave, valor: variavel.valor || variavel.valorExtraido || '', statusRevisao: 'confirmado', escopo: variavel.escopo || '' }],
    });
    preencher((await api.get(`/editais/${id}/composicao`)).data.data);
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{novo ? 'Novo edital' : 'Estrutura do edital'}</Typography>
          <Typography color="text.secondary">Origem {edital?.documento?.origem || 'MANUAL'} · fonte {edital?.documento?.arquivoFonte || edital?.arquivoFonte || 'não informada'}</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button component={RouterLink} to="/editais" variant="outlined">Voltar</Button>
          {podeOperar && editavel ? <Button variant="contained" onClick={() => void salvar().catch((err) => setErro(err?.response?.data?.message || 'Não foi possível salvar.'))}>Salvar</Button> : null}
          {podeOperar && !novo ? <Button onClick={() => void api.get(`/editais/${id}/composicao/previa`).then((res) => setPrevia(res.data.data))}>Visualizar prévia</Button> : null}
          {podeOperar && !novo && editavel ? <Button variant="contained" color="secondary" onClick={() => void gerar()}>Gerar edital</Button> : null}
          {!novo ? <Button onClick={() => void baixar('pdf')}>Baixar PDF</Button> : null}
          {!novo ? <Button onClick={() => void baixar('docx')}>Baixar DOCX</Button> : null}
        </Stack>
      </Stack>
      {edital?.documento ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={rotuloStatus(edital.documento.statusComposicao)} color={edital.documento.statusComposicao === 'PUBLICADO' ? 'success' : 'primary'} />
          <Chip label={`Versão ${edital.documento.versaoAtual}`} />
          <Chip label={`Responsável ${edital.documento.updatedBy || edital.documento.createdBy || 'não informado'}`} />
          {edital.documento.geracoes?.[0] ? <Chip label={`Última geração ${new Date(edital.documento.geracoes[0].createdAt).toLocaleString('pt-BR')} · ${edital.documento.geracoes[0].usuarioNome || 'sistema'}`} /> : null}
        </Stack>
      ) : null}
      {erro ? <Alert severity="error">{Array.isArray(erro) ? erro.join(' ') : erro}</Alert> : null}
      {mensagem ? <Alert severity="success">{mensagem}</Alert> : null}
      {!editavel && edital?.documento?.statusComposicao === 'PUBLICADO' ? (
        <Alert severity="warning" action={podeOperar ? <Button color="inherit" onClick={() => void api.post(`/editais/${id}/composicao/nova-versao`).then((res) => preencher(res.data.data))}>Nova versão</Button> : undefined}>
          Documento publicado não pode ser alterado diretamente.
        </Alert>
      ) : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {[
          ['numero', 'Número'], ['ano', 'Ano'], ['titulo', 'Título'], ['objeto', 'Objeto'], ['descricao', 'Descrição'],
          ['processoAdministrativo', 'Processo administrativo'], ['dataPublicacao', 'Data de publicação'], ['dataRecebimento', 'Data de recebimento'],
          ['horarioRecebimento', 'Horário'], ['localRecebimento', 'Local'], ['comissao', 'Comissão'], ['legislacaoAplicavel', 'Legislação'],
          ['prazoVigencia', 'Prazo de vigência'], ['condicoesParticipacao', 'Condições de participação'], ['criteriosHabilitacao', 'Habilitação'],
          ['regrasEntrega', 'Regras de entrega'], ['formaPagamento', 'Pagamento'], ['penalidades', 'Penalidades'], ['foro', 'Foro'], ['observacoes', 'Observações'],
        ].map(([nome, label]) => (
          <TextField key={nome} label={label} type={nome.toLowerCase().includes('data') ? 'date' : nome === 'ano' ? 'number' : 'text'} InputLabelProps={nome.toLowerCase().includes('data') ? { shrink: true } : undefined} value={form[nome] ?? ''} disabled={!editavel && !novo} onChange={(e) => setCampo(nome, e.target.value)} />
        ))}
        <TextField select label="Município" value={form.municipioId} disabled={!editavel && !novo} onChange={async (e) => {
          setCampo('municipioId', e.target.value);
          const lista = (await api.get(`/escolas?limit=200&municipioId=${e.target.value}`)).data.data;
          setEscolas(lista.items || lista || []);
        }}>
          <MenuItem value="">Não informado</MenuItem>
          {municipios.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
        </TextField>
        <TextField select label="Unidades escolares" SelectProps={{ multiple: true }} value={form.escolaIds} disabled={!editavel && !novo} onChange={(e) => setCampo('escolaIds', e.target.value)}>
          {escolas.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
        </TextField>
      </Box>

      <Typography variant="h6">Itens</Typography>
      {itens.map((item, index) => (
        <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField label="Produto" value={item.produtoOriginal} disabled={!editavel && !novo} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, produtoOriginal: e.target.value } : atual))} />
          <TextField label="Especificação" value={item.especificacao} disabled={!editavel && !novo} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, especificacao: e.target.value } : atual))} />
          <TextField label="Quantidade" value={item.quantidade} disabled={!editavel && !novo} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, quantidade: e.target.value } : atual))} />
          <TextField label="Unidade" value={item.unidade} disabled={!editavel && !novo} onChange={(e) => setItens(itens.map((atual, i) => i === index ? { ...atual, unidade: e.target.value } : atual))} />
        </Stack>
      ))}
      {editavel || novo ? <Button onClick={() => setItens([...itens, { produtoOriginal: '', quantidade: '', unidade: 'KG', especificacao: '' }])}>Adicionar item</Button> : null}

      <Typography variant="h6">Anexos</Typography>
      {anexos.map((anexo, index) => (
        <Stack key={`${anexo.tipo}-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
          <Chip label={anexo.incluido ? 'Selecionado' : 'Fora'} color={anexo.incluido ? 'success' : 'default'} onClick={() => editavel && setAnexos(anexos.map((item, i) => i === index ? { ...item, incluido: !item.incluido } : item))} />
          <TextField label="Título" value={anexo.titulo} disabled={!editavel} onChange={(e) => setAnexos(anexos.map((item, i) => i === index ? { ...item, titulo: e.target.value } : item))} />
          <TextField select label="Template / versão" value={anexo.templateVersaoId || ''} disabled={!editavel} onChange={(e) => {
            const template = templates.find((item) => item.versoes?.[0]?.id === e.target.value || item.id === e.target.value);
            setAnexos(anexos.map((item, i) => i === index ? { ...item, templateId: template?.id || item.templateId, templateVersaoId: e.target.value } : item));
          }}>
            <MenuItem value="">Versão atual do template</MenuItem>
            {templates.filter((item) => item.tipo === anexo.tipo).map((item) => (
              <MenuItem key={item.id} value={item.versoes?.[0]?.id || ''}>{item.titulo} · v{item.versaoAtual}</MenuItem>
            ))}
          </TextField>
          <Button disabled={!editavel} onClick={() => setAnexos(moverAnexo(anexos, index, -1))}>Subir</Button>
          <Button disabled={!editavel} onClick={() => setAnexos(moverAnexo(anexos, index, 1))}>Descer</Button>
        </Stack>
      ))}
      {!anexos.length && !novo ? <Typography color="text.secondary">Nenhum anexo vinculado. Salve o edital para anexar os templates ativos.</Typography> : null}
      {editavel ? <Button onClick={() => setAnexos([...anexos, { tipo: TIPOS[Math.min(anexos.length, 7)], titulo: 'Novo anexo', ordem: anexos.length, incluido: true }])}>Adicionar anexo</Button> : null}

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
          {(previa?.secoes || []).map((secao: any) => (
            <Box key={secao.tipo} sx={{ mt: 2 }}>
              <Typography fontWeight={700}>{secao.titulo}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{secao.conteudo}</Typography>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
