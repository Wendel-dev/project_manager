import type { AppUser } from "../../domain/interfaces/AppUser";
import type { IAuthRepository } from "../../application/interfaces/IAuthRepository";

export class AuthRepositoryMock implements IAuthRepository {
  private currentUser: AppUser | null = null;
  private listeners: ((user: AppUser | null) => void)[] = [];

  private async delay(ms: number = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async signIn(email: string, password: string): Promise<AppUser> {
    await this.delay();
    const mockUser: AppUser = {
      id: "default_user",
      email: email,
      displayName: "Mock User",
      photoURL: null,
      emailVerified: true,
    };
    this.currentUser = mockUser;
    this.notifyListeners();
    return mockUser;
  }

  async signUp(email: string, password: string): Promise<AppUser> {
    await this.delay();
    const mockUser: AppUser = {
      id: "default_user",
      email: email,
      displayName: "Mock User",
      photoURL: null,
      emailVerified: false,
    };
    this.currentUser = mockUser;
    this.notifyListeners();
    return mockUser;
  }

  async signOut(): Promise<void> {
    await this.delay();
    this.currentUser = null;
    this.notifyListeners();
  }

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async getIdToken(forceRefresh?: boolean): Promise<string | null> {
    return this.currentUser ? `mock-token-${this.currentUser.id}` : null;
  }

  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  async verifyToken(token: string): Promise<AppUser | null> {
    if (token.startsWith("mock-token-")) {
      const id = token.replace("mock-token-", "");
      return {
        id,
        email: "mock@example.com",
        displayName: "Mock User",
        photoURL: null,
        emailVerified: true,
      };
    }
    return null;
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }
}
