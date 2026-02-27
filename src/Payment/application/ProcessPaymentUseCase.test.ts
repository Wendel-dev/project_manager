// src/Payment/application/ProcessPaymentUseCase.test.ts
import { expect, test, describe, spyOn } from "bun:test";
import { ProcessPaymentUseCase } from "./ProcessPaymentUseCase";
import { MockPaymentProvider } from "../infrastructure/MockPaymentProvider";
import { IPaymentRepository } from "./interfaces/IPaymentRepository";

describe("ProcessPaymentUseCase", () => {
  const mockProvider = new MockPaymentProvider();
  const mockRepo: IPaymentRepository = {
    save: async () => {},
    updateStatus: async () => {},
    getById: async () => null,
    getByProviderId: async () => null,
  };

  test("should create checkout session and save to repository", async () => {
    const saveSpy = spyOn(mockRepo, "save");
    const useCase = new ProcessPaymentUseCase(mockProvider, mockRepo);

    const result = await useCase.execute({
      amount: 1000,
      currency: "usd",
      successUrl: "http://success",
      cancelUrl: "http://cancel",
      customerEmail: "test@example.com",
    });

    expect(result.url).toBe("https://mock.payment.url");
    expect(result.sessionId).toContain("mock_cs_");
    expect(saveSpy).toHaveBeenCalled();
    
    const savedTransaction = saveSpy.mock.calls[0][0];
    expect(savedTransaction.amount).toBe(1000);
    expect(savedTransaction.status).toBe("pending");
    expect(savedTransaction.customerId).toBe("test@example.com");
  });
});
