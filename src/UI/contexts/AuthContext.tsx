import React, { createContext, useContext, useState, useEffect } from "react";
import type { AppUser } from "../../Auth/domain/interfaces/AppUser";
import { AuthApiService } from "../infrastructure/AuthApiService";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta recuperar a sessão atual ao carregar
    const checkSession = async () => {
      try {
        const currentUser = await AuthApiService.verifyToken();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const loggedUser = await AuthApiService.signIn(email, password);
    setUser(loggedUser);
  };

  const signUp = async (email: string, password: string) => {
    const registeredUser = await AuthApiService.signUp(email, password);
    setUser(registeredUser);
  };

  const signOut = async () => {
    await AuthApiService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
