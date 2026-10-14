# Pesquisa documental PNAE — Mato Grosso — exercício de 2025

Data: 12/10/2026, America/Cuiaba. Status: **LEVANTAMENTO COM LACUNAS**.

## Resultado verificável

- Os 13 portais fornecidos foram acessados diretamente, todos com resposta HTTP 200 no acesso realizado. A busca web apresentou erros pontuais para Cáceres, Rondonópolis e IOMAT; o acesso direto permitiu recuperar conteúdo, registrado no pacote.
- 119 URLs de páginas investigadas, excluídos endpoints de PDFs. Não equivale a percorrer todos os registros de todos os sites.
- 125 procedimentos/referências inventariados; 52 chamadas públicas com PDF integral e exercício de 2025 confirmado, em seis DREs.
- 135 URLs de arquivos registradas; 128 PDFs baixados, abertos pelo leitor de PDF, com páginas verificadas, texto extraído e SHA-256. Sete downloads retornaram 404.
- 553 linhas de itens extraídas parcialmente, em Diamantino e Juína. **Não é uma extração completa dos itens de todos os editais.**
- 312 cabeçalhos de anexos identificados nos PDFs elegíveis; não são 312 arquivos separados. Anexos permanecem dentro dos originais.
- Nenhum acesso ao código-fonte, banco de dados ou aplicação merenda_pnae. Não ocorreu importação.

## Método e limite da cobertura

1. Acesso aos portais indicados; inspeção de menus/seções de editais, COADM, COGER, informativos, notícias e unidades escolares.
2. Consultas por domínio, agricultura familiar, alimentação escolar, chamada pública, 2024/2025, municípios e escolas; busca de PDF e fontes alternativas na Imprensa Oficial.
3. Leitura de páginas históricas, inclusive categorias paginadas de Alta Floresta e acervo longo de Juína. Em Google Sites, recuperação dos links reais e redirecionamentos para Drive. Não foram fabricados caminhos de arquivos.
4. Download por URL publicada; validação do cabeçalho PDF, abertura, contagem de páginas, extração de texto e hash. Uma amostra de tabela foi renderizada para conferir números e estrutura visual.
5. Separação entre ano da numeração, data de publicação e exercício atendido. Procedimentos numerados em 2024 foram incluídos somente com evidência no corpo do edital de atendimento a 2025.
6. Deduplicação lógica por regional, modalidade, número e abrangência; duplicidade binária por SHA-256. Retificações e URLs alternativas preservadas como documentos do mesmo procedimento quando identificáveis.

A conferência dos PDFs foi textual, com inspeção visual amostral. Não constitui auditoria jurídica ou revisão visual de todas as páginas. A publicação institucional do próprio site e contatos edu.mt.gov.br sustentam sua identificação; não foi obtida uma certificação independente de cada domínio junto à SEDUC.

**A pesquisa não é um censo completo de escolas/CDCEs nem de todos os editais de 2025.** As listas atuais de escolas e os territórios nos próprios editais foram consultados; mudanças de jurisdição entre 2025 e 2026 não foram presumidas. Não se deve usar a divisão territorial atual para reatribuir retrospectivamente os documentos.

## Cobertura por regional

“Elegíveis” abaixo significa chamada com PDF integral e ano letivo confirmado; avisos, extratos e links quebrados não entram nessa contagem. PDFs incluem pregões e documentos fora do escopo, preservados em diretório separado.

| DRE | Chamadas elegíveis 2025 | Pregões 2025 inventariados | PDFs baixados | Links indisponíveis |
|---|---:|---:|---:|---:|
| Alta Floresta | 7 | 0 | 7 | 0 |
| Barra do Garças | 0 | 0 | 1 | 0 |
| Cáceres | 0 | 5 | 7 | 0 |
| Confresa | 0 | 0 | 1 | 0 |
| Diamantino | 14 | 0 | 15 | 0 |
| Juína | 10 | 0 | 12 | 0 |
| Matupá | 0 | 0 | 1 | 0 |
| Metropolitana | 0 | 11 | 22 | 0 |
| Pontes e Lacerda | 1 | 0 | 1 | 0 |
| Primavera do Leste | 2 | 11 | 42 | 0 |
| Rondonópolis | 0 | 0 | 1 | 0 |
| Sinop | 18 | 0 | 18 | 0 |
| Tangará da Serra | 0 | 0 | 0 | 7 |

## Achados que afetam a importação

### Alta Floresta
Sete chamadas: 008 a 014/2024, correspondentes a Alta Floresta, Carlinda, Nova Canaã do Norte, Paranaíta, Apiacás, Nova Monte Verde e Nova Bandeirantes. Localizadas nas páginas históricas 14 e 15 da categoria Editais. Os PDFs podem começar com uma página do Diário Oficial que contém avisos de outras regionais; o primeiro número que um extrator encontrar não identifica necessariamente o edital principal. A numeração principal e o território foram conferidos no corpo.

### Diamantino
14 chamadas, 017 a 030/2024, abrangendo municípios e recortes urbanos/campo. A 021/2024 de Santa Rita do Trivelato possui documento de retificação preservado como outra versão, não outro edital. Os links e a ordem da página não autorizam trocar automaticamente números de Nova Mutum urbano/campo: prevalece o arquivo.

### Juína
Dez chamadas distintas confirmadas: Aripuanã, Brasnorte, Colniza, Cotriguaçu, Juína, Juara, Juara indígena, Porto dos Gaúchos, Novo Horizonte do Norte e Castanheira. Há duas URLs com PDFs binariamente iguais de Cotriguaçu e duas de Aripuanã. Uma publicação de Aripuanã mistura rótulo de pregão com link de chamada pública: registrar tipo efetivo pelo conteúdo e não pelo nome do link. Juruena e Conselvan não foram considerados cobertos por outro edital da regional; permanecem lacunas do acervo de 2025.

