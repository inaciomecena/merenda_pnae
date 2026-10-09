import { EDITAL_DRE, CONTRATO_DRE } from './textos-dre-extraidos';

export interface ModeloDre {
  tipo: string;
  titulo: string;
  arquivo: string;
  finalidade: 'EDITAL' | 'PROJETO_VENDA' | 'PRODUCAO_PROPRIA' | 'CONTROLE_LIMITE';
  perfilFornecedor?: string;
  ordem: number;
  conteudo: string;
}

const cabecalho = '<p>Projeto de Venda de Gêneros Alimentícios da Agricultura Familiar para o PNAE — Chamada Pública nº {{edital.numero}}/{{edital.ano}}, de {{edital.dataPublicacao}}.</p>';
const fornecedor = `<p>Nome / razão social: {{produtor.nome}} — CPF/CNPJ: {{produtor.cpfCnpj}}</p>
<p>Endereço: {{produtor.endereco}} — Município/UF: {{produtor.municipio}} — CEP: {{produtor.cep}}</p>
<p>DDD/Fone: {{produtor.telefone}} — E-mail (quando houver): {{produtor.email}}</p>
<p>Nº DAP / CAF: {{produtor.dapCaf}}</p>
<p>Banco: {{produtor.banco}} — Agência: {{produtor.agencia}} — Conta corrente: {{produtor.conta}} — PIX: {{produtor.pix}}</p>`;
const representante = `<p>Representante legal: {{representante.nome}} — CPF: {{representante.cpf}}</p>
<p>Endereço: {{representante.endereco}} — Município/UF: {{representante.municipio}}</p>
<p>DDD/Fone: {{representante.telefone}} — E-mail: {{representante.email}}</p>`;
const entidade = `<h2>Identificação da Entidade Executora do PNAE/FNDE/MEC</h2>
<p>Nome: {{entidade.nome}} — CNPJ: {{entidade.cnpj}}</p>
<p>Endereço: {{entidade.endereco}} — Município/UF: {{entidade.municipio}}</p>
<p>Fone: {{entidade.telefone}} — E-mail: {{entidade.email}}</p>
<p>Representante legal: {{entidade.representante.nome}} — CPF: {{entidade.representante.cpf}}</p>`;
const produtos = `<h2>Relação dos produtos</h2><p>{{itens}}</p>
<p>Cronograma de entrega: {{projeto.cronograma}}</p><p>Valor total do projeto: {{projeto.valorTotal}}</p>`;
const aceite = '<p>Declaro estar de acordo com as condições estabelecidas neste projeto e que as informações acima conferem com as condições de fornecimento próprio de cada agricultor familiar.</p>';
const assinatura = (individual: boolean) => `<p>{{projeto.local}}, {{projeto.data}}.</p>
<p>________________________________________</p><p>${individual ? '{{produtor.nome}} — CPF: {{produtor.cpfCnpj}}' : '{{representante.nome}} — CPF: {{representante.cpf}}'}</p>`;
const relacao = '<h2>Relação de fornecedores e produtos</h2><p>{{grupo.produtosFornecedores}}</p>';

const perfis = [
  { tipo: 'ANEXO_I', perfil: 'FORMAL', label: 'Grupo Formal', plural: 'Grupos Formais', arquivo: '02_Anexo_I_Grupos_Formais', ordem: 10 },
  { tipo: 'ANEXO_II', perfil: 'INFORMAL', label: 'Grupo Informal', plural: 'Grupos Informais', arquivo: '03_Anexo_II_Grupos_Informais', ordem: 20 },
  { tipo: 'ANEXO_III', perfil: 'INDIVIDUAL', label: 'Fornecedor Individual', plural: 'Fornecedores Individuais', arquivo: '04_Anexo_III_Fornecedores_Individuais', ordem: 30 },
  { tipo: 'ANEXO_IV', perfil: 'EFR', label: 'Empreendimento Familiar Rural', plural: 'Empreendimento Familiar Rural', arquivo: '05_Anexo_IV_Empreendimento_Familiar_Rural', ordem: 40 },
];

