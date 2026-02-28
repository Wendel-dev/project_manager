import { SQLitePaymentRepository } from "./persistence/SQLite/SQLitePaymentRepository";
import { MySQLPaymentRepository } from "./persistence/MySQL/MySQLPaymentRepository";
import type { IPaymentRepository } from "../application/interfaces/IPaymentRepository";

export class PaymentRepositoryFactory {
  static createPaymentRepository(): IPaymentRepository {
    const dbType = process.env.DB_TYPE;
    switch(dbType) {
      case 'mysql':
        return new MySQLPaymentRepository();
      default: 
        return new SQLitePaymentRepository();
    }
  }
}
