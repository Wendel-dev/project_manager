// src/Payment/application/HandlePaymentWebhookUseCase.ts
import { IPaymentProvider } from './interfaces/IPaymentProvider';
import { IPaymentRepository } from './interfaces/IPaymentRepository';
import { ISubscriptionRepository } from '../../Project/application/interfaces/ISubscriptionRepository';

export class HandlePaymentWebhookUseCase {
  constructor(
    private paymentProvider: IPaymentProvider,
    private paymentRepository: IPaymentRepository,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(payload: string, signature: string): Promise<void> {
    const event = await this.paymentProvider.verifyWebhookSignature(payload, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.paymentRepository.updateStatus(session.id, 'completed');
      
      // If it's a subscription checkout
      if (session.mode === 'subscription' && session.subscription) {
        // We'll handle this in customer.subscription.created/updated or here
        // Usually better to wait for subscription events but we can sync user_id here
      }
    } else if (event.type === 'customer.subscription.created' || 
               event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const userId = subscription.metadata.user_id;
      
      if (userId) {
        await this.subscriptionRepository.upsert({
          id: subscription.id,
          user_id: userId,
          stripe_customer_id: subscription.customer,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000),
          updated_at: new Date()
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await this.subscriptionRepository.delete(subscription.id);
    }
    
    await this.paymentProvider.handleWebhookEvent(event);
  }
}
