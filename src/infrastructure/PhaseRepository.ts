import db from "../db";
import { PhaseData } from "../module/interfaces/Phase";
import { IPhaseRepository } from "../application/interfaces/IPhaseRepository";

export class PhaseRepository implements IPhaseRepository {
  async findByProjectId(userId: string, projectId: number): Promise<PhaseData[]> {
    return db.query("SELECT * FROM phases WHERE project_id = ? AND user_id = ? ORDER BY order_index ASC").all(projectId, userId) as PhaseData[];
  }

  async create(userId: string, phaseData: Partial<PhaseData>): Promise<PhaseData> {
    const { project_id, name, order_index } = phaseData;
    const result = db.query(
      "INSERT INTO phases (user_id, project_id, name, order_index) VALUES (?, ?, ?, ?) RETURNING id"
    ).get(userId, project_id, name, order_index) as { id: number };

    return {
      id: result.id,
      user_id: userId,
      project_id: project_id!,
      name: name!,
      order_index: order_index!
    };
  }

  async delete(userId: string, id: number): Promise<void> {
    db.query("DELETE FROM phases WHERE id = ? AND user_id = ?").run(id, userId);
  }

  async createBatch(userId: string, phases: Partial<PhaseData>[]): Promise<void> {
    const insert = db.prepare("INSERT INTO phases (user_id, project_id, name, order_index) VALUES (?, ?, ?, ?)");
    const transaction = db.transaction((phases: Partial<PhaseData>[]) => {
      for (const phase of phases) {
        insert.run(userId, phase.project_id, phase.name, phase.order_index);
      }
    });
    transaction(phases);
  }
}
