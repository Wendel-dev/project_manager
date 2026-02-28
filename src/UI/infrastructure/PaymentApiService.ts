import { getHeaders, handleResponse } from "./ApiUtils";

export interface CheckoutOptions {
  amount?: number;
  currency: string;
  metadata?: Record<string, any>;
  priceId?: string;
  mode?: 'payment' | 'subscription';
  successUrl?: string;
  cancelUrl?: string;
}

export class PaymentApiService {
  static async createCheckoutSession(options: CheckoutOptions): Promise<{ url: string }> {
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        ...options,
        successUrl: options.successUrl || window.location.origin + "/payment/success",
        cancelUrl: options.cancelUrl || window.location.origin + "/payment/cancel",
      }),
    });

    return handleResponse(response);
  }

  static async redirectToCheckout(options: CheckoutOptions) {
    const { url } = await this.createCheckoutSession(options);
    window.location.href = url;
  }
}
