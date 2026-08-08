CREATE TABLE IF NOT EXISTS subscriptions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  activated_at  DATE NOT NULL,
  expires_at    DATE NOT NULL,
  activated_by  BIGINT UNSIGNED NOT NULL,
  notes         VARCHAR(255) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activated_by) REFERENCES users(id),
  INDEX idx_user_expires (user_id, expires_at)
);
