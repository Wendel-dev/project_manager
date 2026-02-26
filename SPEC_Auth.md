# SPEC: Subdomínio de Autenticação (src/Auth)

## 1. Visão Geral
Este documento especifica a implementação do subdomínio de autenticação para o IndieFlow, seguindo o `PRD_AUTH.md`. O objetivo é criar uma camada de abstração que permita o uso inicial do Firebase Auth, garantindo portabilidade para outros provedores (como Supabase) no futuro.

## 2. Estrutura de Diretórios
A implementação será centralizada em `src/Auth` para manter a coesão do domínio:
```
src/Auth/
├── domain/
│   ├── AppUser.ts          # Interface universal de usuário
│   └── IAuthRepository.ts  # Interface do repositório de autenticação
├── infrastructure/
│   ├── Firebase/
│   │   ├── config.ts       # Configuração do Firebase SDK
│   │   └── FirebaseAuthRepository.ts
│   └── Mocks/
│       └── AuthRepositoryMock.ts
└── tests/
    ├── FirebaseAuthRepository.test.ts
    └── AuthIntegration.test.ts
```

## 3. Definições de Domínio

### 3.1 AppUser.ts
Desacopla o usuário do provedor externo.
```typescript
export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
```

### 3.2 IAuthRepository.ts
Define o contrato para qualquer provedor de autenticação.
```typescript
import { AppUser } from "./AppUser";

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<AppUser>;
  signUp(email: string, password: string): Promise<AppUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
  getCurrentUser(): AppUser | null;
}
```

## 4. Implementação Firebase (Modular v9+)

### 4.1 Configuração (`infrastructure/Firebase/config.ts`)
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 4.2 Repositório (`infrastructure/Firebase/FirebaseAuthRepository.ts`)
```typescript
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { auth } from "./config";
import { AppUser } from "../../domain/AppUser";
import { IAuthRepository } from "../../domain/IAuthRepository";

export class FirebaseAuthRepository implements IAuthRepository {
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
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return this.mapFirebaseUser(credential.user)!;
  }

  async signUp(email: string, password: string): Promise<AppUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return this.mapFirebaseUser(credential.user)!;
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(this.mapFirebaseUser(user));
    });
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
  }

  getCurrentUser(): AppUser | null {
    return this.mapFirebaseUser(auth.currentUser);
  }
}
```

## 5. Estratégia de Testes

### 5.1 Testes Unitários (Vitest + Mocks)
Garantir que o repositório chama as funções corretas do Firebase.
- **Mocking:** Usar `vi.mock('firebase/auth')`.
- **Casos:**
    - Sucesso no login retorna `AppUser` mapeado.
    - Erro no login (senha errada) lança exceção amigável.
    - `onAuthStateChanged` registra o callback corretamente.

### 5.2 Testes de Integração (Firebase Emulator)
Verificar o comportamento real sem custo ou poluição de dados.
- **Setup:** `connectAuthEmulator(auth, 'http://localhost:9099')`.
- **Fluxo:** Criar conta -> Login -> Verificar Token -> Logout.

## 6. Orientações de Segurança e Implementação

1. **Variáveis de Ambiente:** Nunca commitar chaves do Firebase. Usar `.env` e prefixar com `VITE_` se estiver usando Vite.
2. **Tratamento de Erros:** Converter códigos de erro do Firebase (`auth/wrong-password`, `auth/user-not-found`) em mensagens genéricas no repositório ou no Use Case para evitar enumeração de usuários.
3. **Persistência:** O Firebase Auth v9 no browser usa IndexedDB por padrão. Não é necessário gerenciar localStorage manualmente no `AuthContext` se estiver usando o repositório corretamente.
4. **Contexto React:** O `AuthContext` deve consumir o `IAuthRepository` via Injeção de Dependência ou inicialização direta do provedor configurado.

## 7. Próximos Passos
1. Instalar dependências: `bun add firebase`.
2. Criar diretórios em `src/Auth`.
3. Implementar `AppUser` e `IAuthRepository`.
4. Implementar `FirebaseAuthRepository` e configuração.
5. Migrar `AuthContext.tsx` para usar o novo repositório.
