// src/Payment/infrastructure/PaymentFactory.ts
import { IPaymentProvider } from '../application/interfaces/IPaymentProvider';
import { StripePaymentProvider } from './StripePaymentProvider';
import { MockPaymentProvider } from './MockPaymentProvider';

export class PaymentFactory {
  static create(): IPaymentProvider {
    const providerName = process.env.PAYMENT_PROVIDER || 'stripe';
    switch (providerName.toLowerCase()) {
      case 'stripe':
        const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
        return new StripePaymentProvider(apiKey);
      case 'mock':
        return new MockPaymentProvider();
      default:
        throw new Error(`Unsupported payment provider: ${providerName}`);
    }
  }
}
