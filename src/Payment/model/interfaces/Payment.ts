// src/Payment/model/interfaces/Payment.ts
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  providerId: string; // ex: 'cs_test_...'
  amount: number;
  currency: string;
  status: PaymentStatus;
  customerId: string;
  metadata?: Record<string, any>;
}
