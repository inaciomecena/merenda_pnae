import { CrudPage } from './CrudPage';
import api from '../services/api';

export default function EscolasPageV2() {
  const fetchMunicipios = async () => {
    try {
      const { data } = await api.get('/municipios?limit=200&uf=MT');
      return (data.data?.items ?? data.data ?? []).map((m: any) => ({
        label: `${m.nome} - ${m.uf} (${m.codigoIbge || 'sem IBGE'})`,
        value: m.id,
      }));
    } catch {
      return [];
    }
  };

  return (
    <CrudPage
      title="Escolas"
      endpoint="/escolas"
      initialValues={{ nome: '', codigo: '', municipioId: '' }}
      fields={[
        { name: 'nome', label: 'Nome' },
        { name: 'codigo', label: 'Codigo INEP' },
        { name: 'municipioId', label: 'Municipio', fetchOptions: fetchMunicipios },
      ]}
      renderRow={(item: any) => (
        <>
          {item.nome} - INEP {item.codigo || 'sem codigo'} - {item.municipio?.nome || 'sem municipio'}-{item.municipio?.uf || 'MT'}
        </>
      )}
    />
  );
}
