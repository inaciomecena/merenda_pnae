# PROMPT MESTRE — MiMo 2.6 Flash Free — importação histórica PNAE MT 2025

Você atuará no projeto existente `merenda_pnae` / Plataforma PNAE Digital, com Node.js, React, Prisma e MySQL. Execute etapas curtas, verificáveis, com checkpoints. Inspecione a implementação real antes de editar. Este prompt não contém nomes inventados de modelos, endpoints ou serviços do repositório.

## Escopo autorizado

Preparar e validar o aproveitamento de editais históricos de 2025 para consulta, edição de dados derivados e geração de novos editais/anexos. Desenvolver a adaptação estritamente necessária do importador existente e executar **dry-run sem gravação no banco ativo**. Se já existir fluxo suficiente, reutilizá-lo e não duplicar módulos.

A aplicação já possui importação e funcionalidades relacionadas a chamadas públicas, anexos e geração documental, conforme contexto do usuário; verifique o estado efetivo no código. Não presumir que todas as funcionalidades estão prontas. Notas fiscais, conferência, liquidação e pagamentos permanecem manuais, com anexos/rastreabilidade: não introduzir integração com SEFAZ ou bancos.

Pesquisa realizada em 12/10/2026. O pacote contém 52 chamadas com PDF integral e ano letivo 2025 confirmado, além de pregões, avisos, extratos e candidatos conflitantes. **Não é censo completo das 13 DREs.** Preservar o status LEVANTAMENTO_COM_LACUNAS.

## 0. Encontrar o pacote e registrar checkpoint

1. Leia AGENTS.md e instruções reais do repositório. Não criar branches nem worktrees. Trabalhar no checkout atual, preservar alterações do usuário; não executar commits automáticos.
2. Localize `MANIFESTO_DOCUMENTOS.json` e `INVENTARIO_EDITAIS_PNAE_MT_2025.xlsx`. Após extrair o ZIP, defina `PACKAGE_DIR` como o diretório que contém ambos. Se houver mais de uma cópia, use a versão correspondente a este relatório e registre qual escolheu.
3. Caminho real de origem nesta sessão: `/workspace/scratch/6c61238d1c73/outputs/pnae2025/MANIFESTO_DOCUMENTOS.json`. No ambiente do usuário esse caminho pode não existir; use os caminhos **relativos do manifesto** em relação à raiz extraída, sem reconstruir nomes.
4. Leia `RELATORIO_PESQUISA_PNAE_MT_2025.md`, `PENDENCIAS_PESQUISA.md` e `EVIDENCIAS_ACESSO_PORTAIS.json` antes de extrair/importar.
5. Registre em `docs/importacao-pnae-2025/CHECKPOINT.md`: fase, arquivos lidos, decisões, hash do manifesto, bloqueios, próxima ação e comandos executados. Só crie esse diretório se compatível com a organização real. Atualize após cada fase para retomada sem repetir pesquisa.

Aceite: pacote localizado, contagens do manifesto registradas, nenhum acesso de escrita ao banco.

## 1. Mapear a implementação real

1. Identifique raiz backend/frontend, scripts de teste, versões instaladas e comandos seguros.
2. Inspecione `schema.prisma`, migrations e serviços de importação de PDF/edital. Identifique no código os modelos para DRE, município, escola, unidade executora/CDCE, chamada pública, itens, anexos/templates, versões e auditoria.
3. Localize autenticação JWT, RBAC, isolamento institucional, regras de publicação e eventos de auditoria. Registre os caminhos reais encontrados em `MAPEAMENTO_IMPLEMENTACAO.md`.
4. Identifique o mecanismo atual de armazenamento de PDFs e cálculo de hash; preservação de originais; extração/OCR; geração de documento; tela de revisão antes de persistir.
5. Compare os requisitos com a implementação; produza uma tabela campo-fonte → modelo/atributo existente → transformação → validação → lacuna. Não inventar nomes de campos.

Aceite: arquitetura mapeada com caminhos reais e decisão explícita de reutilização. Nenhuma migration aplicada por inferência.

## 2. Validar manifesto, Excel e arquivos

