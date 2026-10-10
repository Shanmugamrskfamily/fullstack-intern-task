import { createContext, useContext } from 'react';
import type { Session, User } from '@/types/api';
import type { LoginValues, RegisterPayload } from './schemas';

export interface AuthContextValue {
  /** True as soon as a valid, unexpired token exists (the profile may still be loading). */
  isAuthenticated: boolean;
  user: User | null;
  login: (input: LoginValues) => Promise<Session>;
  register: (input: RegisterPayload) => Promise<Session>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
