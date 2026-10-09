import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { rotuloStatus } from '../lib/composicao-ui';
import api from '../services/api';

export default function EngenhariaReversaPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [estrutura, setEstrutura] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregar(forcar = false) {
    setCarregando(true);
    setErro('');
    try {
      if (forcar) await api.post(`/importacoes/${id}/estrutura`);
      try {
        setEstrutura((await api.get(`/importacoes/${id}/estrutura`)).data.data);
      } catch {
        await api.post(`/importacoes/${id}/estrutura`);
        setEstrutura((await api.get(`/importacoes/${id}/estrutura`)).data.data);
      }
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Não foi possível extrair a estrutura do PDF.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, [id]);

  function atualizarCampo(campoId: string, valor: string) {
    setEstrutura({
      ...estrutura,
      campos: estrutura.campos.map((campo: any) => campo.id === campoId ? { ...campo, valor, statusRevisao: 'confirmado' } : campo),
    });
  }

  async function salvar() {
    setErro('');
    const campos = estrutura.campos.map((campo: any) => ({ id: campo.id, chave: campo.chave, valor: campo.valor || '', statusRevisao: campo.statusRevisao }));
    setEstrutura((await api.patch(`/importacoes/${id}/estrutura/campos`, { campos })).data.data);
    setMensagem('Campos revisados. O PDF original não foi alterado.');
  }

  async function aplicar(modo: 'ATUALIZAR' | 'CRIAR_NOVO') {
    setErro('');
    try {
      await salvar();
      const criado = (await api.post(`/importacoes/${id}/estrutura/aplicar`, { modo })).data.data;
      navigate(`/editais/${criado.id}`);
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Não foi possível aplicar a estrutura.');
    }
  }

  if (carregando) return <Typography>Lendo o PDF e montando a conferência...</Typography>;
  if (!estrutura) return <Alert severity="error">{erro || 'Estrutura indisponível.'}</Alert>;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight={700}>Conferência da engenharia reversa</Typography>
          <Typography color="text.secondary">{estrutura.arquivoNome} · confiança {estrutura.confiancaGeral}</Typography>
        </Box>
        <Button component={RouterLink} to={`/importacoes/${id}/conferencia`} variant="outlined">Conferência de itens</Button>
      </Stack>
      <Alert severity="info">O arquivo-fonte permanece intacto. Número, ano, datas, município, escolas, processo, valores, quantidades, legislação, responsáveis e assinaturas não são copiados para um novo edital até serem confirmados.</Alert>
      {erro ? <Alert severity="error">{Array.isArray(erro) ? erro.join(' ') : erro}</Alert> : null}
      {mensagem ? <Alert severity="success">{mensagem}</Alert> : null}
      <Typography variant="caption">Arquivo-fonte: {estrutura.arquivoFonte}</Typography>
      <Stack spacing={1}>
        {estrutura.campos.map((campo: any) => (
          <Box key={campo.id} sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #e8e8e8', borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography fontWeight={700}>{campo.rotulo}</Typography>
              <Chip size="small" label={rotuloStatus(campo.statusRevisao)} color={campo.statusRevisao === 'pendente_revisao' ? 'warning' : 'success'} />
              <Chip size="small" label={campo.confianca || 'sem confiança'} />
              {campo.sensivel ? <Chip size="small" color="warning" label="Variável sensível" /> : null}
              {campo.paginaOrigem ? <Chip size="small" label={`Página ${campo.paginaOrigem}`} /> : null}
            </Stack>
            <Typography variant="caption" color="text.secondary">Extraído: {campo.valorExtraido || 'não identificado'}</Typography>
            <TextField fullWidth size="small" sx={{ mt: 1 }} label="Valor para o novo edital" value={campo.valor || ''} onChange={(e) => atualizarCampo(campo.id, e.target.value)} />
          </Box>
        ))}
      </Stack>
      <Typography fontWeight={700}>Anexos identificados</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">{(estrutura.anexos || []).map((anexo: any) => <Chip key={anexo.tipo} label={anexo.titulo} />)}</Stack>
      <Typography fontWeight={700}>Seções e cláusulas ({estrutura.secoes?.length || 0})</Typography>
      <Typography variant="body2" color="text.secondary">{(estrutura.secoes || []).slice(0, 8).map((secao: any) => secao.titulo).join(' · ') || 'Nenhuma cláusula numerada.'}</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button variant="outlined" onClick={() => void salvar()}>Salvar conferência</Button>
        <Button variant="contained" onClick={() => void aplicar('ATUALIZAR')}>Atualizar edital importado</Button>
        <Button variant="contained" color="secondary" onClick={() => void aplicar('CRIAR_NOVO')}>Criar novo edital</Button>
      </Stack>
    </Stack>
  );
}
