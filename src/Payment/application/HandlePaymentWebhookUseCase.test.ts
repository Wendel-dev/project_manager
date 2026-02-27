// src/Payment/application/HandlePaymentWebhookUseCase.test.ts
import { expect, test, describe, spyOn } from "bun:test";
import { HandlePaymentWebhookUseCase } from "./HandlePaymentWebhookUseCase";
import { MockPaymentProvider } from "../infrastructure/MockPaymentProvider";
import { IPaymentRepository } from "./interfaces/IPaymentRepository";

describe("HandlePaymentWebhookUseCase", () => {
  const mockProvider = new MockPaymentProvider();
  const mockRepo: IPaymentRepository = {
    save: async () => {},
    updateStatus: async () => {},
    getById: async () => null,
    getByProviderId: async () => null,
  };

  test("should update transaction status when checkout session is completed", async () => {
    const updateSpy = spyOn(mockRepo, "updateStatus");
    const useCase = new HandlePaymentWebhookUseCase(mockProvider, mockRepo);

    const payload = JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          status: "complete"
        }
      }
    });

    await useCase.execute(payload, "sig_mock");

    expect(updateSpy).toHaveBeenCalledWith("cs_test_123", "completed");
  });
});
