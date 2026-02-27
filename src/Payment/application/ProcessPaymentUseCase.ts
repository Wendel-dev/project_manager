// src/Payment/application/ProcessPaymentUseCase.ts
import { IPaymentProvider, CheckoutOptions } from './interfaces/IPaymentProvider';
import { IPaymentRepository } from './interfaces/IPaymentRepository';

export class ProcessPaymentUseCase {
  constructor(
    private paymentProvider: IPaymentProvider,
    private paymentRepository: IPaymentRepository
  ) {}

  async execute(options: CheckoutOptions): Promise<{ url: string; sessionId: string }> {
    const { url, sessionId } = await this.paymentProvider.createCheckoutSession(options);

    await this.paymentRepository.save({
      id: crypto.randomUUID(),
      providerId: sessionId,
      amount: options.amount,
      currency: options.currency,
      status: 'pending',
      customerId: options.customerEmail || 'unknown',
      metadata: options.metadata,
    });

    return { url, sessionId };
  }
}
