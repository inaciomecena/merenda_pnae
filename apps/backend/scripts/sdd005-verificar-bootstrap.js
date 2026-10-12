// SDD-005 — verificação pós-bootstrap (somente leitura): vínculo ADMIN + auditoria
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const vins = await prisma.vinculoUsuario.findMany({
    select: { id: true, userId: true, funcao: true, ativo: true, vigenciaInicio: true, vigenciaFim: true, dreId: true, escolaId: true, municipioId: true, produtorId: true },
  });
  console.log('== VÍNCULOS APÓS BOOTSTRAP ==');
  for (const v of vins) console.log(JSON.stringify(v));

  const aud = await prisma.auditLog.findMany({
    where: { action: 'BOOTSTRAP_ADMIN_VINCULO' },
    select: { id: true, action: true, entity: true, entityId: true, entityLabel: true, userName: true, userRole: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('\n== AUDITORIA BOOTSTRAP_ADMIN_VINCULO ==');
  console.log(`Total: ${aud.length}`);
  for (const a of aud) console.log(`${a.createdAt.toISOString()} | ${a.action} | ${a.entity}#${a.entityId} | ${a.entityLabel} | por=${a.userName} (${a.userRole})`);

  const ok = vins.length === 1 && vins[0].funcao === 'ADMIN' && vins[0].ativo === true && aud.length >= 1;
  console.log(`\nRESULTADO: ${ok ? 'BOOTSTRAP VALIDADO' : 'DIVERGÊNCIA'}`);
  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
})().catch(async (e) => { console.error('ERRO:', e.message.slice(0, 300)); await prisma.$disconnect(); process.exit(1); });
