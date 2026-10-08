CREATE DATABASE IF NOT EXISTS sagae_pnae
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'sagae'@'localhost' IDENTIFIED BY 'sagae123';
CREATE USER IF NOT EXISTS 'sagae'@'127.0.0.1' IDENTIFIED BY 'sagae123';

ALTER USER 'sagae'@'localhost' IDENTIFIED BY 'sagae123';
ALTER USER 'sagae'@'127.0.0.1' IDENTIFIED BY 'sagae123';

GRANT ALL PRIVILEGES ON sagae_pnae.* TO 'sagae'@'localhost';
GRANT ALL PRIVILEGES ON sagae_pnae.* TO 'sagae'@'127.0.0.1';

FLUSH PRIVILEGES;
