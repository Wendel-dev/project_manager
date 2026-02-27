// src/Payment/infrastructure/MockPaymentProvider.ts
import { IPaymentProvider, CheckoutOptions } from '../application/interfaces/IPaymentProvider';

export class MockPaymentProvider implements IPaymentProvider {
  async createCheckoutSession(options: CheckoutOptions): Promise<{ url: string; sessionId: string }> {
    return { url: 'https://mock.payment.url', sessionId: `mock_cs_${crypto.randomUUID()}` };
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<any> {
    return JSON.parse(payload);
  }

  async handleWebhookEvent(event: any): Promise<void> {
    console.log('Mock webhook event handled:', event.type);
  }
}
