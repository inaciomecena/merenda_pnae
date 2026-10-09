import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { FormatAlignCenter, FormatAlignJustify, FormatAlignLeft, FormatAlignRight, FormatBold, FormatItalic, FormatListBulleted, FormatListNumbered, FormatUnderlined, InsertDriveFile, Link as LinkIcon, Redo, Undo } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

const TIPOS = [
  ['EDITAL_PRINCIPAL', 'Edital principal'],
  ['ANEXO_I', 'Anexo I'],
  ['ANEXO_II', 'Anexo II'],
  ['ANEXO_III', 'Anexo III'],
  ['ANEXO_IV', 'Anexo IV'],
  ['ANEXO_V', 'Anexo V'],
  ['ANEXO_VI', 'Anexo VI'],
  ['ANEXO_VII', 'Anexo VII'],
] as const;

const vazio = { tipo: 'ANEXO_I', numeroAnexo: 1, titulo: '', descricao: '', ordem: 1, formato: 'HTML', conteudo: '<p>{{edital.numero}}/{{edital.ano}}</p>', vigenciaInicio: '', vigenciaFim: '' };

function EditorDocumento({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (area.current && area.current.innerHTML !== value) area.current.innerHTML = value || '<p><br /></p>';
  }, [value]);
  const command = (name: string, arg?: string) => {
    area.current?.focus();
    document.execCommand(name, false, arg);
    onChange(area.current?.innerHTML || '');
  };
  const toolbar = [
    ['Desfazer', <Undo />, 'undo'], ['Refazer', <Redo />, 'redo'], ['Negrito', <FormatBold />, 'bold'], ['Itálico', <FormatItalic />, 'italic'], ['Sublinhado', <FormatUnderlined />, 'underline'],
    ['Lista com marcadores', <FormatListBulleted />, 'insertUnorderedList'], ['Lista numerada', <FormatListNumbered />, 'insertOrderedList'], ['Alinhar à esquerda', <FormatAlignLeft />, 'justifyLeft'], ['Centralizar', <FormatAlignCenter />, 'justifyCenter'], ['Alinhar à direita', <FormatAlignRight />, 'justifyRight'], ['Justificar', <FormatAlignJustify />, 'justifyFull'],
  ] as const;
  return <Box sx={{ border: '1px solid #c5cbd3', borderRadius: 1, overflow: 'hidden', bgcolor: '#f8fafc' }}>
    <Stack direction="row" spacing={0.25} sx={{ px: 1, py: 0.5, borderBottom: '1px solid #d9dee7', flexWrap: 'wrap' }}>
      {toolbar.map(([label, icon, action]) => <Tooltip title={label} key={label}><IconButton size="small" onMouseDown={(event) => event.preventDefault()} onClick={() => command(action)}>{icon}</IconButton></Tooltip>)}
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Inserir link"><IconButton size="small" onClick={() => { const url = window.prompt('URL do link'); if (url) command('createLink', url); }}><LinkIcon /></IconButton></Tooltip>
      <Tooltip title="Inserir placeholder"><IconButton size="small" onClick={() => { const chave = window.prompt('Placeholder (ex.: edital.numero)'); if (chave) command('insertText', `{{${chave}}}`); }}><InsertDriveFile /></IconButton></Tooltip>
    </Stack>
    <Stack direction="row" spacing={1} sx={{ px: 1, py: 0.5, borderBottom: '1px solid #d9dee7' }}>
      <TextField select size="small" defaultValue="p" onChange={(event) => command('formatBlock', event.target.value)} sx={{ minWidth: 130 }}>
        <MenuItem value="p">Texto normal</MenuItem><MenuItem value="h1">Título 1</MenuItem><MenuItem value="h2">Título 2</MenuItem><MenuItem value="h3">Título 3</MenuItem><MenuItem value="blockquote">Citação</MenuItem>
      </TextField>
    </Stack>
    <Box ref={area} contentEditable suppressContentEditableWarning onInput={() => onChange(area.current?.innerHTML || '')} sx={{ minHeight: 420, maxHeight: '55vh', overflow: 'auto', bgcolor: 'white', px: 6, py: 4, outline: 'none', fontFamily: 'Arial, sans-serif', '& p': { margin: '0 0 10px' }, '& table': { borderCollapse: 'collapse', width: '100%' }, '& td, & th': { border: '1px solid #777', padding: '6px' }, '& img': { maxWidth: '100%' } }} />
  </Box>;
}

