import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';

type SchoolDetail = {
  id: string; nome: string; codigo?: string | null; endereco?: string | null; telefone?: string | null;
  responsavel?: string | null; active: boolean; restricaoAtendimento?: string | null; localizacao?: string | null;
  localidadeDiferenciada?: string | null; categoriaAdministrativa?: string | null; dependenciaAdministrativa?: string | null;
  categoriaEscolaPrivada?: string | null; conveniadaPoderPublico?: string | null; regulamentacaoConselho?: string | null;
  porteEscola?: string | null; etapasModalidades?: string | null; outrasOfertasEducacionais?: string | null;
  latitude?: string | number | null; longitude?: string | number | null;
  municipio?: { nome: string; uf: string; codigoIbge?: string | null } | null;
};

export default function EscolaDetalhesPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<ApiResponse<SchoolDetail>>(`/escolas/${id}`)
      .then(({ data }) => setSchool(data.data))
      .catch((err) => setError(err?.response?.data?.message || 'Não foi possível carregar os detalhes da escola.'))
      .finally(() => setLoading(false));
  }, [id]);

  const details: Array<[string, string | number | null | undefined]> = school ? [
    ['Código INEP', school.codigo], ['Município', school.municipio ? `${school.municipio.nome} - ${school.municipio.uf}` : null],
    ['Situação', school.active ? 'Ativa' : 'Inativa'], ['Restrição de atendimento', school.restricaoAtendimento],
    ['Localização', school.localizacao], ['Localidade diferenciada', school.localidadeDiferenciada],
    ['Categoria administrativa', school.categoriaAdministrativa], ['Dependência administrativa', school.dependenciaAdministrativa],
    ['Categoria da escola privada', school.categoriaEscolaPrivada], ['Conveniada ao poder público', school.conveniadaPoderPublico],
    ['Regulamentação pelo Conselho de Educação', school.regulamentacaoConselho], ['Porte da escola', school.porteEscola],
    ['Etapas e modalidades', school.etapasModalidades], ['Outras ofertas educacionais', school.outrasOfertasEducacionais],
    ['Endereço', school.endereco], ['Telefone', school.telefone], ['Responsável', school.responsavel],
    ['Latitude', school.latitude], ['Longitude', school.longitude], ['Código IBGE do município', school.municipio?.codigoIbge],
  ] : [];

  return <Stack spacing={2}>
    <Button startIcon={<ArrowBack />} onClick={() => navigate('/escolas')} sx={{ alignSelf: 'flex-start' }}>Voltar para escolas</Button>
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      : error ? <Alert severity="error">{error}</Alert>
      : school ? <>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
          <Box><Typography variant="h5" fontWeight={700}>{school.nome}</Typography><Typography color="text.secondary">{school.codigo || 'Sem código INEP'}{school.municipio ? ` · ${school.municipio.nome} - ${school.municipio.uf}` : ''}</Typography></Box>
          {school.codigo && <Button component="a" href={`https://idebescola.inep.gov.br/ideb/escola/dadosEscola/${school.codigo}`} target="_blank" rel="noreferrer">Consultar no INEP</Button>}
        </Stack>
        <Divider />
        <Grid container spacing={1.5}>
          {details.map(([label, value]) => <Grid item xs={12} sm={6} md={4} key={label}>
            <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{value === null || value === undefined || value === '' ? '—' : String(value)}</Typography>
            </Paper>
          </Grid>)}
        </Grid>
      </> : <Alert severity="info">Escola não encontrada.</Alert>}
  </Stack>;
}
