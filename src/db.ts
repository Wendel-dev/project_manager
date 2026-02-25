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

// Migration for existing databases
const tables = ["projects", "tasks", "doc_elements", "phases"];
for (const table of tables) {
  const info = db.query(`PRAGMA table_info(${table})`).all() as any[];
  if (!info.find((col) => col.name === "user_id")) {
    db.run(`ALTER TABLE ${table} ADD COLUMN user_id TEXT DEFAULT 'default_user'`);
  }
}

// Migration for projects current_phase_id
const projectsInfo = db.query("PRAGMA table_info(projects)").all() as any[];
if (!projectsInfo.find((col) => col.name === "current_phase_id")) {
  db.run("ALTER TABLE projects ADD COLUMN current_phase_id INTEGER");
}

// Migration for tasks phase_id
let tasksInfo = db.query("PRAGMA table_info(tasks)").all() as any[];
if (!tasksInfo.find((col) => col.name === "phase_id")) {
  db.run("ALTER TABLE tasks ADD COLUMN phase_id INTEGER");
}

// Bootstrap: Create initial phase for existing projects if they don't have any
try {
  const projects = db.query("SELECT * FROM projects").all() as any[];
  for (const project of projects) {
    const existingPhases = db.query("SELECT * FROM phases WHERE project_id = ?").all(project.id) as any[];
    
    if (existingPhases.length === 0) {
      // Use current_phase name if it exists (from old schema) or default
      const phaseName = (project as any).current_phase || (project.type === 'jogo' ? 'Conceito' : 'Pesquisa UX');
      
      const result = db.query(
        "INSERT INTO phases (user_id, project_id, name, order_index) VALUES (?, ?, ?, ?) RETURNING id"
      ).get(project.user_id, project.id, phaseName, 0) as { id: number };
      
      db.query("UPDATE projects SET current_phase_id = ? WHERE id = ?").run(result.id, project.id);
      db.query("UPDATE tasks SET phase_id = ? WHERE project_id = ? AND phase_id IS NULL").run(result.id, project.id);
    } else if (!project.current_phase_id) {
       // If phases exist but current_phase_id is not set, set it to the first phase or match by name
       const phaseToLink = existingPhases.find(p => p.name === (project as any).current_phase) || existingPhases[0];
       db.query("UPDATE projects SET current_phase_id = ? WHERE id = ?").run(phaseToLink.id, project.id);
       db.query("UPDATE tasks SET phase_id = ? WHERE project_id = ? AND phase_id IS NULL").run(phaseToLink.id, project.id);
    }
  }
} catch (error) {
  console.error("Error during bootstrap migration:", error);
}

// Migration for doc_elements parent_id
const docElementsInfo = db.query("PRAGMA table_info(doc_elements)").all() as any[];
if (!docElementsInfo.find((col) => col.name === "parent_id")) {
  db.run("ALTER TABLE doc_elements ADD COLUMN parent_id INTEGER");
}

// Additional migrations for tasks
tasksInfo = db.query("PRAGMA table_info(tasks)").all() as any[];
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
