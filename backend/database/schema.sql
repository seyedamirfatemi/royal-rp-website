-- =============================================================
--  ROYAL RP - website database schema
--  Written for SQLite (development) and MySQL/MariaDB (production).
--  The init script rewrites the few type names that differ.
--
--  IMPORTANT: this is the WEBSITE's own database. It never creates
--  or alters tables belonging to the FiveM server (ESX/QBCore/Qbox);
--  those are read through a separate, read-mostly connection.
-- =============================================================

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        VARCHAR(32)  NOT NULL UNIQUE,
  email           VARCHAR(190) NOT NULL UNIQUE,
  password_hash   VARCHAR(255),                 -- NULL for Discord-only accounts
  role            VARCHAR(24)  NOT NULL DEFAULT 'user',
  status          VARCHAR(16)  NOT NULL DEFAULT 'active',  -- active | pending | suspended
  display_name    VARCHAR(64),
  avatar_url      VARCHAR(255),
  locale          VARCHAR(8)   NOT NULL DEFAULT 'fa',

  discord_id      VARCHAR(32)  UNIQUE,
  discord_tag     VARCHAR(64),
  game_license    VARCHAR(96)  UNIQUE,          -- FiveM 'license:...' identifier
  game_linked_at  DATETIME,

  wallet_balance  DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_spent     DECIMAL(10,2) NOT NULL DEFAULT 0,

  suspended_until DATETIME,
  suspend_reason  VARCHAR(255),

  last_login_at   DATETIME,
  last_login_ip   VARCHAR(64),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ---------- sessions ----------
