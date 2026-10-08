import { CrudPage } from './CrudPage';
import api from '../services/api';

export default function EscolasPage() {
  const fetchMunicipios = async () => {
    try {
      const { data } = await api.get('/municipios?limit=100');
      return (data.data?.items ?? data.data ?? []).map((m: any) => ({ label: `${m.nome} - ${m.uf}`, value: m.id }));
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
        { name: 'codigo', label: 'Código INEP' },
        { name: 'municipioId', label: 'Município', fetchOptions: fetchMunicipios },
      ]}
      renderRow={(item: any) => <>{item.nome} — {item.codigo || 'Sem código'} — {item.municipio?.nome || ''}</>}
    />
  );
}
