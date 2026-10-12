/**
 * Módulo de importação histórica PNAE MT 2025.
 *
 * Biblioteca PURA (sem NestJS DI, sem Prisma, sem endpoints) usada por
 * scripts de staging/dry-run e por testes unitários. A gravação definitiva
 * (etapa futura, autorizada separadamente) reutiliza os services existentes
 * de `importador-editais` e `chamadas-publicas`.
 */

export * from './dominio/tipos';
export * from './dominio/decimal-monetario';
export * from './dominio/classificacao-pacote';
export * from './dominio/chaves-logicas';
export * from './aplicacao/leitor-pacote';
// './aplicacao/apoio-extracao' é só um alias de './dominio/decimal-monetario'
// (evita conflito de nomes no re-export central).
export { lerPossivel } from './aplicacao/apoio-extracao';
export * from './aplicacao/extrator-documento';
export * from './aplicacao/resolucao-institucional';
export * from './aplicacao/gerador-staging';
export * from './aplicacao/simulador-importacao';
