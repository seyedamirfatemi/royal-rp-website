-- =====================================================================
--  ROYAL RP - manual database setup, for HeidiSQL
--
--  Use this when `npm run setup` cannot do it for you, which on XAMPP
--  usually means MariaDB's own permission tables are crashed.
--
--  Run it IN ORDER, one part at a time, and check the result of each
--  part before moving to the next. HeidiSQL runs the whole tab with
--  F9, or just the highlighted text with Ctrl+F9 - highlight one part
--  at a time.
--
--  BEFORE YOU START: replace the two passwords in PART 4. Search for
--  PUT_PASSWORD_ONE and PUT_PASSWORD_TWO. Pick anything you like; you
--  will paste them into one command at the end and never need them
--  again.
-- =====================================================================


-- =====================================================================
--  PART 1 - repair the crashed permission table
--
--  This is why CREATE USER fails with
--      Table '.\mysql\db' is marked as crashed
--
--  USE_FRM rebuilds the table from its definition file. It can discard
--  database-level grants that were stored there, so if the game server
--  stops being able to reach its database afterwards, re-grant its
--  user. Back up C:\xampp\mysql\data\mysql\db.MY* first.
--
--  Skip this part if CHECK TABLE in PART 2 already says OK.
-- =====================================================================

REPAIR TABLE mysql.db USE_FRM;

FLUSH PRIVILEGES;


-- =====================================================================
--  PART 2 - confirm the repair worked
--
--  Msg_text must say OK. If it still says "marked as crashed", stop
--  here: the table needs myisamchk with MariaDB shut down, and nothing
--  below will work until then.
-- =====================================================================

CHECK TABLE mysql.db;


-- =====================================================================
--  PART 3 - the website's own database
-- =====================================================================

CREATE DATABASE IF NOT EXISTS royalrp_web
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;


-- =====================================================================
--  PART 4 - the two accounts
--
--  REPLACE PUT_PASSWORD_ONE AND PUT_PASSWORD_TWO BELOW (4 places).
--
--  royalrp_web   owns the website database, nothing else
--  royalrp_read  can only read the game database
--
--  The site never writes to the game: every purchase is applied by the
--  royal-web-bridge resource, because VoltaBase keeps an online
--  player's money and inventory in memory and would overwrite a direct
--  UPDATE on its next save. So read-only costs nothing here.
--
--  Both are bound to 'localhost', so they cannot be used from another
--  machine even if MariaDB were exposed.
-- =====================================================================

CREATE USER IF NOT EXISTS 'royalrp_web'@'localhost'  IDENTIFIED BY 'PUT_PASSWORD_ONE';
ALTER  USER            'royalrp_web'@'localhost'  IDENTIFIED BY 'PUT_PASSWORD_ONE';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON royalrp_web.* TO 'royalrp_web'@'localhost';

CREATE USER IF NOT EXISTS 'royalrp_read'@'localhost' IDENTIFIED BY 'PUT_PASSWORD_TWO';
ALTER  USER            'royalrp_read'@'localhost' IDENTIFIED BY 'PUT_PASSWORD_TWO';

GRANT SELECT ON volta.* TO 'royalrp_read'@'localhost';

FLUSH PRIVILEGES;


-- =====================================================================
--  PART 5 - the one table the VIP feature needs
--
--  It lives in the game database because the bridge resource reads it
--  in game. Created here as root so the website's account can stay
--  read-only.
-- =====================================================================

CREATE TABLE IF NOT EXISTS volta.royal_vip (
  identifier  VARCHAR(60)  NOT NULL,
  tier        VARCHAR(24)  NOT NULL,
  expires_at  DATETIME     NULL,
  granted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (identifier),
  KEY idx_royal_vip_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
--  PART 6 - check what you just made
--
--  Expect: two rows named royalrp_web and royalrp_read, both on
--  localhost; royalrp_read holding nothing but SELECT on volta.
-- =====================================================================

SELECT user, host FROM mysql.user WHERE user IN ('royalrp_web', 'royalrp_read');

SHOW GRANTS FOR 'royalrp_web'@'localhost';

SHOW GRANTS FOR 'royalrp_read'@'localhost';

SHOW TABLES FROM volta LIKE 'royal_vip';


-- =====================================================================
--  THEN, back in the website folder, write the config file:
--
--    node tools/setup.js --skip-db --db-pass=PUT_PASSWORD_ONE --game-pass=PUT_PASSWORD_TWO
--
--  followed by:
--
--    node backend\database\init.js
--    node backend\database\seed.js
--    start-website.bat
-- =====================================================================
