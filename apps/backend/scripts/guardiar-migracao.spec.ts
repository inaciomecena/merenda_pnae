/**
 * TESTE DE REGRESSÃO DA GUARDA DE MIGRAÇÃO (scripts/guardiar-migracao.js).
 *
 * Especificação (SDD §8) — fail-closed:
 *  (a) exit 0 (PERMITIDO) para `seaf_pnae` e para o schema isolado de homologação;
 *  (b) exit 1 (BLOQUEADO) para: banco ativo `merenda_pnae`, URL sem schema, URL lixo,
 *      protocolo postgres, porta morta, allowlist miss e lista de proibidos;
 *  (c) a saída nunca contém `mysql://` nem a senha da URL.
 *
 * SEGURANÇA: este teste é SOMENTE LEITURA. A guarda roda apenas
 * `SELECT DATABASE(), @@hostname, @@port, CURRENT_USER(), VERSION()`; o spec
 * somente spawna o script com DATABASE_URL por variável de ambiente (nunca grava
 * no .env) e verifica exit code + JSON de saída.
 */
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

jest.setTimeout(60000);

const BACKEND = path.resolve(__dirname, '..');
const GUARDA = path.join(BACKEND, 'scripts', 'guardiar-migracao.js');

const SEAF = 'mysql://root:@127.0.0.1:3306/seaf_pnae?charset=utf8mb4';
const ISOLADO = 'mysql://root:@127.0.0.1:3306/merenda_pnae_homolog_2025_unicidade?charset=utf8mb4';
const ATIVO = 'mysql://root:@127.0.0.1:3306/merenda_pnae?charset=utf8mb4';
const PORTA_MORTA = 'mysql://root:@127.0.0.1:33999/seaf_pnae?charset=utf8mb4';
const SEM_SCHEMA = 'mysql://root:@127.0.0.1:3306/?charset=utf8mb4';
const SENHA_BOGUS = 'SENHA_SECRETA_XY9';

interface ResultadoGuarda {
  status: number | null;
  stdout: string;
  stderr: string;
  texto: string;
  decisao: string | undefined;
  etapa: string | undefined;
  motivo: string | undefined;
  json: any;
}

/** Spawn da guarda com DATABASE_URL/variáveis passadas POR VARIÁVEL (nunca no .env). */
function rodarGuarda(url: string | null, variaveis: Record<string, string> = {}): ResultadoGuarda {
  const env: NodeJS.ProcessEnv = { ...process.env };
  // Garante que o teste controle 100% das listas da guarda, sem herança do ambiente.
  delete env.MIGRACAO_SCHEMAS_PROIBIDOS;
  delete env.MIGRACAO_SCHEMAS_PERMITIDOS;
  delete env.MIGRACAO_HOSTS_EQUIVALENTES;
  if (url === null) delete env.DATABASE_URL;
  else env.DATABASE_URL = url;
  Object.assign(env, variaveis);

  const exec = spawnSync(process.execPath, [GUARDA], {
    cwd: BACKEND,
    env,
    encoding: 'utf8',
    windowsHide: true,
  });

  const stdout = exec.stdout || '';
  const stderr = exec.stderr || '';
  const texto = `${stdout}\n${stderr}`;

  // BLOQUEADO é impresso em stderr como JSON (pretty) + linha "MIGRACAO BLOQUEADA (...)".
  const fonte = exec.status === 0 ? stdout : stderr.split('MIGRACAO BLOQUEADA')[0];
  let json: any;
  try {
    json = JSON.parse(fonte.trim());
  } catch {
    json = undefined;
  }

  return {
    status: exec.status,
    stdout,
    stderr,
    texto,
    decisao: json?.decisao,
    etapa: json?.etapa,
    motivo: json?.motivo,
    json,
  };
}