1. Leia as oito abas da planilha: RESUMO, DREs, EDITAIS, DOCUMENTOS, ITENS, PENDÊNCIAS, ANEXOS, FONTES. Use dependência já instalada; evite instalar biblioteca apenas para duplicar funcionalidade existente.
2. Use o JSON como índice estruturado e reconcilie com a planilha. Uma linha DOCUMENTOS representa uma URL; vários documentos podem pertencer ao mesmo edital. Hash igual representa duplicação de bytes, não autorização para perder uma URL de proveniência.
3. Confirme que cada caminho existe, está dentro de PACKAGE_DIR, é PDF legível e possui SHA-256 igual ao manifesto. Bloquear caminho absoluto inesperado, traversal, symlink para fora da raiz ou arquivo alterado.
4. Use como candidatos iniciais apenas editais com `elegibilidade == ELEGIVEL_2025`, PDF integral e evidência de ano letivo 2025. Essa classificação é evidência da pesquisa, não aprovação administrativa final; revalide o conteúdo antes de persistir.
5. `PREGAO_2025` vai para categoria separada, sem entrar no módulo de agricultura familiar.
6. Bloquear `PENDENTE_ARQUIVO`, `PENDENTE_EDITAL_COMPLETO`, `REFERENCIA_HISTORICA`, `CONFLITO_EXERCICIO`, `FORA_ESCOPO_2026` e `MATERIAL_AUXILIAR`. Não transformar extrato de contrato em edital nem gerar PDF fictício.
7. Registrar cada arquivo como processado, duplicado, bloqueado ou erro, com causa. Não ocultar erro com sucesso parcial.

Aceite: `VALIDACAO_PACOTE.json` com todas as URLs/caminhos e resultado; contagens reconciliadas; originais preservados.

## 3. Extrair dados com rastreabilidade

1. Reutilize extrator atual. Os `.txt` auxiliares do pacote ajudam, mas **o PDF é a fonte primária**. Não presumir que texto em ordem linear representa a ordem de leitura em página com duas colunas.
2. Para cada campo, guardar valor bruto, valor normalizado, ID_documento, hash, página física do PDF, método de extração, confiança/revisão e motivo de pendência.
3. Distinguir número/ano do edital, exercício atendido, data de publicação, data de sessão, período de habilitação e prazo de entrega. Data de sessão não é data de publicação.
4. Identificar DRE publicadora, município atendido, recorte territorial (sede/distrito/campo/urbano/indígena) e Câmara de Negócios. Não usar o município da Câmara como município do atendimento. Não reatribuir escola automaticamente pela divisão territorial atual.
5. Extrair escolas/unidades executoras/CDCEs e seus CNPJs como relação 1:N. Validar dígitos do CNPJ e vínculo por documento. Se houver divergência com cadastro atual, criar pendência; não alterar cadastro consolidado.
6. Extrair objeto, processo administrativo, fundamentação tal como está no documento, habilitação, critérios/prioridades de seleção, datas, entrega e pagamento. Não atualizar normas históricas em documento original.
7. Itens: sequência, produto, descrição integral, unidade comercial, peso/volume da embalagem, quantidade decimal, preço unitário e total original. Usar Decimal/Prisma.Decimal ou mecanismo decimal existente; não usar float para cálculos monetários definitivos.
8. A aba ITENS contém extração **parcial de 553 linhas**, com descrições iniciais. Completar a partir dos PDFs e manter versões/retificações separadas. Chave da linha deve incluir documento/versão + sequência; o mesmo item em retificação não é necessariamente duplicado a apagar.
9. Não preencher quantidades/preços ausentes com zero. Não somar tabela de projeto de venda em branco à tabela de demanda. Não importar os pagamentos a fornecedores dos extratos como valores estimados do edital.
10. Anexos: classificar por conteúdo/título, guardar numeral/ordem original, páginas, tabelas, campos editáveis, declarações e assinaturas. Preservar original; gerar template derivado versionado sem supor que Anexo IV/V tem o mesmo significado em todas as DREs.

Casos reais obrigatórios:

