-- =====================================================================
--  ROYAL RP - database setup for the VPS
--
--  Run once, as the MariaDB root user:
--      mysql -u root -p < tools/create-db-users.sql
--
--  Creates two accounts, each with the least privilege it needs:
--
--    royalrp_web   owns the website's own database and nothing else
--    royalrp_read  can only SELECT from the game database
--
--  The site never writes to the game database. Every purchase is
--  applied through the royal-web-bridge resource, because VoltaBase
--  keeps an online player's money and inventory in memory and would
--  overwrite a direct UPDATE on its next save. So a read-only account
--  for `volta` is not a precaution that costs anything - it matches
--  what the code actually does.
--
--  Both accounts are bound to 'localhost': they are unusable from
--  anywhere but this machine, even if MariaDB were ever exposed.
--
--  CHANGE THE TWO PASSWORDS BELOW before running this.
-- =====================================================================

-- ---------- the website's own database ----------
CREATE DATABASE IF NOT EXISTS royalrp_web
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'royalrp_web'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_website_password';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON royalrp_web.* TO 'royalrp_web'@'localhost';

-- ---------- read-only access to the game database ----------
CREATE USER IF NOT EXISTS 'royalrp_read'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_readonly_password';

GRANT SELECT ON volta.* TO 'royalrp_read'@'localhost';

FLUSH PRIVILEGES;

-- ---------- check ----------
SELECT user, host FROM mysql.user
 WHERE user IN ('royalrp_web', 'royalrp_read');

SHOW GRANTS FOR 'royalrp_read'@'localhost';
