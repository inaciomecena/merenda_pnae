import { CONTRATO_DRE_FORMATADO } from '../../../composicao-editais/application/domain/layout-dre-extraido';
import { aplicarPlaceholders } from '../../../composicao-editais/application/domain/placeholders';
import type { LinhaTabela } from '../../../composicao-editais/application/domain/documento-renderer';

export interface OrigemTemplate {
  anexoEdital?: string | null;
  templateInstitucional?: string | null;
}

export function selecionarTemplateMinuta(origem: OrigemTemplate): { conteudo: string; origem: string } {
  if (origem.anexoEdital?.trim()) return { conteudo: origem.anexoEdital, origem: 'EDITAL_ANEXO_VII' };
  if (origem.templateInstitucional?.trim()) return { conteudo: origem.templateInstitucional, origem: 'TEMPLATE_INSTITUCIONAL' };
  return { conteudo: CONTRATO_DRE_FORMATADO, origem: 'MINUTA_DRE_EXTRAIDA' };
}

export function tabelaItensMinuta(itens: Array<{ produto: string; descricao?: string | null; unidade: string; quantidade: string; valorUnitario: string; valorTotal: string }>): LinhaTabela[] {
  return [
    { colunas: ['Item', 'Descrição', 'Unidade', 'Quantidade', 'Valor unitário', 'Valor total'] },
    ...itens.map((item, index) => ({
      colunas: [
        String(index + 1),
        item.descricao ? `${item.produto} — ${item.descricao}` : item.produto,
        item.unidade || '[PENDENTE: unidade]',
        item.quantidade,
        item.valorUnitario,
        item.valorTotal,
      ],
    })),
  ];
}

export function preencherMinuta(conteudo: string, valores: Record<string, string | null | undefined>): { texto: string; pendentes: string[] } {
  const aviso = '<p>MINUTA para conferência. Este arquivo não constitui assinatura eletrônica, certificação ICP-Brasil ou instrumento formalizado.</p>';
  const aplicado = aplicarPlaceholders(`${aviso}${conteudo}`, valores);
  return aplicado;
}

export function conteudoAditivo(dados: {
  numero: number;
  contratoNumero: string;
  exercicio: number;
  tipo: string;
  justificativa: string;
  valorAlteracao: string;
  vigenciaFim?: string | null;
}): string {
  return [
    `<h1>Registro de aditivo nº ${dados.numero}</h1>`,
    `<p>Contrato ${dados.contratoNumero}, exercício ${dados.exercicio}.</p>`,
    `<p>Tipo registrado: ${dados.tipo}.</p>`,
    `<p>Justificativa registrada: ${dados.justificativa}</p>`,
    `<p>Valor da alteração registrado: ${dados.valorAlteracao}.</p>`,
    dados.vigenciaFim ? `<p>Vigência alterada para: ${dados.vigenciaFim}.</p>` : '',
    '<p>Este registro reproduz os dados lançados no sistema e não cria cláusula jurídica nova. A formalização depende do instrumento externo. Não há assinatura eletrônica.</p>',
    '<p>{{assinaturas}}</p>',
  ].join('');
}
