import { extrairPlaceholders, validarPlaceholders, VARIAVEIS_DISPONIVEIS } from './placeholders';

export interface ItemValidacao {
  produto: string;
  quantidade?: number | string | null;
  unidade?: string | null;
}

export interface AnexoValidacao {
  tipo: string;
  titulo: string;
  incluido: boolean;
  templateId?: string | null;
  conteudo?: string | null;
  vigenciaFim?: Date | string | null;
}

export interface EntradaValidacaoGeracao {
  statusComposicao: string;
  numero?: string | null;
  ano?: number | null;
  titulo?: string | null;
  objeto?: string | null;
  municipioNome?: string | null;
  dataPublicacao?: Date | string | null;
  dataSessao?: Date | string | null;
  valores: Record<string, string | null | undefined>;
  variaveisPendentes: string[];
  anexos: AnexoValidacao[];
  itens: ItemValidacao[];
  conteudos: string[];
}

export interface ResultadoValidacao {
  ok: boolean;
  erros: string[];
}

function dataInvalida(valor?: Date | string | null): boolean {
  if (valor == null || valor === '') return false;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime());
}

export function validarGeracao(entrada: EntradaValidacaoGeracao): ResultadoValidacao {
  const erros: string[] = [];

  if (entrada.statusComposicao === 'CANCELADO') erros.push('Edital cancelado não pode ser gerado.');
  if (entrada.statusComposicao === 'PUBLICADO') erros.push('Documento publicado não pode ser regerado. Crie uma nova versão.');
  if (!entrada.numero?.trim()) erros.push('Número do edital é obrigatório.');
  if (!entrada.ano || entrada.ano < 2000 || entrada.ano > 2100) erros.push('Ano do edital é inválido.');
  if (!entrada.titulo?.trim()) erros.push('Título do edital é obrigatório.');
  if (!entrada.objeto?.trim()) erros.push('Objeto do edital é obrigatório.');
  if (!entrada.municipioNome?.trim() && !entrada.valores['edital.municipio.nome']) erros.push('Município é obrigatório.');

  if (dataInvalida(entrada.dataPublicacao)) erros.push('Data de publicação inválida.');
  if (dataInvalida(entrada.dataSessao)) erros.push('Data de recebimento/sessão inválida.');
  if (entrada.dataPublicacao && entrada.dataSessao && !dataInvalida(entrada.dataPublicacao) && !dataInvalida(entrada.dataSessao)) {
    const publicacao = new Date(entrada.dataPublicacao);
    const sessao = new Date(entrada.dataSessao);
    if (sessao.getTime() < publicacao.getTime()) erros.push('A data da sessão não pode ser anterior à data de publicação.');
  }

  const incluidos = entrada.anexos.filter((anexo) => anexo.incluido);
  if (!incluidos.some((anexo) => anexo.tipo === 'EDITAL_PRINCIPAL')) erros.push('O edital principal precisa estar selecionado.');
  for (const anexo of incluidos) {
    if (!anexo.templateId && !anexo.conteudo?.trim()) erros.push(`Anexo sem template: ${anexo.titulo}.`);
    if (anexo.vigenciaFim && new Date(anexo.vigenciaFim).getTime() < Date.now()) {
      erros.push(`Template vencido vinculado a ${anexo.titulo}. Escolha uma versão vigente.`);
    }
  }

  const textos = entrada.conteudos.filter(Boolean).join('\n');
  const placeholders = validarPlaceholders(textos);
  if (placeholders.invalidos.length) erros.push(`Placeholders inválidos: ${placeholders.invalidos.join(', ')}.`);

  const obrigatorias = new Set(extrairPlaceholders(textos).filter((chave) => VARIAVEIS_DISPONIVEIS.find((item) => item.chave === chave && item.obrigatorio && !['itens', 'escolas', 'fornecedores', 'assinaturas'].includes(chave))));
  obrigatorias.add('edital.numero');
  obrigatorias.add('edital.ano');
  obrigatorias.add('edital.titulo');
  obrigatorias.add('edital.objeto');
  for (const chave of obrigatorias) {
    const valor = entrada.valores[chave];
    if (valor == null || String(valor).trim() === '') erros.push(`Variável obrigatória não preenchida: {{${chave}}}.`);
  }

  if (entrada.variaveisPendentes.length) {
    erros.push(`Campos pendentes de revisão: ${entrada.variaveisPendentes.join(', ')}.`);
  }

  if (!entrada.itens.length) erros.push('O edital não possui itens para a tabela de produtos.');
  entrada.itens.forEach((item, index) => {
    const quantidade = item.quantidade == null || item.quantidade === '' ? null : Number(item.quantidade);
    if (quantidade == null || Number.isNaN(quantidade) || quantidade <= 0) erros.push(`Item ${index + 1} (${item.produto}) sem quantidade.`);
    if (!item.unidade?.trim()) erros.push(`Item ${index + 1} (${item.produto}) sem unidade.`);
  });

  const modelos = incluidos.map((anexo) => anexo.templateId || `${anexo.tipo}:${anexo.titulo.trim()}`);
  if (new Set(modelos).size !== modelos.length) erros.push('Há modelos repetidos na composição. Remova a cópia do mesmo modelo.');
  if (incluidos.filter((anexo) => anexo.tipo === 'EDITAL_PRINCIPAL').length > 1) erros.push('Selecione somente um edital principal.');

  return { ok: erros.length === 0, erros };
}