### Sinop
18 chamadas listadas e baixadas, 020 a 037/2024. A notícia de 27/11/2024 anuncia 19 chamadas, mas a página consultada disponibiliza 18 entradas. **Não foi criado um 19º edital fictício.** Tabaporã sede e distrito são recortes distintos. A chamada de Santa Carmem contém a grafia “025/224” no início, enquanto portal/corpo identificam 025/2024; preservar o erro material como evidência.

### Primavera do Leste
Dois PDFs integrais de chamadas confirmados: 001/2025, Poxoréu; e 016/2024, Gaúcha do Norte urbano. Também foram localizados avisos de outras chamadas de 2024 em páginas do Diário Oficial, mas não os respectivos editais completos. A página Certames 2025 inclui processos preparados no fim de 2025 para 2026. PDFs 006 e 007/2025 mencionam ano letivo 2025, apesar de processos/cronograma/normas da rodada seguinte: classificados como conflito, sem importação automática. Pregões ficam separados.

### Pontes e Lacerda
PDF integral da chamada 014/2024 confirmado para Pontes e Lacerda/2025. Informativos atuais de novembro de 2025, como a chamada 010/2025 de Rondolândia, atendem explicitamente a 2026. Não substituem o acervo de 2025 dos demais municípios.

### Tangará da Serra
Sete referências a chamadas 008 a 014/2024, com sessões em janeiro de 2025, foram localizadas nas áreas Em Andamento e Concluídas. Os sete links do Drive retornam 404 no download. No navegador, o link de Sapezal exibe “O arquivo que você solicitou não existe”. Não há PDF baixado dessa regional no pacote. O estado “Em andamento” no portal histórico não foi interpretado como situação administrativa vigente em outubro de 2026.

### Metropolitana
Foram baixados 11 pregões históricos da seção Pregão 2024, cujo conteúdo atende a 2025. Os 11 links atuais de chamadas públicas pertencem à rodada de fim de 2025/2026; dois indicam 2026 e nove reutilizam 2025 em trechos do modelo enquanto número/processo/datas apontam outro exercício. Mantidos em quarentena documental. Nenhuma dessas nove chamadas foi classificada automaticamente como elegível de 2025.

### Cáceres
Cinco pregões de 2025 identificados no acervo (sete URLs de PDFs, contando versões/minutas). Não foi baixado edital integral de chamada pública de 2025. A busca encontrou homologação da chamada 024/2024 em fonte oficial; permanece candidata a recuperar, sem substituir edital por extrato.

### Barra do Garças, Confresa, Matupá e Rondonópolis
Os respectivos portais, seções administrativas e listas de escolas foram consultados. Foram abertos e baixados extratos oficiais relativos a: 004/2025–Água Boa, 018/2024–Canabrava do Norte, 001/2025–Matupá e 024/2024–Rondonópolis. Comprovam referências históricas aos procedimentos, mas não substituem seus editais integrais. Não houve confirmação integral de todos os campos nem do exercício pelo edital nessas quatro referências.

## Engenharia reversa documental

Padrão recorrente: aviso/capa → identificação do procedimento/processo → objeto → tabela de produtos → habilitação → seleção → entregas/pagamento → projetos de venda → escolas → resultado → minuta contratual.

- Alta Floresta, Sinop, Juína e Pontes e Lacerda frequentemente usam anexos I, II, III para projetos de venda individual/informal/formal; IV para escolas; V para resultado; VI para minuta contratual.
- O importador deve classificar **pelo título/conteúdo**, pois outros modelos mudam a ordem. Referências internas a “Anexo V” podem não coincidir com o numeral do anexo de escolas efetivamente presente.
- Documento original e versões devem ser imutáveis, com hash, URL, data de coleta e página de origem por campo extraído.
- Escola/CDCE é unidade executora; a DRE ou município da Câmara de Negócios pode ser diferente do município atendido. Não usar automaticamente o município da Câmara como território do edital.
- Um edital pode atender muitas escolas. Registrar relação 1:N, não inventar um CNPJ único para todo o edital. CNPJs gerais ficaram em branco quando essa relação não foi extraída com segurança.
- Quantidades, unidade comercial e tamanho da embalagem são campos distintos. “Unidade de 900g” não deve virar 900 kg, por exemplo.
- Campos ausentes permanecem nulos, com origem/status de revisão. Datas de sessão não substituem data de publicação.

### Exemplo numérico conferido
DOC-0007, chamada 024/2024, Alto Paraguai urbano, página física 3, item 1: quantidade 17; preço R$22,40; total original R$380,08; calculado R$380,80; diferença R$0,72. A planilha preserva o original e calcula a diferença. Não corrigir silenciosamente.

DOC-0002, Nobres, página 18, item 37, apresenta “R$ 2,205,70”, com separadores ambíguos. Essa linha foi retirada da extração numérica e registrada em Pendências. Não converter parcial “2,20” em valor válido.

## Organização e uso

- `PNAE_MT_2025/`: PDFs históricos, avisos e extratos coletados, com textos extraídos auxiliares.
- `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/`: catálogo, rodada 2026 e documentos com exercício conflitante, bloqueados para importação.
- `MANIFESTO_DOCUMENTOS.json`: índices de editais/documentos/itens/anexos, caminhos relativos, URLs, hashes, elegibilidade e evidências.
- Excel: RESUMO, DREs, EDITAIS, DOCUMENTOS, ITENS, PENDÊNCIAS, ANEXOS e FONTES.
- Prompts mestre e por DRE: preparar importador/revisão e executar apenas simulação. Não autoriza importação definitiva em banco ativo.

Os caminhos relativos são portáveis após extrair o ZIP. O caminho de pesquisa desta sessão foi `/workspace/scratch/6c61238d1c73/outputs/pnae2025/`; o MiMo deve resolver a raiz real do pacote no ambiente do projeto.

## Pendências para cobertura integral

Recuperar os sete arquivos de Tangará; recuperar chamadas históricas completas de Barra, Confresa, Matupá, Rondonópolis, Cáceres e Metropolitana; completar os avisos de Primavera; investigar o 19º edital anunciado por Sinop; validar Juruena/Conselvan; obter cadastro territorial válido em 2025 e completar busca escola por escola/CDCE. Completar itens, escolas/CNPJs, cronogramas e campos jurídicos de cada edital após revisão individual. Não publicar este pacote como base censitária concluída.

