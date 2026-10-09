"""Dev-only: rebuild styled paragraphs from docs/dre (pip install pymupdf).

Only the principal's example product grid is removed. The editable clauses,
bold spans and paragraph boundaries are retained; no original call data is used
as the values of a new edital.
"""
import html
import json
import pathlib
import re
import pymupdf

root = pathlib.Path(__file__).resolve().parents[3]
source = root / 'docs/dre/01_Edital_Principal.pdf'
doc = pymupdf.open(source)

replacements = [
    (r'001/2025', '{{edital.numero}}/{{edital.ano}}'),
    (r'170376/2025', '{{edital.processoAdministrativo}}'),
    (r'14 de janeiro de 2026', '{{edital.dataSessao}}'),
    (r'09h:00min', '{{edital.horarioSessao}}'),
    (r'Escola\s+Estadual Dr\. Arnaldo Estevão De Figueiredo, situada à Avenida Major Simão Aureliano De Barros, 229\s+CENTRO, Alto Paraguai - MT', '{{edital.localSessao}}'),
    (r'dmt\.coadm@edu\.mt\.gov\.br', '{{entidade.email}}'),
    (r'www\.drediamantino\.com\.br', '{{entidade.portal}}'),
    (r'Diamantino, 26 de novembro de 2025\.', '{{edital.municipio.nome}}, {{edital.dataPublicacao}}.'),
    (r'Diamantino-MT', '{{edital.municipio.nome}}/{{edital.municipio.uf}}'),
    (r'Alto Paraguai(?:\s*[-/]\s*MT)?', '{{edital.municipio.nome}}'),
    (r'no ano letivo de 2026', 'no ano letivo de {{edital.ano}}'),
]


def paragraph(blocks):
    text, bold = '', []
    for block in blocks:
        for line in block['lines']:
            if text:
                text += ' '
                bold.append(False)
            for span in line['spans']:
                text += span['text']
                bold.extend(['Bold' in span['font']] * len(span['text']))
    for pattern, value in replacements:
        for match in reversed(list(re.finditer(pattern, text))):
            a, b = match.span()
            weight = any(bold[a:b])
            text = text[:a] + value + text[b:]
            bold[a:b] = [weight] * len(value)
    parts, start = [], 0
    while start < len(text):
        end = start + 1
        while end < len(text) and bold[end] == bold[start]:
            end += 1
        segment = html.escape(text[start:end])
        parts.append(f'<strong>{segment}</strong>' if bold[start] else segment)
        start = end
    return ''.join(parts).strip(), text.strip()


output, inserted = [], False
for page in doc:
    # All six-column grids on pages before "2. DOS PREÇOS" belong to the example products.
    tables = [t.bbox for t in page.find_tables().tables if t.col_count == 6 and page.number < 20]
    blocks = [b for b in page.get_text('dict')['blocks'] if 'lines' in b]
    intro = [b for b in blocks if page.number == 0 and b['bbox'][0] > 200 and 140 < b['bbox'][1] < 290]
    for block in blocks:
        box = pymupdf.Rect(block['bbox'])
        text = ' '.join(s['text'] for l in block['lines'] for s in l['spans']).strip()
        if not text or re.fullmatch(r'\d+', text):
            continue
        if any(box.intersects(pymupdf.Rect(table)) for table in tables):
            if not inserted:
                output.append('<div>{{itens}}</div>')
                inserted = True
            continue
        if block in intro:
            if block is intro[0]:
                markup, plain = paragraph(intro)
                output.append(f'<p class="ementa">{markup}</p>')
            continue
        markup, plain = paragraph([block])
        if plain.startswith('SECRETARIA DE ESTADO'):
            output.append(f'<h1>{markup}</h1>')
        elif page.number == 0 and plain.startswith('Processo administrativo'):
            output.append(f'<p class="processo">{markup}</p>')
        elif re.match(r'^\d+\.\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s,()/-]+\.?$', plain):
            output.append(f'<h2>{markup}</h2>')
        else:
            # Split numbered clauses and roman list entries inside a PDF text block.
            markup = re.sub(r' (?=(?:\d{1,2}\.\d{1,2}\.?\s|[IVX]+\s*[-–]\s))', '<br>', markup)
            output.append(f'<p>{markup}</p>')

