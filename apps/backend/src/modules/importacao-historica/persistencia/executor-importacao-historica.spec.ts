import { decidirEscritaImportacao } from './executor-importacao-historica';

describe('proteção do destino da importação histórica', () => {
  const url = 'mysql://root:@localhost:3306/merenda_pnae?charset=utf8mb4';
  const confirmacao = 'merenda_pnae@HP:3306';

  it('permite somente o destino local cuja identidade efetiva foi confirmada', () => {
    expect(decidirEscritaImportacao('merenda_pnae', 'HP', 3306, url, confirmacao).permitido).toBe(true);
  });

  it.each([
    ['schema diferente', 'seaf_pnae', 'HP', 3306, url, confirmacao],
    ['sem confirmação explícita', 'merenda_pnae', 'HP', 3306, url, undefined],
    ['porta diferente', 'merenda_pnae', 'HP', 3307, url, 'merenda_pnae@HP:3307'],
    ['URL de outro schema', 'merenda_pnae', 'HP', 3306, url.replace('merenda_pnae', 'seaf_pnae'), confirmacao],
    ['host remoto', 'merenda_pnae', 'HP', 3306, url.replace('localhost', 'db.example.test'), confirmacao],
    ['identidade vazia', null, 'HP', 3306, url, confirmacao],
  ])('recusa %s', (_caso, db, host, porta, databaseUrl, confirmacaoDestino) => {
    expect(decidirEscritaImportacao(db, host, porta, databaseUrl, confirmacaoDestino).permitido).toBe(false);
  });
});