## Fontes por procedimento

As URLs abaixo são as efetivamente localizadas. `PENDENTE` não significa elegibilidade comprovada.

- **ED-0001 — Diamantino — 030/2024 — Rosário Oeste — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1c78ZFNNYoccuvL0jU8rWp_R_xz1xMS4Z/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0001_DOC-0001.pdf`
- **ED-0002 — Diamantino — 029/2024 — Nobres — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1zCzXCy_6UQ-wp3fF82YbY2eXyOdWj-LR/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0002_DOC-0002.pdf`
- **ED-0003 — Diamantino — 028/2024 — Santo Afonso — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1fCfEBhm8epesXks5VK9fFLLFTKhYCGWF/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0003_DOC-0003.pdf`
- **ED-0004 — Diamantino — 027/2024 — Nova Marilândia — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1C0P8--EuzFhoFNhYrgXsDBxoLLu1n0d9/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0004_DOC-0004.pdf`
- **ED-0005 — Diamantino — 026/2024 — Nortelândia — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1tTAVdECBY5ZvvdzVyxeay_bBqctcchwf/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0005_DOC-0005.pdf`
- **ED-0006 — Diamantino — 025/2024 — Arenápolis — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1jxuJW5kNzwha3Fi061AMXFEQlu_d-n41/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0006_DOC-0006.pdf`
- **ED-0007 — Diamantino — 024/2024 — Alto Paraguai - urbano — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/10rhsdxf-aU1663wDNiq3zHTRxT23wPI0/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0007_DOC-0007.pdf`
- **ED-0008 — Diamantino — 022/2024 — Nova Mutum - campo — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1DKNfN8WjoU90Qoe6Mc200hVpIrlpV9V8/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0008_DOC-0008.pdf`
- **ED-0009 — Diamantino — 023/2024 — Nova Mutum - urbano — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1l23MmDMY2xhil3ElaXwTmdVUTuyn7Nkz/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0009_DOC-0009.pdf`
- **ED-0010 — Diamantino — 021/2024 — Santa Rita do Trivelato — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/19CirP-lpUU2rFgsXRoXjuHz8riBBT2Z7/view?usp=sharing
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0010_DOC-0010.pdf`
- **ED-0011 — Diamantino — 019/2024 — Alto Paraguai - campo — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/15Q4vZ2MBLMQnBSvxZYzipIfVArnTMOAs/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0012_DOC-0012.pdf`
- **ED-0012 — Diamantino — 020/2024 — Diamantino — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/19yUaeovVMqUo_PZOOxBKKSoG74iSMpW5/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0013_DOC-0013.pdf`
- **ED-0013 — Diamantino — 018/2024 — Nova Maringá — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1Zi9-sR8YW0YToVfPQb1pnEQeAk-xgPJA/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0014_DOC-0014.pdf`
- **ED-0014 — Diamantino — 017/2024 — São José do Rio Claro — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drediamantino/chamada-pública
  - Documento/referência: https://drive.google.com/file/d/1a5ZMBmaaMcymd9NyW_cxUh8axSsYgOZa/view?usp=drivesdk
  - Arquivo: `PNAE_MT_2025/05_DIAMANTINO/DOC-0015_DOC-0015.pdf`
- **ED-0015 — Juína — 026/2024 — Castanheira — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/castanheiraedital--chamada-pUblica-2025docx-PO0m.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0016_castanheiraedital--chamada-pUblica-2025docx-PO0m.pdf`
- **ED-0016 — Juína — 017/2024 — Brasnorte — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/brasnorteedital--chamada-pUblica-2025docx-ZQmt.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0017_brasnorteedital--chamada-pUblica-2025docx-ZQmt.pdf`
- **ED-0017 — Juína — 020/2024 — Juína — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/juinaedital--chamada-pUblica-2025-juinadocx-d5go.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0018_juinaedital--chamada-pUblica-2025-juinadocx-d5go.pdf`
- **ED-0018 — Juína — 019/2024 — Cotriguaçu — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/cotriguacuedital--chamada-pUblica-2025-2-MbYw.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0020_cotriguacuedital--chamada-pUblica-2025-2-MbYw.pdf`
- **ED-0019 — Juína — 025/2024 — Novo Horizonte do Norte — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/novo-horizonte-edital--chamada-pUblica-2025pos-parecer-2docx-FGAB.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0021_novo-horizonte-edital--chamada-pUblica-2025pos-parecer-2docx-FGAB.pdf`
- **ED-0020 — Juína — 024/2024 — Porto dos Gaúchos — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/porto-edital--chamada-pUblica-2025docx-1-zvmJ.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0022_porto-edital--chamada-pUblica-2025docx-1-zvmJ.pdf`
- **ED-0021 — Juína — 022/2024 — Juara - indígena — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/juara-indigenaedital--chamada-pUblica-2025pos-parecer-1docx-5sZw.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0023_juara-indigenaedital--chamada-pUblica-2025pos-parecer-1docx-5sZw.pdf`
- **ED-0022 — Juína — 021/2024 — Juara — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/juaraedital-docx-atRm.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0024_juaraedital-docx-atRm.pdf`
- **ED-0023 — Juína — 018/2024 — Colniza — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/colniza-chamada-pUblica-2025pos-parecer1docx-Wh1j.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0025_colniza-chamada-pUblica-2025pos-parecer1docx-Wh1j.pdf`
- **ED-0024 — Juína — 015/2024 — Aripuanã — ELEGIVEL_2025**
  - Publicação: https://www.drejuina.com.br/editals
  - Documento/referência: https://www.drejuina.com.br/uploads/editais/aripuana-edital--chamada-pUblica-2025pos-parecerdocx-1-xI4f.pdf
  - Arquivo: `PNAE_MT_2025/06_JUINA/DOC-0027_aripuana-edital--chamada-pUblica-2025pos-parecerdocx-1-xI4f.pdf`
