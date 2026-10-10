# SDD-006 — Projetos de venda e habilitação documental

Requisitos: RF-06, RF-13. Dependências: SDD-002/004/005.

## Design
Evoluir Proposta sem perder documentos existentes. Identificar fornecedor individual, grupo informal, grupo formal ou empreendimento e participantes. Cada item aponta diretamente para EditalItem, incluindo versão, quantidade e preço aplicável.

Gerar documentos conforme modalidade e preservar versão apresentada. Checklist depende do participante e da chamada. Upload registra validade e análise; arquivo enviado não é automaticamente documento validado.

Fluxo: RASCUNHO → EM_PREPARACAO → APRESENTADO. Retificação/reapresentação segue procedimento da chamada e mantém protocolo/versões. Apresentação eletrônica com efeito formal depende da definição institucional D-03; sem configuração, oferecer preparação e exportação sem declarar participação oficial concluída.

## API
Evoluir `/propostas`; acrescentar `POST /propostas/:id/apresentar`, histórico e documentos com acesso por fornecedor/representante.

## Aceite
- CA-006-A: protocolo único, timestamp do servidor e snapshot da versão apresentada.
- CA-006-B: apresentação fora do prazo ou por representante inválido é rejeitada.
- CA-006-C: tipo do participante determina documentos e assinaturas necessários.
- CA-006-D: item de outro edital e preço incompatível com a regra aplicada são rejeitados.
- CA-006-E: repetição do envio não cria projetos/protocolos duplicados; geração de PDF sozinha não altera status para apresentado.
