# Arquitetura proposta

## Decisões técnicas
Manter monorepo atual, React/TypeScript/MUI, NestJS/Prisma e MySQL. Backend modular único na primeira versão, com serviços de domínio por etapa. Não iniciar migração de stack sem problema concreto que a justifique.

Separar módulos: organização/acessos; demanda/oferta; composição documental; oportunidades; projetos; seleção; contratos; ordens; recebimentos; financeiro; indicadores. Reaproveitar os módulos existentes onde a responsabilidade coincide.

## Fronteiras
- Interface solicita operações e exibe resultados; nunca é a autoridade de saldo, prazo ou permissão.
- Controllers autenticam, validam DTOs e encaminham contexto do usuário.
- Serviços aplicam autorização por recurso, transições e regras de domínio.
- Repositórios/Prisma persistem operações críticas em transações.
- Indicadores usam registros operacionais e filtros obrigatórios do contexto autorizado.
- Documentos publicados e financeiros são armazenados fora do código versionado, com metadados e autorização de download.

## Autorização
Contexto contém usuário, funções, vínculos de DRE/escola/fornecedor e representações válidas. O escopo solicitado pelo cliente somente restringe o conjunto autorizado; nunca o amplia. Verificar também recursos filhos, downloads, exportações e IDs indiretos.

Escolher um mecanismo comum de políticas e aplicá-lo aos módulos legados. A função `requireScope` existente não representa a regional da DRE; deve evoluir. Escola participante de edital consolidado precisa ser reconhecida pela relação `EditalEscola`, além de `escolaId` legado.

## Comandos críticos
Cada comando de emissão, conferência ou pagamento aceita chave de idempotência por ator/contexto/operação. Persistir chave, hash da requisição e resultado na mesma transação: repetição igual retorna o resultado; mesma chave com conteúdo diferente retorna conflito.

Para reservar saldo, bloquear a linha do item contratual e alocações envolvidas em ordem consistente, reler saldo e gravar reserva. Avaliar `SELECT ... FOR UPDATE` via consulta parametrizada do Prisma, ou atualização condicional equivalente, com teste real no banco suportado. Nunca depender de saldo previamente calculado no frontend.

## Eventos e notificações
Outbox transacional grava eventos junto à mudança operacional. Worker com tentativas e deduplicação envia notificações; falha de envio não desfaz ordem ou pagamento confirmado. Começar com notificações no painel; email/push/WhatsApp exigem configuração própria. Aviso não substitui publicação oficial.

## Documentos e dados
Guardar identificador, proprietário, classificação pública/restrita, mime, tamanho, hash SHA-256, versão e vínculo de origem. Arquivos legados devem ser inventariados. Migrações de caminhos preservam o download autorizado e a versão histórica.

Normalizar datas e moedas. Serializar Decimal como string nas APIs; usar biblioteca decimal nos cálculos necessários da interface. Definir escala por quantidade/unidade e política de arredondamento por item e total.

## Integridade
Não excluir contratos, recebimentos aceitos e pagamentos contabilizados fisicamente. Usar cancelamento, encerramento ou evento de correção autorizado. Soft delete existente exige filtros uniformes; auditoria não substitui tabelas operacionais.

Configurações legais possuem versão, vigência, origem e aprovador. Cada chamada/contrato referencia a versão aplicada. IA pode sugerir extração documental com origem e confiança, mantendo revisão humana antes de publicação.

## Evolução segura
Migrações aditivas: criar estruturas, preencher vínculos de modo verificável, habilitar funcionalidades e só depois avaliar descontinuação de campos. Testar em cópia isolada do dump; não executar reset/seed destrutivo no banco ativo.

Antes da implantação: validar compatibilidade efetiva do servidor (o dump e o datasource não bastam), configurar backup e restore, jobs, armazenamento, domínio e segredos fora do repositório.