- **ED-0025 — Primavera do Leste — 011/2025 — Primavera do Leste — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1U2KHE7gQmPFL3AjpT0_koB6xrzva2Djq/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0029_DOC-0029.pdf`
- **ED-0026 — Primavera do Leste — 010/2025 — Gaúcha do Norte — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1u4viDkeR13vC8sY0_b83YVsERdtqQcdI/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0030_DOC-0030.pdf`
- **ED-0027 — Primavera do Leste — sem número verificado — Nova Nazaré — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/11P2vQe6LDaw094XxMFfarykQGzPGw2RZ/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0031_DOC-0031.pdf`
- **ED-0028 — Primavera do Leste — 009/2025 — Paranatinga Indígenas — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1IaKsTwt6oygKi3cNcuJiDBxHBm93HsGi/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0032_DOC-0032.pdf`
- **ED-0029 — Primavera do Leste — 009/2025 — Brasnorte — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1A6ksWJbqRQdM9DkKbuW6ozKcjjJ_hm-B/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0033_DOC-0033.pdf`
- **ED-0030 — Primavera do Leste — 008/2025 — Paranatinga — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1N2WYR06Qz76_58Ty5MbZL19ILFVeY6Cr/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0034_DOC-0034.pdf`
- **ED-0031 — Primavera do Leste — 007/2025 — Santo Antônio do Leste — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1FOq4Eay9AaNQgqG3jtX1drPKFEYW_rQU/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0035_DOC-0035.pdf`
- **ED-0032 — Primavera do Leste — 006/2025 — Campo Verde — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1uOCEwWVJSG8frRHa4VJcf7GuS_oI-bUl/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0036_DOC-0036.pdf`
- **ED-0033 — Primavera do Leste — 005/2025 — Poxoréo — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/194zImK1prHxYLWtetHtbTQO2o1cblCEj/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0037_DOC-0037.pdf`
- **ED-0034 — Primavera do Leste — 004/2025 — Primavera do Leste — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1GL-3TufRhzRAwncgIuYj5z4ejvyNIBrF/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0038_DOC-0038.pdf`
- **ED-0035 — Primavera do Leste — 009/2025 — Primavera do Leste — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1_KMjEXJP4BdZk3uMexh4DOKOKY8WQF4X/view?usp=sharing
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0039_DOC-0039.pdf`
- **ED-0036 — Primavera do Leste — 008/2025 — Primavera do Leste — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1hKjjjUAavvzqwoLRUv5XFkyE7VZ0tmp4/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0040_DOC-0040.pdf`
- **ED-0037 — Primavera do Leste — 007/2025 — Primavera do Leste — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/11WTxQ7cYjRQ36rin-umxWwmZPZRcj-QU/view?usp=sharing
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0041_DOC-0041.pdf`
- **ED-0038 — Primavera do Leste — 006/2025 — Primavera do Leste — CONFLITO_EXERCICIO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1oshlg6_JFjkOBsfOCm9iThMWUKROxpXS/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0042_DOC-0042.pdf`
- **ED-0039 — Primavera do Leste — 005/2025 — Primavera do Leste — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1dJSfMI4DTtzf0iEWyeJgPXuJjGThhhQn/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0043_DOC-0043.pdf`
- **ED-0040 — Primavera do Leste — 003/2025 — Carlinda — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1Apt0mpLmRSon4T6wJTwCpQLheRbVx5Bv/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0044_DOC-0044.pdf`
- **ED-0041 — Primavera do Leste — 004/2025 — Primavera do Leste — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/155Ya79RS0h0Phrfr8W2FUMLSk25SUBUZ/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0045_DOC-0045.pdf`
- **ED-0042 — Primavera do Leste — 003/2025 — Primavera do Leste — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1FeVRDtsX6IrvS2jZ8OjU87z4A2pwQyRA/view?usp=drive_link
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0046_DOC-0046.pdf`
- **ED-0043 — Primavera do Leste — 002/2025 — Primavera do Leste — FORA_ESCOPO_2026**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1vUp5LfrsB_Cz_szM9Zhpg-5oO7XckfF0/view?usp=sharing
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/10_PRIMAVERA_DO_LESTE/DOC-0047_DOC-0047.pdf`
- **ED-0044 — Primavera do Leste — 003/2025 — Paranatinga - urbana — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1ROfDZgd_0HFbAs_zga1X4lpu8wdWyKIb/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0048_DOC-0048.pdf`
- **ED-0045 — Primavera do Leste — sem número verificado — Primavera do Leste — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1Ff8DJ5Z458Y-Pqp5bTpMz-t_j4oUmEpn/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0049_DOC-0049.pdf`
- **ED-0046 — Primavera do Leste — 001/2025 — Poxoréu — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1ankz-P-NgVCs0DfIGJVEswIzkyqATLOt/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0050_DOC-0050.pdf`
- **ED-0047 — Primavera do Leste — 002/2025 — Primavera do Leste — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/16n6QQItwSAsgwoe4dX5Lovqa5cS8EOLe/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0051_DOC-0051.pdf`
- **ED-0048 — Primavera do Leste — 001/2025 — Santo Antônio do Leste — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1lmzHuVSvCENKWZqtCnxoLugonYRk5q4b/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0052_DOC-0052.pdf`
- **ED-0049 — Primavera do Leste — 012/2024 — Santo Antônio do Leste — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1jvcAeDDGc-PaBDXrTRLiD2QbzJjaOhvE/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0065_DOC-0065.pdf`
- **ED-0050 — Primavera do Leste — 009/2024 — Santo Antônio do Leste — PENDENTE_EDITAL_COMPLETO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1ZOyOp4RM83qtRR9bmDlTKbPBme1_gTQH/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0055_DOC-0055.pdf`
- **ED-0051 — Primavera do Leste — 014/2024 — Paranatinga - urbana — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/10Goz6E9hSipACxJ1artyZEApT2JJcnuW/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0066_DOC-0066.pdf`
- **ED-0052 — Primavera do Leste — 013/2024 — Paranatinga - urbana — PENDENTE_EDITAL_COMPLETO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1FTJ9Bu_XxE5WkradLZtsquDo3YF36RU2/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0057_DOC-0057.pdf`
- **ED-0053 — Primavera do Leste — 010/2024 — Primavera do Leste — PENDENTE_EDITAL_COMPLETO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1dtNrtzLzqkJuIbrhMuc4slA3lF2xIX5M/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0058_DOC-0058.pdf`
- **ED-0054 — Primavera do Leste — 011/2024 — Poxoréu — PENDENTE_EDITAL_COMPLETO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1Wjo67zqWJI8qfXZK9Y2pW5gBldH0eelK/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0059_DOC-0059.pdf`
- **ED-0055 — Primavera do Leste — 012/2024 — Campo Verde — PENDENTE_EDITAL_COMPLETO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1g3_xIr5sW6SvM_nkHxgpULhhPnpQb0Us/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0060_DOC-0060.pdf`
- **ED-0056 — Primavera do Leste — 009/2024 — Gaúcha do Norte — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1ItBdCrs3RwVBz8I9cZelgals7sts8Xpo/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0061_DOC-0061.pdf`
- **ED-0057 — Primavera do Leste — 010/2024 — Primavera do Leste — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1yVgl9BY0Wz6uLFZVFZ4dkGo9ce0Y5Rws/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0062_DOC-0062.pdf`
- **ED-0058 — Primavera do Leste — 011/2024 — Poxoréu — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1emDxv5nWFjaoF8by6LBj_bf-V7XRkhWI/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0063_DOC-0063.pdf`
- **ED-0059 — Primavera do Leste — 015/2024 — Paranatinga - indígena — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1v1ohSPNAWg3LbfVB1Cm6fjMFnLOaAlkF/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0067_DOC-0067.pdf`
- **ED-0060 — Primavera do Leste — 013/2024 — Campo Verde — PREGAO_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1c3mdaljKRtqfPkjJRLTdcDZ-poyAHTU6/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0068_DOC-0068.pdf`
- **ED-0061 — Primavera do Leste — 016/2024 — Gaúcha do Norte - urbana — ELEGIVEL_2025**
  - Publicação: https://sites.google.com/edu.mt.gov.br/drepva/coordenadorias/coadm/certames-2025
  - Documento/referência: https://drive.google.com/file/d/1t7mFIHJ17ZYchybLD1G5tdI7ckEUD56E/view?usp=drive_link
  - Arquivo: `PNAE_MT_2025/10_PRIMAVERA_DO_LESTE/DOC-0069_DOC-0069.pdf`