export default function TemplatesAnexosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(vazio);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');
  const [versaoDe, setVersaoDe] = useState<any>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState('');

  useEffect(() => {
    let url = '';
    if (aberto && form.id && form.formato === 'PDF') {
      api.get(`/templates-documento/${form.id}/arquivo`, { responseType: 'blob' }).then((response) => {
        url = URL.createObjectURL(response.data);
        setPdfPreview(url);
      }).catch(() => setPdfPreview(''));
    } else {
      setPdfPreview('');
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [aberto, form.id, form.formato]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['templates-documento'],
    queryFn: async () => (await api.get('/templates-documento')).data.data,
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = { ...form, numeroAnexo: form.numeroAnexo === '' ? undefined : Number(form.numeroAnexo), ordem: Number(form.ordem || 0) };
      const resposta = form.id
        ? await api.patch(`/templates-documento/${form.id}`, payload)
        : await api.post('/templates-documento', payload);
      if (arquivo) {
        const body = new FormData();
        body.append('arquivo', arquivo);
        await api.post(`/templates-documento/${resposta.data.data.id}/arquivo`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    },
    onSuccess: async () => {
      setAberto(false);
      setArquivo(null);
      setErro('');
      await queryClient.invalidateQueries({ queryKey: ['templates-documento'] });
    },
    onError: (err: any) => setErro(err?.response?.data?.message || 'Não foi possível salvar o template.'),
  });

  async function acao(path: string, method: 'post' | 'patch' | 'delete' = 'post', body?: any) {
    setErro('');
    try {
      await api.request({ url: path, method, data: body });
      await queryClient.invalidateQueries({ queryKey: ['templates-documento'] });
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Operação não concluída.');
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Templates de Anexos</Typography>
          <Typography color="text.secondary">Modelos do edital principal e dos anexos I a VII, com versão e vigência.</Typography>
        </Box>
        <Button variant="contained" onClick={() => { setForm(vazio); setArquivo(null); setAberto(true); }}>Cadastrar template</Button>
      </Stack>
      {error ? <Alert severity="error">Não foi possível listar os templates.</Alert> : null}
      {erro ? <Alert severity="warning">{Array.isArray(erro) ? erro.join(' ') : erro}</Alert> : null}
      {isLoading ? <Typography>Carregando...</Typography> : null}
      <Stack spacing={1}>
        {(data || []).map((item: any) => (
          <Box key={item.id} sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e8e8e8' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography fontWeight={700}>{item.titulo}</Typography>
                <Typography variant="body2" color="text.secondary">{item.descricao || 'Sem descrição'}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                  <Chip size="small" label={item.tipo} />
                  <Chip size="small" label={item.ativo ? 'Ativo' : 'Inativo'} color={item.ativo ? 'success' : 'default'} />
                  <Chip size="small" label={`Versão ${item.versaoAtual}`} />
                  <Chip size="small" label={item.formato} />
                  <Chip size="small" label={`Ordem ${item.ordem}`} />
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button size="small" onClick={() => { setForm({ ...item, vigenciaInicio: item.vigenciaInicio?.slice(0, 10) || '', vigenciaFim: item.vigenciaFim?.slice(0, 10) || '', conteudo: item.conteudo || item.versoes?.[0]?.conteudo || '' }); setAberto(true); }}>Editar</Button>
                <Button size="small" onClick={() => setVersaoDe(item)}>Versões</Button>
                <Button size="small" onClick={() => void acao(`/templates-documento/${item.id}/duplicar`)}>Duplicar</Button>
                <Button size="small" onClick={() => void acao(`/templates-documento/${item.id}/status`, 'patch', { ativo: !item.ativo })}>{item.ativo ? 'Inativar' : 'Ativar'}</Button>
                <Button size="small" color="error" onClick={() => void acao(`/templates-documento/${item.id}`, 'delete')}>Excluir</Button>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog open={aberto} onClose={() => setAberto(false)} fullWidth maxWidth="md">
        <DialogTitle>{form.id ? 'Editar template' : 'Novo template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <TextField label="Número do anexo" type="number" value={form.numeroAnexo ?? ''} onChange={(e) => setForm({ ...form, numeroAnexo: e.target.value })} />
            <TextField label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <TextField label="Descrição" value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <TextField label="Ordem" type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
            <TextField select label="Formato" value={form.formato || 'HTML'} onChange={(e) => setForm({ ...form, formato: e.target.value })}>
              <MenuItem value="HTML">HTML</MenuItem>
              <MenuItem value="TEXTO">Texto</MenuItem>
              <MenuItem value="DOCX">DOCX</MenuItem>
              <MenuItem value="PDF">PDF preservado</MenuItem>
            </TextField>
            <TextField label="Vigência inicial" type="date" InputLabelProps={{ shrink: true }} value={form.vigenciaInicio || ''} onChange={(e) => setForm({ ...form, vigenciaInicio: e.target.value })} />
            <TextField label="Vigência final" type="date" InputLabelProps={{ shrink: true }} value={form.vigenciaFim || ''} onChange={(e) => setForm({ ...form, vigenciaFim: e.target.value })} />
            <Alert severity="info">Este cadastro define apenas o modelo visual. O arquivo será anexado ao edital na ordem selecionada, sem editar ou reformatar o conteúdo.</Alert>
            {form.formato === 'PDF' && pdfPreview ? <Box component="iframe" title="Pré-visualização do template PDF" src={pdfPreview} sx={{ width: '100%', height: '55vh', border: '1px solid #c5cbd3', bgcolor: '#666' }} /> : null}
            <Button component="label" variant="outlined" startIcon={<InsertDriveFile />}>Selecionar arquivo modelo (PDF ou DOCX)<input hidden type="file" accept=".docx,.pdf" onChange={(e) => { const selecionado = e.target.files?.[0] || null; setArquivo(selecionado); const nome = selecionado?.name.toLowerCase() || ''; if (nome.endsWith('.docx')) setForm({ ...form, formato: 'DOCX' }); if (nome.endsWith('.pdf')) setForm({ ...form, formato: 'PDF' }); }} /></Button>
            {arquivo ? <Typography variant="caption">{arquivo.name}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAberto(false)}>Cancelar</Button>
          <Button variant="contained" disabled={salvar.isPending} onClick={() => salvar.mutate()}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(versaoDe)} onClose={() => setVersaoDe(null)} fullWidth>
        <DialogTitle>Versões — {versaoDe?.titulo}</DialogTitle>
        <DialogContent>
          <Button size="small" onClick={async () => setVersaoDe((await api.get(`/templates-documento/${versaoDe.id}`)).data.data)}>Carregar histórico</Button>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {(versaoDe?.versoes || []).map((versao: any) => (
              <Box key={versao.id}>
                <Typography fontWeight={600}>Versão {versao.numero} — {versao.observacao || versao.titulo}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(versao.createdAt).toLocaleString('pt-BR')} · {versao.createdBy || 'sistema'}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>{versao.conteudo}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
