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
    target_date TEXT,
    checklists TEXT,
    doc_element_version_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

// Migration for existing databases
const tables = ["projects", "tasks", "doc_elements"];
for (const table of tables) {
  const info = db.query(`PRAGMA table_info(${table})`).all() as any[];
  if (!info.find((col) => col.name === "user_id")) {
    db.run(`ALTER TABLE ${table} ADD COLUMN user_id TEXT DEFAULT 'default_user'`);
  }
}

// Migration for doc_elements parent_id
const docElementsInfo = db.query("PRAGMA table_info(doc_elements)").all() as any[];
if (!docElementsInfo.find((col) => col.name === "parent_id")) {
  db.run("ALTER TABLE doc_elements ADD COLUMN parent_id INTEGER");
}

// Additional migrations for tasks
const tasksInfo = db.query("PRAGMA table_info(tasks)").all() as any[];
if (!tasksInfo.find((col) => col.name === "target_date")) {
  db.run("ALTER TABLE tasks ADD COLUMN target_date TEXT");
}
if (!tasksInfo.find((col) => col.name === "checklists")) {
  db.run("ALTER TABLE tasks ADD COLUMN checklists TEXT");
}
if (!tasksInfo.find((col) => col.name === "created_at")) {
  // SQLite limitation: cannot add a column with non-constant default like CURRENT_TIMESTAMP via ALTER TABLE.
  // We add it with a temporary constant string and then update it.
  db.run("ALTER TABLE tasks ADD COLUMN created_at DATETIME DEFAULT '2026-02-20 00:00:00'");
  db.run("UPDATE tasks SET created_at = CURRENT_TIMESTAMP WHERE created_at = '2026-02-20 00:00:00'");
}

export default db;