- **ED-0062 — Sinop — 020/2024 — Sinop — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/f8345a8a-c33f-4788-bfe9-fb15c23010b8
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0070_f8345a8a-c33f-4788-bfe9-fb15c23010b8.pdf`
- **ED-0063 — Sinop — 021/2024 — Colíder — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/d239737c-aa5b-4aa5-8c4f-98a1c89d4007
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0071_d239737c-aa5b-4aa5-8c4f-98a1c89d4007.pdf`
- **ED-0064 — Sinop — 022/2024 — Nova Santa Helena — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/d8539333-10b0-436d-be50-4bc6b6c5b940
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0072_d8539333-10b0-436d-be50-4bc6b6c5b940.pdf`
- **ED-0065 — Sinop — 023/2024 — Itaúba — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/61522d8f-5478-4cdb-b7cf-0d7a17c56a27
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0073_61522d8f-5478-4cdb-b7cf-0d7a17c56a27.pdf`
- **ED-0066 — Sinop — 024/2024 — Cláudia — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/1291cecc-6aa7-43bb-a549-a33b65843df9
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0074_1291cecc-6aa7-43bb-a549-a33b65843df9.pdf`
- **ED-0067 — Sinop — 025/2024 — Santa Carmem — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/bd759726-7290-4133-976b-096fd05bfc1b
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0075_bd759726-7290-4133-976b-096fd05bfc1b.pdf`
- **ED-0068 — Sinop — 026/2024 — Ipiranga do Norte — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/807e87cd-6ca6-45b4-be56-587562a0b377
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0076_807e87cd-6ca6-45b4-be56-587562a0b377.pdf`
- **ED-0069 — Sinop — 027/2024 — Tabaporã - distrito — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/762c78d9-033d-49a2-81cc-9952333825e8
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0077_762c78d9-033d-49a2-81cc-9952333825e8.pdf`
- **ED-0070 — Sinop — 028/2024 — União do Sul — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/7272d1c5-14fa-4d35-9416-fa978aae122e
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0078_7272d1c5-14fa-4d35-9416-fa978aae122e.pdf`
- **ED-0071 — Sinop — 029/2024 — Itanhangá — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/dc2650b4-75f5-4259-83e4-67d7ac91d586
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0079_dc2650b4-75f5-4259-83e4-67d7ac91d586.pdf`
- **ED-0072 — Sinop — 030/2024 — Tapurah — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/912f5800-b74c-4a39-8a20-e86bacc363b1
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0080_912f5800-b74c-4a39-8a20-e86bacc363b1.pdf`
- **ED-0073 — Sinop — 031/2024 — Lucas do Rio Verde — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/bd8b8e50-3336-4f3c-b477-295a07c42a73
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0081_bd8b8e50-3336-4f3c-b477-295a07c42a73.pdf`
- **ED-0074 — Sinop — 032/2024 — Sorriso — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/b3b243ae-9c6f-465d-b616-bbe843f76a0a
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0082_b3b243ae-9c6f-465d-b616-bbe843f76a0a.pdf`
- **ED-0075 — Sinop — 033/2024 — Nova Ubiratã - sede — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/60ecd063-24c4-4325-8689-129e23d2e25b
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0083_60ecd063-24c4-4325-8689-129e23d2e25b.pdf`
- **ED-0076 — Sinop — 034/2024 — Boa Esperança do Norte — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/a27aaf3d-adc9-4b34-ba88-5755ae46e194
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0084_a27aaf3d-adc9-4b34-ba88-5755ae46e194.pdf`
- **ED-0077 — Sinop — 035/2024 — Tabaporã - sede — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/754dca13-1a2d-4733-83a5-4bde5f1235ff
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0085_754dca13-1a2d-4733-83a5-4bde5f1235ff.pdf`
- **ED-0078 — Sinop — 036/2024 — Vera — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/8fdbdccf-4aac-4d5d-ab2a-951abaf48b1a
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0086_8fdbdccf-4aac-4d5d-ab2a-951abaf48b1a.pdf`
- **ED-0079 — Sinop — 037/2024 — Feliz Natal — ELEGIVEL_2025**
  - Publicação: https://dresinop.com.br/editais/993c9e6b-8ed8-4697-81b6-2fbf4cfedf2d
  - Documento/referência: https://dresinop.com.br/arquivos/ef4983ae-d7b6-4e0d-85e2-21406a4505c3
  - Arquivo: `PNAE_MT_2025/12_SINOP/DOC-0087_ef4983ae-d7b6-4e0d-85e2-21406a4505c3.pdf`
- **ED-0080 — Tangará da Serra — 014/2024 — Sapezal — PENDENTE_ARQUIVO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/dre-tangaradaserra/institucional/coordenadorias/coadm/chamada-pública-em-andamento
  - Documento/referência: https://drive.google.com/file/d/1G0ElLv1VSiTCNWNCDSnDbahxi7EA5DIk/view?usp=drive_link
  - Arquivo: `não baixado`
- **ED-0081 — Tangará da Serra — 013/2024 — Tangará da Serra — PENDENTE_ARQUIVO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/dre-tangaradaserra/institucional/coordenadorias/coadm/chamada-pública-concluídas
  - Documento/referência: https://drive.google.com/file/d/1pzC2qhTXj3QNZsbZ4fBSZSIkxT8H7X8_/view?usp=drive_link
  - Arquivo: `não baixado`
- **ED-0082 — Tangará da Serra — 012/2024 — Porto Estrela — PENDENTE_ARQUIVO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/dre-tangaradaserra/institucional/coordenadorias/coadm/chamada-pública-concluídas
  - Documento/referência: https://drive.google.com/file/d/1xAysEQ2u520IYvXlbAJszLnxCjLWy1Gz/view?usp=drive_link
  - Arquivo: `não baixado`
- **ED-0083 — Tangará da Serra — 011/2024 — Nova Olímpia — PENDENTE_ARQUIVO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/dre-tangaradaserra/institucional/coordenadorias/coadm/chamada-pública-concluídas
  - Documento/referência: https://drive.google.com/file/d/1BcSqSk-pcRGIqwD1yMcrXcuqKncBeNHw/view?usp=drive_link
  - Arquivo: `não baixado`
- **ED-0084 — Tangará da Serra — 010/2024 — Denise — PENDENTE_ARQUIVO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/dre-tangaradaserra/institucional/coordenadorias/coadm/chamada-pública-concluídas
  - Documento/referência: https://drive.google.com/file/d/1lx7feury5GzGqaYu3fxkf0wkzaG8yuSj/view?usp=drive_link
  - Arquivo: `não baixado`
- **ED-0085 — Tangará da Serra — 009/2024 — Campo Novo do Parecis — PENDENTE_ARQUIVO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/dre-tangaradaserra/institucional/coordenadorias/coadm/chamada-pública-concluídas
  - Documento/referência: https://drive.google.com/file/d/1ByAy0T06Y7QG9YNM4ZIZbk_eHmbidlDv/view?usp=drive_link
  - Arquivo: `não baixado`
- **ED-0086 — Tangará da Serra — 008/2024 — Barra do Bugres — PENDENTE_ARQUIVO**
  - Publicação: https://sites.google.com/edu.mt.gov.br/dre-tangaradaserra/institucional/coordenadorias/coadm/chamada-pública-concluídas
  - Documento/referência: https://drive.google.com/file/d/1QXgBS_ON4HEe4EP-0cBgF9LMN808hc0m/view?usp=drive_link
  - Arquivo: `não baixado`
- **ED-0087 — Cáceres — 013/2024 — Curvelândia — PREGAO_2025**
  - Publicação: https://www.drecaceres.com.br/edital.php?id=233
  - Documento/referência: https://drive.google.com/file/d/1RPraEuk2hI9FQBZoJVwmMYSC-G6IsKq-/view
  - Arquivo: `PNAE_MT_2025/03_CACERES/DOC-0095_DOC-0095.pdf`
- **ED-0088 — Cáceres — 014/2024 — Mirassol D’Oeste — PREGAO_2025**
  - Publicação: https://www.drecaceres.com.br/edital.php?id=233
  - Documento/referência: https://drive.google.com/file/d/1DLSem3a2G6qp_HVFAj6-37RRpgyjgEqH/view?usp=sharing
  - Arquivo: `PNAE_MT_2025/03_CACERES/DOC-0096_DOC-0096.pdf`
- **ED-0089 — Cáceres — 015/2024 — Glória D’Oeste — PREGAO_2025**
  - Publicação: https://www.drecaceres.com.br/edital.php?id=233
  - Documento/referência: https://drive.google.com/file/d/1j8USo6mX-z2qdQiot-c6bLJpSVuk500h/view?usp=sharing
  - Arquivo: `PNAE_MT_2025/03_CACERES/DOC-0097_DOC-0097.pdf`
- **ED-0090 — Cáceres — 017/2024 — Cáceres — PREGAO_2025**
  - Publicação: https://www.drecaceres.com.br/edital.php?id=233
  - Documento/referência: https://drive.google.com/file/d/1BDnloUNQArc6mq0YhfpAHz8Xjcz5E_sh/view?usp=sharing
  - Arquivo: `PNAE_MT_2025/03_CACERES/DOC-0098_DOC-0098.pdf`
- **ED-0091 — Cáceres — 016/2024 — Porto Esperidião — PREGAO_2025**
  - Publicação: https://www.drecaceres.com.br/edital.php?id=233
  - Documento/referência: https://drive.google.com/file/d/1Ky3eb9ihi1dvUE6o29vA_JjwKJbV5gnj/view?usp=sharing
  - Arquivo: `PNAE_MT_2025/03_CACERES/DOC-0101_DOC-0101.pdf`
- **ED-0092 — Alta Floresta — 013/2024 — Nova Monte Verde — ELEGIVEL_2025**
  - Publicação: https://drealtafloresta.com.br/drealtafloresta/aviso-de-chamada-publica-no-013-2024-p-o-municipio-de-nova-monte-verde-mt-ano-letivo-de-2025/
  - Documento/referência: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-2025-Nova-Monte-Verde.pdf
  - Arquivo: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0102_EDITAL-CHAMADA-PUBLICA-2025-Nova-Monte-Verde.pdf`
