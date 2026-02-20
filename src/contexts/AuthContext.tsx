import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthRepositoryMock as AuthRepository } from "../infrastructure/AuthRepositoryMock";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const authRepository = new AuthRepository();

  useEffect(() => {
    const savedToken = localStorage.getItem("indieflow-auth-token");
    const savedUser = localStorage.getItem("indieflow-user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authRepository.login(email, password);
    const user = { id: response.user.id, email: response.user.email };
    setToken(response.access_token);
    setUser(user);
    localStorage.setItem("indieflow-auth-token", response.access_token);
    localStorage.setItem("indieflow-user", JSON.stringify(user));
  };

  const signUp = async (email: string, password: string) => {
    await authRepository.signUp(email, password);
    // After signup, Supabase might require email confirmation or you can auto-login
    // For now, we'll just throw a success message or let the user login
    alert("Signup successful! Please login.");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("indieflow-auth-token");
    localStorage.removeItem("indieflow-user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
