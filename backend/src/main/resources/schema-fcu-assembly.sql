-- DDL para tabela que persiste o documento de Assembly em JSON
CREATE TABLE IF NOT EXISTS fcu_assembly_doc (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  pn VARCHAR(64),
  sn VARCHAR(64),
  model VARCHAR(64),
  os_code VARCHAR(64),
  client VARCHAR(128),
  manual_ref VARCHAR(128),
  revision VARCHAR(32),
  revision_date VARCHAR(64),
  ata VARCHAR(64),
  pages INT,
  observations TEXT,
  body_json JSON NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
