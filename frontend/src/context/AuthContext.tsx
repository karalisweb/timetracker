import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface TwoFactorState {
  required: boolean;
  tempToken: string;
  email: string;
  otpEmail: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  verifyLoginOtp: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
  isPM: boolean;
  isSenior: boolean;
  canAccessOrchestration: boolean;
  hasRole: (role: string) => boolean;
  twoFactorState: TwoFactorState | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        try {
          const { data } = await authApi.me();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const data = await authApi.login(email, password);

    // Se richiede 2FA, salva lo stato e non completare il login
    if (data.requiresTwoFactor) {
      setTwoFactorState({
        required: true,
        tempToken: data.tempToken!,
        email: email,
        otpEmail: data.otpEmail!,
      });
      return data;
    }

    // Login normale senza 2FA
    setUser(data.user!);
    setToken(data.accessToken!);
    localStorage.setItem('token', data.accessToken!);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  };

  const verifyLoginOtp = async (code: string) => {
    if (!twoFactorState) {
      throw new Error('Nessuna verifica 2FA in corso');
    }

    const data = await authApi.verifyLoginOtp(
      twoFactorState.email,
      code,
      twoFactorState.tempToken
    );

    // Login completato
    setUser(data.user);
    setToken(data.accessToken);
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setTwoFactorState(null);
  };

  const cancelTwoFactor = () => {
    setTwoFactorState(null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch {
      // Ignora errori
    }
  };

  const hasRole = (role: string) => user?.roles?.includes(role as any) ?? false;
  const isAdmin = hasRole('admin');
  const isPM = hasRole('pm');
  const isSenior = hasRole('senior');
  const canAccessOrchestration = isAdmin || isPM || isSenior;

  return (
    <AuthContext.Provider value={{
      user, token, login, verifyLoginOtp, cancelTwoFactor, logout, refreshUser, isLoading,
      isAdmin, isPM, isSenior, canAccessOrchestration, hasRole, twoFactorState
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
