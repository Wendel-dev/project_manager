// src/Payment/infrastructure/PaymentRepository.ts
import db from '../../db';
import { IPaymentRepository } from '../application/interfaces/IPaymentRepository';
import { PaymentTransaction } from '../model/interfaces/Payment';

export class PaymentRepository implements IPaymentRepository {
  async save(transaction: PaymentTransaction): Promise<void> {
    db.run(
      `INSERT INTO payments (id, provider_id, user_id, amount, currency, status, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.providerId,
        transaction.customerId, // Map customerId to user_id for simplicity or check if they're different
        transaction.amount,
        transaction.currency,
        transaction.status,
        JSON.stringify(transaction.metadata || {}),
      ]
    );
  }

  async updateStatus(id: string, status: PaymentTransaction['status']): Promise<void> {
    db.run(
      `UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR provider_id = ?`,
      [status, id, id]
    );
  }

  async getById(id: string): Promise<PaymentTransaction | null> {
    const result = db.query('SELECT * FROM payments WHERE id = ?').get(id) as any;
    return result ? this.mapToDomain(result) : null;
  }

  async getByProviderId(providerId: string): Promise<PaymentTransaction | null> {
    const result = db.query('SELECT * FROM payments WHERE provider_id = ?').get(providerId) as any;
    return result ? this.mapToDomain(result) : null;
  }

  private mapToDomain(row: any): PaymentTransaction {
    return {
      id: row.id,
      providerId: row.provider_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status as any,
      customerId: row.user_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
