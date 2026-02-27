import type { IAuthRepository } from "./interfaces/IAuthRepository";
import type { AppUser } from "../domain/interfaces/AppUser";

export class GetSessionUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(token?: string): Promise<AppUser | null> {
    return await this.authRepository.verifyToken(token);
  }
}
