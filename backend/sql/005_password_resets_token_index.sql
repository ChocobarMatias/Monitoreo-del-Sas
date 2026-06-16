-- Migración: agregar índice único en password_resets.token
-- Correr una vez en bases de datos existentes
-- IMPORTANTE: Antes de correr, invalidar tokens en texto plano con:
-- UPDATE password_resets SET used_at = NOW() WHERE used_at IS NULL;

ALTER TABLE password_resets ADD UNIQUE INDEX idx_token (token);
