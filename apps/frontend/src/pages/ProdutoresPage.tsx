import { CrudPage } from './CrudPage';
import api from '../services/api';

export default function ProdutoresPage() {
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
      title="Produtores"
      endpoint="/produtores"
      initialValues={{ nome: '', cpfCnpj: '', municipioId: '', telefone: '' }}
      fields={[
        { name: 'nome', label: 'Nome' },
        { name: 'cpfCnpj', label: 'CPF/CNPJ' },
        { name: 'municipioId', label: 'Município', fetchOptions: fetchMunicipios },
        { name: 'telefone', label: 'Telefone' },
      ]}
      renderRow={(item: any) => <>{item.nome} — {item.cpfCnpj || 'Sem CPF/CNPJ'}</>}
    />
  );
}
