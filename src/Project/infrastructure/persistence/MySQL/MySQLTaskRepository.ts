import { pool } from "../../../../Shared/infrastructure/persistence/MySQLConnection";
import type { TaskData } from "../../module/interfaces/Task";
import type { ITaskRepository } from "../../application/interfaces/ITaskRepository";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface TaskRow extends RowDataPacket, TaskData {}

export class MySQLTaskRepository implements ITaskRepository {
  async findByProjectId(userId: string, projectId: number): Promise<TaskData[]> {
    const [rows] = await pool.execute<TaskRow[]>(
      "SELECT * FROM tasks WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC",
      [projectId, userId]
    );
    return rows;
  }

  async findById(userId: string, id: number): Promise<TaskData | null> {
    const [rows] = await pool.execute<TaskRow[]>(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async create(userId: string, task: Omit<TaskData, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tasks (user_id, project_id, phase_id, title, description, area, status, target_date, checklists, doc_element_version_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        task.project_id, 
        task.phase_id || null,
        task.title, 
        task.description || null, 
        task.area, 
        task.status, 
        task.target_date || null,
        task.checklists ? JSON.stringify(task.checklists) : null,
        task.doc_element_version_id || null
      ]
    );

    return result.insertId;
  }

  async update(userId: string, id: number, updates: Partial<TaskData>): Promise<void> {
    const fields = Object.keys(updates).filter(f => f !== 'id' && f !== 'user_id');
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const val = (updates as any)[field];
      if (field === 'checklists' && val !== null && typeof val === 'object') {
        return JSON.stringify(val);
      }
      return val;
    });
    values.push(id);
    values.push(userId);

    await pool.execute(`UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`, values);
  }

  async getAreaStats(userId: string, projectId: number): Promise<{ area: string, todo_count: number, done_count: number }[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT area, 
             COUNT(CASE WHEN status = 'todo' OR status = 'doing' THEN 1 END) as todo_count,
             COUNT(CASE WHEN status = 'done' THEN 1 END) as done_count
      FROM tasks
      WHERE project_id = ? AND user_id = ?
      GROUP BY area
    `, [projectId, userId]);
    
    return rows as { area: string, todo_count: number, done_count: number }[];
  }

  async getInertiaTasks(userId: string, projectId: number): Promise<{ id: number, title: string, started_doing_at: string }[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT id, title, started_doing_at 
      FROM tasks 
      WHERE project_id = ? AND user_id = ? AND status = 'doing' 
      AND started_doing_at IS NOT NULL
    `, [projectId, userId]);
    
    return rows as { id: number, title: string, started_doing_at: string }[];
  }

  async getOutdatedTasks(userId: string, projectId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT t.id, t.title, t.doc_element_version_id, de.current_version_id as latest_version_id, de.title as doc_title
      FROM tasks t
      JOIN doc_element_versions dev ON t.doc_element_version_id = dev.id
      JOIN doc_elements de ON dev.element_id = de.id
      WHERE t.project_id = ? AND t.user_id = ? AND t.doc_element_version_id != de.current_version_id
    `, [projectId, userId]);
    
    return rows;
  }

  async delete(userId: string, id: number): Promise<void> {
    await pool.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, userId]);
  }
}
