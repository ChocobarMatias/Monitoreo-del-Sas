CREATE DATABASE IF NOT EXISTS guard_app;
USE guard_app;

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

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255) NULL,
  role ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  cycle_start_date DATE NULL,
  initial_week_type ENUM('A','B') NOT NULL DEFAULT 'A',
  grupo_sas_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_grupo_sas FOREIGN KEY (grupo_sas_id) REFERENCES grupos_sas(id)
);

-- Para instalaciones existentes:
-- ALTER TABLE users ADD COLUMN cycle_start_date DATE NULL, ADD COLUMN initial_week_type ENUM('A','B') NOT NULL DEFAULT 'A';
-- ALTER TABLE attendance_overrides ADD COLUMN holiday_worked TINYINT(1) NULL;

CREATE TABLE password_resets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE attendance_months (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_night_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_holiday_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  suggested_rest_days INT NOT NULL DEFAULT 0,
  worked_days INT NOT NULL DEFAULT 0,
  total_holidays INT NOT NULL DEFAULT 0,
  weekend_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_month (user_id, year, month),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Para instalaciones existentes (correr una vez):
-- ALTER TABLE attendance_months
--   ADD COLUMN worked_days INT NOT NULL DEFAULT 0,
--   ADD COLUMN total_holidays INT NOT NULL DEFAULT 0,
--   ADD COLUMN weekend_days INT NOT NULL DEFAULT 0;

CREATE TABLE attendance_days (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attendance_month_id BIGINT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  week_cycle ENUM('A','B','C','D') NOT NULL,
  day_name VARCHAR(20) NOT NULL,
  shift_type ENUM('NONE','DAY','NIGHT','LICENSE') NOT NULL DEFAULT 'NONE',
  start_time VARCHAR(5) NULL,
  end_time VARCHAR(5) NULL,
  worked_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  night_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  holiday_paid_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_holiday TINYINT(1) NOT NULL DEFAULT 0,
  is_strike TINYINT(1) NOT NULL DEFAULT 0,
  is_rest TINYINT(1) NOT NULL DEFAULT 0,
  is_vacation TINYINT(1) NOT NULL DEFAULT 0,
  is_sick_leave TINYINT(1) NOT NULL DEFAULT 0,
  notes VARCHAR(255) NULL,
  source ENUM('AUTO','MANUAL') NOT NULL DEFAULT 'AUTO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_month_day (attendance_month_id, work_date),
  FOREIGN KEY (attendance_month_id) REFERENCES attendance_months(id)
);

CREATE TABLE key_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  mec1 VARCHAR(120) NULL,
  mec2 VARCHAR(120) NULL,
  mec3 VARCHAR(120) NULL,
  mec4 VARCHAR(120) NULL,
  mec5 VARCHAR(120) NULL,
  mec6 VARCHAR(120) NULL,
  vol VARCHAR(120) NULL,
  back1 VARCHAR(120) NULL,
  back2 VARCHAR(120) NULL,
  descripcion TEXT NULL,
  fecha_actualizacion DATETIME NULL,
  guardia1 VARCHAR(120) NULL,
  guardia2 VARCHAR(120) NULL,
  telefono_guardia1 VARCHAR(40) NULL,
  telefono_guardia2 VARCHAR(40) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

CREATE TABLE salary_scale_versions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(120) NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  sueldo_basico DECIMAL(12,2) NOT NULL,
  adicional_presentismo DECIMAL(12,2) NOT NULL,
  viatico DECIMAL(12,2) NOT NULL,
  adicional_no_rem DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE salary_calculations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attendance_month_id BIGINT UNSIGNED NOT NULL,
  salary_scale_version_id BIGINT UNSIGNED NOT NULL,
  basic_hours DECIMAL(10,2) NOT NULL DEFAULT 200,
  extra_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  night_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  holiday_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_remunerative DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_non_remunerative DECIMAL(12,2) NOT NULL DEFAULT 0,
  discounts DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendance_month_id) REFERENCES attendance_months(id),
  FOREIGN KEY (salary_scale_version_id) REFERENCES salary_scale_versions(id)
);


CREATE TABLE attendance_overrides (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attendance_month_id BIGINT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,

  type ENUM(
    'HOLIDAY',
    'STRIKE',
    'REST',
    'VACATION',
    'SICK'
  ) NOT NULL,

  strike_shift ENUM('DAY','NIGHT') NULL,
  holiday_worked TINYINT(1) NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_override (attendance_month_id, work_date),

  FOREIGN KEY (attendance_month_id) REFERENCES attendance_months(id)
);

CREATE TABLE api_keys (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  key_hash VARCHAR(255),
  name VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhooks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(255),
  secret VARCHAR(255)
);