import type { IAuthRepository } from "./interfaces/IAuthRepository";
import type { AppUser } from "../domain/interfaces/AppUser";
import type { ISubscriptionRepository } from "../../Project/application/interfaces/ISubscriptionRepository";

export class GetSessionUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(token?: string): Promise<AppUser | null> {
    const user = await this.authRepository.verifyToken(token);
    
    if (user) {
      const subscription = await this.subscriptionRepository.findByUserId(user.id);
      user.isSubscribed = subscription && 
                          subscription.status === 'active' && 
                          new Date(subscription.current_period_end) > new Date();
    }

    return user;
  }
}
