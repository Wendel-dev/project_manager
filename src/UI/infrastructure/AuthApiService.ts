import { getHeaders, handleResponse } from "./ApiUtils";
import type { AppUser } from "../../Auth/domain/interfaces/AppUser";

export class AuthApiService {
  static async signIn(email: string, password: string): Promise<AppUser> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  }

  static async signUp(email: string, password: string): Promise<AppUser> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  }

  static async signOut(): Promise<void> {
    const response = await fetch("/api/auth/logout", { 
      method: "POST",
      headers: getHeaders()
    });
    return handleResponse(response);
  }

  static async verifyToken(): Promise<AppUser | null> {
    try {
      const response = await fetch("/api/auth/me", {
        headers: getHeaders()
      });
      if (response.status === 401) return null;
      return await handleResponse(response);
    } catch (error) {
      return null;
    }
  }
}
