// src/Payment/application/HandlePaymentWebhookUseCase.ts
import { IPaymentProvider } from './interfaces/IPaymentProvider';
import { IPaymentRepository } from './interfaces/IPaymentRepository';

export class HandlePaymentWebhookUseCase {
  constructor(
    private paymentProvider: IPaymentProvider,
    private paymentRepository: IPaymentRepository
  ) {}

  async execute(payload: string, signature: string): Promise<void> {
    const event = await this.paymentProvider.verifyWebhookSignature(payload, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.paymentRepository.updateStatus(session.id, 'completed');
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      await this.paymentRepository.updateStatus(session.id, 'failed');
    }
    
    await this.paymentProvider.handleWebhookEvent(event);
  }
}
