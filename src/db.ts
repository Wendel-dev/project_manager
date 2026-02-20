import { Database } from "bun:sqlite";

const db = new Database("indieflow.sqlite");

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'jogo' | 'aplicativo'
    current_phase TEXT NOT NULL,
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
    doc_element_version_id INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_doing_at DATETIME,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS doc_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id INTEGER,
    title TEXT NOT NULL,
    current_version_id INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id)
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

// Migration for existing databases
const tables = ["projects", "tasks", "doc_elements"];
for (const table of tables) {
  const info = db.query(`PRAGMA table_info(${table})`).all() as any[];
  if (!info.find((col) => col.name === "user_id")) {
    db.run(`ALTER TABLE ${table} ADD COLUMN user_id TEXT DEFAULT 'default_user'`);
  }
}

export default db;
