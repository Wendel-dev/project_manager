// src/UI/services/PaymentService.ts
export interface CheckoutOptions {
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export const PaymentService = {
  async createCheckoutSession(options: CheckoutOptions): Promise<{ url: string }> {
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...options,
        successUrl: window.location.origin + "/payment/success",
        cancelUrl: window.location.origin + "/payment/cancel",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create checkout session");
    }

    return response.json();
  },

  async redirectToCheckout(options: CheckoutOptions) {
    const { url } = await this.createCheckoutSession(options);
    window.location.href = url;
  },
};