- **DOC-0007, ED-0007**, Alto Paraguai urbano, 024/2024, página 3, item ABACATE: 17 × 22,40 = 380,80; total original 380,08. Manter original e pendência de 0,72. Nunca ajustar silenciosamente.
- **DOC-0002**, Nobres, página 18, item PEPINO: valor “R$ 2,205,70”, com separadores ambíguos. Não aceitar extração parcial 2,20; exigir conferência.
- **DOC-0075**, Santa Carmem: início traz “025/224”; portal/corpo identificam 025/2024. Guardar número bruto e normalizado com justificativa e revisão.
- Alta Floresta: PDFs começam com recortes de Diário Oficial contendo outros editais. Não identificar pelo primeiro número encontrado.
- Metropolitana/Primavera: documentos da rodada fim de 2025/2026 têm ano 2025 residual. Manter em quarentena até decisão documentada.
- Tangará: sete PDFs retornam 404. Não inventar conteúdo.
- Sinop: 18 entradas disponíveis versus 19 anunciadas. Não criar a 19ª.

Aceite: staging em arquivos JSON, sem banco ativo, com revisão por campo/versão e lista completa de pendências.

## 4. Vinculação institucional e idempotência

1. Consultar cadastros reais somente por mecanismo autorizado de leitura; resolver DRE por identificador institucional existente, município por código oficial quando presente, unidade executora por CNPJ validado e vínculo documental.
2. Nunca usar apenas nome aproximado para vincular instituição. Nomes iguais, escolas indígenas e salas anexas devem ser distinguidos. Não inferir DRE a partir do município sem fonte histórica.
3. Chave lógica candidata: instituição responsável/DRE + procedimento + número normalizado + ano da numeração + exercício + território/recorte. Validar se projeto já tem chave equivalente.
4. Chave de versão/documento: identidade do edital + hash SHA-256 + tipo do documento, com múltiplas URLs de proveniência. Hash repetido sem conteúdo novo não gera segunda versão.
5. Arquivo diferente pode ser retificação: não substituir campos revisados. Criar nova versão candidata e comparação campo a campo; conservar ambas as versões e estado de revisão.
6. Fluxo transacional/idempotente usando serviços e constraints existentes. Preparar migrations aditivas somente se houver lacuna real; nunca alterar/aplicar esquema sem revisar o plano.
7. Repetir dry-run do mesmo lote deve produzir zero novas entidades/versões candidatas quando não houver mudanças. Falhas de um documento devem aparecer no relatório e não contaminar o restante.

Aceite: relatório de correspondências, duplicidades e conflitos; teste de repetição sem crescimento; nenhuma alteração de registros revisados.

## 5. Aproveitamento para novos editais

1. Importação histórica deve produzir rascunho/referência revisável, nunca publicar, homologar, contratar ou criar pagamentos automaticamente.
2. Original histórico é imutável. “Criar a partir deste edital” gera derivação independente, com vínculo ao original e identificação do novo exercício/número/instituição.
3. Tornar revisáveis objeto, escolas, itens, quantidades, preços, datas, anexos/templates e regras jurídicas. Campos novos ausentes não podem ser copiados como se validados.
4. Dados/preços/prazos de 2025 não aprovam um edital de 2026. Exigir revisão administrativa dos campos derivados antes da geração/publicação.
5. Reutilizar telas e serviços existentes; incluir preview por campo e lista de problemas. Não mostrar ferramentas/etapas internas do agente no fluxo do usuário.
6. Respeitar JWT, RBAC, auditoria/correlationId e isolamento institucional em todo endpoint, consulta, arquivo e template; testar tentativa de acesso de outra DRE.

Aceite: reuso de dados e templates em rascunho, original preservado, revisão obrigatória, nenhum efeito em chamadas operacionais de 2026.

## 6. Testes e prova de segurança da importação

Executar testes relevantes da implementação existente e novos testes de comportamento somente quando houver modificação real:

- dry-run não grava dados nem altera arquivos originais;
- elegibilidade 2024→2025 versus publicação 2025→2026;
- ano conflitante bloqueado;
- duplicado binário e retificação com alteração real;
- valores decimais, tabela multipágina, quantidade/unidade/embalagem e divergência 0,72;
- número bruto “025/224” e valor bruto “2,205,70”;
- erro/404/hash divergente e arquivo inválido;
- DRE/município/CNPJ ambíguos sem vinculação automática;
- RBAC e leitura de PDF/template de outra instituição bloqueados;
- preservação de chamadas 2026 e registros revisados;
- falha transacional, retomada por checkpoint e reprocessamento idempotente;
- geração derivada mantendo referência e histórico.

