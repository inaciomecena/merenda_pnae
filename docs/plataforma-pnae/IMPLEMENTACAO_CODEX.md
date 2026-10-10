# Orientação para implementar no Codex

Use este texto junto aos documentos deste diretório no checkout de `merenda_pnae`.

## Instrução
Atue no projeto existente conforme PRD, arquitetura, modelo de dados e SDDs. Comece por SDD-001 e SDD-002. Preserve stack, cadastros, importação, templates e documentos existentes. Antes de editar, leia instruções locais e confira o estado atual do repositório, banco e migrações; a análise de referência corresponde ao commit 4fb165648cef9b1b340fb70478cd994015d93c6e.

Trabalhe em branch própria. Não execute reset, seed destrutivo ou migração no banco ativo. Use cópia isolada do dump para validar alterações. Registre divergências e falhas anteriores.

Implemente cada fluxo de forma completa: persistência, validação, autorização por recurso, API, interface e testes necessários. Não trate filtros de interface como isolamento. Revise downloads, exportações e os módulos antigos afetados.

Nos saldos, use Decimal, transações, controle de concorrência e idempotência. Nenhum score de compatibilidade deve representar classificação jurídica. Entrega informada, aceite, faturamento aprovado e pagamento são eventos distintos. Corrija registros confirmados por ajuste/estorno com histórico.

Não invente competências, limites ou exigências legais. As definições em DECISOES.md devem virar configuração versionada ou permanecer pendentes antes de habilitar a operação dependente. Não declare apresentação eletrônica oficial sem a modalidade institucional definida.

Ao terminar um SDD, atualize o backlog com status real e evidências: arquivos alterados, migrações, testes executados, resultados e pendências. Execute checks proporcionais ao que mudou, incluindo banco real nas reservas/pagamentos concorrentes. Não alegue conclusão de módulos apenas porque existem rotas ou telas.

Comece com: relatório de compatibilidade do SDD-001; implementação do modelo organizacional e isolamento do SDD-002; demonstração de que DRE A não acessa recursos da DRE B e de que produtor acessa somente recursos próprios/representados. Depois siga as dependências do backlog.
