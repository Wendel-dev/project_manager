import type { AppUser } from "../../domain/interfaces/AppUser";

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<AppUser>;
  signUp(email: string, password: string): Promise<AppUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
  getCurrentUser(): AppUser | null;
  verifyToken(token?: string): Promise<AppUser | null>;
}
