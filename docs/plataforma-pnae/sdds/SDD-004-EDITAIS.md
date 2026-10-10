# SDD-004 — Composição, publicação e retificação de editais

Requisitos: RF-04, RF-13. Dependências: SDD-002/003.

## Reaproveitamento
Manter composição documental, engenharia reversa, templates e versões. Importação produz rascunho com fonte e revisão; criação manual e por demanda convergem para a mesma estrutura.

## Design
Registrar abertura/encerramento de apresentação, calendário, responsável competente, escolas, locais, itens e preços. Associar pesquisa de preços e versão de regras. Publicação exige campos obrigatórios, itens revisados e documentos gerados; preservar snapshot e evidências dos canais oficiais.

Estado documental existente não deve ser confundido com fase processual da chamada. Modelar calendário/fase explicitamente, compatibilizando enum legado. Retificação cria versão e registra impacto sobre prazos e projetos; não substitui o arquivo anterior.

## API e interface
Evoluir rotas de composição existentes. Incluir comandos de revisão, publicação e retificação e registro de evidências. Não presumir integração automática com Diário Oficial.

## Aceite
- CA-004-A: dados obrigatórios ausentes bloqueiam publicação com erros claros.
- CA-004-B: importação não ativa chamada sem revisão e comando autorizado.
- CA-004-C: arquivo, itens e versão publicados concordam; download histórico continua disponível.
- CA-004-D: abertura e encerramento têm timezone, sequência válida e prazo compatível com a regra aplicada.
- CA-004-E: retificação mantém histórico, comunica afetados e determina tratamento dos projetos existentes.