export const MODELOS_DRE: ModeloDre[] = [
  { tipo: 'EDITAL_PRINCIPAL', titulo: 'Edital principal da chamada pública', arquivo: '01_Edital_Principal.pdf', finalidade: 'EDITAL', ordem: 0, conteudo: EDITAL_DRE },
  ...perfis.flatMap((p): ModeloDre[] => {
    const individual = p.perfil === 'INDIVIDUAL';
    const informal = p.perfil === 'INFORMAL';
    const nome = informal ? '{{grupo.nome}}' : '{{produtor.nome}}';
    const pessoa = individual ? 'produtor' : 'representante';
    const identificacao = `{{${pessoa}.nome}}, portador do RG nº {{${pessoa}.rg}}/{{${pessoa}.orgaoRg}}, inscrito no CPF/MF sob o nº {{${individual ? 'produtor.cpfCnpj' : 'representante.cpf'}}}, residente na {{${pessoa}.endereco}}, nº {{${pessoa}.numero}}, Bairro {{${pessoa}.bairro}}, no município de {{${pessoa}.municipio}}`;
    let producao: string;
    if (individual) {
      producao = `Eu, ${identificacao}, Fornecedor Individual, Declaro para os devidos fins, que os produtos identificados no Projeto de Vendas são todos de produção própria, conforme consta da relação de produtos descritos no Projeto de Vendas`;
    } else if (informal) {
      producao = `Eu, ${identificacao}, representante legal dos associados pertencentes ao Grupo Informal ${nome}, Declaro para os devidos fins, que os produtos produzidos pelos associados do Grupo Informal ${nome}, identificados no Projeto de Vendas, são produzidos por cada um dos associados, conforme consta da relação de produtos e fornecedores constantes do Projeto de Vendas`;
    } else {
      producao = `A ${p.label} ${nome}, inscrita no CNPJ sob o nº {{produtor.cpfCnpj}}, representada por ${identificacao}, Declara para os devidos fins, que os produtos oriundos de {{produtor.localProducao}}, relacionados no Projeto de Vendas, são produzidos na própria {{produtor.localProducao}}, pelos próprios associados`;
    }
    const fim = ', para o fornecimento de gêneros alimentícios oriundos da Agricultura Familiar, junto ao Processo da Chamada Pública de nº {{edital.numero}}/{{edital.ano}}, para atendimento às Unidades Escolares do município de {{edital.municipio.nome}}/{{edital.municipio.uf}}.';
    const verdade = '<p>E por ser esta a expressão da verdade, declaro e assino a presente.</p>';
    const base = { tipo: p.tipo, perfilFornecedor: p.perfil };
    const anexos: ModeloDre[] = [{
      ...base, titulo: `${p.tipo.replace('_', ' ')} – Projeto de venda – ${p.plural}`, arquivo: p.arquivo + '.pdf', finalidade: 'PROJETO_VENDA', ordem: p.ordem,
      conteudo: `<h1>${p.tipo.replace('_', ' ')} – Projeto de Venda – ${p.plural}</h1>${cabecalho}<h2>Identificação dos fornecedores — ${p.label}</h2>` +
        (informal ? `${representante}<p>Nome do grupo: {{grupo.nome}} — CEP: {{produtor.cep}} — Nº de participantes: {{grupo.participantes}}</p><h2>Relação dos fornecedores participantes</h2><p>{{grupo.fornecedores}}</p>` : fornecedor) +
        (!individual && !informal ? `<p>Nº de associados/integrantes: {{grupo.totalAssociados}}</p>${p.perfil === 'FORMAL' ? '<p>Associados com DAP/CAF PF: {{grupo.associadosCaf}} — Participantes do projeto: {{grupo.participantes}}</p>' : ''}${representante}` : '') +
        entidade + produtos + (!individual && !informal ? relacao : '') + aceite + assinatura(individual),
    }, {
      ...base, titulo: `Declaração de produção própria – ${p.label}`, arquivo: p.arquivo + '_Declaracao_Producao_Propria.pdf', finalidade: 'PRODUCAO_PROPRIA', ordem: p.ordem + 1,
      conteudo: `<h1>DECLARAÇÃO DE PRODUÇÃO PRÓPRIA (${p.label})</h1><p>${producao}${fim}</p>${verdade}${assinatura(individual)}`,
    }];
    if (!individual) anexos.push({
      ...base, titulo: `Declaração de controle do limite de fornecimento – ${p.label}`, arquivo: p.arquivo + '_Declaracao_Controle_Limite_Fornecimento.pdf', finalidade: 'CONTROLE_LIMITE', ordem: p.ordem + 2,
      conteudo: `<h1>DECLARAÇÃO DE CONTROLE DO LIMITE DE DAP/CAF PARA FORNECIMENTO INDIVIDUAL (${p.label})</h1><p>Eu, ${identificacao}, representante legal de ${nome}, Declaro para os devidos fins, que será de minha total responsabilidade o controle do limite individual de produtos fornecidos por cada associado${informal ? `, pertencentes ao Grupo Informal ${nome}` : ''}, conforme consta da relação de produtos e fornecedores constantes do Projeto de Vendas${fim}</p>${verdade}${assinatura(false)}`,
    });
    return anexos;
  }),
  { tipo: 'ANEXO_V', titulo: 'Anexo V – Unidades escolares', arquivo: '06_Anexo_V_Unidades_Escolares.pdf', finalidade: 'EDITAL', ordem: 50, conteudo: '<h1>ANEXO V – RELAÇÃO DAS UNIDADES ESCOLARES CONTEMPLADAS</h1><p>{{escolas}}</p>' },
  { tipo: 'ANEXO_VI', titulo: 'Anexo VI – Resultado da chamada pública', arquivo: '07_Anexo_VI_Resultado_Chamada_Publica.pdf', finalidade: 'EDITAL', ordem: 60, conteudo: `<h1>ANEXO VI – RESULTADO DA CHAMADA PÚBLICA</h1><p>A CÂMARA DE NEGÓCIOS DA ALIMENTAÇÃO ESCOLAR DA DIRETORIA REGIONAL DO MUNICÍPIO DE {{edital.municipio.nome}}, torna público para conhecimento dos interessados o Resultado da Chamada Pública nº {{edital.numero}}/{{edital.ano}} para Aquisição de Gêneros Alimentícios da Agricultura Familiar e do Empreendedor Familiar Rural, e de suas organizações, para atendimento dos alunos matriculados na Rede Pública Estadual, do município de {{edital.municipio.nome}}/{{edital.municipio.uf}}, em observância ao FNDE/PNAE, Resolução CD/FNDE nº 06 de 08/05/2020, IN nº 011/2024/GS/SEDUC/MT, nos termos do Edital, declarado(s) vencedor(es):</p><p>{{fornecedores}}</p><p>{{itens}}</p><p>{{assinaturas}}</p>` },
  { tipo: 'ANEXO_VII', titulo: 'Anexo VII – Minuta de contrato', arquivo: '08_Anexo_VII_Minuta_Contrato.pdf', finalidade: 'EDITAL', ordem: 70, conteudo: CONTRATO_DRE },
];
