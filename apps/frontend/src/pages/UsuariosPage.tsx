import { CrudPage } from './CrudPage';

export default function UsuariosPage() {
  return (
    <CrudPage
      title="Usuários"
      endpoint="/users"
      initialValues={{ name: '', email: '', role: 'ADMIN', password: '', escolaId: '', municipioId: '' }}
      fields={[
        { name: 'name', label: 'Nome' },
        { name: 'email', label: 'E-mail' },
        { name: 'role', label: 'Perfil', type: 'select', options: [{ label: 'Admin', value: 'ADMIN' }, { label: 'DRE', value: 'DRE' }, { label: 'Escola', value: 'ESCOLA' }, { label: 'Extensionista', value: 'EXTENSIONISTA' }, { label: 'Representante', value: 'REPRESENTANTE' }, { label: 'Produtor', value: 'PRODUTOR' }] },
        { name: 'password', label: 'Senha' },
        { name: 'escolaId', label: 'ID da escola (obrigatório para Escola)' },
        { name: 'municipioId', label: 'ID do município (obrigatório para Extensionista)' },
      ]}
      renderRow={(item: any) => <>{item.name} — {item.email}</>}
    />
  );
}
