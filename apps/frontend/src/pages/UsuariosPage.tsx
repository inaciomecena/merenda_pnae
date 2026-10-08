import { CrudPage } from './CrudPage';

export default function UsuariosPage() {
  return (
    <CrudPage
      title="Usuários"
      endpoint="/users"
      initialValues={{ name: '', email: '', role: 'ADMIN', password: '' }}
      fields={[
        { name: 'name', label: 'Nome' },
        { name: 'email', label: 'E-mail' },
        { name: 'role', label: 'Perfil', type: 'select', options: [{ label: 'Admin', value: 'ADMIN' }, { label: 'Escola', value: 'ESCOLA' }, { label: 'Extensionista', value: 'EXTENSIONISTA' }] },
        { name: 'password', label: 'Senha' },
      ]}
      renderRow={(item: any) => <>{item.name} — {item.email}</>}
    />
  );
}
