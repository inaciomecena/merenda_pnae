import { Prisma } from '@prisma/client';

export interface PendenciaProgramacao {
  codigo: string;
  mensagem: string;
  bloqueiaConfirmacao: boolean;
}

export interface DadosValidacaoProgramacao {
  contratoId: string;
  fornecedorId: string;
  unidadeEscolarId: string;
  dreId: string;
  dataPrevista: string;
  itens: Array<{
    contratoItemId: string;
    quantidadeProgramada: string;
  }>;
  contratoStatus: string;
  itensValidos: number;
  saldosSuficientes: boolean;
  bloqueiosSaldos: string[];
}

export function validarProgramacao(dados: DadosValidacaoProgramacao): PendenciaProgramacao[] {
  const pendencias: PendenciaProgramacao[] = [];
  const add = (codigo: string, mensagem: string, bloqueia = true) => {
    pendencias.push({ codigo, mensagem, bloqueiaConfirmacao: bloqueia });
  };

  if (dados.contratoStatus !== 'VIGENTE') {
    add('CONTRATO_STATUS', `Contrato deve estar VIGENTE para programar entregas. Status atual: ${dados.contratoStatus}.`);
  }
  if (!dados.dataPrevista) {
    add('DATA_PREVISTA', 'Data prevista é obrigatória.');
  }
  if (dados.itensValidos === 0) {
    add('ITENS', 'Nenhum item válido selecionado para programação.');
  }
  if (!dados.saldosSuficientes) {
    for (const bloqueio of dados.bloqueiosSaldos) {
      add('SALDO_INSUFICIENTE', bloqueio);
    }
  }
  for (const item of dados.itens) {
    if (!item.contratoItemId) {
      add('ITEM_CONTRATO', 'Item não vinculado a item de contrato válido.');
    }
    if (!item.quantidadeProgramada || Number(item.quantidadeProgramada) <= 0) {
      add('QUANTIDADE', `Quantidade deve ser maior que zero para item ${item.contratoItemId}.`);
    }
  }

  return pendencias;
}

export function bloqueiaConfirmacao(pendencias: PendenciaProgramacao[]): string[] {
  return pendencias.filter((p) => p.bloqueiaConfirmacao).map((p) => p.mensagem);
}

export interface PendenciaEntrega {
  codigo: string;
  mensagem: string;
  bloqueiaConferencia: boolean;
  bloqueiaAceite: boolean;
}

export interface DadosValidacaoEntrega {
  programacaoId: string;
  programacaoStatus: string;
  dataEntrega: string;
  itens: Array<{
    programacaoItemId: string;
    quantidadeInformada: string;
    quantidadeAceita: string;
    quantidadeRejeitada: string;
  }>;
  itensValidos: number;
  somaAceitaIgualInformada: boolean;
  naoExcedeProgramado: boolean;
  bloqueios: string[];
}

export function validarEntrega(dados: DadosValidacaoEntrega): PendenciaEntrega[] {
  const pendencias: PendenciaEntrega[] = [];
  const add = (codigo: string, mensagem: string, conferencia = true, aceite = true) => {
    pendencias.push({ codigo, mensagem, bloqueiaConferencia: conferencia, bloqueiaAceite: aceite });
  };

  if (!['CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'].includes(dados.programacaoStatus)) {
    add('PROGRAMACAO_STATUS', `Programação deve estar CONFIRMADA, EM_ENTREGA ou PARCIALMENTE_RECEBIDA. Status: ${dados.programacaoStatus}.`, false, true);
  }
  if (!dados.dataEntrega) {
    add('DATA_ENTREGA', 'Data da entrega é obrigatória.', true, true);
  }
  if (dados.itensValidos === 0) {
    add('ITENS', 'Nenhum item informado na entrega.', true, true);
  }
  if (!dados.somaAceitaIgualInformada) {
    add('SOMA_QUANTIDADES', 'A soma de aceita + rejeitada deve ser igual à quantidade informada para cada item.', true, true);
  }
  if (!dados.naoExcedeProgramado) {
    add('EXCEDE_PROGRAMADO', 'Quantidade aceita não pode exceder a quantidade programada pendente.', false, true);
  }
  for (const bloqueio of dados.bloqueios) {
    add('BLOQUEIO', bloqueio, true, true);
  }

  return pendencias;
}

export function bloqueiaConferencia(pendencias: PendenciaEntrega[]): string[] {
  return pendencias.filter((p) => p.bloqueiaConferencia).map((p) => p.mensagem);
}

export function bloqueiaAceite(pendencias: PendenciaEntrega[]): string[] {
  return pendencias.filter((p) => p.bloqueiaAceite).map((p) => p.mensagem);
}