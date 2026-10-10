# SDD-007 — Habilitação, seleção e resultado

Requisitos: RF-07, RF-13. Dependência: SDD-006.

## Design
Criar análise documental por projeto, diligências, decisão de habilitação e seleção por alimento. Registrar critérios, evidências, versão normativa, quantidade selecionada, justificativa e responsável.

Motor auxilia a aplicação da ordem de critérios configurada, sem substituir decisão da comissão. Não converter score de compatibilidade ou menor preço em classificação formal. Abranger grupos e suas composições; noções de fornecedor local e prioridades seguem regra aplicada, sem inferência por distância apenas.

Estados sugeridos: RECEBIDO → EM_ANALISE → HABILITADO/INABILITADO; seleção gera resultado provisório, tratamentos previstos e resultado final autorizado. Diligências e recursos têm prazos e regras próprios, configurados conforme procedimento aplicável.

## API/interface
Fila da comissão; `POST /projetos/:id/analises`, `/diligencias`, `POST /chamadas/:id/resultados`, comando de homologação separado. O módulo legado “Homologacao” consultado mede ambiente/testes; não equivale à homologação processual.

## Aceite
- CA-007-A: decisão fundamentada e identidade do responsável ficam preservadas.
- CA-007-B: quantidade selecionada por item não ultrapassa demanda vigente sem alteração formal.
- CA-007-C: desempate e divisão de quantidade preservam o critério usado e todas as decisões.
- CA-007-D: contrato exige resultado válido ou origem histórica explicitamente identificada.
- CA-007-E: alteração de regra futura não reclassifica resultados históricos automaticamente.
