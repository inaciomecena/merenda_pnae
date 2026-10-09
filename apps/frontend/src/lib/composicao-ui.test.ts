import assert from 'node:assert/strict';
import test from 'node:test';
import { moverAnexo, ordenarAnexos, podeEditarComposicao, rotuloStatus } from './composicao-ui.ts';

test('documento publicado ou cancelado não é editável', () => {
  assert.equal(podeEditarComposicao('PUBLICADO'), false);
  assert.equal(podeEditarComposicao('CANCELADO'), false);
  assert.equal(podeEditarComposicao('RASCUNHO'), true);
  assert.equal(podeEditarComposicao('GERADO'), true);
});

test('rótulos da conferência e da composição', () => {
  assert.equal(rotuloStatus('EM_CONFERENCIA'), 'Em conferência');
  assert.equal(rotuloStatus('pendente_revisao'), 'Pendente de revisão');
  assert.equal(rotuloStatus(null), 'Sem composição');
});

test('anexos sobem e descem mantendo a ordem sequencial', () => {
  const anexos = ordenarAnexos([{ id: 'a', ordem: 2 }, { id: 'b', ordem: 0 }]);
  assert.deepEqual(anexos.map((item) => item.id), ['b', 'a']);
  const movido = moverAnexo(anexos, 1, -1);
  assert.deepEqual(movido.map((item) => item.id), ['a', 'b']);
  assert.deepEqual(movido.map((item) => item.ordem), [0, 1]);
});
