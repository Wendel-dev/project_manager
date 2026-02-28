// src/Project/application/interfaces/ISubscriptionRepository.ts
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  current_period_end: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
  upsert(subscription: Partial<Subscription>): Promise<void>;
  delete(id: string): Promise<void>;
}
