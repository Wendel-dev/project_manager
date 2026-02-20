import db from "../db";
import type { ProjectData, ProjectType } from "../module/interfaces/Project";
import type { IProjectRepository } from "../application/interfaces/IProjectRepository";

export class ProjectRepository implements IProjectRepository {
  async findAll(userId: string): Promise<ProjectData[]> {
    return db.query("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC").all(userId) as ProjectData[];
  }

  async findById(userId: string, id: number): Promise<ProjectData | null> {
    return db.query("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(id, userId) as ProjectData | null;
  }

  async create(userId: string, name: string, type: ProjectType, initialPhase: string): Promise<ProjectData> {
    const result = db.query(
      "INSERT INTO projects (user_id, name, type, current_phase) VALUES (?, ?, ?, ?) RETURNING id"
    ).get(userId, name, type, initialPhase) as { id: number };

    return {
      id: result.id,
      user_id: userId,
      name,
      type,
      current_phase: initialPhase,
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
    
    db.query(`UPDATE projects SET ${setClause} WHERE id = ? AND user_id = ?`).run(...values);
  }
}
