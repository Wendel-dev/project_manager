import db from "../../../../Shared/infrastructure/persistence/SQLiteConnection";
import type { DocElementData } from "../../module/interfaces/Doc";
import type { IDocRepository } from "../../application/interfaces/IDocRepository";

export class SQLiteDocRepository implements IDocRepository {
  async findByProjectId(userId: string, projectId: number): Promise<DocElementData[]> {
    const results = db.query(`
      SELECT de.*, dev.content as current_content, dev.created_at as version_created_at
      FROM doc_elements de
      LEFT JOIN doc_element_versions dev ON de.current_version_id = dev.id
      WHERE de.project_id = ? AND de.user_id = ?
    `).all(projectId, userId) as any[];
    
    return results.map(r => ({
      ...r,
      parent_id: r.parent_id // Ensure it's mapped correctly if needed
    })) as DocElementData[];
  }

  async createElement(userId: string, projectId: number, title: string, parentId: number | null = null): Promise<number> {
    const result = db.query(
      "INSERT INTO doc_elements (user_id, project_id, title, parent_id) VALUES (?, ?, ?, ?) RETURNING id"
    ).get(userId, projectId, title, parentId) as { id: number };
    return result.id;
  }

  async createVersion(userId: string, elementId: number, content: string): Promise<number> {
    // We check if the element belongs to the user before creating a version
    const element = db.query("SELECT id FROM doc_elements WHERE id = ? AND user_id = ?").get(elementId, userId);
    if (!element) {
      throw new Error("Unauthorized or element not found");
    }

    const result = db.query(
      "INSERT INTO doc_element_versions (element_id, content) VALUES (?, ?) RETURNING id"
    ).get(elementId, content) as { id: number };
    return result.id;
  }

  async updateCurrentVersion(userId: string, elementId: number, versionId: number): Promise<void> {
    const result = db.query("UPDATE doc_elements SET current_version_id = ? WHERE id = ? AND user_id = ?").run(versionId, elementId, userId);
    if (result.changes === 0) {
      throw new Error("Unauthorized or element not found");
    }
  }
}
