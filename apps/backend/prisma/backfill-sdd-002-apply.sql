-- Somente banco isolado e depois de revisão nominal do relatório preview.
-- Ajustar identificador do responsável antes de executar. Não concede ADMIN, DRE,
-- PRODUTOR ou representação automaticamente.
SELECT DATABASE() AS banco, @@hostname AS host, @@port AS porta;
START TRANSACTION;
INSERT INTO vinculos_usuario (id, userId, funcao, escolaId, vigenciaInicio, ativo, createdAt, updatedAt, createdBy)
SELECT UUID(), u.id, 'ESCOLA', e.id, NOW(3), 1, NOW(3), NOW(3), 'SDD-002-BACKFILL-REVISADO'
FROM users u JOIN escolas e ON e.id = u.escolaId AND e.deletedAt IS NULL AND e.active = 1
WHERE u.role = 'ESCOLA' AND u.active = 1 AND u.deletedAt IS NULL
  AND NOT EXISTS (SELECT 1 FROM vinculos_usuario v WHERE v.userId = u.id AND v.funcao = 'ESCOLA' AND v.ativo = 1);
SELECT ROW_COUNT() AS vinculos_escola_inseridos;
-- Bootstrap administrativo exige decisão expressa. Substitua NULL pelo ID do
-- administrador autorizado na cópia isolada; sem isso, não há concessão.
SET @admin_autorizado_id = NULL;
INSERT INTO vinculos_usuario (id, userId, funcao, vigenciaInicio, ativo, createdAt, updatedAt, createdBy)
SELECT UUID(), u.id, 'ADMIN', NOW(3), 1, NOW(3), NOW(3), 'SDD-002-AUTORIZACAO-EXPLICITA'
FROM users u
WHERE u.id = @admin_autorizado_id AND u.role = 'ADMIN' AND u.active = 1 AND u.deletedAt IS NULL
  AND NOT EXISTS (SELECT 1 FROM vinculos_usuario v WHERE v.userId = u.id AND v.funcao = 'ADMIN' AND v.ativo = 1);
SELECT ROW_COUNT() AS administradores_explicitamente_autorizados;
-- Revisar contagens e IDs antes do COMMIT; ROLLBACK em caso de divergência.
SELECT u.id, v.id AS vinculoId, v.escolaId FROM users u
JOIN vinculos_usuario v ON v.userId = u.id AND v.funcao = 'ESCOLA' AND v.ativo = 1
WHERE u.role = 'ESCOLA' AND u.deletedAt IS NULL;
ROLLBACK;
-- Substituir ROLLBACK por COMMIT somente na cópia isolada após conferência.
