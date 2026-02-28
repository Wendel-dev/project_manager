import { pool } from "../../../../Shared/infrastructure/persistence/MySQLConnection";
import type { DocElementData } from "../../module/interfaces/Doc";
import type { IDocRepository } from "../../application/interfaces/IDocRepository";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class MySQLDocRepository implements IDocRepository {
  async findByProjectId(userId: string, projectId: number): Promise<DocElementData[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT de.*, dev.content as current_content, dev.created_at as version_created_at
      FROM doc_elements de
      LEFT JOIN doc_element_versions dev ON de.current_version_id = dev.id
      WHERE de.project_id = ? AND de.user_id = ?
    `, [projectId, userId]);
    
    return rows.map(r => ({
      ...r,
      parent_id: r.parent_id
    })) as DocElementData[];
  }

  async createElement(userId: string, projectId: number, title: string, parentId: number | null = null): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO doc_elements (user_id, project_id, title, parent_id) VALUES (?, ?, ?, ?)",
      [userId, projectId, title, parentId]
    );
    return result.insertId;
  }

  async createVersion(userId: string, elementId: number, content: string): Promise<number> {
    // Check ownership
    const [elements] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM doc_elements WHERE id = ? AND user_id = ?",
      [elementId, userId]
    );
    
    if (elements.length === 0) {
      throw new Error("Unauthorized or element not found");
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO doc_element_versions (element_id, content) VALUES (?, ?)",
      [elementId, content]
    );
    return result.insertId;
  }

  async updateCurrentVersion(userId: string, elementId: number, versionId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE doc_elements SET current_version_id = ? WHERE id = ? AND user_id = ?",
      [versionId, elementId, userId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error("Unauthorized or element not found");
    }
  }
}
