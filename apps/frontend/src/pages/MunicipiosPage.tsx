import { CrudPage } from './CrudPage';

export default function MunicipiosPage() {
  return (
    <CrudPage
      title="Municípios"
      endpoint="/municipios"
      initialValues={{ nome: '', uf: '', codigoIbge: '' }}
      fields={[
        { name: 'nome', label: 'Nome' },
        { name: 'uf', label: 'UF' },
        { name: 'codigoIbge', label: 'Código IBGE' },
      ]}
      renderRow={(item: any) => <>{item.nome} — {item.uf}</>}
    />
  );
}
