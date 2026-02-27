import type { IAuthRepository } from "./interfaces/IAuthRepository";
import type { AppUser } from "../domain/interfaces/AppUser";

export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(email: string, password: string): Promise<{ user: AppUser; token: string | null }> {
    const user = await this.authRepository.signIn(email, password);
    const token = await this.authRepository.getIdToken();
    return { user, token };
  }
}