describe('guarda de migração (guardiar-migracao.js) — spawn somente-leitura', () => {
  describe('(a) PERMITIDO (exit 0)', () => {
    it('libera seaf_pnae mesmo com query string na URL', () => {
      const r = rodarGuarda(SEAF);
      expect(r.status).toBe(0);
      expect(r.decisao).toBe('PERMITIDO');
      expect(r.json.schema).toBe('seaf_pnae');
      expect(r.json.identidadeEfetiva.database).toBe('seaf_pnae');
      expect(r.json.identidadeEfetiva.porta).toBe(3306);
    });

    it('libera o schema isolado de homologação e reporta a identidade efetiva', () => {
      const r = rodarGuarda(ISOLADO);
      expect(r.status).toBe(0);
      expect(r.decisao).toBe('PERMITIDO');
      expect(r.json.identidadeEfetiva.database).toBe('merenda_pnae_homolog_2025_unicidade');
      expect(String(r.json.identidadeEfetiva.hostname || '').length).toBeGreaterThan(0);
      expect(String(r.json.identidadeEfetiva.versao || '').length).toBeGreaterThan(0);
    });

    it('libera quando MIGRACAO_SCHEMAS_PERMITIDOS contém o schema alvo', () => {
      const r = rodarGuarda(SEAF, { MIGRACAO_SCHEMAS_PERMITIDOS: 'merenda_pnae_homolog_2025_unicidade, seaf_pnae' });
      expect(r.status).toBe(0);
      expect(r.decisao).toBe('PERMITIDO');
    });
  });

  describe('(b) BLOQUEADO (exit 1)', () => {
    const casos: Array<{ nome: string; url: string; variaveis?: Record<string, string>; etapa: string }> = [
      { nome: 'banco ativo merenda_pnae', url: ATIVO, etapa: 'politica' },
      { nome: 'MIGRACAO_SCHEMAS_PROIBIDOS contendo o schema alvo', url: SEAF, variaveis: { MIGRACAO_SCHEMAS_PROIBIDOS: 'seaf_pnae' }, etapa: 'politica' },
      { nome: 'MIGRACAO_SCHEMAS_PERMITIDOS sem o schema alvo (allowlist miss)', url: SEAF, variaveis: { MIGRACAO_SCHEMAS_PERMITIDOS: 'merenda_pnae_homolog_2025_unicidade' }, etapa: 'politica' },
      { nome: 'URL sem schema (pathname vazio)', url: SEM_SCHEMA, etapa: 'url' },
      { nome: 'URL lixo (not-a-url)', url: 'not-a-url', etapa: 'url' },
      { nome: 'protocolo postgres://', url: 'postgres://root:@127.0.0.1:5432/seaf_pnae', etapa: 'url' },
      { nome: 'porta morta 33999 (falha de conexão)', url: PORTA_MORTA, etapa: 'conexao' },
    ];

    it.each(casos)('bloqueia $nome', ({ url, variaveis, etapa }) => {
      const r = rodarGuarda(url, variaveis || {});
      expect(r.status).toBe(1);
      expect(r.decisao).toBe('BLOQUEADO');
      expect(r.etapa).toBe(etapa);
      expect(typeof r.motivo).toBe('string');
      expect((r.motivo || '').length).toBeGreaterThan(0);
    });

    it('bloqueia o banco ativo ANTES de conectar (etapa=politica, sem tentativa de DDL)', () => {
      const r = rodarGuarda(ATIVO);
      expect(r.status).toBe(1);
      // Prova de que a recusa é pré-conexão: a etapa é política, não conexão/identidade.
      expect(r.etapa).toBe('politica');
      expect(r.texto).not.toContain('identidadeEfetiva');
    });
  });

  describe('(c) credenciais nunca aparecem na saída', () => {
    it('nenhuma saída contém "mysql://" nem a senha da URL (permitido e bloqueado)', () => {
      const comSenhaBogusPermitido = 'mysql://root:' + SENHA_BOGUS + '@127.0.0.1:3306/seaf_pnae?charset=utf8mb4';
      const comSenhaBogusBloqueado = 'mysql://root:' + SENHA_BOGUS + '@127.0.0.1:3306/merenda_pnae?charset=utf8mb4';

      const permitido = rodarGuarda(comSenhaBogusPermitido);
      const bloqueado = rodarGuarda(comSenhaBogusBloqueado);
      const portaMorta = rodarGuarda(PORTA_MORTA);

      for (const r of [permitido, bloqueado, portaMorta]) {
        expect(r.texto).not.toContain('mysql://');
        expect(r.texto).not.toContain(SENHA_BOGUS);
      }
      // Com senha inválida a conexão falha e mesmo assim nada vaza (fail-closed + silêncio).
      expect(permitido.status).toBe(1);
      expect(permitido.etapa).toBe('conexao');
      expect(bloqueado.status).toBe(1);
    });
  });
});