- **ED-0093 — Alta Floresta — 014/2024 — Nova Bandeirantes — ELEGIVEL_2025**
  - Publicação: https://drealtafloresta.com.br/drealtafloresta/aviso-de-chamada-publica-no-014-2024-p-o-municipio-de-nova-bandeirantes-ano-letivo-de-2025/
  - Documento/referência: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-N.-BANDEIRANTES-014-24-ano-letivo-2025.pdf
  - Arquivo: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0103_EDITAL-CHAMADA-PUBLICA-N.-BANDEIRANTES-014-24-ano-letivo-2025.pdf`
- **ED-0094 — Alta Floresta — 012/2024 — Apiacás — ELEGIVEL_2025**
  - Publicação: https://drealtafloresta.com.br/drealtafloresta/aviso-de-chamada-publica-no-012-2024-p-o-municipio-de-apiacas-mt-ano-letivo-de-2025/
  - Documento/referência: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-012-24-APIACAS-ano-letivo-2025-1.pdf
  - Arquivo: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0104_EDITAL-CHAMADA-PUBLICA-012-24-APIACAS-ano-letivo-2025-1.pdf`
- **ED-0095 — Alta Floresta — 010/2024 — Nova Canaã do Norte — ELEGIVEL_2025**
  - Publicação: https://drealtafloresta.com.br/drealtafloresta/aviso-de-chamada-publica-no-010-2024-p-o-municipio-de-nova-canaa-do-norte-ano-letivo-2025/
  - Documento/referência: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-NCN-010-24-ano-letivo-2025.pdf
  - Arquivo: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0105_EDITAL-CHAMADA-PUBLICA-NCN-010-24-ano-letivo-2025.pdf`
- **ED-0096 — Alta Floresta — 009/2024 — Carlinda — ELEGIVEL_2025**
  - Publicação: https://drealtafloresta.com.br/drealtafloresta/aviso-de-chamada-publica-no-009-2024-p-o-municipio-carlinda-mt-ano-letivo-de-2025/
  - Documento/referência: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-No-009-24-CARLINDA-Ano-letivo-2025-1.pdf
  - Arquivo: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0106_EDITAL-CHAMADA-PUBLICA-No-009-24-CARLINDA-Ano-letivo-2025-1.pdf`
