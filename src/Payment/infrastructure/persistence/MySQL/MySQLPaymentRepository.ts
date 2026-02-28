import { pool } from "../../../../Shared/infrastructure/persistence/MySQLConnection";
import type { IPaymentRepository } from "../../../application/interfaces/IPaymentRepository";
import type { PaymentTransaction } from "../../../model/interfaces/Payment";
import type { RowDataPacket } from "mysql2";

export class MySQLPaymentRepository implements IPaymentRepository {
  async save(transaction: PaymentTransaction): Promise<void> {
    await pool.execute(
      `INSERT INTO payments (id, provider_id, user_id, amount, currency, status, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.providerId,
        transaction.customerId, 
        transaction.amount,
        transaction.currency,
        transaction.status,
        transaction.metadata ? JSON.stringify(transaction.metadata) : null,
      ]
    );
  }

  async updateStatus(id: string, status: PaymentTransaction['status']): Promise<void> {
    await pool.execute(
      `UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR provider_id = ?`,
      [status, id, id]
    );
  }

  async getById(id: string): Promise<PaymentTransaction | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapToDomain(rows[0]) : null;
  }

  async getByProviderId(providerId: string): Promise<PaymentTransaction | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE provider_id = ?',
      [providerId]
    );
    return rows.length > 0 ? this.mapToDomain(rows[0]) : null;
  }

  private mapToDomain(row: any): PaymentTransaction {
    return {
      id: row.id,
      providerId: row.provider_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status as any,
      customerId: row.user_id,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
    };
  }
}