merged = []
for block in output:
    plain = re.sub('<[^>]+>', '', block[3:-4]).lstrip() if block.startswith('<p>') else ''
    previous = re.sub('<[^>]+>', '', merged[-1]).rstrip() if merged else ''
    if plain and plain[0].islower() and merged and merged[-1].startswith('<p>') and previous and previous[-1] not in '.:;!?':
        merged[-1] = merged[-1][:-4] + ' ' + block[3:]
    else:
        merged.append(block)
output = merged
target = root / 'apps/backend/src/modules/composicao-editais/application/domain/layout-dre-extraido.ts'
principal_html = '\n'.join(output)

# Contract: keep the original paragraph/heading styles and the budget grid.
# Its empty acquisition grid and example identification are replaced by variables.
replacements += [
    (r'(?:nº|n\.)\s*\.{3,},?\s*de\s*[./\d\s]*202[./\s]*[,;]?', 'nº {{edital.numero}}/{{edital.ano}} '),
    (r'R\$\.{3,}\s*\(\.{3,}\)', '{{projeto.valorTotal}}'),
    (r'Banco\s*\.{3,}\s*Agência nº\s*\.{3,},\s*conta corrente nº\s*\.{3,}\s*e pix\s*\.{3,}', 'Banco {{produtor.banco}}, Agência {{produtor.agencia}}, conta corrente {{produtor.conta}}, PIX {{produtor.pix}}'),
    (r'Foro da Seção Judiciária\s*\.{3,}-\s*\.{3,}', 'Foro de {{edital.foro}}'),
    (r'\[\.\.\.\] - MT, xx de xxxxxxx de 202x\.', '{{projeto.local}}, {{projeto.data}}.'),
    (r'Representante Legal: \[\.\.\.\]', 'Representante Legal: {{representante.nome}}'),
    (r'\(NOME COMPLETO CPF OU CNPJ\)', '{{produtor.nome}} — {{produtor.cpfCnpj}}'),
    (r'\(NOME COMPLETO CPF E CARGO\)', '{{entidade.representante.nome}} — {{entidade.representante.cpf}}'),
]
contract = pymupdf.open(root / 'docs/dre/08_Anexo_VII_Minuta_Contrato.pdf')
contract_output = ['''<h1 class="termo">TERMO DE CONTRATO Nº {{contrato.numero}}</h1>
<p><strong>Contrato Administrativo nº {{contrato.numero}}<br>Processo administrativo nº {{edital.processoAdministrativo}}<br>Edital de chamada pública nº {{edital.numero}}/{{edital.ano}}</strong></p>
<p class="ementa">TERMO DE CONTRATO QUE ENTRE SI CELEBRAM O CONSELHO DELIBERATIVO DA COMUNIDADE ESCOLAR — CDCE, DA {{entidade.nome}} DO ESTADO DE MATO GROSSO E A EMPRESA {{produtor.nome}}.</p>
<p>O CONSELHO DELIBERATIVO DA COMUNIDADE ESCOLAR — CDCE DA {{entidade.nome}}, CNPJ {{entidade.cnpj}}, com sede em {{entidade.endereco}}, {{entidade.municipio}}, representado por {{entidade.representante.nome}}, CPF {{entidade.representante.cpf}}, doravante CONTRATANTE, e {{produtor.nome}}, CPF/CNPJ {{produtor.cpfCnpj}}, com sede em {{produtor.endereco}}, {{produtor.municipio}}, representado por {{representante.nome}}, CPF {{representante.cpf}}, RG {{representante.rg}}/{{representante.orgaoRg}}, e-mail {{produtor.email}}, telefone {{produtor.telefone}}, doravante CONTRATADA, resolvem celebrar o presente contrato mediante as cláusulas que seguem:</p>''']
started, acquisition = False, False
for page in contract:
    # Grey clause banners may be detected as tables containing the first body line.
    # Only the actual budget grid is static; acquisition is handled separately.
    tables = [t for t in page.find_tables().tables if any('U.O' in (cell or '') for cell in t.extract()[0])]
    seen = set()
    for block in page.get_text('dict')['blocks']:
        if 'lines' not in block:
            continue
        box = pymupdf.Rect(block['bbox'])
        markup, plain = paragraph([block])
        if plain.startswith('CLÁUSULA PRIMEIRA'):
            started = True
        if not started or re.fullmatch(r'\d+', plain) or not plain:
            continue
        if '1.2 Objeto da contratação:' in plain:
            before = plain.split('1.2 Objeto da contratação:', 1)[0].strip()
            if before:
                contract_output.append('<p>' + html.escape(before) + '</p>')
            contract_output.append('<p>1.2 Objeto da contratação:</p><div>{{itens}}</div><p>Valor Total do Contrato: {{projeto.valorTotal}}</p>')
            acquisition = True
            continue
        resumed = re.search(r'1\.3\s+São anexos', plain)
        if resumed:
            acquisition = False
            plain = plain[resumed.start():]
            markup = html.escape(plain)
        if acquisition:
            continue
        table_index = None if resumed else next((i for i,t in enumerate(tables) if box.intersects(pymupdf.Rect(t.bbox))), None)
        if table_index is not None:
            if table_index not in seen:
                rows = tables[table_index].extract()
                contract_output.append('<table class="dotacao">' + ''.join('<tr>' + ''.join('<td>' + html.escape(cell or '').replace('\n','<br>') + '</td>' for cell in row) + '</tr>' for row in rows) + '</table>')
                seen.add(table_index)
            continue
        if plain.startswith('CLÁUSULA '):
            match = re.match(r'^(CLÁUSULA .+?)(?=\s+\d+\.\d+\b|$)', plain)
            heading = match.group(1) if match else plain
            contract_output.append('<h2>' + html.escape(heading) + '</h2>')
            rest = plain[len(heading):].strip()
            if rest:
                contract_output.append('<p>' + html.escape(rest) + '</p>')
        else:
            contract_output.append(f'<p>{markup}</p>')
