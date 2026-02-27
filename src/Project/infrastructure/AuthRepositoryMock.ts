export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthRepositoryMock {
  private async delay(ms: number = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    await this.delay();
    
    // Forçamos o ID como 'default_user' para acessar os dados pré-existentes na migração
    const mockUserId = "default_user";
    
    return {
      access_token: `mock-token-${mockUserId}`,
      user: { 
        id: mockUserId, 
        email: email 
      }
    };
  }

  async signUp(email: string, password: string): Promise<any> {
    await this.delay();
    return { success: true };
  }
}
