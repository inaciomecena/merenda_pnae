
INSERT INTO users (id, name, email, passwordHash, role, active, createdAt, updatedAt, deletedAt, createdBy, updatedBy)
VALUES (
  UUID(),
  'Administrador PNAE',
  'admin@seaf.gov.br',
  '$2a$10$9n1oRZ9u6dPwL1Q51JIlPu1v4Q5dD6u0D8rVv0XQBeXgY4Mu1lZna',
  'ADMIN',
  true,
  NOW(),
  NOW(),
  NULL,
  'system',
  'system'
) ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO municipios (id, nome, uf, codigoIbge, ativo, createdAt, updatedAt, deletedAt, createdBy, updatedBy)
VALUES
  (UUID(), 'Alto Paraguai', 'MT', '510010', true, NOW(), NOW(), NULL, 'system', 'system'),
  (UUID(), 'Cáceres', 'MT', '510170', true, NOW(), NOW(), NULL, 'system', 'system'),
  (UUID(), 'Pontes e Lacerda', 'MT', '510550', true, NOW(), NOW(), NULL, 'system', 'system')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO pnae_produtos_referencia (id, nome, categoria, subcategoria, unidadePadrao, palavrasChave, sinonimos, agriculturaFamiliar, ativo, createdAt, updatedAt, deletedAt, createdBy, updatedBy)
VALUES
  (UUID(), 'abacaxi', NULL, NULL, NULL, NULL, NULL, true, true, NOW(), NOW(), NULL, 'system', 'system'),
  (UUID(), 'abóbora cabotiá', NULL, NULL, NULL, NULL, NULL, true, true, NOW(), NOW(), NULL, 'system', 'system'),
  (UUID(), 'banana', NULL, NULL, NULL, NULL, NULL, true, true, NOW(), NOW(), NULL, 'system', 'system')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
