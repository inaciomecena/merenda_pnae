import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Box, Card, CardContent, CircularProgress, Drawer, IconButton, Stack, Typography, Divider, Chip,
} from '@mui/material';
import { Close, School, People, Assignment, LocalShipping } from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

interface MapMunicipio {
  id: string;
  nome: string;
  uf: string;
  codigoIbge: string;
  escolas: number;
  produtores: number;
  editais: number;
  propostas: number;
}

const MT_CENTER: [number, number] = [-12.64, -55.72];

function MapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [map, center, zoom]);
  return null;
}

const municipioCoords: Record<string, [number, number]> = {
  '5100102': [-14.22, -56.72],   // Alto Paraguai
  '5102524': [-16.07, -57.68],   // Caceres
  '5106756': [-15.23, -59.39],   // Pontes e Lacerda
  '5103209': [-15.59, -56.09],   // Cuiaba
  '5107602': [-12.64, -55.72],   // Sorriso
  '5102631': [-13.31, -55.92],   // Campo Novo do Parecis
  '5106253': [-14.85, -57.17],   // Jaciara
  '5105104': [-15.93, -55.85],   // Varzea Grande
  '5101805': [-13.65, -58.42],   // Brasnorte
  '5107909': [-14.87, -57.35],   // Tangara da Serra
};

function getCoord(codigoIbge: string): [number, number] {
  return municipioCoords[codigoIbge] || [-12.64, -55.72];
}

function getRadius(count: number): number {
  if (count >= 20) return 18;
  if (count >= 10) return 14;
  if (count >= 5) return 10;
  return 6;
}

function getColor(count: number): string {
  if (count >= 20) return '#01287C';
  if (count >= 10) return '#0284c7';
  if (count >= 5) return '#06b6d4';
  return '#22d3ee';
}

export default function MapPage() {
  const [municipios, setMunicipios] = useState<MapMunicipio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MapMunicipio | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/dashboard/mapa');
      setMunicipios(res.data as MapMunicipio[]);
    } catch {
      setError('Erro ao carregar dados do mapa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleMarkerClick = (m: MapMunicipio) => {
    setSelected(m);
    setDrawerOpen(true);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>Mapa do Mato Grosso</Typography>

      <Box sx={{ height: 500, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
        <MapContainer center={MT_CENTER} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapView center={MT_CENTER} zoom={6} />
          {municipios.map(m => {
            const coord = getCoord(m.codigoIbge);
            return (
              <CircleMarker
                key={m.id}
                center={coord}
                radius={getRadius(m.editais)}
                pathOptions={{ color: getColor(m.editais), fillColor: getColor(m.editais), fillOpacity: 0.7 }}
                eventHandlers={{ click: () => handleMarkerClick(m) }}
              >
                <Popup>
                  <strong>{m.nome}</strong><br />
                  Editais: {m.editais} | Escolas: {m.escolas}<br />
                  Produtores: {m.produtores} | Propostas: {m.propostas}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </Box>

      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Chip label={`${municipios.length} municipios`} color="primary" />
        <Chip label={`${municipios.reduce((a, m) => a + m.editais, 0)} editais`} />
        <Chip label={`${municipios.reduce((a, m) => a + m.escolas, 0)} escolas`} />
        <Chip label={`${municipios.reduce((a, m) => a + m.produtores, 0)} produtores`} />
      </Stack>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 350 } }}>
        {selected && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight={700}>{selected.nome}</Typography>
              <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>MT - IBGE: {selected.codigoIbge}</Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Assignment color="primary" />
                    <Typography variant="subtitle2">Editais</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700}>{selected.editais}</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <School color="secondary" />
                    <Typography variant="subtitle2">Escolas</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700}>{selected.escolas}</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <People sx={{ color: '#ea580c' }} />
                    <Typography variant="subtitle2">Produtores</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700}>{selected.produtores}</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalShipping sx={{ color: '#16a34a' }} />
                    <Typography variant="subtitle2">Propostas</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700}>{selected.propostas}</Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}
      </Drawer>
    </Stack>
  );
}
