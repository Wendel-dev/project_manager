import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
} from "firebase/auth";
import type { User as FirebaseUser, Auth } from "firebase/auth";
import { decodeJwt } from "jose";
import type { AppUser } from "../../domain/interfaces/AppUser";
import type { IAuthRepository } from "../../application/interfaces/IAuthRepository";

export class FirebaseAuthRepository implements IAuthRepository {
  constructor(private auth: Auth) {}

  private mapFirebaseUser(user: FirebaseUser | null): AppUser | null {
    if (!user) return null;
    return {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  }

  async signIn(email: string, password: string): Promise<AppUser> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    return this.mapFirebaseUser(credential.user)!;
  }

  async signUp(email: string, password: string): Promise<AppUser> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    return this.mapFirebaseUser(credential.user)!;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      callback(this.mapFirebaseUser(user));
    });
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!this.auth.currentUser) return null;
    return await this.auth.currentUser.getIdToken(forceRefresh);
  }

  getCurrentUser(): AppUser | null {
    return this.mapFirebaseUser(this.auth.currentUser);
  }

  async verifyToken(token: string): Promise<AppUser | null> {
    if (!token) return null;

    // Em produção, verificaríamos o token adequadamente.
    // Para simplificar e manter compatibilidade com o atual middleware:
    try {
      const payload = decodeJwt(token);
      return {
        id: (payload.sub as string),
        email: (payload.email as string) || null,
        displayName: (payload.name as string) || null,
        photoURL: (payload.picture as string) || null,
        emailVerified: true,
      };
    } catch {
      return null;
    }
  }
}
