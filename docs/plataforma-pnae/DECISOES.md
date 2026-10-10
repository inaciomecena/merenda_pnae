# Decisões, premissas e pontos de definição

## Decisões técnicas propostas
- ADR-01: manter React/NestJS/Prisma/MySQL e arquitetura modular única.
- ADR-02: autorizar por função e vínculo ao recurso, incluindo regional e representação.
- ADR-03: preservar documentos publicados e operações confirmadas; corrigir por eventos.
- ADR-04: reserva transacional de saldo e idempotência nos comandos críticos.
- ADR-05: separar demanda, oportunidade, projeto, seleção, contrato e execução.
- ADR-06: registrar pagamentos; integração bancária fica fora do escopo inicial.
- ADR-07: manter compatibilidade de produtos como recomendação, sem usá-la como classificação formal.
- ADR-08: priorizar web responsiva; PWA pode ser ativada, sem operações críticas offline na primeira versão.

## Definições operacionais pendentes
| ID | Definição | Momento necessário | Premissa para especificação |
|---|---|---|---|
| D-01 | Quem publica, contrata e paga: DRE, EEx, UEx ou combinação | Antes de habilitar essas ações | Competências configuráveis; sem inferir pela função do usuário |
| D-02 | Quais DREs e escolas integram o piloto | Antes de implantar acessos | Modelo preparado para várias regionais |
| D-03 | Participação eletrônica oficial e modalidade de assinatura | Antes de receber projetos com efeito formal | Preparação digital e protocolo técnico; validade institucional requer definição |
| D-04 | Regras de seleção, limites e documentação vigentes | Antes de ativar seleção/contratação | Versão normativa explícita, sem pontuação jurídica inventada |
| D-05 | Quem solicita, recebe, atesta e autoriza pagamentos | Antes de execução contratual | Ações distintas e permissões atribuídas por competência |
| D-06 | Tratamento de contratos já ativos e entregas históricas | Antes de importar saldos | Carga identificada, reconciliada e aprovada |
| D-07 | Troca de produtos, tolerâncias e reposições | Antes de liberar exceções | Sem substituição automática; aprovação e documentos específicos |
| D-08 | Fonte de repasses e despesas para indicadores do PNAE | Antes de exibir percentual institucional | Dashboard contratual separado do indicador de aplicação de recursos |
| D-09 | Infraestrutura, retenção, RPO/RTO e canais de notificação | Antes de produção | Backup e teste de restore obrigatórios; painel como canal inicial |

Esses pontos não impedem criar especificações nem desenvolver cadastros e testes. As funcionalidades dependentes devem permanecer desabilitadas ou em preparação até a configuração correspondente existir.

## Acrescentamentos ao planejamento anterior
Habilitação e decisões da comissão; diligências e recursos quando aplicáveis; representantes de grupos/organizações; controle de limites na dimensão correta; publicação e retificações; carga de contratos ativos; ajustes e estornos; encerramento e dossiê contratual; backup/restore; distinção entre orçamento contratado, execução aceita, faturamento aprovado e pagamento.
