import { handleProtected } from "../../Shared/infrastructure/HttpHandlers";
import { ProcessPaymentUseCase } from "../application/ProcessPaymentUseCase";
import { HandlePaymentWebhookUseCase } from "../application/HandlePaymentWebhookUseCase";

export function createPaymentRoutes(
  processPaymentUseCase: ProcessPaymentUseCase,
  handlePaymentWebhookUseCase: HandlePaymentWebhookUseCase
) {
  return {
    "/api/payments/checkout": {
      async POST(req: Request) {
        return handleProtected(req, async (userId) => {
          const { amount, currency, successUrl, cancelUrl, metadata } = await req.json();
          // Ideally get user email from a UserUseCase or Auth service
          const result = await processPaymentUseCase.execute({
            amount,
            currency,
            successUrl,
            cancelUrl,
            customerEmail: userId, // Placeholder if we don't have email yet
            metadata: { ...metadata, userId },
          });
          return Response.json(result);
        });
      },
    },

    "/api/webhooks/stripe": {
      async POST(req: Request) {
        try {
          const signature = req.headers.get("stripe-signature") || "";
          const payload = await req.text();
          await handlePaymentWebhookUseCase.execute(payload, signature);
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook error:", error);
          return Response.json({ error: (error as Error).message }, { status: 400 });
        }
      },
    },
  };
}
