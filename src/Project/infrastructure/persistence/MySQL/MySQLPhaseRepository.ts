import { pool } from "../../../../Shared/infrastructure/persistence/MySQLConnection";
import { PhaseData } from "../../module/interfaces/Phase";
import { IPhaseRepository } from "../../application/interfaces/IPhaseRepository";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface PhaseRow extends RowDataPacket, PhaseData {}

export class MySQLPhaseRepository implements IPhaseRepository {
  async findByProjectId(userId: string, projectId: number): Promise<PhaseData[]> {
    const [rows] = await pool.execute<PhaseRow[]>(
      "SELECT * FROM phases WHERE project_id = ? AND user_id = ? ORDER BY order_index ASC",
      [projectId, userId]
    );
    return rows;
  }

  async create(userId: string, phaseData: Partial<PhaseData>): Promise<PhaseData> {
    const { project_id, name, order_index } = phaseData;
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO phases (user_id, project_id, name, order_index) VALUES (?, ?, ?, ?)",
      [userId, project_id, name, order_index]
    );

    return {
      id: result.insertId,
      user_id: userId,
      project_id: project_id!,
      name: name!,
      order_index: order_index!
    };
  }

  async delete(userId: string, id: number): Promise<void> {
    await pool.execute("DELETE FROM phases WHERE id = ? AND user_id = ?", [id, userId]);
  }

  async createBatch(userId: string, phases: Partial<PhaseData>[]): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const phase of phases) {
        await connection.execute(
          "INSERT INTO phases (user_id, project_id, name, order_index) VALUES (?, ?, ?, ?)",
          [userId, phase.project_id, phase.name, phase.order_index]
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
