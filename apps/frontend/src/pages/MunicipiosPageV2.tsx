import { CrudPage } from './CrudPage';

export default function MunicipiosPageV2() {
  return (
    <CrudPage
      title="Municípios"
      endpoint="/municipios"
      initialValues={{ nome: '', uf: 'MT', codigoIbge: '' }}
      fields={[
        { name: 'nome', label: 'Nome' },
        { name: 'uf', label: 'UF' },
        { name: 'codigoIbge', label: 'Codigo IBGE' },
      ]}
      renderRow={(item: any) => <>{item.nome} - {item.uf} - IBGE {item.codigoIbge || 'sem código'}</>}
    />
  );
}
