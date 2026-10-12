import assert from 'node:assert/strict';
import test from 'node:test';
import { configKeyLabel, humanizeSystemValue } from './display-text.ts';

test('normaliza códigos técnicos para português legível', () => {
  assert.equal(humanizeSystemValue('PENDENTE_CONFERENCIA'), 'Pendente de conferência');
  assert.equal(humanizeSystemValue('COMPROVANTE_ENTREGA'), 'Comprovante de entrega');
  assert.equal(humanizeSystemValue('orgao.secretaria'), 'Órgão secretaria');
});

test('apresenta chaves de configuração sem nomes técnicos', () => {
  assert.equal(configKeyLabel('sistema.versao'), 'Versão do sistema');
  assert.equal(configKeyLabel('upload.tamanho_maximo_mb'), 'Tamanho máximo do arquivo (MB)');
});
