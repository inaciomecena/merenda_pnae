const { PrismaClient } = require('@prisma/client');
const name = process.env.E2E_DB_NAME || 'merenda_pnae_sdd008';
const p = new PrismaClient({ datasources: { db: { url: 'mysql://root:@localhost:3306/mysql?charset=utf8mb4' } } });
(async () => {
  await p.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${name}\``);
  await p.$executeRawUnsafe(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(JSON.stringify({ database: name, created: true }));
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => p.$disconnect());
