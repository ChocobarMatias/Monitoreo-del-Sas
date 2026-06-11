-- Migration 002: Grupos SAS + swap initial_week_type (engine A/B renaming)

CREATE TABLE grupos_sas (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  tipo_inicio ENUM('A','B') NOT NULL,
  cycle_start_date DATE NOT NULL DEFAULT '2026-06-01',
  descripcion VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO grupos_sas (nombre, tipo_inicio, cycle_start_date, descripcion) VALUES
  ('Grupo 1', 'A', '2026-06-01', 'Semana tipo A en la semana del 01/06/2026'),
  ('Grupo 2', 'B', '2026-06-01', 'Semana tipo B en la semana del 01/06/2026');

ALTER TABLE users
  ADD COLUMN grupo_sas_id INT UNSIGNED NULL,
  ADD CONSTRAINT fk_users_grupo_sas FOREIGN KEY (grupo_sas_id) REFERENCES grupos_sas(id);

-- El engine A/B fue renombrado para coincidir con AGENT.md.
-- Antes: engine A = AGENT.md B, engine B = AGENT.md A.
-- Ahora: engine A = AGENT.md A, engine B = AGENT.md B.
-- Swapear initial_week_type en todos los usuarios para mantener el mismo cronograma real.
UPDATE users SET initial_week_type = CASE
  WHEN initial_week_type = 'A' THEN 'B'
  WHEN initial_week_type = 'B' THEN 'A'
  ELSE initial_week_type
END;
