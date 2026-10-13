# SDD-011 - Modelagem

`InteresseOportunidade` é aditivo e referencia `Produtor`, `ChamadaPublica` e `EditalItem`. Campos: quantidade pretendida, observações, solicitação de assistência, status e auditoria temporal. A chave única `(produtorId, chamadaId, editalItemId)` impede duplicidade.

Migração: `20261012170000_sdd_011_interesses_oportunidade`. Deve ser aplicada somente após validação em banco isolado; não foi aplicada ao banco oficial.
