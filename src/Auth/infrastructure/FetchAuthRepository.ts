import type { AppUser } from "../domain/interfaces/AppUser";
import type { IAuthRepository } from "../application/interfaces/IAuthRepository";

export class FetchAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<AppUser> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    return await response.json();
  }

  async signUp(email: string, password: string): Promise<AppUser> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    return await response.json();
  }

  async signOut(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
  }

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    // No frontend baseado em cookies, a verificação de estado acontece via '/api/auth/me'
    // Chamaremos o callback inicialmente após o fetch bem sucedido no Contexto
    return () => {};
  }

  async getIdToken(): Promise<string | null> {
    // O token está no cookie HttpOnly, inacessível ao JS do frontend por design
    // Retornamos null para desencorajar o uso de tokens no frontend
    return null;
  }

  getCurrentUser(): AppUser | null {
    // Não gerenciamos estado interno aqui, o Contexto fará isso
    return null;
  }

  async verifyToken(): Promise<AppUser | null> {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return null;
    return await response.json();
  }
}
