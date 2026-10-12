import assert from 'node:assert/strict';
import test from 'node:test';
import { getScreenByPath, screenDefinitions } from '../config/screens.config.ts';

const applicationPaths = [
  '/login', '/dashboard', '/mapa', '/relatorios', '/municipios', '/escolas', '/escolas/abc',
  '/editais', '/editais/abc', '/editais/abc/consulta', '/templates-anexos', '/produtos-referencia',
  '/produtores', '/balizamento', '/propostas', '/importacoes', '/importacoes/importar',
  '/importacoes/abc', '/importacoes/abc/conferencia', '/importacoes/abc/estrutura', '/organizacao',
  '/vinculos', '/usuarios', '/auditoria', '/configuracoes', '/homologacao', '/contratos',
  '/contratos/novo', '/contratos/abc', '/contratos/abc/editar', '/contratos/abc/auditoria',
  '/entregas', '/notas-fiscais', '/notas-fiscais/nova', '/notas-fiscais/abc',
  '/conferencia-fiscal', '/atestos', '/liquidacoes', '/pagamentos', '/financeiro',
];

test('cada rota da aplicação possui código de tela', () => {
  for (const path of applicationPaths) {
    assert.notEqual(getScreenByPath(path).code, 'PNAE-TEL-000', path);
  }
});

test('os códigos de tela são únicos', () => {
  const codes = screenDefinitions.map(screen => screen.code);
  assert.equal(new Set(codes).size, codes.length);
});
