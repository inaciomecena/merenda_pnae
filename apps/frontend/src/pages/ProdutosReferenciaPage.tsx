import { CrudPage } from './CrudPage';

export default function ProdutosReferenciaPage() {
  return (
    <CrudPage
      title="Produtos de referência"
      endpoint="/produtos-referencia"
      initialValues={{ nome: '', categoria: '', unidadePadrao: '', ativo: true }}
      fields={[
        { name: 'nome', label: 'Nome' },
        { name: 'categoria', label: 'Categoria' },
        { name: 'unidadePadrao', label: 'Unidade padrão' },
      ]}
      renderRow={(item: any) => <>{item.nome}</>}
    />
  );
}
