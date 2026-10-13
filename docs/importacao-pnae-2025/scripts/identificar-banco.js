/**
 * IDENTIFICAÇÃO DO BANCO CONECTADO — SOMENTE LEITURA.
 *
 * REGRA: apenas SELECT/SHOW (DATABASE(), VERSION(), SHOW DATABASES).
 * Nenhum create/update/delete/executeRaw de escrita. Não aplica migrations.
 *
 * Objetivo: confirmar QUAL banco/host/porta o DATABASE_URL aponta, antes de
 * qualquer escrita em ambiente isolado. Não imprime credenciais.
 *
 * Uso: node docs/importacao-pnae-2025/scripts/identificar-banco.js
 *      (ou HOMOLOG_DATABASE_URL="mysql://..." node ... para checar outra URL)
 */
const { PrismaClient } = require('@prisma/client');

function mascararUrl(url) {
  if (!url) return '(DATABASE_URL não definida)';
  try {
    const u = new URL(url);
    const usuario = u.username || '(sem usuário)';
    const senha = u.password ? '****' : '(sem senha)';
    return `${u.protocol}//${usuario}:${senha}@${u.hostname}:${u.port || '3306'}${u.pathname}`;
  } catch {
    return '(URL não parseável)';
  }
}

const urlEfetiva = process.env.HOMOLOG_DATABASE_URL || process.env.DATABASE_URL;

const prisma = process.env.HOMOLOG_DATABASE_URL
  ? new PrismaClient({ datasources: { db: { url: process.env.HOMOLOG_DATABASE_URL } } })
  : new PrismaClient();

(async () => {
  const saida = { urlInformada: mascararUrl(urlEfetiva) };
  try {
    const info = await prisma.$queryRawUnsafe(
      'SELECT DATABASE() AS db, CURRENT_USER() AS usuario, VERSION() AS versao, @@hostname AS host, @@port AS porta',
    );
    const linha = Array.isArray(info) ? info[0] : info;
    saida.databaseConectado = linha.db ?? null;
    saida.usuarioConectado = linha.usuario ?? null;
    saida.versao = linha.versao ?? null;
    saida.host = linha.host ? String(linha.host) : null;
    saida.porta = linha.porta ? Number(linha.porta) : null;

    const dbs = await prisma.$queryRawUnsafe('SHOW DATABASES');
    saida.basesVisiveis = dbs.map((r) => String(Object.values(r)[0])).sort();

    // Regra de segurança: um banco de homologação precisa ser inequívoco.
    const nome = (saida.databaseConectado || '').toLowerCase();
    const ativo = nome === 'merenda_pnae';
    const homolog = /homolog/.test(nome);
    saida.classificacao = ativo ? 'BANCO_ATIVO' : homolog ? 'BANCO_ISOLADO' : 'INDETERMINADO';
    saida.permiteEscrita = homolog && !ativo;
  } catch (e) {
    saida.erro = e.message.split('\n')[0];
    saida.classificacao = 'INDETERMINADO';
    saida.permiteEscrita = false;
  } finally {
    await prisma.$disconnect();
  }
  console.log(JSON.stringify(saida, null, 2));
  process.exit(0);
})();