Não executar `prisma migrate reset`, limpeza de tabelas, seed destrutivo ou importação definitiva no banco ativo. Se testes dependem de banco, usar ambiente isolado explicitamente identificado; não assumir que `.env` é ambiente de desenvolvimento.

Aceite: comandos e resultados registrados em `TESTES_IMPORTACAO_PNAE_2025.md`; falhas preexistentes separadas das causadas pela mudança, sem esconder falha global.

## 7. Entregáveis e parada antes da importação definitiva

Entregar:

1. Mapeamento da implementação e campos.
2. Validação do pacote e hashes.
3. Staging JSON com dados, origem por campo e status de revisão.
4. Mapeamento DRE/município/escola/CDCE com fontes e ambiguidades.
5. Comparação de duplicados/retificações e plano de idempotência.
6. Adaptação mínima do importador/revisão, se necessária, com arquivos reais modificados e testes.
7. Relatório por DRE: encontrados, confirmados, bloqueados, extraídos, duplicados, pendentes e erros.
8. Comando concreto de dry-run e comando concreto de aplicação definitiva, conforme a implementação real; não inventar comandos.
9. Plano de backup/rollback para eventual execução posterior, sem executar gravação definitiva.
10. Checkpoint final para retomada.

**Parar antes da importação definitiva no banco ativo** e apresentar o lote concreto validado, pendências e o comando real que precisaria de autorização. Não pedir autorização para inspeção, validação ou dry-run já autorizados. Não executar commits/branches, não apagar dados, não sobrescrever registros revisados, não importar ficção, não contratar API paga e não enviar PDFs/dados a terceiros.

## Índice real de documentos elegíveis

As URLs e caminhos abaixo pertencem ao levantamento. O manifesto é a referência integral para versões, bloqueios e arquivos adicionais. Não baixar novamente os arquivos já íntegros.

- ED-0001 | Diamantino | 030/2024 | Rosário Oeste
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0001_DOC-0001.pdf`
  - URL: https://drive.google.com/file/d/1c78ZFNNYoccuvL0jU8rWp_R_xz1xMS4Z/view?usp=drivesdk
- ED-0002 | Diamantino | 029/2024 | Nobres
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0002_DOC-0002.pdf`
  - URL: https://drive.google.com/file/d/1zCzXCy_6UQ-wp3fF82YbY2eXyOdWj-LR/view?usp=drivesdk
- ED-0003 | Diamantino | 028/2024 | Santo Afonso
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0003_DOC-0003.pdf`
  - URL: https://drive.google.com/file/d/1fCfEBhm8epesXks5VK9fFLLFTKhYCGWF/view?usp=drivesdk
- ED-0004 | Diamantino | 027/2024 | Nova Marilândia
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0004_DOC-0004.pdf`
  - URL: https://drive.google.com/file/d/1C0P8--EuzFhoFNhYrgXsDBxoLLu1n0d9/view?usp=drivesdk
- ED-0005 | Diamantino | 026/2024 | Nortelândia
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0005_DOC-0005.pdf`
  - URL: https://drive.google.com/file/d/1tTAVdECBY5ZvvdzVyxeay_bBqctcchwf/view?usp=drivesdk
- ED-0006 | Diamantino | 025/2024 | Arenápolis
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0006_DOC-0006.pdf`
  - URL: https://drive.google.com/file/d/1jxuJW5kNzwha3Fi061AMXFEQlu_d-n41/view?usp=drivesdk
- ED-0007 | Diamantino | 024/2024 | Alto Paraguai - urbano
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0007_DOC-0007.pdf`
  - URL: https://drive.google.com/file/d/10rhsdxf-aU1663wDNiq3zHTRxT23wPI0/view?usp=drivesdk
- ED-0008 | Diamantino | 022/2024 | Nova Mutum - campo
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0008_DOC-0008.pdf`
  - URL: https://drive.google.com/file/d/1DKNfN8WjoU90Qoe6Mc200hVpIrlpV9V8/view?usp=drivesdk
