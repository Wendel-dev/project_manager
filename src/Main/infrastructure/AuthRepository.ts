export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthRepository {
  private supabaseUrl = process.env.SUPABASE_URL || "https://your-project.supabase.co";
  private anonKey = process.env.SUPABASE_ANON_KEY || "your-anon-key";

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": this.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.message || "Login failed");
    }

    return response.json();
  }

  async signUp(email: string, password: string): Promise<any> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "apikey": this.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.message || "Signup failed");
    }

    return response.json();
  }
}
