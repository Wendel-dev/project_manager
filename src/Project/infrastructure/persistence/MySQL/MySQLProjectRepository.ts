import { pool } from "../../../../Shared/infrastructure/persistence/MySQLConnection";
import type { ProjectData, ProjectType } from "../../module/interfaces/Project";
import type { IProjectRepository } from "../../application/interfaces/IProjectRepository";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface ProjectRow extends RowDataPacket, ProjectData {}

export class MySQLProjectRepository implements IProjectRepository {
  async findAll(userId: string): Promise<ProjectData[]> {
    const [rows] = await pool.execute<ProjectRow[]>(
      "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  async findById(userId: string, id: number): Promise<ProjectData | null> {
    const [rows] = await pool.execute<ProjectRow[]>(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async countByUserId(userId: string): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM projects WHERE user_id = ?",
      [userId]
    );
    return rows[0].count;
  }

  async create(userId: string, name: string, type: ProjectType, initialPhaseId: number): Promise<ProjectData> {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO projects (user_id, name, type, current_phase_id) VALUES (?, ?, ?, ?)",
      [userId, name, type, initialPhaseId]
    );

    return {
      id: result.insertId,
      user_id: userId,
      name,
      type,
      current_phase_id: initialPhaseId,
      created_at: new Date().toISOString()
    };
  }

  async update(userId: string, id: number, updates: Partial<ProjectData>): Promise<void> {
    const fields = Object.keys(updates).filter(f => f !== 'id' && f !== 'user_id');
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    values.push(id);
    values.push(userId);
    
    await pool.execute(`UPDATE projects SET ${setClause} WHERE id = ? AND user_id = ?`, values);
  }

  async delete(userId: string, id: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. doc_element_versions (via JOIN with doc_elements)
      await connection.execute(`
        DELETE dev FROM doc_element_versions dev
        INNER JOIN doc_elements de ON dev.element_id = de.id
        WHERE de.project_id = ? AND de.user_id = ?
      `, [id, userId]);

      // 2. doc_elements
      await connection.execute("DELETE FROM doc_elements WHERE project_id = ? AND user_id = ?", [id, userId]);

      // 3. tasks
      await connection.execute("DELETE FROM tasks WHERE project_id = ? AND user_id = ?", [id, userId]);

      // 4. phases
      await connection.execute("DELETE FROM phases WHERE project_id = ? AND user_id = ?", [id, userId]);

      // 5. projects
      await connection.execute("DELETE FROM projects WHERE id = ? AND user_id = ?", [id, userId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