-- Opaque, hashed session ids. The raw id only ever lives in the
-- httpOnly cookie; the database stores its SHA-256 so a database
-- leak cannot be replayed as a login.
CREATE TABLE IF NOT EXISTS sessions (
  id           VARCHAR(64) PRIMARY KEY,        -- sha256(raw token)
  user_id      INTEGER NOT NULL,
  csrf_secret  VARCHAR(64) NOT NULL,
  user_agent   VARCHAR(255),
  ip           VARCHAR(64),
  expires_at   DATETIME NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ---------- oauth state (CSRF protection for the Discord flow) ----------
CREATE TABLE IF NOT EXISTS oauth_states (
  state      VARCHAR(64) PRIMARY KEY,
  redirect   VARCHAR(255),
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- password resets ----------
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- shop ----------
CREATE TABLE IF NOT EXISTS categories (
  id         VARCHAR(32) PRIMARY KEY,
  slug       VARCHAR(48) NOT NULL UNIQUE,
  name       VARCHAR(80) NOT NULL,
  name_fa    VARCHAR(80),
  icon       VARCHAR(32),
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(48) PRIMARY KEY,
  slug          VARCHAR(80)  NOT NULL UNIQUE,
  category_id   VARCHAR(32)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  name_fa       VARCHAR(120),
  short         TEXT,
  short_fa      TEXT,
  description   TEXT,
  features      TEXT,                          -- JSON array of strings
  image         VARCHAR(255),
  gallery       TEXT,                          -- JSON array of paths
  price         DECIMAL(10,2) NOT NULL DEFAULT 0,
  old_price     DECIMAL(10,2),
  currency      VARCHAR(8)   NOT NULL DEFAULT 'IRT',
  stock         INTEGER,                       -- NULL = unlimited
  max_per_order INTEGER NOT NULL DEFAULT 5,
  duration      VARCHAR(32),                   -- '30 days' for subscriptions
  badge         VARCHAR(24),
  featured      INTEGER NOT NULL DEFAULT 0,
  popular       INTEGER NOT NULL DEFAULT 0,
  visible       INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,

  -- delivery contract (see services/delivery.js)
  delivery_type    VARCHAR(24) NOT NULL DEFAULT 'manual', -- manual|vip|money|vehicle|item|role|slot
  delivery_payload TEXT,                                   -- JSON, interpreted per type
  delivery_note    TEXT,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_products_cat     ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(visible);

CREATE TABLE IF NOT EXISTS coupons (
  code         VARCHAR(32) PRIMARY KEY,
  type         VARCHAR(16) NOT NULL,           -- percent | fixed
  value        DECIMAL(10,2) NOT NULL,
  min_spend    DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2),
  max_uses     INTEGER,
  used_count   INTEGER NOT NULL DEFAULT 0,
  per_user     INTEGER NOT NULL DEFAULT 1,
  expires_at   DATETIME,
  active       INTEGER NOT NULL DEFAULT 1,
  label        VARCHAR(120),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id              VARCHAR(24) PRIMARY KEY,     -- RR-10492
  user_id         INTEGER NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending|paid|delivered|failed|refunded|cancelled
  subtotal        DECIMAL(10,2) NOT NULL,
  discount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax             DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(8) NOT NULL DEFAULT 'IRT',
  coupon_code     VARCHAR(32),

  payment_provider VARCHAR(24),
  payment_ref      VARCHAR(128),               -- provider's lookup handle (ZarinPal: Authority)
  payment_receipt  VARCHAR(64),                -- customer-facing receipt no. (ZarinPal: RefID)
  paid_at          DATETIME,

  -- idempotency: a replayed webhook can never deliver twice
  delivery_key     VARCHAR(64) UNIQUE,
  delivered_at     DATETIME,
  delivery_error   TEXT,

  character_id    VARCHAR(48),                 -- target character, if chosen
  game_license    VARCHAR(96),                 -- snapshot at order time
  ip              VARCHAR(64),

  refunded_at     DATETIME,
  refund_reason   VARCHAR(255),
  refunded_by     INTEGER,

  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date   ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    VARCHAR(24) NOT NULL,
  product_id  VARCHAR(48) NOT NULL,
  name        VARCHAR(120) NOT NULL,           -- snapshot, so history survives edits
  unit_price  DECIMAL(10,2) NOT NULL,
  qty         INTEGER NOT NULL,
  line_total  DECIMAL(10,2) NOT NULL,
  delivery_type    VARCHAR(24),
  delivery_payload TEXT,
  delivered   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);

-- Raw provider webhooks, kept for dispute resolution and replay detection.
CREATE TABLE IF NOT EXISTS payment_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  provider    VARCHAR(24) NOT NULL,
  event_id    VARCHAR(128) NOT NULL,
  event_type  VARCHAR(64),
  order_id    VARCHAR(24),
  signature_ok INTEGER NOT NULL DEFAULT 0,
  payload     TEXT,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  type          VARCHAR(24) NOT NULL,          -- topup|purchase|refund|adjustment
  amount        DECIMAL(10,2) NOT NULL,        -- signed
  balance_after DECIMAL(10,2) NOT NULL,
  label         VARCHAR(120),
  reference     VARCHAR(64),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);

-- ---------- entitlements (what a paid order actually granted) ----------
CREATE TABLE IF NOT EXISTS entitlements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  order_id    VARCHAR(24),
  product_id  VARCHAR(48),
  kind        VARCHAR(24) NOT NULL,            -- vip|vehicle|slot|property|role
  value       VARCHAR(120),
  expires_at  DATETIME,                        -- NULL = permanent
  revoked_at  DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_entitle_user ON entitlements(user_id);

-- ---------- support ----------
CREATE TABLE IF NOT EXISTS tickets (
  id          VARCHAR(24) PRIMARY KEY,         -- RR-1184
  user_id     INTEGER NOT NULL,
  subject     VARCHAR(160) NOT NULL,
  category    VARCHAR(32)  NOT NULL DEFAULT 'general',
  priority    VARCHAR(16)  NOT NULL DEFAULT 'normal',
  status      VARCHAR(16)  NOT NULL DEFAULT 'open', -- open|answered|pending|closed
  assignee_id INTEGER,
  closed_at   DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tickets_user   ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id  VARCHAR(24) NOT NULL,
  user_id    INTEGER NOT NULL,
  is_staff   INTEGER NOT NULL DEFAULT 0,
  body       TEXT NOT NULL,
  files      TEXT,                              -- JSON array of stored filenames
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tmsg_ticket ON ticket_messages(ticket_id);

-- ---------- content ----------
CREATE TABLE IF NOT EXISTS news (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  title       VARCHAR(200) NOT NULL,
  title_fa    VARCHAR(200),
  excerpt     TEXT,
  excerpt_fa  TEXT,
  body        TEXT,
  body_fa     TEXT,
  category    VARCHAR(32) NOT NULL DEFAULT 'update',
  image       VARCHAR(255),
  author_id   INTEGER,
  author_name VARCHAR(64),
  tags        TEXT,                             -- JSON array
  read_minutes INTEGER NOT NULL DEFAULT 3,
  featured    INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 0,
  published_at DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_news_pub ON news(published, published_at);

CREATE TABLE IF NOT EXISTS staff_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  name       VARCHAR(64) NOT NULL,
  tag        VARCHAR(64),
  role       VARCHAR(24) NOT NULL,
  bio        TEXT,
  bio_fa     TEXT,
  avatar     VARCHAR(255),
  since      DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gallery (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  src        VARCHAR(255) NOT NULL,
  title      VARCHAR(160),
  title_fa   VARCHAR(160),
  tag        VARCHAR(32),
  size       VARCHAR(16),
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible    INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key_name   VARCHAR(64) PRIMARY KEY,
  value      TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  type       VARCHAR(24) NOT NULL DEFAULT 'system',
  title      VARCHAR(160) NOT NULL,
  body       TEXT,
  icon       VARCHAR(32),
  link       VARCHAR(255),
  read_at    DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read_at);

-- ---------- logs ----------
-- Append-only by convention: nothing in the application issues an
-- UPDATE or DELETE against this table except the retention job.
CREATE TABLE IF NOT EXISTS logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  category   VARCHAR(32) NOT NULL,
  severity   VARCHAR(16) NOT NULL DEFAULT 'info', -- info|success|warning|error|critical
  message    TEXT NOT NULL,
  actor_id   INTEGER,
  actor_name VARCHAR(64),
  target     VARCHAR(120),
  source     VARCHAR(16) NOT NULL DEFAULT 'website', -- website|fivem|system
  ip         VARCHAR(64),
  meta       TEXT                                  -- JSON
);
CREATE INDEX IF NOT EXISTS idx_logs_ts  ON logs(ts);
CREATE INDEX IF NOT EXISTS idx_logs_cat ON logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_sev ON logs(severity);

-- Separate, longer-retention table for anything security relevant.
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_id   INTEGER,
  actor_name VARCHAR(64),
  action     VARCHAR(64) NOT NULL,
  target     VARCHAR(120),
  before_val TEXT,
  after_val  TEXT,
  ip         VARCHAR(64),
  user_agent VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);

-- Failed sign-in tracking, used for lockout and abuse detection.
CREATE TABLE IF NOT EXISTS login_attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      VARCHAR(190),
  ip         VARCHAR(64),
  success    INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_attempts_ip    ON login_attempts(ip, created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_email ON login_attempts(email, created_at);
