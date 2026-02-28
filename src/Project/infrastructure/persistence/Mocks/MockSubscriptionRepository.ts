import type { ISubscriptionRepository, Subscription } from "../../../application/interfaces/ISubscriptionRepository";

export class MockSubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<Subscription | null> {
    // In mock/dev mode, we can assume the user is always subscribed if we want,
    // or just return null to test the limit.
    // Let's return a fake active subscription for SQLite/Dev.
    return {
      id: 'sub_mock',
      user_id: userId,
      stripe_customer_id: 'cus_mock',
      status: 'canceled', 
      current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  async upsert(subscription: Partial<Subscription>): Promise<void> {
    return;
  }

  async delete(id: string): Promise<void> {
    return;
  }
}
