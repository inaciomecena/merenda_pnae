import { CrudPage } from './CrudPage';

export default function ProdutosReferenciaPage() {
  return (
    <CrudPage
      title="Produtos de referência"
      endpoint="/produtos-referencia"
      initialValues={{ nome: '', categoria: '', subcategoria: '', unidadePadrao: '', palavrasChave: '', sinonimos: '', agriculturaFamiliar: true, ativo: true }}
      fields={[
        { name: 'nome', label: 'Nome' },
        { name: 'categoria', label: 'Categoria' },
        { name: 'subcategoria', label: 'Subcategoria' },
        { name: 'unidadePadrao', label: 'Unidade padrão' },
        { name: 'palavrasChave', label: 'Palavras-chave' },
        { name: 'sinonimos', label: 'Sinônimos' },
      ]}
      renderRow={(item: any) => <>{item.nome} · {item.unidadePadrao || 'sem unidade'}{item.categoria ? ` · ${item.categoria}` : ''}{item.sinonimos ? ` · ${item.sinonimos}` : ''}</>}
    />
  );
}
