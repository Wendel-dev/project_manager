// src/Payment/application/interfaces/IPaymentRepository.ts
import { PaymentTransaction } from '../../model/interfaces/Payment';

export interface IPaymentRepository {
  save(transaction: PaymentTransaction): Promise<void>;
  updateStatus(id: string, status: PaymentTransaction['status']): Promise<void>;
  getById(id: string): Promise<PaymentTransaction | null>;
  getByProviderId(providerId: string): Promise<PaymentTransaction | null>;
}
