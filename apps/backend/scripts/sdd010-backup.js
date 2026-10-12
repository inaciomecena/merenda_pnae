const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRawUnsafe(
      'SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema=DATABASE() ORDER BY TABLE_NAME',
    );
    const backup = { database: 'merenda_pnae', createdAt: new Date().toISOString(), tables: {} };
    for (const table of tables) {
      const name = table.TABLE_NAME;
      backup.tables[name] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${name.replace(/`/g, '``')}\``);
    }
    const output = path.resolve(__dirname, '../../../output/backups/merenda_pnae-sdd010-before-migration-20261012150000.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(backup, (_, value) => typeof value === 'bigint' ? value.toString() : value));
    console.log(output);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
