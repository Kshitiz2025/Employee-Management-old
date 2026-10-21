-- MySQL schema for the Employee Management app.
-- Optional: the backend creates the table automatically (ddl-auto=update).

CREATE DATABASE IF NOT EXISTS admindb;
USE admindb;

CREATE TABLE IF NOT EXISTS tablename (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255),
  department VARCHAR(255),
  salary     DOUBLE       NOT NULL
);