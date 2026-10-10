# SDD-002 — Organização, acessos e representação

Requisitos: RF-02, RF-13, RF-14. Dependência: SDD-001.

## Design
Criar EEx, DRE, vínculo escola–DRE e vínculos de usuário. Acrescentar perfil do produtor e representação de organizações. Adaptar autenticação e autorização comum, sem confiar em IDs enviados pelo cliente.

Um usuário de DRE acessa apenas sua regional; escola acessa recursos próprios e editais dos quais participa; produtor acessa seus projetos e contratos; extensionista acessa fornecedores representados com autorização válida. Administração pode ter escopo global explicitamente concedido.

Revisar módulos antigos, downloads e relatórios. Corrigir o dashboard que oferece rota à DRE no frontend, mas não a inclui nos endpoints consultados. Distinguir função institucional das permissões de comissão, fiscalização e financeiro.

## Interface/API propostas
Painel inicial por perfil; gestão de vínculos; autorizações assistidas. Rotas autenticadas `GET /me/contexto`, `GET/POST /dres`, `POST /usuarios/:id/vinculos` e `POST /representacoes`, sob prefixo de API existente. Contratos de rotas serão ajustados às convenções do projeto.

## Aceite
- CA-002-A: DRE A não consulta/altera/exporta recursos da DRE B, mesmo fornecendo IDs válidos.
- CA-002-B: escola participante de chamada consolidada consulta o edital autorizado.
- CA-002-C: produtor não acessa documentos de outro fornecedor.
- CA-002-D: representação expirada/revogada bloqueia novos comandos e identifica o ator nos registros anteriores.
- CA-002-E: navegação e API concordam quanto às permissões; mudanças de vínculo têm efeito sem depender de token antigo privilegiado.
