const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');

const OFFICIAL = /(^|\/)merenda_pnae(?:\?|$)/i;

function assertIsolatedDatabase(url) {
  if (!url || OFFICIAL.test(url)) throw new Error('E2E recusado: DATABASE_URL aponta para o banco oficial');
  const database = new URL(url).pathname.replace(/^\//, '');
  if (!database.startsWith('merenda_pnae_e2e_sdd011_') && !database.startsWith('merenda_pnae_sdd011_')) throw new Error('E2E recusado: nome do banco não é explicitamente isolado');
  return database;
}

function adminClient() { return new PrismaClient({ datasources: { db: { url: 'mysql://root:@localhost:3306/mysql?charset=utf8mb4' } } }); }
function client(url) { assertIsolatedDatabase(url); return new PrismaClient({ datasources: { db: { url } } }); }
function fixtureId(prefix) { return `${prefix}-${randomUUID()}`; }

module.exports = { OFFICIAL, assertIsolatedDatabase, adminClient, client, fixtureId };
