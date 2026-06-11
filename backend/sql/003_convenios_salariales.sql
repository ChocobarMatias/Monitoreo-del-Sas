-- Migración: tabla convenios_salariales
-- Correr una vez en bases de datos existentes

CREATE TABLE IF NOT EXISTS convenios_salariales (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre        VARCHAR(120)   NOT NULL,
  sueldo_basico DECIMAL(12,2)  NOT NULL,
  presentismo   DECIMAL(12,2)  NOT NULL DEFAULT 0,
  viaticos_no_rem DECIMAL(12,2) NOT NULL DEFAULT 0,
  anios_antiguedad INT          NOT NULL DEFAULT 0,
  suma_no_remunerativa DECIMAL(12,2) NOT NULL DEFAULT 0,
  vigente_desde DATE            NOT NULL,
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);
