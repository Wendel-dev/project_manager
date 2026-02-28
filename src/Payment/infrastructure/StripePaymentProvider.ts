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
    const isSubscription = options.mode === 'subscription';
    
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (isSubscription && options.priceId) {
      line_items.push({
        price: options.priceId,
        quantity: 1,
      });
    } else if (options.amount) {
      line_items.push({
        price_data: {
          currency: options.currency,
          product_data: {
            name: 'Project Payment',
          },
          unit_amount: options.amount,
        },
        quantity: 1,
      });
    } else {
      throw new Error('Either amount or priceId must be provided');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: options.mode || 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      customer_email: options.customerEmail,
      metadata: options.metadata,
      subscription_data: isSubscription ? {
        metadata: options.metadata,
      } : undefined,
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