contract_output = [re.sub(r' (?=\d{1,2}\.\d{1,2}\s)', '</p><p>', block) if block.startswith('<p>') else block for block in contract_output]
contract_html = '\n'.join(contract_output)
clause_pattern = r'(?<![\d.])\d{1,2}\.\d{1,2}(?:\.\d+)?(?!\d)'
original_clauses = set(re.findall(clause_pattern, '\n'.join(page.get_text() for page in contract)))
rebuilt_clauses = set(re.findall(clause_pattern, re.sub('<[^>]+>', ' ', contract_html)))
missing = original_clauses - rebuilt_clauses
if missing:
    raise ValueError(f'Cláusulas ausentes na reconstrução do contrato: {sorted(missing)}')
target.write_text('// Generated by scripts/extract-dre-layout.py.\nexport const EDITAL_DRE_FORMATADO = ' + json.dumps(principal_html, ensure_ascii=False) + ';\nexport const CONTRATO_DRE_FORMATADO = ' + json.dumps(contract_html, ensure_ascii=False) + ';\n', encoding='utf-8')
assets = root / 'apps/backend/assets/dre'
assets.mkdir(parents=True, exist_ok=True)
image = doc[0].get_images()[0]
logo = pymupdf.Pixmap(doc, image[0])
if image[1]:
    logo = pymupdf.Pixmap(logo, pymupdf.Pixmap(doc, image[1]))
logo.save(assets / 'seduc-mt.png')
print(f'Layout extraído: {len(output)} blocos; tabela dinâmica: {inserted}.')
