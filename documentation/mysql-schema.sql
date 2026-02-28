-- Schema Migration (SQLite to MySQL)

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'jogo' | 'aplicativo'
  current_phase_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS phases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  order_index INT NOT NULL,
  INDEX (project_id),
  INDEX (user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS doc_elements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  project_id INT,
  title VARCHAR(255) NOT NULL,
  parent_id INT,
  current_version_id INT,
  INDEX (project_id),
  INDEX (user_id),
  INDEX (parent_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES doc_elements(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS doc_element_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  element_id INT,
  content LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (element_id),
  FOREIGN KEY (element_id) REFERENCES doc_elements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  project_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  target_date VARCHAR(100),
  checklists JSON,
  doc_element_version_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  started_doing_at DATETIME,
  phase_id INT,
  INDEX (project_id),
  INDEX (user_id),
  INDEX (phase_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  provider_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
