// src/Payment/application/interfaces/IPaymentProvider.ts
export interface CheckoutOptions {
  amount?: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  priceId?: string;
  mode?: 'payment' | 'subscription';
}

export interface IPaymentProvider {
  createCheckoutSession(options: CheckoutOptions): Promise<{ url: string; sessionId: string }>;
  verifyWebhookSignature(payload: string, signature: string): Promise<any>;
  handleWebhookEvent(event: any): Promise<void>;
}