- ED-0009 | Diamantino | 023/2024 | Nova Mutum - urbano
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0009_DOC-0009.pdf`
  - URL: https://drive.google.com/file/d/1l23MmDMY2xhil3ElaXwTmdVUTuyn7Nkz/view?usp=drivesdk
- ED-0010 | Diamantino | 021/2024 | Santa Rita do Trivelato
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0010_DOC-0010.pdf`
  - URL: https://drive.google.com/file/d/19CirP-lpUU2rFgsXRoXjuHz8riBBT2Z7/view?usp=sharing
- ED-0011 | Diamantino | 019/2024 | Alto Paraguai - campo
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0012_DOC-0012.pdf`
  - URL: https://drive.google.com/file/d/15Q4vZ2MBLMQnBSvxZYzipIfVArnTMOAs/view?usp=drivesdk
- ED-0012 | Diamantino | 020/2024 | Diamantino
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0013_DOC-0013.pdf`
  - URL: https://drive.google.com/file/d/19yUaeovVMqUo_PZOOxBKKSoG74iSMpW5/view?usp=drivesdk
- ED-0013 | Diamantino | 018/2024 | Nova Maringá
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0014_DOC-0014.pdf`
  - URL: https://drive.google.com/file/d/1Zi9-sR8YW0YToVfPQb1pnEQeAk-xgPJA/view?usp=drivesdk
- ED-0014 | Diamantino | 017/2024 | São José do Rio Claro
  - PDF: `PNAE_MT_2025/05_DIAMANTINO/DOC-0015_DOC-0015.pdf`
  - URL: https://drive.google.com/file/d/1a5ZMBmaaMcymd9NyW_cxUh8axSsYgOZa/view?usp=drivesdk
- ED-0015 | Juína | 026/2024 | Castanheira
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0016_castanheiraedital--chamada-pUblica-2025docx-PO0m.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/castanheiraedital--chamada-pUblica-2025docx-PO0m.pdf
- ED-0016 | Juína | 017/2024 | Brasnorte
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0017_brasnorteedital--chamada-pUblica-2025docx-ZQmt.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/brasnorteedital--chamada-pUblica-2025docx-ZQmt.pdf
- ED-0017 | Juína | 020/2024 | Juína
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0018_juinaedital--chamada-pUblica-2025-juinadocx-d5go.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/juinaedital--chamada-pUblica-2025-juinadocx-d5go.pdf
- ED-0018 | Juína | 019/2024 | Cotriguaçu
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0020_cotriguacuedital--chamada-pUblica-2025-2-MbYw.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/cotriguacuedital--chamada-pUblica-2025-2-MbYw.pdf
- ED-0019 | Juína | 025/2024 | Novo Horizonte do Norte
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0021_novo-horizonte-edital--chamada-pUblica-2025pos-parecer-2docx-FGAB.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/novo-horizonte-edital--chamada-pUblica-2025pos-parecer-2docx-FGAB.pdf
- ED-0020 | Juína | 024/2024 | Porto dos Gaúchos
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0022_porto-edital--chamada-pUblica-2025docx-1-zvmJ.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/porto-edital--chamada-pUblica-2025docx-1-zvmJ.pdf
- ED-0021 | Juína | 022/2024 | Juara - indígena
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0023_juara-indigenaedital--chamada-pUblica-2025pos-parecer-1docx-5sZw.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/juara-indigenaedital--chamada-pUblica-2025pos-parecer-1docx-5sZw.pdf
- ED-0022 | Juína | 021/2024 | Juara
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0024_juaraedital-docx-atRm.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/juaraedital-docx-atRm.pdf
- ED-0023 | Juína | 018/2024 | Colniza
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0025_colniza-chamada-pUblica-2025pos-parecer1docx-Wh1j.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/colniza-chamada-pUblica-2025pos-parecer1docx-Wh1j.pdf
- ED-0024 | Juína | 015/2024 | Aripuanã
  - PDF: `PNAE_MT_2025/06_JUINA/DOC-0027_aripuana-edital--chamada-pUblica-2025pos-parecerdocx-1-xI4f.pdf`
  - URL: https://www.drejuina.com.br/uploads/editais/aripuana-edital--chamada-pUblica-2025pos-parecerdocx-1-xI4f.pdf
- ED-0046 | Primavera do Leste | 001/2025 | Poxoréu
  - PDF: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0050_DOC-0050.pdf`
  - URL: https://drive.google.com/file/d/1ankz-P-NgVCs0DfIGJVEswIzkyqATLOt/view?usp=drive_link
