// Uso pontual: recria o banco isolado do E2E SDD-005 (não toca no banco ativo).
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({
  datasources: { db: { url: 'mysql://root:@localhost:3306/mysql?charset=utf8mb4' } },
});

p.$executeRawUnsafe('DROP DATABASE IF EXISTS merenda_pnae_sdd005')
  .then(() =>
    p.$executeRawUnsafe(
      'CREATE DATABASE merenda_pnae_sdd005 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    ),
  )
  .then(() => p.$queryRawUnsafe('SHOW DATABASES LIKE "merenda_pnae_sdd005"'))
  .then((rows) => {
    console.log('RECREATE OK', JSON.stringify(rows));
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERRO', e.message);
    process.exit(1);
  });
