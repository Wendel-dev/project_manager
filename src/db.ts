import { Database } from "bun:sqlite";

const db = new Database("indieflow.sqlite");

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'jogo' | 'aplicativo'
    current_phase_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    area TEXT NOT NULL,
    status TEXT NOT NULL,
    target_date TEXT,
    checklists TEXT,
    doc_element_version_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_doing_at DATETIME,
    phase_id INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(phase_id) REFERENCES phases(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS doc_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id INTEGER,
    title TEXT NOT NULL,
    parent_id INTEGER, -- Added for hierarchy
    current_version_id INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(parent_id) REFERENCES doc_elements(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS doc_element_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    element_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(element_id) REFERENCES doc_elements(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
