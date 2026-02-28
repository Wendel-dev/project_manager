import db from "../../../../Shared/infrastructure/persistence/SQLiteConnection";
import type { TaskData } from "../../module/interfaces/Task";
import type { ITaskRepository } from "../../application/interfaces/ITaskRepository";

export class SQLiteTaskRepository implements ITaskRepository {
  async findByProjectId(userId: string, projectId: number): Promise<TaskData[]> {
    return db.query("SELECT * FROM tasks WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC").all(projectId, userId) as TaskData[];
  }

  async findById(userId: string, id: number): Promise<TaskData | null> {
    return db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(id, userId) as TaskData | null;
  }

  async create(userId: string, task: Omit<TaskData, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<number> {
    const result = db.query(
      "INSERT INTO tasks (user_id, project_id, phase_id, title, description, area, status, target_date, checklists, doc_element_version_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id"
    ).get(
      userId,
      task.project_id, 
      task.phase_id || null,
      task.title, 
      task.description || null, 
      task.area, 
      task.status, 
      task.target_date || null,
      task.checklists || null,
      task.doc_element_version_id || null
    ) as { id: number };

    return result.id;
  }

  async update(userId: string, id: number, updates: Partial<TaskData>): Promise<void> {
    const fields = Object.keys(updates).filter(f => f !== 'id' && f !== 'user_id');
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    values.push(id);
    values.push(userId);

    db.query(`UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).run(...values);
  }

  async getAreaStats(userId: string, projectId: number): Promise<{ area: string, todo_count: number, done_count: number }[]> {
    return db.query(`
      SELECT area, 
             COUNT(CASE WHEN status = 'todo' OR status = 'doing' THEN 1 END) as todo_count,
             COUNT(CASE WHEN status = 'done' THEN 1 END) as done_count
      FROM tasks
      WHERE project_id = ? AND user_id = ?
      GROUP BY area, phase_id
    `).all(projectId, userId) as { area: string, todo_count: number, done_count: number }[];
  }

  async getInertiaTasks(userId: string, projectId: number): Promise<{ id: number, title: string, started_doing_at: string }[]> {
    return db.query(`
      SELECT id, title, started_doing_at 
      FROM tasks 
      WHERE project_id = ? AND user_id = ? AND status = 'doing' 
      AND started_doing_at IS NOT NULL
    `).all(projectId, userId) as { id: number, title: string, started_doing_at: string }[];
  }

  async getOutdatedTasks(userId: string, projectId: number): Promise<any[]> {
    return db.query(`
      SELECT t.id, t.title, t.doc_element_version_id, de.current_version_id as latest_version_id, de.title as doc_title
      FROM tasks t
      JOIN doc_element_versions dev ON t.doc_element_version_id = dev.id
      JOIN doc_elements de ON dev.element_id = de.id
      WHERE t.project_id = ? AND t.user_id = ? AND t.doc_element_version_id != de.current_version_id
    `).all(projectId, userId);
  }

  async delete(userId: string, id: number): Promise<void> {
    db.query("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId);
  }
}
