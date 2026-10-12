# SDD-007 - Requisitos atendidos

- Cadastro de chamada com edital, periodo, objeto, entidade, DRE, municipio, escolas e status.
- Publicacao, abertura/encerramento de inscricoes e transicoes controladas.
- Inscricao unica por participante e chamada.
- Projeto de venda com itens, quantidade, preco unitario e total decimal.
- Envio imutavel do projeto, com versao e bloqueio de reenvio silencioso.
- Analise de habilitacao com status, parecer e pendencias.
- Classificacao explicavel por item e selecao com limite de oferta/demanda.
- Resultado preliminar, recurso, decisao e homologacao unica.
- Encaminhamento idempotente para contrato em `RASCUNHO`; formalizacao continua manual.
- Auditoria, JWT/RBAC e isolamento por vinculo institucional.
- Painel frontend responsivo em `/chamadas-publicas`.

Regras legais variaveis, pontuacoes e desempates nao sao fixados automaticamente; permanecem dados do edital e decisao administrativa.
