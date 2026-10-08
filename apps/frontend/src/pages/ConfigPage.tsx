import { useEffect, useState } from 'react';
import {
  Alert, Button, Card, CardContent, CircularProgress, Divider, Grid, Stack,
  TextField, Typography, Box,
} from '@mui/material';
import { Save, Refresh, Add } from '@mui/icons-material';
import api from '../services/api';
import type { ApiResponse } from '../types';

interface ConfigItem {
  id: string;
  chave: string;
  valor: string;
  descricao?: string;
  tipo: string;
}

const groups: Record<string, string[]> = {
  'Sistema': ['sistema.nome', 'sistema.versao'],
  'Orgao': ['orgao.nome', 'orgao.secretaria', 'orgao.programa'],
  'Documentos': ['documento.validade_padrao', 'documento.prazo_entrega_padrao'],
  'Upload': ['upload.tamanho_maximo_mb', 'upload.tipos_permitidos'],
};

export default function ConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [newConfig, setNewConfig] = useState({ chave: '', valor: '', descricao: '', tipo: 'texto' });
  const [showNew, setShowNew] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<ConfigItem[]>>('/config');
      const items = data.data || [];
      setConfigs(items);
      const vals: Record<string, string> = {};
      items.forEach(c => { vals[c.chave] = c.valor; });
      setEditedValues(vals);
    } catch {
      setError('Nao foi possivel carregar as configuracoes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchConfigs(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = configs.map(c => ({
        chave: c.chave,
        valor: editedValues[c.chave] || c.valor,
        descricao: c.descricao,
        tipo: c.tipo,
      }));
      await api.put('/config', updates);
      setSuccess('Configuracoes salvas com sucesso!');
      void fetchConfigs();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddConfig = async () => {
    if (!newConfig.chave || !newConfig.valor) {
      setError('Chave e valor sao obrigatorios.');
      return;
    }
    try {
      await api.put(`/config/${newConfig.chave}`, newConfig);
      setSuccess('Configuracao criada!');
      setNewConfig({ chave: '', valor: '', descricao: '', tipo: 'texto' });
      setShowNew(false);
      void fetchConfigs();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar configuracao');
    }
  };

  const handleInitDefaults = async () => {
    try {
      await api.post('/config/init');
      setSuccess('Configuracoes padrao inicializadas!');
      void fetchConfigs();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao inicializar');
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>Configuracoes</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => void fetchConfigs()}>Atualizar</Button>
          <Button variant="outlined" onClick={() => void handleInitDefaults()}>Restaurar Padroes</Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <Save />} onClick={handleSave} disabled={saving}>Salvar</Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {success ? <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert> : null}

      {loading ? <CircularProgress /> : (
        Object.entries(groups).map(([group, keys]) => (
          <Card key={group}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>{group}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {keys.map(key => {
                  const config = configs.find(c => c.chave === key);
                  return (
                    <Grid item xs={12} md={6} key={key}>
                      <TextField
                        label={config?.descricao || key}
                        fullWidth
                        size="small"
                        value={editedValues[key] || ''}
                        onChange={e => setEditedValues({ ...editedValues, [key]: e.target.value })}
                        helperText={key}
                        type={config?.tipo === 'numero' ? 'number' : 'text'}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        ))
      )}

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>Configuracoes Adicionais</Typography>
            <Button size="small" startIcon={<Add />} onClick={() => setShowNew(!showNew)}>Adicionar</Button>
          </Stack>
          {showNew && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <TextField label="Chave" fullWidth size="small" value={newConfig.chave} onChange={e => setNewConfig({ ...newConfig, chave: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Valor" fullWidth size="small" value={newConfig.valor} onChange={e => setNewConfig({ ...newConfig, valor: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Descricao" fullWidth size="small" value={newConfig.descricao} onChange={e => setNewConfig({ ...newConfig, descricao: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button variant="contained" onClick={handleAddConfig} fullWidth>Salvar</Button>
              </Grid>
            </Grid>
          )}
          <Box sx={{ mt: 2 }}>
            {configs.filter(c => !Object.values(groups).flat().includes(c.chave)).map(c => (
              <Stack key={c.id} direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 200 }}>{c.chave}</Typography>
                <TextField
                  size="small"
                  value={editedValues[c.chave] || ''}
                  onChange={e => setEditedValues({ ...editedValues, [c.chave]: e.target.value })}
                  sx={{ flex: 1 }}
                />
              </Stack>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
