import { describe, it, expect, mock, beforeEach } from "bun:test";
import { FirebaseAuthRepository } from "../infrastructure/Firebase/FirebaseAuthRepository";

// Mock das funções do firebase/auth
const mockSignInWithEmailAndPassword = mock(() => Promise.resolve({ user: { uid: '123', email: 'test@example.com', emailVerified: true } }));
const mockCreateUserWithEmailAndPassword = mock(() => Promise.resolve({ user: { uid: '123', email: 'test@example.com', emailVerified: false } }));
const mockSignOut = mock(() => Promise.resolve());
const mockOnAuthStateChanged = mock((auth, callback) => {
  callback({ uid: '123', email: 'test@example.com', emailVerified: true });
  return () => {};
});

// Mock da Auth interface
const mockAuth = {
  currentUser: { 
    uid: '123', 
    email: 'test@example.com', 
    displayName: 'Test User',
    photoURL: null,
    emailVerified: true,
    getIdToken: mock(() => Promise.resolve('mock-token')) 
  }
} as any;

mock.module("firebase/auth", () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

describe("FirebaseAuthRepository", () => {
  let repository: FirebaseAuthRepository;

  beforeEach(() => {
    repository = new FirebaseAuthRepository(mockAuth);
    mockSignInWithEmailAndPassword.mockClear();
    mockCreateUserWithEmailAndPassword.mockClear();
    mockSignOut.mockClear();
    mockOnAuthStateChanged.mockClear();
  });

  it("should return mapped user on signIn success", async () => {
    const user = await repository.signIn("test@example.com", "password");
    
    expect(user.id).toBe('123');
    expect(user.email).toBe('test@example.com');
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
  });

  it("should return mapped user on signUp success", async () => {
    const user = await repository.signUp("test@example.com", "password");
    
    expect(user.id).toBe('123');
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
  });

  it("should call firebase signOut", async () => {
    await repository.signOut();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should register onAuthStateChanged callback", () => {
    const callback = mock(() => {});
    repository.onAuthStateChanged(callback);
    expect(mockOnAuthStateChanged).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it("should get current user mapped correctly", () => {
    const user = repository.getCurrentUser();
    expect(user?.id).toBe('123');
    expect(user?.email).toBe('test@example.com');
  });

  it("should return id token", async () => {
    const token = await repository.getIdToken();
    expect(token).toBe('mock-token');
  });
});