- **ED-0097 — Alta Floresta — 011/2024 — Paranaíta — ELEGIVEL_2025**
  - Publicação: https://drealtafloresta.com.br/drealtafloresta/aviso-de-chamada-publica-no-011-2024-paranaita-2/
  - Documento/referência: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-011-24-PTA-ano-letivo-2025-1.pdf
  - Arquivo: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0107_EDITAL-CHAMADA-PUBLICA-011-24-PTA-ano-letivo-2025-1.pdf`
- **ED-0098 — Alta Floresta — 008/2024 — Alta Floresta — ELEGIVEL_2025**
  - Publicação: https://drealtafloresta.com.br/drealtafloresta/aviso-de-chamada-publica-no-008-2024-alta-floresta/
  - Documento/referência: https://drealtafloresta.com.br/drealtafloresta/wp-content/uploads/2024/12/EDITAL-CHAMADA-PUBLICA-008-24-AF-ano-letivo-2025.pdf
  - Arquivo: `PNAE_MT_2025/01_ALTA_FLORESTA/DOC-0108_EDITAL-CHAMADA-PUBLICA-008-24-AF-ano-letivo-2025.pdf`
- **ED-0099 — Metropolitana — 003/2025 — Cuiabá — FORA_ESCOPO_2026**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_a29852589efd42ed8e069f3abcffbbc7.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0109_2004f4_a29852589efd42ed8e069f3abcffbbc7.pdf`
- **ED-0100 — Metropolitana — 002/2025 — Várzea Grande — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_d275f8ff4df34f22aac00f2ef72077a1.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0110_2004f4_d275f8ff4df34f22aac00f2ef72077a1.pdf`
- **ED-0101 — Metropolitana — 001/2026 — Santo Antônio do Leverger — FORA_ESCOPO_2026**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_7e7f9188a88349d28235ca65582376ca.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0111_2004f4_7e7f9188a88349d28235ca65582376ca.pdf`
- **ED-0102 — Metropolitana — 005/2026 — Nossa Senhora do Livramento — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_e84cb3a0d1f64507beff5c292c9fac5e.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0112_2004f4_e84cb3a0d1f64507beff5c292c9fac5e.pdf`
- **ED-0103 — Metropolitana — 006/2026 — Poconé — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_88a5d1caedc34dde8c02a2ce8321076d.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0113_2004f4_88a5d1caedc34dde8c02a2ce8321076d.pdf`
- **ED-0104 — Metropolitana — 004/2026 — Jangada — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_42c1768cd2454f29a14f5e8b51c5c509.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0114_2004f4_42c1768cd2454f29a14f5e8b51c5c509.pdf`
- **ED-0105 — Metropolitana — 003/2026 — Acorizal — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_fcf2491bb40c4f5ca34e34cc02490f53.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0115_2004f4_fcf2491bb40c4f5ca34e34cc02490f53.pdf`
- **ED-0106 — Metropolitana — 002/2026 — Barão de Melgaço — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_c48619e9ff29426d9ad5922b1a9474d8.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0116_2004f4_c48619e9ff29426d9ad5922b1a9474d8.pdf`
- **ED-0107 — Metropolitana — 007/2025 — Chapada dos Guimarães — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_a40cb2d0ef534c7d8b8153fb4c5c9697.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0117_2004f4_a40cb2d0ef534c7d8b8153fb4c5c9697.pdf`
- **ED-0108 — Metropolitana — 008/2026 — Planalto da Serra — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_c959216226f846ae8cd20addd9412c18.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0118_2004f4_c959216226f846ae8cd20addd9412c18.pdf`
- **ED-0109 — Metropolitana — 009/2026 — Nova Brasilândia — CONFLITO_EXERCICIO**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_bd417cb1a36a4509975aedce74924758.pdf
  - Arquivo: `DOCUMENTOS_FORA_ESCOPO_OU_CONFLITANTES/08_METROPOLITANA/DOC-0119_2004f4_bd417cb1a36a4509975aedce74924758.pdf`
- **ED-0110 — Metropolitana — 007/2024 — Cuiabá — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_dea8716823c14c04a061631b6fd19025.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0120_2004f4_dea8716823c14c04a061631b6fd19025.pdf`
- **ED-0111 — Metropolitana — 008/2024 — Várzea Grande — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_8bb54366edc047cc91e143616c8418c9.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0121_2004f4_8bb54366edc047cc91e143616c8418c9.pdf`
- **ED-0112 — Metropolitana — 009/2024 — Santo Antônio do Leverger — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_87ed7fac89b54734a58548ab9bf6741b.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0122_2004f4_87ed7fac89b54734a58548ab9bf6741b.pdf`
- **ED-0113 — Metropolitana — 010/2024 — Poconé — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_f869b5af3e7a42e58206e5a5f70a15f0.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0123_2004f4_f869b5af3e7a42e58206e5a5f70a15f0.pdf`
- **ED-0114 — Metropolitana — 011/2024 — Nossa Senhora do Livramento — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_a8813c38b6e34b8880bad6dada1b622d.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0124_2004f4_a8813c38b6e34b8880bad6dada1b622d.pdf`
- **ED-0115 — Metropolitana — 012/2024 — Jangada — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_df2e8ee18b594ee6a5b25064c8856c92.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0125_2004f4_df2e8ee18b594ee6a5b25064c8856c92.pdf`
- **ED-0116 — Metropolitana — 013/2024 — Acorizal — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_3c327a18a5fc41f89b2df665bfad91f9.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0126_2004f4_3c327a18a5fc41f89b2df665bfad91f9.pdf`
- **ED-0117 — Metropolitana — 014/2024 — Barão de Melgaço — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_0c038f727d3b419d8213275738c38c2c.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0127_2004f4_0c038f727d3b419d8213275738c38c2c.pdf`
- **ED-0118 — Metropolitana — 015/2024 — Chapada dos Guimarães — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_ee4640c9dee7474fafbf9b9e6778221a.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0128_2004f4_ee4640c9dee7474fafbf9b9e6778221a.pdf`
- **ED-0119 — Metropolitana — 016/2024 — Planalto da Serra — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_32158461ac7442b09680f673b655e0c5.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0129_2004f4_32158461ac7442b09680f673b655e0c5.pdf`
- **ED-0120 — Metropolitana — 017/2024 — Nova Brasilândia — PREGAO_2025**
  - Publicação: https://www.dmetropolitana.org/pregao-2025
  - Documento/referência: https://www.dmetropolitana.org/_files/ugd/2004f4_34e70caf91d04da28c0b0e2a68144bc3.pdf
  - Arquivo: `PNAE_MT_2025/08_METROPOLITANA/DOC-0130_2004f4_34e70caf91d04da28c0b0e2a68144bc3.pdf`
- **ED-0121 — Pontes e Lacerda — 014/2024 — Pontes e Lacerda — ELEGIVEL_2025**
  - Publicação: https://dreponteselacerda.com.br/site/edital.php
  - Documento/referência: https://dreponteselacerda.com.br/site/edital-downloadPDF.php?ideditais=113
  - Arquivo: `PNAE_MT_2025/09_PONTES_E_LACERDA/DOC-0131_edital-downloadPDF.php.pdf`
- **ED-0122 — Confresa — 018/2024 — Canabrava do Norte — REFERENCIA_HISTORICA**
  - Publicação: https://www.iomat.mt.gov.br/legislacao/diario_oficial/detalhes/873816
  - Documento/referência: https://www.iomat.mt.gov.br/legislacao/diario_oficial/download/873816
  - Arquivo: `PNAE_MT_2025/04_CONFRESA/DOC-0132_873816.pdf`
- **ED-0123 — Barra do Garças — 004/2025 — Água Boa — REFERENCIA_HISTORICA**
  - Publicação: https://www.iomat.mt.gov.br/legislacao/diario_oficial/detalhes/884194
  - Documento/referência: https://www.iomat.mt.gov.br/legislacao/diario_oficial/download/884194
  - Arquivo: `PNAE_MT_2025/02_BARRA_DO_GARCAS/DOC-0133_884194.pdf`
- **ED-0124 — Rondonópolis — 024/2024 — Rondonópolis — REFERENCIA_HISTORICA**
  - Publicação: https://www.iomat.mt.gov.br/legislacao/diario_oficial/detalhes/902650
  - Documento/referência: https://www.iomat.mt.gov.br/legislacao/diario_oficial/download/902650
  - Arquivo: `PNAE_MT_2025/11_RONDONOPOLIS/DOC-0134_902650.pdf`
- **ED-0125 — Matupá — 001/2025 — Matupá — REFERENCIA_HISTORICA**
  - Publicação: https://www.iomat.mt.gov.br/legislacao/diario_oficial/detalhes/885190
  - Documento/referência: https://www.iomat.mt.gov.br/legislacao/diario_oficial/download/885190
  - Arquivo: `PNAE_MT_2025/07_MATUPA/DOC-0135_885190.pdf`
