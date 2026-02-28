import { pool } from "../../../../Shared/infrastructure/persistence/MySQLConnection";
import type { ISubscriptionRepository, Subscription } from "../../application/interfaces/ISubscriptionRepository";
import { RowDataPacket } from "mysql2";

interface SubscriptionRow extends RowDataPacket, Subscription {}

export class MySQLSubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<Subscription | null> {
    const [rows] = await pool.execute<SubscriptionRow[]>(
      "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY current_period_end DESC LIMIT 1",
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async upsert(subscription: Partial<Subscription>): Promise<void> {
    const fields = Object.keys(subscription);
    if (fields.length === 0) return;

    const placeholders = fields.map(() => "?").join(", ");
    const setClause = fields.map((field) => `${field} = VALUES(${field})`).join(", ");
    const values = Object.values(subscription);

    const sql = `
      INSERT INTO subscriptions (${fields.join(", ")})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${setClause}
    `;

    await pool.execute(sql, values);
  }

  async delete(id: string): Promise<void> {
    await pool.execute("DELETE FROM subscriptions WHERE id = ?", [id]);
  }
}
