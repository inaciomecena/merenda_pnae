import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chaveAcessoValida,
  podeConfirmarNota,
  podeCorrigirNota,
  podeVincularRecebimento,
  somaItensManuais,
  valorTotalItemManual,
  valorTotalNotaManual,
} from './fiscal-manual-ui.ts';

test('vínculo de recebimento bloqueado após atesto, rejeição e cancelamento', () => {
  assert.equal(podeVincularRecebimento(true, 'PROCESSADA'), true);
  assert.equal(podeVincularRecebimento(true, 'PENDENTE_CONFERENCIA'), true);
  assert.equal(podeVincularRecebimento(true, 'AGUARDANDO_ATESTO'), true);
  assert.equal(podeVincularRecebimento(true, 'ATESTADA'), false);
  assert.equal(podeVincularRecebimento(true, 'REJEITADA'), false);
  assert.equal(podeVincularRecebimento(true, 'CANCELADA'), false);
  assert.equal(podeVincularRecebimento(false, 'PROCESSADA'), false);
});

test('correção de dados bloqueada após atesto/cancelamento', () => {
  assert.equal(podeCorrigirNota(true, 'PENDENTE_PROCESSAMENTO'), true);
  assert.equal(podeCorrigirNota(true, 'PROCESSADA'), true);
  assert.equal(podeCorrigirNota(true, 'ATESTADA'), false);
  assert.equal(podeCorrigirNota(true, 'CANCELADA'), false);
  assert.equal(podeCorrigirNota(false, 'PROCESSADA'), false);
});

test('confirmação dos dados apenas em PENDENTE_PROCESSAMENTO', () => {
  assert.equal(podeConfirmarNota(true, 'PENDENTE_PROCESSAMENTO'), true);
  assert.equal(podeConfirmarNota(true, 'PROCESSADA'), false);
  assert.equal(podeConfirmarNota(false, 'PENDENTE_PROCESSAMENTO'), false);
});

test('chave de acesso opcional: vazia ou 44 dígitos', () => {
  const chaveOk = '35261111222333444455555555555555555111111111'; // 44 dígitos
  assert.equal(chaveAcessoValida(''), true);
  assert.equal(chaveAcessoValida(chaveOk), true);
  assert.equal(chaveAcessoValida('123'), false);
  assert.equal(chaveAcessoValida(`${chaveOk.slice(0, 43)}X`), false);
});

test('valores da nota manual são calculados pelos itens', () => {
  assert.equal(valorTotalItemManual('10', '9.00'), '90.00');
  assert.equal(valorTotalItemManual('', '9.00'), '0.00');
  assert.equal(somaItensManuais([{ quantidade: '10', valorUnitario: '9.00' }, { quantidade: '2', valorUnitario: '5.00' }]), '100.00');
  assert.equal(valorTotalNotaManual('100.00', '0.00', '100.00', '0.00'), '200.00');
  assert.equal(valorTotalNotaManual('100.00', '10.00', '0.00', '0.00'), '90.00');
});
