// src/Payment/infrastructure/StripePaymentProvider.ts
import Stripe from 'stripe';
import type { IPaymentProvider, CheckoutOptions } from '../application/interfaces/IPaymentProvider';

export class StripePaymentProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-01-27.acacia' as any, // Standard stable version
    });
  }

  async createCheckoutSession(options: CheckoutOptions): Promise<{ url: string; sessionId: string }> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: options.currency,
            product_data: {
              name: 'Project Payment',
            },
            unit_amount: options.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      customer_email: options.customerEmail,
      metadata: options.metadata,
    }, {
      idempotencyKey: options.metadata?.transactionId || crypto.randomUUID(),
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return { url: session.url, sessionId: session.id };
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<any> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async handleWebhookEvent(event: any): Promise<void> {
    // This will be called from a controller/hook that coordinates with use cases
    console.log('Stripe webhook event received:', event.type);
  }
}