- ED-0061 | Primavera do Leste | 016/2024 | Gaúcha do Norte - urbana
  - PDF: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0069_DOC-0069.pdf`
  - URL: https://drive.google.com/file/d/1t7mFIHJ17ZYchybLD1G5tdI7ckEUD56E/view?usp=drive_link
- ED-0062 | Sinop | 020/2024 | Sinop
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0070_f8345a8a-c33f-4788-bfe9-fb15c23010b8.pdf`
  - URL: https://dresinop.com.br/arquivos/f8345a8a-c33f-4788-bfe9-fb15c23010b8
- ED-0063 | Sinop | 021/2024 | Colíder
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0071_d239737c-aa5b-4aa5-8c4f-98a1c89d4007.pdf`
  - URL: https://dresinop.com.br/arquivos/d239737c-aa5b-4aa5-8c4f-98a1c89d4007
- ED-0064 | Sinop | 022/2024 | Nova Santa Helena
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0072_d8539333-10b0-436d-be50-4bc6b6c5b940.pdf`
  - URL: https://dresinop.com.br/arquivos/d8539333-10b0-436d-be50-4bc6b6c5b940
- ED-0065 | Sinop | 023/2024 | Itaúba
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0073_61522d8f-5478-4cdb-b7cf-0d7a17c56a27.pdf`
  - URL: https://dresinop.com.br/arquivos/61522d8f-5478-4cdb-b7cf-0d7a17c56a27
- ED-0066 | Sinop | 024/2024 | Cláudia
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0074_1291cecc-6aa7-43bb-a549-a33b65843df9.pdf`
  - URL: https://dresinop.com.br/arquivos/1291cecc-6aa7-43bb-a549-a33b65843df9
- ED-0067 | Sinop | 025/2024 | Santa Carmem
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0075_bd759726-7290-4133-976b-096fd05bfc1b.pdf`
  - URL: https://dresinop.com.br/arquivos/bd759726-7290-4133-976b-096fd05bfc1b
- ED-0068 | Sinop | 026/2024 | Ipiranga do Norte
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0076_807e87cd-6ca6-45b4-be56-587562a0b377.pdf`
  - URL: https://dresinop.com.br/arquivos/807e87cd-6ca6-45b4-be56-587562a0b377
- ED-0069 | Sinop | 027/2024 | Tabaporã - distrito
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0077_762c78d9-033d-49a2-81cc-9952333825e8.pdf`
  - URL: https://dresinop.com.br/arquivos/762c78d9-033d-49a2-81cc-9952333825e8
- ED-0070 | Sinop | 028/2024 | União do Sul
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0078_7272d1c5-14fa-4d35-9416-fa978aae122e.pdf`
  - URL: https://dresinop.com.br/arquivos/7272d1c5-14fa-4d35-9416-fa978aae122e
- ED-0071 | Sinop | 029/2024 | Itanhangá
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0079_dc2650b4-75f5-4259-83e4-67d7ac91d586.pdf`
  - URL: https://dresinop.com.br/arquivos/dc2650b4-75f5-4259-83e4-67d7ac91d586
- ED-0072 | Sinop | 030/2024 | Tapurah
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0080_912f5800-b74c-4a39-8a20-e86bacc363b1.pdf`
  - URL: https://dresinop.com.br/arquivos/912f5800-b74c-4a39-8a20-e86bacc363b1
- ED-0073 | Sinop | 031/2024 | Lucas do Rio Verde
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0081_bd8b8e50-3336-4f3c-b477-295a07c42a73.pdf`
  - URL: https://dresinop.com.br/arquivos/bd8b8e50-3336-4f3c-b477-295a07c42a73
- ED-0074 | Sinop | 032/2024 | Sorriso
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0082_b3b243ae-9c6f-465d-b616-bbe843f76a0a.pdf`
  - URL: https://dresinop.com.br/arquivos/b3b243ae-9c6f-465d-b616-bbe843f76a0a
