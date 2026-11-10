-- CampusFind database schema (MySQL 5.7+ / MariaDB 10.3+)
-- Import with:  mysql -u root -p < schema.sql
-- or paste into phpMyAdmin -> SQL tab.

CREATE DATABASE IF NOT EXISTS campusfind
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campusfind;

-- ---------------------------------------------------------------
-- Registry of student IDs that are allowed to sign up
-- (replaces the Supabase database trigger allowlist)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(30) NOT NULL UNIQUE,
  used       TINYINT(1)  NOT NULL DEFAULT 0,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Registered users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  student_id    VARCHAR(30)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(student_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Lost / found item reports
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ref             VARCHAR(20)  NULL UNIQUE,
  kind            ENUM('Lost','Found') NOT NULL,
  status          ENUM('Lost','Found','Recovered') NOT NULL,
  title           VARCHAR(120) NOT NULL,
  category        VARCHAR(60)  NOT NULL,
  building        VARCHAR(60)  NOT NULL,
  location_detail VARCHAR(120) NULL,
  incident_date   DATE         NOT NULL,
  description     TEXT         NOT NULL,
  reported_by     INT UNSIGNED NOT NULL,
  recovered_at    DATETIME     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_items_status (status),
  INDEX idx_items_category (category),
  INDEX idx_items_building (building),
  CONSTRAINT fk_items_user FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Password reset codes (6 digits, stored hashed, short-lived)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  verified   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_user (user_id),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Sample registry of student IDs (format: SC200/0000/2024).
-- REPLACE these with your campus' real IDs.
-- ---------------------------------------------------------------
INSERT IGNORE INTO students (student_id) VALUES
  ('SC200/0001/2024'),
  ('SC200/0002/2024'),
  ('SC200/0003/2024'),
  ('SC200/0004/2024'),
  ('SC200/0005/2024'),
  ('SC211/0101/2023'),
  ('SC211/0102/2023'),
  ('SC211/0103/2023');
