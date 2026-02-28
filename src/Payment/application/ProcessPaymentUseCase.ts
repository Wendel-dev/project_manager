// src/Payment/application/ProcessPaymentUseCase.ts
import type { IPaymentProvider, CheckoutOptions } from './interfaces/IPaymentProvider';
import type { IPaymentRepository } from './interfaces/IPaymentRepository';

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
      amount: options.amount || 0,
      currency: options.currency,
      status: 'pending',
      customerId: options.customerEmail || 'unknown',
      metadata: {
        ...options.metadata,
        priceId: options.priceId,
        mode: options.mode || 'payment'
      },
    });

    return { url, sessionId };
  }
}
