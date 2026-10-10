-- EXECUTAR SOMENTE em banco MySQL isolado, após conferir SELECT DATABASE(), @@hostname e @@port.
-- Relatório sem alterações. Nenhuma DRE ou representação é inferida dos dados legados.
SELECT DATABASE() AS banco, @@hostname AS host, @@port AS porta;
SELECT role, COUNT(*) AS usuarios_ativos FROM users WHERE active = 1 AND deletedAt IS NULL GROUP BY role;
SELECT u.id, u.role, u.escolaId, u.municipioId,
       CASE
         WHEN u.role = 'ESCOLA' AND e.id IS NOT NULL THEN 'ESCOLA_CONFIRMAVEL'
         WHEN u.role = 'EXTENSIONISTA' AND m.id IS NOT NULL THEN 'MUNICIPIO_LEGADO_REVISAR'
         ELSE 'PENDENTE_REVISAO_MANUAL'
       END AS classificacao
FROM users u
LEFT JOIN escolas e ON e.id = u.escolaId AND e.deletedAt IS NULL
LEFT JOIN municipios m ON m.id = u.municipioId AND m.deletedAt IS NULL
WHERE u.active = 1 AND u.deletedAt IS NULL
  AND NOT EXISTS (SELECT 1 FROM vinculos_usuario v WHERE v.userId = u.id AND v.ativo = 1)
ORDER BY u.role, u.id;
