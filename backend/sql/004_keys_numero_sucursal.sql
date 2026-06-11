-- Migración: agregar numero_sucursal a key_records
-- Correr una vez en bases de datos existentes

ALTER TABLE key_records
  ADD COLUMN numero_sucursal VARCHAR(50) NULL AFTER id;