- ED-0075 | Sinop | 033/2024 | Nova Ubiratã - sede
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0083_60ecd063-24c4-4325-8689-129e23d2e25b.pdf`
  - URL: https://dresinop.com.br/arquivos/60ecd063-24c4-4325-8689-129e23d2e25b
- ED-0076 | Sinop | 034/2024 | Boa Esperança do Norte
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0084_a27aaf3d-adc9-4b34-ba88-5755ae46e194.pdf`
  - URL: https://dresinop.com.br/arquivos/a27aaf3d-adc9-4b34-ba88-5755ae46e194
- ED-0077 | Sinop | 035/2024 | Tabaporã - sede
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0085_754dca13-1a2d-4733-83a5-4bde5f1235ff.pdf`
  - URL: https://dresinop.com.br/arquivos/754dca13-1a2d-4733-83a5-4bde5f1235ff
- ED-0078 | Sinop | 036/2024 | Vera
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0086_8fdbdccf-4aac-4d5d-ab2a-951abaf48b1a.pdf`
  - URL: https://dresinop.com.br/arquivos/8fdbdccf-4aac-4d5d-ab2a-951abaf48b1a
- ED-0079 | Sinop | 037/2024 | Feliz Natal
  - PDF: `PNAE_MT_2025/12_SINOP/DOC-0087_ef4983ae-d7b6-4e0d-85e2-21406a4505c3.pdf`
  - URL: https://dresinop.com.br/arquivos/ef4983ae-d7b6-4e0d-85e2-21406a4505c3
- ED-0092 | Alta Floresta | 013/2024 | Nova Monte Verde
  - PDF: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0102_EDITAL-CHAMADA-PUBLICA-2025-Nova-Monte-Verde.pdf`
  - URL: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-2025-Nova-Monte-Verde.pdf
- ED-0093 | Alta Floresta | 014/2024 | Nova Bandeirantes
  - PDF: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0103_EDITAL-CHAMADA-PUBLICA-N.-BANDEIRANTES-014-24-ano-letivo-2025.pdf`
  - URL: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-N.-BANDEIRANTES-014-24-ano-letivo-2025.pdf
- ED-0094 | Alta Floresta | 012/2024 | Apiacás
  - PDF: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0104_EDITAL-CHAMADA-PUBLICA-012-24-APIACAS-ano-letivo-2025-1.pdf`
  - URL: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-012-24-APIACAS-ano-letivo-2025-1.pdf
- ED-0095 | Alta Floresta | 010/2024 | Nova Canaã do Norte
  - PDF: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0105_EDITAL-CHAMADA-PUBLICA-NCN-010-24-ano-letivo-2025.pdf`
  - URL: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-NCN-010-24-ano-letivo-2025.pdf
- ED-0096 | Alta Floresta | 009/2024 | Carlinda
  - PDF: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0106_EDITAL-CHAMADA-PUBLICA-No-009-24-CARLINDA-Ano-letivo-2025-1.pdf`
  - URL: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-No-009-24-CARLINDA-Ano-letivo-2025-1.pdf
- ED-0097 | Alta Floresta | 011/2024 | Paranaíta
  - PDF: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0107_EDITAL-CHAMADA-PUBLICA-011-24-PTA-ano-letivo-2025-1.pdf`
  - URL: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-011-24-PTA-ano-letivo-2025-1.pdf
- ED-0098 | Alta Floresta | 008/2024 | Alta Floresta
  - PDF: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0108_EDITAL-CHAMADA-PUBLICA-008-24-AF-ano-letivo-2025.pdf`
  - URL: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-008-24-AF-ano-letivo-2025.pdf
- ED-0121 | Pontes e Lacerda | 014/2024 | Pontes e Lacerda
  - PDF: `PNAE_MT_2025/09_PONTES_E_LACERDA/DOC-0131_edital-downloadPDF.php.pdf`
  - URL: https://dreponteselacerda.com.br/site/edital-downloadPDF.php?ideditais=113
