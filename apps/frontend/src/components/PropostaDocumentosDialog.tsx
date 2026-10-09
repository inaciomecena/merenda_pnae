import { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import api from '../services/api';

interface Modelo {
  templateId: string; versaoId: string; numero: number; titulo: string; conteudo: string;
  finalidade: string; perfilFornecedor?: string; vinculadoEdital?: boolean;
}
interface Campo { chave: string; rotulo: string; obrigatorio: boolean; multiline: boolean }
const perfis = { INDIVIDUAL: 'Fornecedor individual', FORMAL: 'Grupo formal', INFORMAL: 'Grupo informal', EFR: 'Empreendimento familiar rural' };
const fixas = new Set(['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.municipio', 'produtor.telefone', 'edital.numero', 'edital.ano', 'projeto.valorTotal']);
const mensagem = (err: any) => { const m = err?.response?.data?.message; return Array.isArray(m) ? m.join(' ') : m || 'Não foi possível concluir a operação.'; };

export default function PropostaDocumentosDialog({ id, onClose, onGenerated, readOnly = false }: { id: string | null; onClose: () => void; onGenerated: () => void; readOnly?: boolean }) {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [selecionados, setSelecionados] = useState<Modelo[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [campos, setCampos] = useState<Campo[]>([]);
  const [perfil, setPerfil] = useState('INDIVIDUAL');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const [previa, setPrevia] = useState<Array<{ titulo: string; versao: number; texto: string }>>([]);
  const [pendencias, setPendencias] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [fixados, setFixados] = useState<Set<string>>(new Set());
  const bloqueado = readOnly || ['FINALIZADA', 'CANCELADA'].includes(status);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setBusy(true); setErro(''); setPrevia([]); setPendencias([]);
    api.get(`/propostas/${id}/documentos`).then(({ data }) => {
      if (!active) return;
      const p = data.data;
      setModelos(p.modelos); setSelecionados(p.selecionados); setValores(p.valores); setCampos(p.campos); setStatus(p.status);
      setFixados(new Set([...fixas].filter(chave => Boolean(p.valores[chave]))));
      setPerfil(p.selecionados[0]?.perfilFornecedor || 'INDIVIDUAL');
    }).catch(err => { if (active) setErro(mensagem(err)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [id]);

  const usadas = new Set(selecionados.flatMap(m => [...m.conteudo.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(match => match[1])));
  const camposVisiveis = campos.filter(c => usadas.has(c.chave));
  const disponiveis = [...modelos.filter(m => !m.perfilFornecedor || m.perfilFornecedor === perfil)];
  selecionados.forEach(m => { if (!disponiveis.some(d => d.versaoId === m.versaoId)) disponiveis.push(m); });
  const modificar = () => { setPrevia([]); setPendencias([]); };

  async function conferir(gerar = false) {
    if (!id) return;
    setBusy(true); setErro('');
    try {
      if (!bloqueado) await api.put(`/propostas/${id}/documentos`, { modelos: selecionados.map(m => ({ templateId: m.templateId, versaoId: m.versaoId })), valores });
      const p = (await api.get(`/propostas/${id}/documentos/previa`)).data.data;
      setPrevia(p.documentos); setPendencias(p.pendencias);
      if (gerar && p.pendencias.length === 0) {
        await api.post(`/propostas/${id}/gerar`, {}, { timeout: 60000 });
        onGenerated(); onClose();
      }
    } catch (err) { setErro(mensagem(err)); }
    finally { setBusy(false); }
  }

  return <Dialog open={Boolean(id)} onClose={busy ? undefined : onClose} fullWidth maxWidth="lg">
    <DialogTitle>Anexos e declarações do produtor</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Alert severity="info">Selecione os modelos da DRE, confira os dados do produtor e complete os campos pedidos nos documentos. O PDF e o DOCX incluem o projeto e as declarações selecionadas, prontos para assinatura.</Alert>
        {erro && <Alert severity="error">{erro}</Alert>}
        {busy && <CircularProgress size={24} />}
        <TextField select label="Perfil do fornecedor" value={perfil} disabled={busy || bloqueado} onChange={e => {
          const value = e.target.value; setPerfil(value); setSelecionados(modelos.filter(m => m.perfilFornecedor === value)); modificar();
        }}>{Object.entries(perfis).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
        <Typography variant="h6">Modelos e versões</Typography>
        {!disponiveis.length && !busy && <Alert severity="warning">Nenhum texto editável disponível para este perfil. A DRE precisa cadastrar e ativar um modelo de projeto de venda.</Alert>}
        {disponiveis.map(m => <FormControlLabel key={m.versaoId} control={<Checkbox disabled={busy || bloqueado} checked={selecionados.some(s => s.versaoId === m.versaoId)} onChange={(_, checked) => {
          setSelecionados(checked ? [...selecionados.filter(s => s.templateId !== m.templateId), m] : selecionados.filter(s => s.versaoId !== m.versaoId)); modificar();
        }} />} label={`${m.titulo} · v${m.numero}${m.vinculadoEdital ? ' · vinculado ao edital' : ''}`} />)}
        <Typography variant="h6">Dados para preenchimento</Typography>
        <Typography variant="body2" color="text.secondary">Os dados de identificação e os valores vêm do cadastro e dos itens do projeto. Complete aqui os demais campos; eles ficam salvos nesta proposta.</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {camposVisiveis.map(c => <TextField key={c.chave} label={c.rotulo} required={c.obrigatorio} value={valores[c.chave] || ''} disabled={busy || bloqueado} multiline={c.multiline} minRows={c.multiline ? 2 : undefined} slotProps={{ input: { readOnly: fixados.has(c.chave) } }} helperText={fixados.has(c.chave) ? 'Preenchido pelo cadastro / projeto' : undefined} onChange={e => { setValores({ ...valores, [c.chave]: e.target.value }); modificar(); }} />)}
        </Box>
        {pendencias.length > 0 && <Alert severity="warning"><Typography fontWeight={700}>Complete os campos antes de gerar:</Typography>{pendencias.map(p => <Typography key={p} variant="body2">{p}</Typography>)}</Alert>}
        {previa.map((p, index) => <Box key={index} sx={{ p: 3, border: '1px solid #c5cbd3', bgcolor: '#fff', borderRadius: 1 }}><Typography variant="h6">{p.titulo} · v{p.versao}</Typography><Typography component="pre" sx={{ fontFamily: 'Arial', fontSize: 14, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{p.texto}</Typography></Box>)}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button disabled={busy} onClick={onClose}>Fechar</Button>
      <Button disabled={busy || !selecionados.length} onClick={() => void conferir()}>{bloqueado ? 'Conferir documentos' : 'Salvar e conferir'}</Button>
      {!bloqueado && <Button variant="contained" disabled={busy || !selecionados.length} onClick={() => void conferir(true)}>Gerar PDF e DOCX</Button>}
    </DialogActions>
  </Dialog>;
}
